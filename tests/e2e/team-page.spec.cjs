const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const fixture=fs.readFileSync(path.resolve(__dirname,'../fixtures/team-portrait-synthetic.svg'),'utf8');
const {measurePortraits,validatePortraits}=require('../team-portrait-geometry.cjs');
const labels={alexey:'АЧ',alex:'АЛ',mark:'МК',denis:'ДЕ',igor:'ИГ',boris:'БО',nikita:'НИ',codex:'КО',masha:'МА'};

async function syntheticTeam(page){
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:'@font-face{font-family:Manrope;src:local(Arial)}'}));
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  await page.route('**/assets/team/*',route=>{
    const name=route.request().url().split('/').pop().replace(/\.(?:webp|png|jpg)$/,'').replace('-full','').replace('-crop','').replace('-designer','');
    return route.fulfill({contentType:'image/svg+xml',body:fixture.replace('{{LABEL}}',labels[name]||'ИИ')});
  });
}

async function expectNoOverflow(page){
  const geometry=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+1);
  const text=await page.locator('.team-card-copy').evaluateAll(nodes=>nodes.map(node=>({client:node.clientWidth,scroll:node.scrollWidth})));
  for(const item of text) expect(item.scroll).toBeLessThanOrEqual(item.client+1);
}

for(const width of [1440,390,320]){
  test(`synthetic local Team ${width}px keeps the accepted structure readable`,async({page},testInfo)=>{
    await syntheticTeam(page);
    await page.setViewportSize({width,height:width===1440?1000:900});
    await page.goto('/team.html');
    await expect(page.locator('html')).toHaveAttribute('lang','ru');
    await expect(page.locator('.team-card')).toHaveCount(9);
    await expect(page.locator('.team-card[data-kind=human]')).toHaveCount(1);
    await expect(page.locator('.team-card[data-kind=ai]')).toHaveCount(8);
    await expect(page.locator('.team-github')).toHaveCount(7);
    await expect(page.locator('.team-portrait')).toHaveCount(9);
    await page.evaluate(()=>document.fonts.ready);
    await expectNoOverflow(page);
    await testInfo.attach(`team-synthetic-${width}`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
}

test('synthetic compact controls preserve natural wrapping and five review regions',async({page},testInfo)=>{
  await syntheticTeam(page);
  for(const [width,members] of [[390,['nikita','masha']],[320,['alex','denis','masha']]]){
    await page.setViewportSize({width,height:900});
    await page.goto('/team.html');
    for(const member of members){
      const card=page.locator(`[data-member=${member}]`);
      const bio=card.locator('.team-bio');
      await expect(card).toBeVisible();
      const box=await bio.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(width===320?31:37);
      expect(box.x+box.width).toBeLessThanOrEqual(width-(width===320?31:37));
      const wrapping=await bio.evaluate(node=>({client:node.clientWidth,scroll:node.scrollWidth,height:node.getBoundingClientRect().height,line:parseFloat(getComputedStyle(node).lineHeight)}));
      expect(wrapping.scroll).toBeLessThanOrEqual(wrapping.client+1);
      expect(wrapping.height).toBeGreaterThanOrEqual(wrapping.line);
      await testInfo.attach(`team-control-${member}-${width}`,{body:await card.screenshot(),contentType:'image/png'});
    }
    await expectNoOverflow(page);
  }
});

test('Team landmarks, keyboard path and CSS magnification stay usable',async({page})=>{
  await syntheticTeam(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/team.html');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('.team-skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#team-members$/);
  await expect(page.locator('#team-members')).toBeFocused();
  await page.evaluate(()=>{document.body.style.zoom='2';});
  const overflowEvidence=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const rounded=value=>Math.round(value*100)/100;
    const identify=node=>node.tagName.toLowerCase()+(node.id?'#'+node.id:'')+(typeof node.className==='string'?'.'+node.className.trim().split(/\s+/).join('.'):'');
    const nodes=Array.from(document.body.querySelectorAll('*')).map(node=>{
      const r=node.getBoundingClientRect(),s=getComputedStyle(node);
      if(!r.width||!r.height||s.display==='none')return null;
      const textRects=[];
      for(const child of node.childNodes)if(child.nodeType===Node.TEXT_NODE&&child.textContent.trim()){
        const range=document.createRange();range.selectNodeContents(child);
        for(const box of range.getClientRects())if(box.right>width+1)textRects.push({right:rounded(box.right),width:rounded(box.width)});
      }
      if(r.right<=width+1&&node.scrollWidth<=node.clientWidth+1&&!textRects.length)return null;
      return {node:identify(node),parent:identify(node.parentElement),text:node.textContent.trim().slice(0,100),
        rect:{left:rounded(r.left),right:rounded(r.right),width:rounded(r.width)},client:node.clientWidth,scroll:node.scrollWidth,
        css:{display:s.display,width:s.width,minWidth:s.minWidth,maxWidth:s.maxWidth,overflowX:s.overflowX,
          font:s.font,fontSize:s.fontSize,whiteSpace:s.whiteSpace,overflowWrap:s.overflowWrap,zoom:s.zoom},textRects};
    }).filter(Boolean);
    return {viewport:width,documentScroll:document.documentElement.scrollWidth,bodyRect:document.body.getBoundingClientRect().toJSON(),nodes:nodes.slice(0,100),total:nodes.length};
  });
  console.log('TEAM_OVERFLOW_EVIDENCE '+JSON.stringify(overflowEvidence));
  await expectNoOverflow(page);
  await expect(page.locator('[data-member=masha]')).toBeVisible();
});

test('Home footer Team entry follows the saved locale without altering Home sections',async({page})=>{
  await syntheticTeam(page);
  await page.goto('/');
  const labels={en:'Team',es:'Equipo',ca:'Equip',ru:'Команда'};
  for(const [lang,label] of Object.entries(labels)){
    await page.locator(`.site-footer [data-lang=${lang}]`).click();
    await expect(page.locator('.site-footer a[href="/team.html"]')).toHaveText(label);
    await expect(page.locator('.service-card')).toHaveCount(6);
  }
  await page.locator('.site-footer a[href="/team.html"]').click();
  await expect(page).toHaveURL(/\/team\.html$/);
  await expect(page.locator('html')).toHaveAttribute('lang','ru');
});


// Actual authorized local assets, not the synthetic route fixture above.
for(const width of [1440,761,760,390,320]){
  test(`equal portrait widths/heights and whole-person crop at ${width}px`,async({page},testInfo)=>{
    await page.route('https://fonts.googleapis.com/**',route=>route.abort());
    await page.route('https://fonts.gstatic.com/**',route=>route.abort());
    await page.setViewportSize({width,height:width===1440?1000:900});
    await page.goto('/team.html');
    await page.locator('[data-member=masha] img').evaluate(image=>image.decode());
    validatePortraits(await page.evaluate(measurePortraits),width);
    await testInfo.attach(`team-actual-${width}`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
}
