const {test,expect}=require('./isolated-fixture.cjs');
const {installHostFixture}=require('./public-fixture.cjs');

test('Host retains B/profile drafts and physical focus/caret through save A, failed dashboard refresh and relabel',async({page})=>{
  await installHostFixture(page);
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

test('Host retains verification through Disable/Enable and binds replacement calendar actions to current identity',async({page})=>{
  await installHostFixture(page);
  const propertyId='11111111-1111-4111-8111-111111111111';
  const a='33333333-3333-4333-8333-333333333333',b='44444444-4444-4444-8444-444444444444';
  let id=a,revision=1,enabled=true,removed=false;
  const commands=[],verificationGets=[];
  await page.route('**/api/host/dashboard',route=>route.fulfill({json:{properties:[{
    id:propertyId,title:'Calendar transitions',city:'Barcelona',country:'Spain',countryCode:'ES',bedrooms:1,sleeps:2,
    listings:[{id:'listing-a',url:'https://www.airbnb.com/rooms/123'}],availability:[],unavailability:[]
  }]}}));
  await page.route(`**/api/host/properties/${propertyId}/calendars`,route=>route.fulfill({json:{calendars:removed?[]:[{
    id,provider:'Airbnb',mode:enabled?'Active':'Disabled',enabled,revision,status:'Connected'
  }]}}));
  await page.route(/\/api\/host\/calendars\/[^/]+\/verification$/,route=>{
    verificationGets.push(new URL(route.request().url()).pathname);
    return route.fulfill({json:{status:'Required',canStart:true,canCheck:false,minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'}});
  });
  await page.route(/\/api\/host\/calendars\/[^/]+(?:\/(?:sync|activate))?$/,route=>{
    const request=route.request(),path=new URL(request.url()).pathname,method=request.method(),body=request.postDataJSON();
    commands.push({path,method,body});expect(path).toContain('/'+id);expect(body.expectedRevision).toBe(revision);
    if(method==='DELETE')removed=true;
    else if(method==='PUT'){enabled=false;revision++;}
    else if(path.endsWith('/activate')){enabled=true;revision++;}
    else if(id===a){id=b;revision=2;}
    else revision++;
    return route.fulfill({status:204});
  });
  await page.goto('/host.html');
  const card=page.locator(`[data-property-id="${propertyId}"]`),actions=card.locator('.host-calendar-actions');
  await card.getByRole('button',{name:'Expand',exact:true}).click();
  const panel=card.locator('.calendar-verification'),panelHandle=await panel.elementHandle();
  const inputs=panel.locator('input'),first=await inputs.nth(0).elementHandle();
  await inputs.nth(0).fill('2026-11-10');await inputs.nth(1).fill('2026-11-12');
  await actions.getByRole('button',{name:'Disable',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','2');
  expect(await panelHandle.evaluate(node=>node.isConnected)).toBe(true);
  await expect(panel.locator('.calendar-verification-dates')).toBeHidden();
  await actions.getByRole('button',{name:'Enable',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','3');
  expect(await panelHandle.evaluate(node=>node.isConnected)).toBe(true);
  await expect(panel.locator('.calendar-verification-dates')).toBeVisible();
  await expect(inputs.nth(0)).toHaveValue('2026-11-10');await expect(inputs.nth(1)).toHaveValue('2026-11-12');
  expect(await first.evaluate(node=>node.isConnected&&node.parentElement.parentElement.parentElement.classList.contains('calendar-verification'))).toBe(true);
  await expect(panel.locator('button').first()).toBeVisible();expect(verificationGets).toHaveLength(1);
  const oldActions=await actions.locator('button').elementHandles();
  await actions.getByRole('button',{name:'Sync now',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','2');
  await expect(panel.locator('button').first()).toBeVisible();
  expect(await panelHandle.evaluate(node=>node.isConnected)).toBe(false);
  const before=commands.length,status=await page.locator('#host-status').textContent();
  for(const button of oldActions)await button.evaluate(node=>node.click());
  expect(commands).toHaveLength(before);await expect(page.locator('#host-status')).toHaveText(status);
  await actions.getByRole('button',{name:'Sync now',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','3');
  await actions.getByRole('button',{name:'Disable',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','4');
  await actions.getByRole('button',{name:'Enable',exact:true}).click();
  await expect(card.locator('.host-calendar-sync')).toHaveAttribute('data-calendar-revision','5');
  page.once('dialog',dialog=>dialog.accept());await actions.getByRole('button',{name:'Delete',exact:true}).click();
  await expect(actions).toHaveCount(0);
  expect(commands).toEqual([
    {path:`/api/host/calendars/${a}`,method:'PUT',body:{mode:'Disabled',expectedRevision:1}},
    {path:`/api/host/calendars/${a}/activate`,method:'POST',body:{expectedRevision:2}},
    {path:`/api/host/calendars/${a}/sync`,method:'POST',body:{expectedRevision:3}},
    {path:`/api/host/calendars/${b}/sync`,method:'POST',body:{expectedRevision:2}},
    {path:`/api/host/calendars/${b}`,method:'PUT',body:{mode:'Disabled',expectedRevision:3}},
    {path:`/api/host/calendars/${b}/activate`,method:'POST',body:{expectedRevision:4}},
    {path:`/api/host/calendars/${b}`,method:'DELETE',body:{expectedRevision:5}}
  ]);
  expect(verificationGets).toEqual([`/api/host/calendars/${a}/verification`,`/api/host/calendars/${b}/verification`]);
  for(const handle of [panelHandle,first,...oldActions])await handle.dispose();
});
