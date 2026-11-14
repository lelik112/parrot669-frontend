const {test, expect, installNetworkGuards} = require('./isolated-fixture.cjs');
const {createAuthMessagingFixture} = require('./auth-messaging-fixture.cjs');

async function login(page, username) {
  await page.locator('#msg-login-link').click();
  await page.locator('#msg-login-form input[name="login"]').fill(username);
  await page.locator('#msg-login-form input[name="password"]').fill('fixture-only-pass');
  await page.locator('#msg-login-form button[type="submit"]').click();
  await expect(page.locator('#msg-account-name')).toHaveText(username);
}

test('invalid structured first-send/reply ACK retains text and same-key manual retry after commit',async({page,browser},testInfo)=>{
  const diagnostic=await require('./pm142-reply-diagnostic.cjs').installReplyDiagnostic({page,browser,testInfo});
  diagnostic.mark('test-body-begin');
  const attempts={start:[],reply:[]};
  const fixture=createAuthMessagingFixture({acknowledge:(value,{firstSend,input})=>{
    const calls=firstSend?attempts.start:attempts.reply;calls.push({...input});
    if(calls.length===1)return firstSend?{conversationId:'not-a-uuid',message:value.message}:{...value,id:123};
    return value;
  }});
  try {
    await fixture.install(page,'a');
    await page.goto(`/messages.html?property=${fixture.ids.property}`);
    await login(page,fixture.identities.a.username);
    const body=page.locator('#msg-compose textarea[name="body"]');
    for(const [name,text] of [['start','Synthetic first ACK'],['reply','Synthetic reply ACK']]) {
      await expect(body).toBeEnabled();
      if(name==='reply')diagnostic.beginReply();
      await body.fill(text);
      if(name==='reply')diagnostic.clickBegin();
      await page.locator('#msg-send').click();
      if(name==='reply')diagnostic.clickComplete();
      await expect(body).toHaveValue(text);await expect(body).toBeDisabled();
      await expect(page.locator('#msg-send')).toContainText('Retry');
      expect(attempts[name]).toHaveLength(1);
      await page.locator('#msg-send').click();
      await expect(body).toHaveValue('');await expect(body).toBeEnabled();
      expect(attempts[name]).toHaveLength(2);expect(attempts[name][1]).toEqual(attempts[name][0]);
      await expect(page.locator('#msg-history')).toContainText(text);
    }
    expect(fixture.snapshot().messages).toHaveLength(2);
  } finally {
    diagnostic.finish();diagnostic.mark('fixture-cleanup-begin');
    try {fixture.cleanup();} finally {diagnostic.mark('fixture-cleanup-end');}
  }
});

test('isolated A/B auth contexts exchange, read and survive independent logout', async ({browser,baseURL}) => {
  const fixture = createAuthMessagingFixture();
  const contextA = await browser.newContext({baseURL,serviceWorkers: 'block'});
  const contextB = await browser.newContext({baseURL,serviceWorkers: 'block'});
  const networkA = await installNetworkGuards(contextA,baseURL);
  const networkB = await installNetworkGuards(contextB,baseURL);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await fixture.install(pageA, 'a');
  await fixture.install(pageB, 'b');

  try {
    await pageA.goto(`/messages.html?property=${fixture.ids.property}`);
    await login(pageA, fixture.identities.a.username);
    // Frozen S2 openEnquiry has no complete participant pair: never infer a host name/role.
    await expect(pageA.locator('html')).toHaveAttribute('lang','en');
    await expect(pageA.locator('#msg-other')).toHaveText('Participant unavailable · Role unavailable');
    await expect(pageA.locator('#msg-other .messages-other-name')).toHaveText('Participant unavailable');
    await expect(pageA.locator('#msg-other .messages-other-role')).toHaveText('Role unavailable');
    await expect(pageA.locator('#msg-other a')).toHaveCount(0);
    await expect(pageA.locator('#msg-own-profile')).toBeHidden();
    await expect(pageA.locator('#msg-open-property')).toBeHidden();
    expect(await pageA.locator('#msg-open-property').getAttribute('href')).toBeNull();
    await pageA.locator('#msg-compose textarea[name="body"]').fill('Synthetic hello from A');
    await pageA.locator('#msg-send').click();
    await expect(pageA).toHaveURL(new RegExp(`conversation=${fixture.ids.conversation}`));
    await expect(pageA.locator('#msg-history')).toContainText('Synthetic hello from A');
    await pageA.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect(pageA.locator('#msg-list button')).toHaveCount(1);
    await pageA.locator('#msg-compose textarea[name="body"]').fill('Unsent A draft');
    await pageA.locator('#msg-compose textarea[name="body"]').evaluate(input=>{
      input.focus();input.setSelectionRange(2,7);
      window.pm140Continuity={input,row:document.querySelector('#msg-list button'),
        bubble:document.querySelector('#msg-history article'),historyLength:history.length};
    });

    await pageB.goto('/messages.html');
    await login(pageB, fixture.identities.b.username);
    const unread = pageB.locator('.messages-conversation.unread');
    await expect(unread).toHaveCount(1);
    await expect(unread).toContainText('Synthetic hello from A');
    await unread.click();
    await expect(pageB.locator('#msg-history')).toContainText('Synthetic hello from A');
    await pageB.locator('#msg-compose textarea[name="body"]').fill('Synthetic reply from B');
    await pageB.locator('#msg-send').click();
    await expect(pageB.locator('#msg-history')).toContainText('Synthetic reply from B');

    // Exercise the existing focus/poll route, not a reload that replaces every node.
    const writesBeforePoll=fixture.snapshot().calls.filter(call=>call.session==='a'&&call.method==='POST').length;
    await pageA.bringToFront();
    await pageA.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect(pageA.locator('#msg-account-name')).toHaveText(fixture.identities.a.username);
    await expect(pageA.locator('#msg-history')).toContainText('Synthetic reply from B');
    expect(await pageA.evaluate(()=>{
      const saved=window.pm140Continuity,input=document.querySelector('#msg-compose textarea[name="body"]');
      return {input:saved.input===input,row:saved.row===document.querySelector('#msg-list button'),
        bubble:saved.bubble===document.querySelector('#msg-history article'),body:input.value,
        start:input.selectionStart,end:input.selectionEnd,historyUnchanged:history.length===saved.historyLength};
    })).toEqual({input:true,row:true,bubble:true,body:'Unsent A draft',start:2,end:7,historyUnchanged:true});
    expect(fixture.snapshot().calls.filter(call=>call.session==='a'&&call.method==='POST')).toHaveLength(writesBeforePoll);
    await expect.poll(() => fixture.snapshot().readThrough.a).toBe(2);

    await pageA.locator('#msg-logout').click();
    await expect(pageA.locator('#msg-auth')).toBeVisible();
    await expect(pageA.locator('#messages-app')).toBeHidden();
    await expect(pageB.locator('#msg-account-name')).toHaveText(fixture.identities.b.username);
    await expect(pageB.locator('#msg-history')).toContainText('Synthetic reply from B');
    expect(fixture.snapshot().sessions).toEqual({a: null, b: fixture.identities.b.username});

    await login(pageA, fixture.identities.a.username);
    await expect(pageA.locator('#msg-history')).toContainText('Synthetic reply from B');
    await pageB.locator('#msg-logout').click();
    await expect(pageB.locator('#messages-app')).toBeHidden();
    await expect(pageA.locator('#msg-account-name')).toHaveText(fixture.identities.a.username);
    await login(pageB, fixture.identities.b.username);
    await expect(pageB.locator('#msg-history')).toContainText('Synthetic reply from B');

    expect(fixture.snapshot().calls.every(call => call.path.startsWith('/api/'))).toBe(true);
    expect(fixture.snapshot().messages).toHaveLength(2);
  } finally {
    await contextA.close();
    await contextB.close();
    fixture.cleanup();
  }
  expect([...networkA.unexpected,...networkB.unexpected]).toEqual([]);
  expect(fixture.snapshot()).toMatchObject({sessions: {}, messages: [], conversationExists: false});
});

// S3 source cases: AUTHORED_NOT_RUN. Browser/native keyboard admission is separate.
async function expectKeyboardFocus(locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeFocused();
  await expect.poll(() => locator.evaluate(node => {
    const style = getComputedStyle(node);
    return {
      active: document.activeElement === node,
      focusVisible: node.matches(':focus-visible'),
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
      painted: !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.outlineColor)
    };
  })).toEqual({active:true, focusVisible:true, width:'2px', style:'solid', offset:'3px', painted:true});
}

async function tabTo(page, target, key) {
  // Bounded real key traversal accommodates native date-input internal segments.
  // No focus() fallback, positive tabindex or DOM mutation can satisfy this oracle.
  for (let step = 0; step < 32; step++) {
    await page.keyboard.press(key);
    if (await target.evaluate(node => document.activeElement === node)) {
      await expectKeyboardFocus(target);
      return;
    }
  }
  throw new Error(`Keyboard did not reach ${await target.getAttribute('id')} using ${key}`);
}

async function expectNoHorizontalOverflow(page, selectors) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const selector of selectors) {
    const locator = page.locator(selector);
    await expect(locator).toBeVisible();
    expect(await locator.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  }
}

for (const [width, locale] of [[390,'ru'], [390,'en'], [320,'ru']]) {
  test(`S3 Host B real keyboard and retained draft ${width}/${locale}`, async ({page,browser,baseURL}) => {
    const expectedWorkingTitle = {en:'Messages', ru:'Сообщения'}[locale];
    const assertLocale = async () => {
      await expect(page.locator('html')).toHaveAttribute('lang',locale);
      await expect(page.locator('.messages-working-title')).toBeVisible();
      await expect(page.locator('.messages-working-title')).toHaveText(expectedWorkingTitle);
    };
    const fixture = createAuthMessagingFixture({completeParticipants:true});
    const guestContext = await browser.newContext({baseURL, serviceWorkers:'block'});
    const guestNetwork = await installNetworkGuards(guestContext, baseURL);
    const guest = await guestContext.newPage();
    let guestClosed = false;
    try {
      await page.setViewportSize({width, height:900});
      await fixture.install(guest, 'a');
      await fixture.install(page, 'b');
      await page.addInitScript(language => localStorage.setItem('parrot669-language',language), locale);

      // All login/message mutations belong to setup, before the measured index.
      await guest.goto(`/messages.html?property=${fixture.ids.property}`);
      await login(guest, fixture.identities.a.username);
      await guest.locator('#msg-compose textarea[name="body"]').fill('S3 synthetic guest history 🏠');
      await guest.locator('#msg-send').click();
      await expect(guest.locator('#msg-history .message-body')).toHaveText(['S3 synthetic guest history 🏠']);
      await expect(guest.locator('#msg-compose textarea[name="body"]')).toHaveValue('');
      await guestContext.close();
      guestClosed = true;

      await page.goto('/messages.html');
      await login(page, fixture.identities.b.username);
      const row = page.locator(`#msg-list button[data-conversation-id="${fixture.ids.conversation}"]`);
      await expect(row).toHaveCount(1);
      await row.click();
      await expect(page).toHaveURL(new RegExp(`conversation=${fixture.ids.conversation}`));
      await assertLocale();
      await expect(page.locator('#msg-own-profile')).toBeVisible();
      await expect(page.locator('#msg-own-profile')).toHaveAttribute('href','/my-profile.html?fromMessages=1#host-profile');
      const body = page.locator('#msg-compose textarea[name="body"]');
      const from = page.locator('#msg-compose input[name="from"]');
      const to = page.locator('#msg-compose input[name="to"]');
      await body.fill('S3 synthetic host history');
      await page.locator('#msg-send').click();
      const historyBodies = ['S3 synthetic guest history 🏠', 'S3 synthetic host history'];
      await expect(page.locator('#msg-history .message-body')).toHaveText(historyBodies);
      await expect(body).toBeEnabled();
      await expect(body).toHaveValue('');
      expect(fixture.snapshot().messages).toHaveLength(2);
      await page.locator('#msg-dates summary').click();
      await from.fill('2033-05-02');
      await to.fill('2033-05-04');
      const draft = `Unsent S3 ${width}/${locale} — пробелы 🏠 & <draft>`;
      await body.fill(draft);
      await expect(page.locator('#msg-send')).toBeEnabled();
      // One explicit known starting focus is setup only. Every measured move uses keys.
      await body.focus();
      const before = fixture.snapshot();
      const measuredStart = before.calls.length;
      const readPath = `/api/messaging/conversations/${fixture.ids.conversation}/read`;
      const send = page.locator('#msg-send');
      const profile = page.locator('#msg-own-profile');
      const assertRetained = async () => {
        await assertLocale();
        await expect(body).toHaveValue(draft);
        await expect(from).toHaveValue('2033-05-02');
        await expect(to).toHaveValue('2033-05-04');
        await expect(page.locator('#msg-history .message-body')).toHaveText(historyBodies);
      };

      // Settled S2 order is textarea -> Send -> own-profile -> Block.
      await page.keyboard.press('Tab');
      await expectKeyboardFocus(send);
      await page.keyboard.press('Tab');
      await expectKeyboardFocus(profile);
      await page.keyboard.press('Tab');
      await expectKeyboardFocus(page.locator('#msg-block'));
      await page.keyboard.press('Shift+Tab');
      await expectKeyboardFocus(profile);
      await page.keyboard.press('Shift+Tab');
      await expectKeyboardFocus(send);
      await page.keyboard.press('Shift+Tab');
      await expectKeyboardFocus(body);
      await assertRetained();
      await expectNoHorizontalOverflow(page, ['#msg-thread', '#msg-compose', '#msg-history']);

      // Reverse through the actual date/history/property controls to compact Back.
      await tabTo(page, page.locator('#msg-back'), 'Shift+Tab');
      await assertRetained();
      await page.keyboard.press('Enter');
      await expect(page.locator('#msg-thread')).toBeHidden();
      await expect(page.locator('#msg-inbox')).toBeVisible();
      await expectKeyboardFocus(row);
      await expectNoHorizontalOverflow(page, ['#msg-inbox', '#msg-list', `#msg-list button[data-conversation-id="${fixture.ids.conversation}"]`]);
      await page.keyboard.press('Enter');
      await expect(page.locator('#msg-thread')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`conversation=${fixture.ids.conversation}`));
      await expect(row).toHaveAttribute('aria-current','true');
      await assertRetained();
      // Reopen focuses the heading; walk forward again rather than assigning focus.
      await expect(page.locator('#msg-property')).toBeFocused();
      await tabTo(page, send, 'Tab');
      await page.keyboard.press('Tab');
      await expectKeyboardFocus(profile);
      await page.keyboard.press('Shift+Tab');
      await expectKeyboardFocus(send);
      await assertRetained();
      await expectNoHorizontalOverflow(page, ['#msg-thread', '#msg-compose', '#msg-history']);

      const after = fixture.snapshot();
      const measured = after.calls.slice(measuredStart);
      expect(measured.length).toBeGreaterThan(0);
      expect(measured.some(call => call.method === 'GET' && call.path === `/api/messaging/conversations/${fixture.ids.conversation}`)).toBe(true);
      expect(measured.filter(call => call.session !== 'b' || !(call.method === 'GET' || (call.method === 'PUT' && call.path === readPath)))).toEqual([]);
      expect(after.messages).toEqual(before.messages);
      expect(after.sessions).toEqual(before.sessions);
      expect(guestNetwork.unexpected).toEqual([]);
    } finally {
      try { if (!guestClosed) await guestContext.close(); } finally { fixture.cleanup(); }
    }
  });
}
