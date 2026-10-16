const {expect} = require('@playwright/test');

const propertyId = '11111111-1111-4111-8111-111111111111';
const property = {
  propertyId, propertyTitle:'Fixture apartment', city:'Barcelona', ownerDisplayName:'Fixture host',
  accommodationType:'entire_place', bedrooms:1, sleeps:2,
  availableFrom:'2026-11-10', availableTo:'2026-11-17', links:[]
};

async function installPublicFixture(page, {items=[property]} = {}) {
  const seen = [];
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType:'text/css', body:''}));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    seen.push({path, method:request.method()});
    const data = path === '/api/host/auth/me' ? {error:'unauthorized'}
      : path === '/api/locations/countries' ? [{code:'ES', name:'Spain'}]
      : path === '/api/locations/cities' && url.searchParams.get('country') === 'ES' ? [{name:'Barcelona'}]
      : path === '/api/search' && url.searchParams.get('country') === 'ES'
          && url.searchParams.get('city') === 'Barcelona'
          && url.searchParams.get('from') === property.availableFrom
          && url.searchParams.get('to') === property.availableTo ? items
      : items.some(item => path === `/api/messaging/contact-options/${item.propertyId}`) ? {
          propertyId:path.split('/').at(-1),
          propertyTitle:items.find(item => path.endsWith(item.propertyId)).propertyTitle,
          hostDisplayName:property.ownerDisplayName,
          hostProfileId:'fixture-host', acceptingNewConversations:true
        }
      : null;
    if (path === '/api/host/auth/me') return route.fulfill({status:401, json:data});
    if (!data || request.method() !== 'GET') return route.fulfill({status:501, json:{error:`Unexpected fixture request: ${request.method()} ${path}`}});
    return route.fulfill({json:data});
  });
  return {seen, propertyId};
}

async function installHostFixture(page) {
  const seen = [];
  const user = {accountId:'fixture-owner', username:'fixture-owner', email:'fixture@example.invalid',
    profile:{id:'22222222-2222-4222-8222-222222222222', displayName:'Fixture host'}};
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType:'text/css', body:''}));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    seen.push({path,method:request.method()});
    const data = path === '/api/host/auth/me' ? user
      : path === '/api/host/dashboard' ? {profile:user.profile,properties:[]}
      : path === '/api/messaging/unread' ? {conversations:0,messages:0}
      : path === '/api/messaging/conversations' ? {items:[],nextCursor:null}
      : path === '/api/messaging/notification-settings' ? {enabled:false,language:'en'}
      : null;
    if (!data || request.method() !== 'GET') return route.fulfill({status:501,json:{error:`Unexpected fixture request: ${request.method()} ${path}`}});
    return route.fulfill({json:data});
  });
  return {seen};
}

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({width:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth}));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
}

module.exports = {installPublicFixture, installHostFixture, assertNoHorizontalOverflow};
