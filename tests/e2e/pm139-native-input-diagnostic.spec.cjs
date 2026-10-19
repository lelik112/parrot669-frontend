const {test:base,expect}=require('./isolated-fixture.cjs');
const {installHostFixture}=require('./public-fixture.cjs');
const {withNativeInputEvidence,causalCaseApplies,assertCausalCondition}=require('./pm139-native-input-diagnostic.cjs');
const test=withNativeInputEvidence(base);

for (const rootScroll of ['smooth','auto']) {

test(`PM139 causal [${rootScroll}]: Host calendar connect retains invalid-ACK draft then saves through existing PUT/204 contract`,async({page},testInfo)=>{
  test.skip(!causalCaseApplies(testInfo.project.name,rootScroll),'Causal matrix: mobile smooth/auto; Chromium auto only.');
  await installHostFixture(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const propertyId='11111111-1111-4111-8111-111111111111';
  const icalUrl='https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123';
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
  await assertCausalCondition(page,expect,rootScroll);
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
  await expect(form.locator('.host-form-error')).toBeHidden();
  expect(commands).toEqual(Array(2).fill({method:'PUT',body:{provider:'Airbnb',icalUrl}}));
});


test(`PM139 causal [${rootScroll}]: Host retains B/profile drafts and physical focus/caret through save A, failed dashboard refresh and relabel`,async({page},testInfo)=>{
  test.skip(!causalCaseApplies(testInfo.project.name,rootScroll),'Causal matrix: mobile smooth/auto; Chromium auto only.');
  await installHostFixture(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  const calendar='33333333-3333-4333-8333-333333333333';
  let failRefresh=false,puts=0,dashboards=0,verifications=0;
  const properties=[a,b].map((id,index)=>({id,title:index?'B':'A',city:'Barcelona',country:'Spain',countryCode:'ES',
    accommodationType:'entire_place',bedrooms:2,sleeps:4,minStayDays:1,cleaningFeeCents:null,
    listings:index?[]:[{id:'listing-a',url:'https://www.airbnb.com/rooms/123'}],availability:[],unavailability:[]}));
  await page.route('**/api/host/dashboard',route=>{
    dashboards++;
    return failRefresh?route.fulfill({status:502,json:{error:'Synthetic refresh failed'}})
      :route.fulfill({json:{profile:{displayName:'Owner'},properties}});
  });
  await page.route(`**/api/host/properties/${a}`,route=>{
    expect(route.request().method()).toBe('PUT');puts++;
    Object.assign(properties[0],route.request().postDataJSON());
    return route.fulfill({json:properties[0]});
  });
  await page.route(`**/api/host/properties/${a}/calendars`,route=>route.fulfill({json:{calendars:[{
    id:calendar,provider:'Airbnb',enabled:true,mode:'Active',revision:1,status:'Connected'
  }]}}));
  await page.route(`**/api/host/calendars/${calendar}/verification`,route=>{
    verifications++;
    return route.fulfill({json:{status:'Required',canStart:true,canCheck:false,minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'}});
  });
  await page.route(`**/api/host/calendars/${calendar}/sync`,route=>{
    expect(route.request().postDataJSON()).toEqual({expectedRevision:1});
    return route.fulfill({status:204});
  });
  await page.goto('/host.html');
  await assertCausalCondition(page,expect,rootScroll);
  const cardA=page.locator(`[data-property-id="${a}"]`),cardB=page.locator(`[data-property-id="${b}"]`);
  await cardA.getByRole('button',{name:'Expand',exact:true}).click();
  await cardB.getByRole('button',{name:'Expand',exact:true}).click();
  const input=cardB.locator('.host-property-title-field input'),profile=page.locator('#host-profile-form [name=displayName]');
  await input.fill('B private draft');await profile.fill('Profile private draft');
  const handle=await input.elementHandle();
  const verificationFrom=cardA.locator('.calendar-verification input').nth(0),verificationTo=cardA.locator('.calendar-verification input').nth(1);
  await verificationFrom.fill('2026-11-10');await verificationTo.fill('2026-11-12');
  await cardA.locator('.host-property-title-field input').fill('Saved A');
  await cardA.locator('.host-property-settings button[type=submit]').click();
  await expect(cardA.locator('.host-property-head strong')).toHaveText('Saved A');expect(puts).toBe(1);
  failRefresh=true;
  await cardA.getByRole('button',{name:'Sync now',exact:true}).click();
  await expect(page.locator('#host-status')).toContainText('Synthetic refresh failed');expect(dashboards).toBe(2);
  await expect(input).toHaveValue('B private draft');await expect(profile).toHaveValue('Profile private draft');
  await input.focus();await input.evaluate(node=>node.setSelectionRange(2,8));
  await page.locator('[data-host-lang="ru"]').click();
  await expect(input).toBeFocused();
  expect(await handle.evaluate(node=>({connected:node.isConnected,value:node.value,from:node.selectionStart,to:node.selectionEnd})))
    .toEqual({connected:true,value:'B private draft',from:2,to:8});
  await expect(profile).toHaveValue('Profile private draft');expect(puts).toBe(1);expect(dashboards).toBe(2);
  await expect(verificationFrom).toHaveValue('2026-11-10');await expect(verificationTo).toHaveValue('2026-11-12');
  expect(verifications).toBe(1);
  await handle.dispose();
});

}
