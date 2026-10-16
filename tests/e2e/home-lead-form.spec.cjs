const {test,expect}=require('@playwright/test');

async function quietNetwork(page){
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
}
async function fill(page,{name='Alex',contact='alex@example.test',service='owner',message='Need local help'}={}){
  await page.locator('[name=name]').fill(name);
  await page.locator('[name=contact]').fill(contact);
  await page.locator('[name=service]').selectOption(service);
  await page.locator('[name=message]').fill(message);
}

test('lead form snapshots one request, localizes in flight and confirms with a read-only summary',async({page})=>{
  await quietNetwork(page);
  let requests=0,release;
  await page.route('**/api/contact',async route=>{
    requests+=1;
    await new Promise(resolve=>{release=()=>{resolve();route.fulfill({status:200,json:{ok:true}});};});
  });
  await page.goto('/');
  await fill(page);
  await page.locator('#lead-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','submitting');
  await expect(page.locator('#lead-form [name=name]')).toBeDisabled();
  await page.locator('[data-lang=ru]').click();
  await expect(page.locator('#form-status')).toHaveText('Отправляем…');
  await expect.poll(()=>requests).toBe(1);
  release();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');
  await expect(page.locator('#lead-editor')).toBeHidden();
  await expect(page.locator('#lead-receipt')).toBeVisible();
  await expect(page.locator('[data-lead-value=name]')).toHaveText('Alex');
  await expect(page.locator('[data-lead-value=service]')).toHaveText('Услуги для владельцев');
  await expect(page.locator('#lead-receipt')).toBeFocused();
  await page.locator('#lead-new-request').click();
  await expect(page.locator('#lead-editor')).toBeVisible();
  await expect(page.locator('[name=name]')).toBeFocused();
  await expect(page.locator('[name=name]')).toHaveValue('');
});

test('validation rejection and ambiguous server or network outcomes preserve the draft',async({page})=>{
  await quietNetwork(page);
  let mode='validation',requests=0;
  await page.route('**/api/contact',route=>{
    requests+=1;
    if(mode==='validation')return route.fulfill({status:400,json:{ok:false,error:'Missing or invalid fields'}});
    if(mode==='server-unknown')return route.fulfill({status:500,json:{ok:false,error:'Email delivery failed'}});
    if(mode==='network-unknown')return route.abort('failed');
    return route.fulfill({status:200,json:{ok:true}});
  });
  await page.goto('/');
  await fill(page,{message:'Keep this exact draft'});
  await page.locator('#lead-form').evaluate(form=>form.requestSubmit());
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','error');
  await expect(page.locator('[name=message]')).toHaveValue('Keep this exact draft');
  await expect(page.locator('#lead-form button[type=submit]')).toHaveText('Try again');
  expect(requests).toBe(1);

  mode='server-unknown';
  await page.locator('#lead-form button[type=submit]').click();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','uncertain');
  await expect(page.locator('#form-status')).toContainText('may have arrived');
  await expect(page.locator('[name=message]')).toHaveValue('Keep this exact draft');
  await expect(page.locator('#lead-form button[type=submit]')).toHaveText('Send again');
  await page.waitForTimeout(100);
  expect(requests).toBe(2);

  mode='network-unknown';
  await page.locator('#lead-form button[type=submit]').click();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','uncertain');
  await page.waitForTimeout(100);
  expect(requests).toBe(3);

  mode='success';
  await page.locator('#lead-form button[type=submit]').click();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');
  expect(requests).toBe(4);
});

test('manual retry keeps the receipt title below the compact sticky header in every locale',async({page})=>{
  await quietNetwork(page);
  let status=500,requests=0;
  await page.route('**/api/contact',route=>{
    requests+=1;
    return route.fulfill({status,json:status===200?{ok:true}:{ok:false,error:'Email delivery failed'}});
  });
  for(const width of [390,320]){
    await page.setViewportSize({width,height:900});
    for(const lang of ['en','es','ca','ru']){
      await page.goto('/');
      await page.locator(`[data-lang=${lang}]`).click();
      await fill(page,{message:`Keep ${lang} draft`});
      status=500;
      const before=requests;
      await page.locator('#lead-form').evaluate(form=>form.requestSubmit());
      await expect(page.locator('#form-status')).toHaveAttribute('data-state','uncertain');
      await page.evaluate(()=>window.scrollBy(0,400));
      status=200;
      await page.locator('#lead-form').evaluate(form=>form.requestSubmit());
      await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');
      await expect(page.locator('#lead-receipt')).toBeFocused();
      const geometry=await page.evaluate(()=>({
        headerBottom:document.querySelector('.topbar').getBoundingClientRect().bottom,
        titleTop:document.querySelector('#lead-receipt h3').getBoundingClientRect().top
      }));
      expect(geometry.titleTop).toBeGreaterThanOrEqual(geometry.headerBottom+15);
      expect(requests-before).toBe(2);
    }
  }
});

test('prefilled conflict stays a draft and compact localized states do not overflow',async({page})=>{
  await quietNetwork(page);
  let requests=0;
  await page.route('**/api/contact',route=>{requests+=1;return route.fulfill({status:200,json:{ok:true}});});
  const contextCopy={en:/already connected to another account/,es:/conectado a otra cuenta/,ca:/connectat a un altre compte/,ru:/привязано к другому аккаунту/};
  for(const width of [390,320]){
    await page.setViewportSize({width,height:900});
    await page.goto('/?contact=airbnb-listing-conflict#contact');
    await expect(page.locator('[name=service]')).toHaveValue('other');
    expect(requests).toBe(0);
    for(const lang of ['en','es','ca','ru']){
      await page.locator(`[data-lang=${lang}]`).click();
      await expect(page.locator('[name=message]')).toHaveValue(contextCopy[lang]);
      await expect(page.locator('#form-status')).toHaveAttribute('data-state','editing');
      const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client+1);
      await expect(page.locator('#lead-form label').first()).toBeVisible();
    }
  }
});
