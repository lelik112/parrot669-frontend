const {createPeriodFixture}=require('./host-period-fixture.cjs');

const cases=[];
for(const locale of ['en','es','ca','ru']){
  for(const width of [320,390])for(const motion of ['reduce','no-preference'])
    cases.push({id:`home-${locale}-${width}-${motion}`,page:'home',locale,width,motion});
  for(const page of ['search','host'])for(const width of [320,390,1440])
    cases.push({id:`${page}-${locale}-${width}`,page,locale,width,motion:'reduce'});
}

// Pure synthetic responses shared by the normal E2E registration and the
// serverless validator. No provider, message or Contact mutation is supported.
function createCssFixture(kind){
  const host=createPeriodFixture();
  return async(path,method='GET')=>{
    if(method!=='GET')return {status:501,body:{error:'CSS regression is read-only'}};
    if(kind==='host')return host.respond(path,method,null);
    if(path==='/api/host/auth/me')return {status:401,body:{error:'unauthorized'}};
    if(path==='/api/locations/countries')return {status:200,body:[{code:'ES',name:'Spain'}]};
    if(path==='/api/messaging/unread')return {status:200,body:{messages:0,conversations:0}};
    if(path==='/api/messaging/notification-settings')return {status:200,body:{enabled:false,language:'en'}};
    return {status:501,body:{error:'Unhandled CSS regression fixture '+path}};
  };
}

async function nativeReach(page,expect,selector){
  const target=page.locator(selector).first();
  await expect(target).toBeVisible();
  const before=await target.evaluate(n=>({shadow:getComputedStyle(n).boxShadow,border:getComputedStyle(n).borderColor}));
  for(let i=0;i<128;i++){
    await page.keyboard.press('Tab');
    if(await target.evaluate(n=>n===document.activeElement)){
      const samples=[];let focus,outline,borderAndRing;
      await expect.poll(async()=>{
        focus=await target.evaluate(n=>({active:n===document.activeElement,visible:n.matches(':focus-visible'),outline:getComputedStyle(n).outlineStyle,outlineWidth:parseFloat(getComputedStyle(n).outlineWidth),shadow:getComputedStyle(n).boxShadow,border:getComputedStyle(n).borderColor}));
        outline=focus.outline!=='none'&&focus.outlineWidth>0;
        borderAndRing=focus.shadow!=='none'&&focus.shadow!==before.shadow&&focus.border!==before.border;
        if(samples.length<32)samples.push({ms:Date.now(),...focus,outline,borderAndRing});
        return focus.active&&focus.visible&&(outline||borderAndRing);
      },{timeout:5000,message:'Keyboard focus must have an outline or changed border plus shadow ring; '+selector}).toBe(true);
      return {selector,before,focused:focus,outline,borderAndRing,samples};
    }
  }
  throw new Error('Native Tab could not reach '+selector);
}

async function noOverflow(page,expect){
  const g=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(g.scroll).toBeLessThanOrEqual(g.client+1);
}

async function unobscured(page,expect,selector){
  const g=await page.locator(selector).first().evaluate(n=>{
    const r=n.getBoundingClientRect(),nav=document.querySelector('.housing-tabs'),bar=nav?.getBoundingClientRect();
    const pinned=nav&&['sticky','fixed'].includes(getComputedStyle(nav).position);
    return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:innerWidth,height:innerHeight,
      covered:!!(pinned&&!nav.contains(n)&&bar.bottom>0&&bar.top<innerHeight&&r.top<bar.bottom&&r.bottom>bar.top)};
  });
  expect(g.top).toBeGreaterThanOrEqual(0);expect(g.bottom).toBeLessThanOrEqual(g.height+1);
  expect(g.left).toBeGreaterThanOrEqual(0);expect(g.right).toBeLessThanOrEqual(g.width+1);
  expect(g.covered).toBe(false);
  return g;
}

async function runCssRegression(page,expect,c,{origin='',capture=async()=>{}}={}){
  await page.setViewportSize({width:c.width,height:1000});
  await page.emulateMedia({reducedMotion:c.motion});
  await page.addInitScript(locale=>localStorage.setItem('parrot669-language',locale),c.locale);
  await page.goto(origin+(c.page==='home'?'/':`/${c.page}.html`),{waitUntil:'load'});
  await expect(page.locator('html')).toHaveAttribute('lang',c.locale);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await noOverflow(page,expect);
  await capture('BASELINE');
  if(c.page==='home'){
    await nativeReach(page,expect,'.menu-toggle');await page.keyboard.press('Space');
    await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden','false');
    const housing=page.locator('#mobile-menu .mobile-housing-primary');
    await expect(housing).toBeFocused();await expect(housing).toHaveCSS('visibility','visible');
    await expect(page.locator('body')).toHaveClass(/menu-open/);
    await page.keyboard.press('Shift+Tab');await expect(page.locator('#mobile-menu [data-menu-lang=ru]')).toBeFocused();
    await page.keyboard.press('Tab');await expect(housing).toBeFocused();
    await capture('MENU-FOCUSED');
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-toggle')).toBeFocused();
    await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden','true');
    await expect(page.locator('body')).not.toHaveClass(/menu-open/);
    return;
  }
  await expect(page.locator('.housing-tabs a')).toHaveCount(3);
  const links=await page.locator('.housing-tabs a').evaluateAll(nodes=>nodes.map(n=>{
    const r=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);
    return {text:n.textContent.trim(),left:r.left,right:r.right,height:r.height,client:n.clientWidth,scroll:n.scrollWidth,
      textRects:[...range.getClientRects()].filter(t=>t.width&&t.height).map(t=>({left:t.left,right:t.right}))};
  }));
  for(const n of links){
    expect(n.text.length).toBeGreaterThan(0);if(c.width<=640)expect(n.height).toBeGreaterThanOrEqual(44);else expect(n.height).toBeGreaterThan(0);
    expect(n.left).toBeGreaterThanOrEqual(0);expect(n.right).toBeLessThanOrEqual(c.width+1);
    expect(n.scroll).toBeLessThanOrEqual(n.client+1);
    for(const t of n.textRects){expect(t.left).toBeGreaterThanOrEqual(n.left-1);expect(t.right).toBeLessThanOrEqual(n.right+1);}
  }
  await nativeReach(page,expect,'.housing-tabs a:first-child');
  await page.keyboard.press('Tab');await expect(page.locator('.housing-tabs a').nth(1)).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('.housing-tabs a').nth(2)).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('.housing-tabs a').nth(1)).toBeFocused();
  await unobscured(page,expect,'.housing-tabs a:nth-child(2)');
  if(c.page==='host'){
    await expect(page.locator('#host-account-session')).toBeVisible();
    await nativeReach(page,expect,'.host-property-selector a[href="/my-profile.html"]');
    await unobscured(page,expect,'.host-property-selector a[href="/my-profile.html"]');
    const profileFocus=await nativeReach(page,expect,'#host-profile-editor');
    await unobscured(page,expect,'#host-profile-editor');
    for(const target of ['#property-panel','.host-property[data-property-id]','.host-workspace-disclosure']){
      await page.locator(target).first().evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
      await unobscured(page,expect,target==='#property-panel'?'#property-panel h2':target==='.host-property[data-property-id]'?'.host-property-heading':'.host-workspace-disclosure > summary');
    }
    await capture('HOST-ANCHOR-FOCUS',{profileFocus});
  }else{
    await nativeReach(page,expect,'#availability-form [name=country]');
    await unobscured(page,expect,'#availability-form [name=country]');await capture('SEARCH-FOCUS');
  }
  await noOverflow(page,expect);
}

module.exports={cases,createCssFixture,runCssRegression};
