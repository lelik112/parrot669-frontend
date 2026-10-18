const {test,expect}=require('./isolated-fixture.cjs');
const {installPublicFixture,installHostFixture}=require('./public-fixture.cjs');

test('module entrypoints boot Home, Search, Host and Recover with blocked storage',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    for(const name of ['getItem','setItem','removeItem']) Object.defineProperty(Storage.prototype,name,{value(){throw new DOMException('Synthetic storage denied','SecurityError');}});
  });
  await installPublicFixture(page);
  await page.route('**/api/contact',route=>route.fulfill({json:{ok:true}}));
  await page.goto('/');
  await expect(page.locator('#lead-form')).toBeVisible();
  await page.locator('#lead-form [name=name]').fill('Synthetic person');
  await page.locator('#lead-form [name=contact]').fill('synthetic@example.invalid');
  await page.locator('#lead-form [name=message]').fill('Synthetic enquiry');
  await page.locator('#lead-form button[type=submit]').click();
  await expect(page.locator('#lead-receipt')).toBeVisible();
  await page.goto('/search.html');
  await expect(page.locator('#availability-form select[name=country]')).toBeEnabled();
  await expect(page.locator('#availability-form select[name=city]')).toHaveValue('Barcelona');
  await installHostFixture(page);
  await page.goto('/host.html');
  await expect(page.locator('#host-profile')).toBeVisible();
  await page.route('**/api/host/auth/password-reset/request',route=>route.fulfill({status:202,json:{accepted:true}}));
  await page.goto('/recover.html');
  await page.locator('#recovery-request [name=email]').fill('synthetic@example.invalid');
  await page.locator('#recovery-request button').click();
  await expect(page.locator('#recovery-status')).toContainText('If an account exists');
  expect(errors).toEqual([]);
});

test('malformed Search response is an error rather than an empty result',async({page})=>{
  await installPublicFixture(page);
  await page.route('**/api/search?**',route=>route.fulfill({status:200,body:'{broken',contentType:'application/json'}));
  await page.goto('/search.html');
  await page.locator('#availability-form [name=from]').fill('2026-11-10');
  await page.locator('#availability-form [name=to]').fill('2026-11-17');
  await page.locator('#availability-form button[type=submit]').click();
  await expect(page.locator('#availability-results .error')).toBeVisible();
  await expect(page.locator('#availability-results article')).toHaveCount(0);
});
