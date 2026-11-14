// S4 browser/visual author matrix only. No screenshot or runtime PASS is implied.
const {test,expect}=require('@playwright/test');
const {createPeriodFixture,propertyId,periodId,otherPropertyId}=require('./host-period-fixture.cjs');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const row=page=>page.locator('[data-host-key="availability:'+periodId+'"]');
async function open(page,fixture,language='en',motion='reduce'){
  await fixture.install(page,language,{reducedMotion:motion});
  await page.goto('/host.html');
  await expect(page.locator('#host-property-select')).toHaveValue(propertyId);
  await expect(row(page)).toHaveAttribute('data-state','idle');
}
for(const width of [320,390,1280])for(const language of ['en','ru']){
  test('workspace disclosure/editor geometry '+width+'/'+language,async({page})=>{
    await page.setViewportSize({width,height:900});
    const fixture=createPeriodFixture();await open(page,fixture,language);
    await expect(page.locator('.host-property-workspace:visible')).toHaveCount(1);
    await expect(page.locator('.host-property-workspace:visible details[open]')).toHaveCount(0);
    await expect(page.locator('#host-add-property')).not.toHaveAttribute('open','');
    await row(page).locator('.host-period-edit').click();
    await expect(row(page).locator('.host-period-save')).toBeDisabled();
    await row(page).locator('[name=nightlyPrice]').fill('125.50');
    await expect(row(page).locator('.host-period-save')).toBeEnabled();
    await expect(page.locator('html')).toHaveAttribute('lang',language);
    const geometry=await row(page).evaluate(node=>{
      const box=node.getBoundingClientRect();
      return {left:box.left,right:box.right,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        controls:[...node.querySelectorAll('button:not([hidden]),input')].filter(n=>n.getClientRects().length)
          .map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))};
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.overflow).toBe(false);
    expect(geometry.controls.every(box=>box.width>=44 && box.height>=44)).toBe(true);
    await row(page).locator('.host-period-cancel').click();
    await expect(row(page)).toHaveAttribute('data-state','idle');
    expect(fixture.seen.filter(call=>call.method!=='GET')).toHaveLength(0);
    // Synthetic isolated-font visual, not native/current-provider acceptance.
    await expect(page).toHaveScreenshot('host-s4-'+width+'-'+language+'.png',{fullPage:true});
  });
}

test('ordinary spinner uses no-preference and valid ACK plus GET before Saved',async({page})=>{
  const fixture=createPeriodFixture(),pending=deferred();
  fixture.hooks.set('PUT /api/host/availability/'+periodId,()=>pending.promise);
  await open(page,fixture,'en','no-preference');
  await row(page).locator('.host-period-edit').click();
  await row(page).locator('[name=nightlyPrice]').fill('81.25');
  await row(page).locator('.host-period-save').click();
  await expect(row(page)).toHaveAttribute('data-state','saving');
  const spinner=row(page).locator('.host-period-spinner');
  await expect(spinner).toBeVisible();
  const animation=await spinner.evaluate(node=>({name:getComputedStyle(node).animationName,
    duration:getComputedStyle(node).animationDuration,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}));
  expect(animation.reduced).toBe(false);expect(animation.name).toBe('host-period-spin');expect(animation.duration).not.toBe('0s');
  expect(fixture.seen.filter(call=>call.method==='PUT')).toHaveLength(1);
  Object.assign(fixture.periods[0],{nightlyPriceCents:8125});
  pending.resolve(fixture.json(fixture.ack(fixture.periods[0])));
  await expect(row(page)).toHaveAttribute('data-state','saved');
  expect(fixture.seen.some(call=>call.path.endsWith('/availability') && call.method==='GET')).toBe(true);
});

test('lost ACK Check and Cancel cannot replay PUT',async({page})=>{
  const fixture=createPeriodFixture();
  fixture.hooks.set('PUT /api/host/availability/'+periodId,({payload})=>{
    Object.assign(fixture.periods[0],payload);throw new Error('Synthetic lost ACK');
  });
  await open(page,fixture);
  await row(page).locator('.host-period-edit').click();
  await row(page).locator('[name=nightlyPrice]').fill('82');
  await row(page).locator('.host-period-save').click();
  await expect(row(page)).toHaveAttribute('data-state','error');
  await expect(row(page).locator('.host-period-save')).toHaveText('Check result');
  await row(page).locator('.host-period-cancel').click();
  await expect(row(page)).toHaveAttribute('data-state','idle');
  expect(fixture.seen.filter(call=>call.method==='PUT')).toHaveLength(1);
});

test('keyboard Edit/Cancel preserve selected workspace values without mutation',async({page})=>{
  const fixture=createPeriodFixture();await open(page,fixture);
  await row(page).locator('.host-period-edit').focus();await page.keyboard.press('Enter');
  const from=row(page).locator('[name=from]');await expect(from).toBeFocused();
  await from.fill('2030-11-21');
  await expect(from).toHaveValue('2030-11-21');
  await row(page).locator('.host-period-cancel').focus();await page.keyboard.press('Enter');
  await expect(row(page)).toHaveAttribute('data-state','idle');
  expect(fixture.seen.filter(call=>call.method!=='GET')).toHaveLength(0);
});

test('switch/language retain keyed condition and period controls',async({page})=>{
  const fixture=createPeriodFixture();await open(page,fixture);
  await page.locator('.host-stay-settings [name=minStayDays]').fill('7');
  await row(page).locator('.host-period-edit').click();
  await row(page).locator('[name=nightlyPrice]').fill('83');
  const handles=await row(page).locator('[name=from]').elementHandle();
  await page.locator('#host-property-select').selectOption(otherPropertyId);
  await page.locator('#host-property-select').selectOption(propertyId);
  await page.locator('[data-host-lang=ru]').click();
  await expect(row(page).locator('[name=nightlyPrice]')).toHaveValue('83');
  await expect(page.locator('[data-property-id="'+propertyId+'"] .host-stay-settings [name=minStayDays]')).toHaveValue('7');
  expect(await handles.evaluate(node=>node.isConnected)).toBe(true);
  // Entry contract uses the same account/profile; an explicit page reload is a
  // privacy boundary and must NOT be used as an in-memory draft-retention oracle.
  expect(fixture.seen.filter(call=>call.method!=='GET')).toHaveLength(0);
});

test('timeout is ambiguous; mismatch Check and Cancel are GET only',async({page})=>{
  await page.clock.install();
  const fixture=createPeriodFixture();
  fixture.hooks.set('PUT /api/host/availability/'+periodId,()=>new Promise(()=>{}));
  await open(page,fixture);
  await row(page).locator('.host-period-edit').click();
  await row(page).locator('[name=nightlyPrice]').fill('84');
  await row(page).locator('.host-period-save').click();
  await expect(row(page)).toHaveAttribute('data-state','saving');
  await page.clock.fastForward(15001);
  await expect(row(page)).toHaveAttribute('data-state','error');
  await row(page).locator('.host-period-save').click();
  await expect(row(page)).toHaveAttribute('data-state','error');
  await expect(row(page).locator('[name=nightlyPrice]')).toHaveValue('84');
  await row(page).locator('.host-period-cancel').click();
  await expect(row(page)).toHaveAttribute('data-state','idle');
  await expect(row(page)).toContainText('€80');
  expect(fixture.seen.filter(call=>call.method==='PUT')).toHaveLength(1);
});
