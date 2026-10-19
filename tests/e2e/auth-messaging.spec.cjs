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
    await expect(pageA.locator('#msg-other')).toHaveText(fixture.identities.b.profile.displayName);
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
