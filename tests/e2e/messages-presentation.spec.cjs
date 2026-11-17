// Authored S2 presentation source. Execution/real keyboard/SR/fonts remain separate gates.
const {test,expect}=require('./isolated-fixture.cjs');
const {createAuthMessagingFixture}=require('./auth-messaging-fixture.cjs');
for(const width of [1440,390,320]) for(const locale of ['en','es','ca','ru'])
test(`Messages presentation ${width}/${locale}`,async({page})=>{
  const fixture=createAuthMessagingFixture();
  try {
    await page.setViewportSize({width,height:900});await fixture.install(page,'a');
    await page.addInitScript(language=>localStorage.setItem('parrot669-language',language),locale);
    await page.goto(`/messages.html?property=${fixture.ids.property}`);
    await page.locator('#msg-login-link').click();
    await page.locator('#msg-login-form input[name="login"]').fill(fixture.identities.a.username);
    await page.locator('#msg-login-form input[name="password"]').fill('fixture-only-pass');
    await page.locator('#msg-login-form button[type="submit"]').click();
    const body=page.locator('#msg-compose textarea[name="body"]');
    await body.fill('Synthetic presentation first');await page.locator('#msg-send').click();
    await expect(body).toBeEnabled();await expect(body).toHaveValue('');
    await body.fill('Synthetic presentation second');await page.locator('#msg-send').click();
    await expect(page.locator('.message-body')).toHaveText(['Synthetic presentation first','Synthetic presentation second']);
    await expect(page.locator('.message-author')).toHaveCount(1);
    await expect(page.locator('.messages-working-title')).toBeVisible();
    expect(await page.locator('.messages-working-title').evaluate(n=>getComputedStyle(n).fontSize)).toBe(width===1440?'32px':'24px');
    for(const bubble of await page.locator('.message-bubble').all()){
      await expect(bubble).toHaveAttribute('role','group');
      const label=await bubble.getAttribute('aria-labelledby');await expect(page.locator(`[id="${label}"]`)).toHaveCount(1);
    }
    // Fixture deliberately lacks guestProfileId. Unknown-role fallback must remain truthful.
    await expect(page.locator('#msg-own-profile')).toBeHidden();await expect(page.locator('#msg-open-property')).toBeHidden();
    await expect(page.locator('.message-author')).toContainText(fixture.identities.a.displayName);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const order=await page.locator('#msg-thread').evaluate(n=>[...n.querySelectorAll('a,button,textarea,input,summary,[tabindex]')].filter(x=>!x.hidden&&getComputedStyle(x).display!=='none').map(x=>x.id||x.name||x.tagName));
    expect(order.indexOf('msg-send')).toBeLessThan(order.indexOf('msg-block'));
  } finally {fixture.cleanup();}
});
