const {test,expect,getNetworkAudit}=require('./isolated-fixture.cjs');
const {captureEvidence}=require('./home-captures.cjs');
const keys=['rental','visit','documents','search','owner','other'];
const slogans={en:'Local help we stand behind.',ru:'Помощь, за которую мы отвечаем.',es:'Ayuda de la que nos hacemos responsables.',ca:'Ajuda de la qual ens fem responsables.'};

for(const width of [1440,390,320])for(const locale of ['ru','en','es','ca']){
  test(`Home capture ${locale} ${width}`,async({page},testInfo)=>{
    test.skip(testInfo.project.name==='mobile-emulation','Chromium and WebKit already cover all three exact widths');
    await page.setViewportSize({width,height:1000});
    await page.goto('/');
    await page.locator(`.site-footer [data-lang=${locale}]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('.hero h1')).toHaveText(slogans[locale]);
    expect(await page.locator('[data-service-card]').evaluateAll(nodes=>nodes.map(n=>n.dataset.serviceCard))).toEqual(keys);
    await expect(page.locator('#local-presence li')).toHaveCount(3);
    await expect(page.locator('.presence-services-link')).toHaveAttribute('href','#services');
    await expect(page.locator('.housing-callout a')).toHaveAttribute('href','/search.html');
    await expect(page.locator('#about .brand-feature-bird')).toBeVisible();
    const report=await page.evaluate(()=>{
      const groups=[...document.querySelectorAll('.trust-guarantee')];
      return {
        width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
        groups:groups.map(node=>{
          const box=node.getBoundingClientRect();
          return {left:box.left,right:box.right,height:box.height,client:node.clientWidth,scroll:node.scrollWidth,
            content:[...node.children].map(n=>n.textContent),
            controls:node.querySelectorAll('a,button,input,select,textarea,[tabindex]').length,
            paragraphs:[...node.querySelectorAll('p')].map(n=>({size:parseFloat(getComputedStyle(n).fontSize),overflow:getComputedStyle(n).overflowY,client:n.clientHeight,scroll:n.scrollHeight}))};
        })
      };
    });
    expect(report.scroll).toBeLessThanOrEqual(report.width+1);
    expect(report.groups).toHaveLength(2);
    expect(report.groups[0].content).toEqual(report.groups[1].content);
    for(const group of report.groups){
      expect(group.left).toBeGreaterThanOrEqual(0);expect(group.right).toBeLessThanOrEqual(width+1);
      expect(group.height).toBeGreaterThan(0);expect(group.scroll).toBeLessThanOrEqual(group.client+1);
      expect(group.controls).toBe(0);expect(group.paragraphs[0].size).toBeGreaterThanOrEqual(18);
      expect(group.paragraphs[1].size).toBeGreaterThanOrEqual(16);
      for(const paragraph of group.paragraphs)expect(paragraph.scroll).toBeLessThanOrEqual(paragraph.client+1);
    }
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await captureEvidence(page,testInfo,{screen:'home',state:'localized-layout',locale,cssViewportWidth:width});
  });
}

for(const locale of ['ru','en','es','ca']){
  test(`Home keyboard and interrupted form ${locale}`,async({page},testInfo)=>{
    test.skip(testInfo.project.name==='mobile-emulation','Covered on the two desktop engines at compact width');
    await page.setViewportSize({width:320,height:900});
    let mode='held',requests=0,release;
    await page.route('**/api/contact',async route=>{
      requests+=1;
      if(mode==='held')await new Promise(resolve=>{release=resolve;});
      return mode==='success'?route.fulfill({status:200,json:{ok:true}}):route.fulfill({status:500,json:{ok:false}});
    });
    await page.goto('/?contact=airbnb-listing-conflict#contact');
    await page.locator(`.site-footer [data-lang=${locale}]`).click();
    await expect(page.locator('[name=service]')).toHaveValue('other');
    expect(requests).toBe(0);
    const form=page.locator('#lead-form');
    await form.locator('[name=name]').fill('Fixture visitor');
    await form.locator('[name=contact]').fill('visitor@example.invalid');
    await form.locator('[name=message]').fill('First line');
    await form.locator('[name=message]').press('Enter');
    await form.locator('[name=message]').pressSequentially('Second line');
    expect(requests).toBe(0);
    await form.locator('button[type=submit]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','submitting');
    await expect.poll(()=>requests).toBe(1);
    await form.evaluate(node=>{node.requestSubmit();node.requestSubmit();});
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden','false');
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-toggle')).toBeFocused();
    release();
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','uncertain');
    await expect(form.locator('[name=message]')).toHaveValue('First line\nSecond line');
    expect(requests).toBe(1);
    mode='success';
    await form.locator('button[type=submit]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');
    await expect(page.locator('#lead-receipt')).toBeFocused();
    await expect.poll(()=>page.evaluate(()=>document.querySelector('#lead-receipt h3').getBoundingClientRect().top-document.querySelector('.topbar').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(15);
    expect(requests).toBe(2);
    await captureEvidence(page,testInfo,{screen:'home',state:'receipt',locale,cssViewportWidth:320,views:['contact']});
    await page.locator('#lead-new-request').focus();await page.keyboard.press('Enter');
    await expect(form.locator('[name=name]')).toBeFocused();
    await expect(form.locator('[name=name]')).toHaveValue('');
    await expect(page.locator('#form-status')).toHaveAttribute('data-state','editing');
  });
}

test('external HTTP and WebSocket probes are intercepted in the fresh context',async({page,context})=>{
  const audit=getNetworkAudit(context);
  const http='https://external.invalid/blocked-probe',ws='wss://external.invalid/blocked-probe';
  audit.expectedProbes.add(http);audit.expectedProbes.add(ws);
  await page.goto('/');
  expect(await page.evaluate(url=>fetch(url).then(()=>false,()=>true),http)).toBe(true);
  expect(await page.evaluate(url=>new Promise(resolve=>{
    const socket=new WebSocket(url);socket.onopen=()=>resolve('opened');socket.onclose=()=>resolve('closed');socket.onerror=()=>resolve('closed');
  }),ws)).toBe('closed');
  expect(audit.blockedRequests).toEqual(expect.arrayContaining([{kind:'blocked HTTP',url:http},{kind:'blocked WebSocket',url:ws}]));
  expect(await page.evaluate(()=>navigator.serviceWorker.register('/qa-probe-sw.js').then(()=>false,()=>true))).toBe(true);
  expect(context.serviceWorkers()).toHaveLength(0);
});
