const {test,expect}=require('./isolated-fixture.cjs');
const {installPublicFixture,installHostFixture}=require('./public-fixture.cjs');

test('Host calendar connect retains invalid-ACK draft then saves through existing PUT/204 contract',async({page})=>{
  await installHostFixture(page);
  const propertyId='11111111-1111-4111-8111-111111111111';
  const icalUrl='https://www.airbnb.com/calendar/ical/123.ics?t=synthetic-only';
  const commands=[];let dashboards=0,accept=false;
  await page.route('**/api/host/dashboard',route=>{
    dashboards++;
    return route.fulfill({json:{properties:[{id:propertyId,title:'Synthetic connect property',city:'Barcelona',bedrooms:1,sleeps:2,
      listings:[{id:'listing-1',url:'https://www.airbnb.com/rooms/123'}]}]}});
  });
  await page.route(`**/api/host/properties/${propertyId}/public-links`,route=>{
    commands.push({method:route.request().method(),body:route.request().postDataJSON()});
    return accept?route.fulfill({status:204}):route.fulfill({status:200,json:{}});
  });
  await page.goto('/host.html');
  const card=page.locator(`[data-property-id="${propertyId}"]`);
  await card.getByRole('button',{name:'Expand',exact:true}).click();
  const form=card.locator('.host-calendar-form'),input=form.locator('[name=icalUrl]');
  await input.fill(icalUrl);
  await form.locator('button[type=submit]').click();
  await expect(form.locator('.host-form-error')).toContainText('Invalid server response');
  await expect(input).toHaveValue(icalUrl);await expect(input).toBeEnabled();
  expect(commands).toEqual([{method:'PUT',body:{provider:'Airbnb',icalUrl}}]);expect(dashboards).toBe(1);
  accept=true;
  await form.locator('button[type=submit]').click();
  await expect.poll(()=>dashboards).toBe(2);
  await expect(form.locator('.host-form-error')).toHaveCount(0);
  expect(commands).toEqual(Array(2).fill({method:'PUT',body:{provider:'Airbnb',icalUrl}}));
});

test('Host calendar uses snapshot revisions for sync, disable, activate and delete; stale is not retried',async({page})=>{
  await installHostFixture(page);
  const propertyId='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
  let revision=7,mode='Active',removed=false,refuse=false,dashboards=0;
  const commands=[];
  await page.route('**/api/host/dashboard',route=>{
    dashboards++;
    return route.fulfill({json:{properties:[{id:propertyId,title:'Synthetic calendar property',city:'Barcelona',bedrooms:1,sleeps:2,
      listings:[{id:'listing-1',url:'https://www.airbnb.com/rooms/123'}]}]}});
  });
  await page.route(`**/api/host/properties/${propertyId}/calendars`,route=>route.fulfill({json:{calendars:removed?[]:[{
    id,provider:'Airbnb',listingId:'123',publicUrl:'https://www.airbnb.com/rooms/123',enabled:mode!=='Disabled',mode,revision,
    status:'Connected',lastSyncedAt:null,lastSuccessAt:null,lastError:null,reservationBlocks:[]
  }]}}));
  await page.route(`**/api/host/calendars/${id}/verification`,route=>route.fulfill({json:{status:'Required',canStart:false,canCheck:false}}));
  await page.route(new RegExp(`/api/host/calendars/${id}(?:/(?:sync|activate))?$`),async route=>{
    const method=route.request().method(),path=new URL(route.request().url()).pathname,body=route.request().postDataJSON();
    commands.push({method,path,body});
    if(refuse)return route.fulfill({status:412,json:{code:'CALENDAR_STALE',error:'Synthetic stale calendar'}});
    expect(body.expectedRevision).toBe(revision);
    if(method==='PUT'){expect(body.mode).toBe('Disabled');mode='Disabled';}
    else if(path.endsWith('/activate')){expect(method).toBe('POST');mode='Active';}
    else if(method==='DELETE')removed=true;
    else {expect(method).toBe('POST');expect(path.endsWith('/sync')).toBe(true);}
    revision++;
    return route.fulfill({status:204});
  });
  await page.goto('/host.html');
  const card=page.locator(`[data-property-id="${propertyId}"]`);
  await card.getByRole('button',{name:'Expand',exact:true}).click();
  const actions=card.locator('.host-calendar-actions');
  async function refreshedClick(name){
    const old=await card.elementHandle();
    await actions.getByRole('button',{name,exact:true}).click();
    await expect.poll(()=>old.evaluate(node=>node.isConnected)).toBe(false);
    await old.dispose();
  }
  await refreshedClick('Sync now');
  expect(dashboards).toBe(2);
  await expect(actions.getByRole('button',{name:'Disable',exact:true})).toBeVisible();
  await refreshedClick('Disable');
  await expect(actions.getByRole('button',{name:'Enable',exact:true})).toBeVisible();
  await refreshedClick('Enable');
  await expect(actions.getByRole('button',{name:'Disable',exact:true})).toBeVisible();
  refuse=true;
  const before=dashboards;
  await actions.getByRole('button',{name:'Sync now',exact:true}).click();
  await expect(page.locator('#host-status')).toContainText('Synthetic stale calendar');
  expect(dashboards).toBe(before);expect(commands).toHaveLength(4);
  refuse=false;
  page.once('dialog',dialog=>dialog.accept());
  await actions.getByRole('button',{name:'Delete',exact:true}).click();
  await expect(card.locator('.host-calendar-actions')).toHaveCount(0);
  expect(commands.map(c=>[c.method,c.path,c.body])).toEqual([
    ['POST',`/api/host/calendars/${id}/sync`,{expectedRevision:7}],
    ['PUT',`/api/host/calendars/${id}`,{mode:'Disabled',expectedRevision:8}],
    ['POST',`/api/host/calendars/${id}/activate`,{expectedRevision:9}],
    ['POST',`/api/host/calendars/${id}/sync`,{expectedRevision:10}],
    ['DELETE',`/api/host/calendars/${id}`,{expectedRevision:10}]
  ]);
});

test('Host account switch removes previous private cards before the next dashboard arrives',async({page})=>{
  await installHostFixture(page);
  let account='a',releaseB;
  const bReady=new Promise(resolve=>releaseB=resolve);
  await page.route('**/api/host/auth/me',route=>route.fulfill({json:{accountId:account,username:account,profile:{id:'profile-'+account}}}));
  await page.route('**/api/host/dashboard',async route=>{
    const requestedAccount=account;
    if(requestedAccount==='b')await bReady;
    await route.fulfill({json:{properties:[{id:'private-'+requestedAccount,title:'PRIVATE '+requestedAccount,city:'Barcelona',bedrooms:1,sleeps:2}]}});
  });
  await page.goto('/host.html');
  await expect(page.locator('[data-property-id="private-a"]')).toBeVisible();
  account='b';
  await page.evaluate(()=>window.ParrotCore.session.refresh());
  await expect(page.locator('[data-property-id="private-a"]')).toHaveCount(0);
  await expect(page.locator('#host-account-email')).toHaveText('b');
  releaseB();await expect(page.locator('[data-property-id="private-b"]')).toBeVisible();
});

test('document load includes page handlers even when controller downloads are delayed',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const asset of ['script.js','messages.js']) await page.route(`**/assets/${asset}`,async route=>{
    await new Promise(resolve=>setTimeout(resolve,200));
    await route.continue();
  });
  await installHostFixture(page);
  await page.goto('/',{waitUntil:'load'});
  expect(await page.evaluate(()=>{
    document.querySelector('.menu-toggle').click();
    return document.querySelector('#mobile-menu').getAttribute('aria-hidden');
  })).toBe('false');
  await page.goto('/messages.html',{waitUntil:'load'});
  expect(await page.evaluate(()=>{
    document.querySelector('[data-msg-lang="en"]').click();
    return document.querySelector('#msg-host-link').textContent;
  })).toBe('For hosts');
});

async function selectFixtureCity(page) {
  const country=page.locator('#availability-form select[name=country]');
  const city=page.locator('#availability-form select[name=city]');
  await expect(country).toBeEnabled();
  await country.selectOption('ES');
  await expect(city).toBeEnabled();
  await city.selectOption('Barcelona');
  await expect(country).toHaveValue('ES');
  await expect(city).toHaveValue('Barcelona');
}

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
  await selectFixtureCity(page);
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
  await selectFixtureCity(page);
  await page.locator('#availability-form [name=from]').fill('2026-11-10');
  await page.locator('#availability-form [name=to]').fill('2026-11-17');
  await page.locator('#availability-form button[type=submit]').click();
  await expect(page.locator('#availability-results .error')).toBeVisible();
  await expect(page.locator('#availability-results article')).toHaveCount(0);
});
