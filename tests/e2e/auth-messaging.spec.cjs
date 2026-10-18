const {test, expect, installNetworkGuards} = require('./isolated-fixture.cjs');
const {createAuthMessagingFixture} = require('./auth-messaging-fixture.cjs');

async function login(page, username) {
  await page.locator('#msg-login-link').click();
  await page.locator('#msg-login-form input[name="login"]').fill(username);
  await page.locator('#msg-login-form input[name="password"]').fill('fixture-only-pass');
  await page.locator('#msg-login-form button[type="submit"]').click();
  await expect(page.locator('#msg-account-name')).toHaveText(username);
}

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

    await pageA.reload();
    await expect(pageA.locator('#msg-account-name')).toHaveText(fixture.identities.a.username);
    await expect(pageA.locator('#msg-history')).toContainText('Synthetic reply from B');
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
