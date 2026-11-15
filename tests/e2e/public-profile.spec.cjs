const {test,expect} = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const parrotId='P669-AAAA-AAAA-AAAA';
const propertyId='11111111-1111-4111-8111-111111111111';
const currentCssPath=path.join(__dirname,'../../public/assets/public-profile.css');
const preV1V2CssPath=path.join(__dirname,'fixtures/public-profile-pre-v1v2-c5ad.css');
const preV1V2CssSha256='165e9e8a36c210764caf662762d7a901896be47c3b2bfd07be3a7e970f740c54';
const payload={
  profile:{parrotId,displayName:'Anna <script>alert(1)</script>',about:'A long, plain-text About\nwith a second line.'},
  property:{id:propertyId,title:'Casa Lumen',city:'Barcelona',cityNative:null,accommodationType:'entire_place',
    bedrooms:2,sleeps:4,minStayDays:3,
    listings:[
      {platform:'Airbnb',url:'https://www.airbnb.com/rooms/123',calendarControlStatus:'verified'},
      {platform:'Pending',url:'https://example.com/pending',calendarControlStatus:'pending'},
    ]},
};

async function fixture(page,{owner=false,transientError=false,profilePayload=payload}={}) {
  let profileRequests=0;
  await page.route(/^https?:\/\/[^/]+\/p\/[^/?]+(?:\?.*)?$/,route=>route.fulfill({
    path:path.join(__dirname,'../../public/profile.html'),
    contentType:'text/html; charset=utf-8',
  }));
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  await page.route('**/api/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path===`/api/p/${parrotId}`) {
      profileRequests+=1;
      if(transientError&&profileRequests===1) return route.fulfill({status:502,json:{error:'temporary'}});
      return route.fulfill({json:profilePayload});
    }
    if(path==='/api/host/auth/me') return owner
      ? route.fulfill({json:{accountId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'owner@example.test',username:'owner',parrotId:parrotId,displayName:'Owner'}})
      : route.fulfill({status:401,json:{error:'unauthorized'}});
    return route.fulfill({status:501,json:{error:'unexpected fixture route'}});
  });
}
const noOverflow=async page=>{
  const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width+1);
};
const expectDisplayNameFocusWithoutControlChrome=async page=>{
  const name=page.locator('#profile-name');
  await expect(name).toBeFocused();
  await expect(name).toHaveCSS('outline-style','none');
};
const navGeometry=page=>page.locator('.profile-topbar nav a').evaluateAll(links=>{
  const nav=links[0]?.closest('nav')?.getBoundingClientRect();
  return links.map(link=>{
    const range=document.createRange();
    range.selectNodeContents(link);
    const textLines=new Set(Array.from(range.getClientRects())
      .filter(rect=>rect.width>0&&rect.height>0)
      .map(rect=>Math.round(rect.top*10)/10));
    const rect=link.getBoundingClientRect();
    return {
      text:link.textContent,
      lineCount:textLines.size,
      insideNav:Boolean(nav)&&rect.left>=nav.left-1&&rect.right<=nav.right+1,
      height:rect.height,
    };
  });
});

test('V1/V2 predicates reject pre-fix CSS and pass after restoration',async({page})=>{
  const oldCssHash=crypto.createHash('sha256').update(fs.readFileSync(preV1V2CssPath)).digest('hex');
  expect(oldCssHash).toBe(preV1V2CssSha256);

  let selectedCssPath=preV1V2CssPath;
  await page.route('**/assets/public-profile.css',route=>route.fulfill({
    path:selectedCssPath,
    contentType:'text/css; charset=utf-8',
  }));
  await page.setViewportSize({width:320,height:900});
  await fixture(page);

  await page.goto(`/p/${parrotId}?property=${propertyId}`);
  await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  await page.locator('[data-lang="ru"]').focus();
  await page.keyboard.press('Enter');
  const oldGeometry=await navGeometry(page);
  expect(oldGeometry.some(item=>item.lineCount>1),'pre-fix CSS must fragment at least one Russian navigation label at 320px / 200%').toBe(true);
  const oldName=page.locator('#profile-name');
  await expect(oldName).toBeFocused();
  await expect(oldName).toHaveCSS('outline-style','solid');
  await expect(oldName).toHaveCSS('outline-width','3px');
  console.log(`PM-099_NEGATIVE_CONTROL old_css_ref=c5ad8c318dc8b3fe97351414ca0631ec9b579c41 old_css_sha256=${oldCssHash} old_v1=FAIL_EXPECTED(fragmented_ru_320_200) old_v2=FAIL_EXPECTED(visible_name_outline)`);

  selectedCssPath=currentCssPath;
  await page.reload();
  await expect(page.locator('#profile-name')).toBeFocused();
  await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  // Reload restores Russian; switch away before exercising the Russian reload/focus path.
  await page.locator('[data-lang="en"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expectDisplayNameFocusWithoutControlChrome(page);
  await page.locator('[data-lang="ru"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang','ru');
  await expectDisplayNameFocusWithoutControlChrome(page);
  const restoredGeometry=await navGeometry(page);
  expect(restoredGeometry).toHaveLength(3);
  for(const item of restoredGeometry) {
    expect(item.lineCount,`${item.text} must remain one readable word/label`).toBe(1);
    expect(item.insideNav,`${item.text} must remain inside the wrapping navigation`).toBe(true);
    expect(item.height,`${item.text} must retain a usable tap target`).toBeGreaterThanOrEqual(87);
  }
  await noOverflow(page);
  await expectDisplayNameFocusWithoutControlChrome(page);
  await page.locator('[data-lang="ru"]').focus();
  await expect(page.locator('[data-lang="ru"]')).toHaveCSS('outline-style','solid');
  await expect(page.locator('[data-lang="ru"]')).toHaveCSS('outline-width','3px');
  console.log(`PM-099_NEGATIVE_CONTROL restored_v1=PASS restored_v2=PASS interactive_focus=PASS ci_sha=${process.env.GITHUB_SHA||'local'}`);
});

for(const width of [1440,390,320]) test(`public profile wraps without overflow at ${width}px and 200% zoom`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await fixture(page);
  await page.goto(`/p/${parrotId}?property=${propertyId}&from=2027-05-01&to=2027-05-05`);
  await expect(page.locator('#profile-content')).toBeVisible();
  await expect(page.locator('#profile-name')).toContainText('Anna <script>');
  await expect(page.locator('#profile-name script')).toHaveCount(0);
  await expect(page.locator('.profile-listing')).toHaveCount(2);
  await expect(page.locator('.profile-listing-status')).toHaveText([
    'Calendar control confirmed ✓','The host has not finished calendar verification',
  ]);
  await expect(page.locator('#profile-contact')).toHaveAttribute('href',new RegExp(`property=${propertyId}.*from=2027-05-01.*to=2027-05-05`));
  await noOverflow(page);
  await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  await noOverflow(page);
});

test('localized navigation keeps whole readable labels at compact, zoomed and desktop sizes',async({page})=>{
  await fixture(page);
  await page.goto(`/p/${parrotId}?property=${propertyId}`);
  const cases=[
    {width:320,zoom:2,languages:['ru']},
    {width:320,zoom:1,languages:['en','es','ca','ru']},
    {width:390,zoom:1,languages:['en','es','ca','ru']},
    {width:1440,zoom:1,languages:['en','es','ca','ru']},
  ];
  for(const current of cases) {
    await page.setViewportSize({width:current.width,height:900});
    await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);},current.zoom);
    for(const language of current.languages) {
      await page.locator(`[data-lang="${language}"]`).click();
      const geometry=await navGeometry(page);
      expect(geometry,`${language} at ${current.width}px / ${current.zoom*100}%`).toHaveLength(3);
      for(const item of geometry) {
        expect(item.lineCount,`${item.text} must remain one readable word/label`).toBe(1);
        expect(item.insideNav,`${item.text} must remain inside the wrapping navigation`).toBe(true);
        expect(item.height,`${item.text} must retain a usable tap target`).toBeGreaterThanOrEqual(44*current.zoom-1);
      }
      await noOverflow(page);
    }
  }
});

test('keyboard/language and owner states remain reachable',async({page})=>{
  await fixture(page,{owner:true});
  await page.goto(`/p/${parrotId}?property=${propertyId}`);
  await expectDisplayNameFocusWithoutControlChrome(page);
  await expect(page.locator('#profile-edit')).toBeVisible();
  await expect(page.locator('#profile-contact')).toBeHidden();
  await page.locator('[data-lang="ru"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-edit')).toHaveText('Редактировать мой профиль');
  await expectDisplayNameFocusWithoutControlChrome(page);
});

test('person-only display name remains readable text when programmatically focused',async({page})=>{
  const profilePayload={profile:{parrotId,displayName:'Anna',about:null},property:null};
  await fixture(page,{profilePayload});
  await page.goto(`/p/${parrotId}`);
  await expect(page.locator('#profile-person-only')).toBeVisible();
  await expect(page.locator('#profile-name')).toHaveText('Anna');
  await expectDisplayNameFocusWithoutControlChrome(page);
});

test('transient error focuses visible Retry and Enter recovers successfully',async({page})=>{
  await fixture(page,{transientError:true});
  await page.goto(`/p/${parrotId}?property=${propertyId}`);
  await expect(page.locator('#profile-error')).toBeVisible();
  await expect(page.locator('#profile-retry')).toBeVisible();
  await expect(page.locator('#profile-retry')).toBeFocused();
  await expect(page.locator('#profile-retry')).toHaveCSS('outline-style','solid');
  await expect(page.locator('#profile-retry')).toHaveCSS('outline-width','3px');
  await page.keyboard.press('Enter');
  await expect(page.locator('#profile-content')).toBeVisible();
  await expect(page.locator('#profile-name')).toHaveText(/Anna/);
  await expectDisplayNameFocusWithoutControlChrome(page);
});
