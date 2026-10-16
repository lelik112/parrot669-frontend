const {test, expect} = require('@playwright/test');
const {installPublicFixture, assertNoHorizontalOverflow} = require('./public-fixture.cjs');

test('PM-050/PM-053: anonymous auth modes and Messages accent stay correct', async ({page}) => {
  await installPublicFixture(page);
  await page.goto('/search.html');
  await expect(page.locator('#search-login')).toBeVisible();
  await expect(page.locator('#search-register')).toBeVisible();
  await expect(page.locator('#search-login')).toHaveAttribute('href','/host.html?login=1');
  await expect(page.locator('#search-register')).toHaveAttribute('href','/host.html?register=1');

  await page.locator('#search-register').click();
  await expect(page).toHaveURL(/\/host\.html\?register=1$/);
  await expect(page.locator('#auth-dialog')).toBeVisible();
  await expect(page.locator('#register-form')).toBeVisible();
  await expect(page.locator('#login-form')).toBeHidden();
  await expect(page.locator('#host-hero')).toBeHidden();
  await expect(page.locator('#property-panel')).toBeHidden();

  await page.goto('/messages.html');
  await expect(page.locator('#msg-login-link')).toBeVisible();
  await expect(page.locator('#msg-register-link')).toBeVisible();
  await page.locator('#msg-register-link').click();
  await expect(page.locator('#msg-register-form')).toBeVisible();
  await expect(page.locator('#msg-login-form')).toBeHidden();
  await expect(page.locator('[data-msg-i18n="messagesEyebrow"]')).toHaveText('PRIVATE CONVERSATIONS');
  await expect(page.locator('.messages-intro h1')).toHaveCount(1);
  await expect(page.locator('[data-msg-i18n="messagesTitleFirst"]')).toHaveText('Plan the stay.');
  await expect(page.locator('[data-msg-i18n="messagesTitleAccent"]')).toHaveText('Keep the conversation together.');
  const titleStyle=await page.locator('.messages-intro h1').evaluate(title=>{
    const first=title.querySelector('[data-msg-i18n="messagesTitleFirst"]');
    const accent=title.querySelector('.messages-title-accent');
    const firstBox=first.getBoundingClientRect(),accentBox=accent.getBoundingClientRect();
    return {firstColor:getComputedStyle(first).color,accentColor:getComputedStyle(accent).color,
      firstTop:firstBox.top,accentTop:accentBox.top};
  });
  expect(titleStyle.firstColor).not.toBe(titleStyle.accentColor);
  expect(titleStyle.accentColor).toBe('rgb(217, 255, 98)');
  expect(titleStyle.accentTop).toBeGreaterThan(titleStyle.firstTop);
  for(const [language,first,accent] of [
    ['en','Plan the stay.','Keep the conversation together.'],
    ['es','Organiza la estancia.','Mantén la conversación en un solo lugar.'],
    ['ca','Organitza l’estada.','Mantén la conversa en un sol lloc.'],
    ['ru','Обсудите поездку.','Сохраните всё в одном диалоге.']
  ]){
    await page.locator(`[data-msg-lang="${language}"]`).click();
    await expect(page.locator('[data-msg-i18n="messagesTitleFirst"]')).toHaveText(first);
    await expect(page.locator('[data-msg-i18n="messagesTitleAccent"]')).toHaveText(accent);
    await expect(page.locator('[data-msg-i18n="messagesTitleAccent"]')).toHaveCSS('color','rgb(217, 255, 98)');
  }
  await expect(page.locator('#msg-refresh')).toHaveCount(0);
  await expect(page.locator('[data-msg-i18n="privacy"], [data-msg-i18n="emailHelp"]')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test('PM-048: concise localized search copy and price-only control remain keyboard and touch friendly', async ({page}) => {
  await installPublicFixture(page);
  await page.goto('/search.html');

  await expect(page.locator('#search-budget-help')).toHaveCount(0);
  await expect(page.locator('.availability-meta')).toHaveCount(0);
  await expect(page.locator('#filter-price-from')).not.toHaveAttribute('aria-describedby',/.+/);
  await expect(page.locator('#filter-price-to')).not.toHaveAttribute('aria-describedby',/.+/);

  const label=page.locator('label.price-filter');
  const checkbox=page.locator('#filter-priced-only');
  const labelBox=await label.boundingBox();
  const checkboxBox=await checkbox.boundingBox();
  expect(labelBox.height).toBeGreaterThanOrEqual(52);
  expect(checkboxBox.width).toBeGreaterThanOrEqual(20);
  expect(checkboxBox.height).toBeGreaterThanOrEqual(20);
  await label.click();
  await expect(checkbox).toBeChecked();
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).not.toBeChecked();

  for(const [language,lead,priceOnly] of [
    ['en',"Find a place that's available for your dates.",'Only with a price'],
    ['es','Encuentra un alojamiento disponible para tus fechas.','Solo con precio'],
    ['ca','Troba un allotjament disponible per a les teves dates.','Només amb preu'],
    ['ru','Найдите жильё, свободное на ваши даты.','Только с ценой']
  ]){
    await page.locator(`[data-search-lang="${language}"]`).click();
    await expect(page.locator('[data-search-i18n="lead"]')).toHaveText(lead);
    await expect(label).toContainText(priceOnly);
  }
  await assertNoHorizontalOverflow(page);
});

test('PM-024/PM-023: public search reaches guest draft and auth gate without sending', async ({page}) => {
  const fixture = await installPublicFixture(page);
  await page.goto('/search.html');
  await page.locator('select[name="country"]').selectOption('ES');
  await page.locator('select[name="city"]').selectOption('Barcelona');
  await page.locator('input[name="from"]').fill('2026-11-10');
  await page.locator('input[name="to"]').fill('2026-11-17');
  await page.locator('#availability-form button[type="submit"]').click();
  const card = page.locator('.availability-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Fixture apartment');
  await expect(card).toContainText('Barcelona');
  const link = card.locator('.message-property-link');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', new RegExp(`property=${fixture.propertyId}.*from=2026-11-10.*to=2026-11-17`));
  await assertNoHorizontalOverflow(page);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/messages.html\\?property=${fixture.propertyId}`));
  await expect(page.locator('#msg-property')).toHaveText('Fixture apartment');
  await expect(page.locator('#msg-compose')).toBeVisible();
  await page.locator('#msg-dates').evaluate(node => node.open = true);
  await expect(page.locator('#msg-compose input[name="from"]')).toHaveValue('2026-11-10');
  await expect(page.locator('#msg-compose input[name="to"]')).toHaveValue('2026-11-17');
  await page.locator('#msg-compose textarea[name="body"]').fill('Is this fixture available?');
  await page.locator('#msg-send').click();
  await expect(page.locator('#msg-auth')).toBeVisible();
  await expect(page.locator('#msg-compose textarea[name="body"]')).toHaveValue('Is this fixture available?');
  expect(fixture.seen.every(call => call.method === 'GET')).toBe(true);
  await assertNoHorizontalOverflow(page);
});

test('PM-026/PM-023: Messages has one keyboard reachable link and language switch', async ({page}) => {
  const fixture = await installPublicFixture(page);
  await page.goto('/search.html');
  await expect(page.locator('nav.housing-tabs a.messaging-nav-link')).toHaveCount(1);
  await page.locator('nav.housing-tabs a.messaging-nav-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/messages.html$/);
  await expect(page.locator('#msg-auth')).toBeVisible();
  await page.locator('[data-msg-lang="ru"]').click();
  await expect(page.locator('#msg-find-housing')).toHaveText('Найти жильё');
  await expect(page.locator('nav.housing-tabs a.messaging-nav-link')).toHaveCount(1);
  expect(fixture.seen.every(call => call.method === 'GET')).toBe(true);
  await assertNoHorizontalOverflow(page);
});

test('PM-024: contact stays available with no external link, verified link and pending calendar', async ({page}) => {
  const base = {city:'Barcelona',ownerDisplayName:'Fixture host',accommodationType:'entire_place',
    bedrooms:1,sleeps:2,availableFrom:'2026-11-10',availableTo:'2026-11-17'};
  const items = [
    {...base,propertyId:'11111111-1111-4111-8111-111111111111',propertyTitle:'No external link',links:[]},
    {...base,propertyId:'22222222-2222-4222-8222-222222222222',propertyTitle:'Verified listing',
      links:[{externalId:'123456',url:'https://www.airbnb.com/rooms/123456',calendarControlStatus:'verified'}]},
    {...base,propertyId:'33333333-3333-4333-8333-333333333333',propertyTitle:'Pending verification',
      links:[{externalId:'234567',url:'https://www.airbnb.com/rooms/234567',calendarControlStatus:'pending'}]}
  ];
  const fixture = await installPublicFixture(page,{items});
  await page.goto('/search.html');
  await page.locator('select[name="country"]').selectOption('ES');
  await page.locator('select[name="city"]').selectOption('Barcelona');
  await page.locator('input[name="from"]').fill(base.availableFrom);
  await page.locator('input[name="to"]').fill(base.availableTo);
  await page.locator('#availability-form button[type="submit"]').click();
  await expect(page.locator('.availability-card')).toHaveCount(3);
  for (const item of items) {
    const card = page.locator('.availability-card').filter({hasText:item.propertyTitle});
    const contact = card.locator('.message-property-link');
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAttribute('href',new RegExp(`property=${item.propertyId}.*from=${base.availableFrom}.*to=${base.availableTo}`));
  }
  await expect(page.locator('.availability-link-missing')).toHaveCount(1);
  await expect(page.locator('.availability-verification-status')).toHaveCount(2);
  await assertNoHorizontalOverflow(page);
  expect(fixture.seen.every(call => call.method === 'GET')).toBe(true);
});

test('PM-023: direct anonymous Messages entry shows auth guidance without private inbox', async ({page}) => {
  const fixture = await installPublicFixture(page);
  await page.goto('/messages.html');
  await expect(page.locator('#msg-auth')).toBeVisible();
  await expect(page.locator('#msg-find-housing')).toBeVisible();
  await expect(page.locator('#messages-app')).toBeHidden();
  await expect(page.locator('#msg-history')).toBeEmpty();
  expect(fixture.seen.some(call => call.path === '/api/messaging/conversations')).toBe(false);
  expect(fixture.seen.every(call => call.method === 'GET')).toBe(true);
  await assertNoHorizontalOverflow(page);
});
