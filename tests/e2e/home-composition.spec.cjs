const {test,expect}=require('./isolated-fixture.cjs');
const {captureEvidence}=require('./home-captures.cjs');

const trustCopy={
  en:{subject:'Local help with property in Barcelona',slogan:'Local help we stand behind.',explanation:'We agree the work and price up front, show you the result and take responsibility for our mistakes.',title:'Our work guarantee',promise:'If we make a mistake in our work, we’ll refund you and take the next step free of charge.',agreement:'We agree the scope of work, expected result, price and guarantee terms with you before work begins.'},
  es:{subject:'Ayuda local con inmuebles en Barcelona',slogan:'Ayuda de la que nos hacemos responsables.',explanation:'Acordamos el trabajo y el precio de antemano, mostramos el resultado y nos hacemos responsables de nuestros errores.',title:'La garantía de nuestro trabajo',promise:'Si cometemos un error en nuestro trabajo, te devolveremos el dinero y realizaremos gratis el siguiente paso.',agreement:'Acordaremos contigo el alcance del trabajo, el resultado esperado, el precio y las condiciones de la garantía antes de empezar.'},
  ca:{subject:'Ajuda local amb immobles a Barcelona',slogan:'Ajuda de la qual ens fem responsables.',explanation:'Acordem la feina i el preu per endavant, mostrem el resultat i assumim la responsabilitat dels nostres errors.',title:'La garantia de la nostra feina',promise:'Si ens equivoquem en la nostra feina, et retornarem els diners i farem el següent pas de franc.',agreement:"Abans de començar, acordarem amb tu l'abast de la feina, el resultat esperat, el preu i les condicions de la garantia."},
  ru:{subject:'Локальная помощь с недвижимостью в Барселоне',slogan:'Помощь, за которую мы отвечаем.',explanation:'Согласуем работу и цену заранее, показываем результат и отвечаем за свои ошибки.',title:'Гарантия нашей работы',promise:'Если мы ошиблись в своей работе, вернём деньги и следующий шаг сделаем бесплатно.',agreement:'Объём работы, ожидаемый результат, цену и условия гарантии согласуем с вами до начала работы.'}
};

async function quietNetwork(page){
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  await page.route('**/api/contact',route=>route.fulfill({status:200,json:{ok:true}}));
}

async function expectNoOverflow(page){
  const size=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(size.scroll).toBeLessThanOrEqual(size.client+1);
}

test('desktop Home exposes the accepted information architecture',async({page},testInfo)=>{
  await quietNetwork(page);
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await expect(page.locator('.hero-subject')).toHaveText(trustCopy.en.subject);
  await expect(page.locator('h1')).toHaveText(trustCopy.en.slogan);
  await expect(page.locator('.hero-lead')).toHaveText(trustCopy.en.explanation);
  await expect(page.locator('.trust-guarantee')).toHaveCount(2);
  await expect(page.locator('.trust-guarantee-promise')).toHaveText([trustCopy.en.promise,trustCopy.en.promise]);
  await expect(page.locator('.trust-guarantee-agreement')).toHaveText([trustCopy.en.agreement,trustCopy.en.agreement]);
  await expect(page.locator('.presence-card')).toBeVisible();
  await expect(page.locator('#local-presence .presence-label')).toHaveText('3 EXAMPLES FROM OUR 6 SERVICES');
  await expect(page.locator('.presence-services-link')).toHaveAttribute('href','#services');
  await expect(page.locator('.service-card')).toHaveCount(6);
  await expect(page.locator('.services-context p').first()).toHaveText('All 6 services — including the 3 examples above.');
  await expect(page.locator('#about')).toBeVisible();
  await expect(page.locator('#about-title')).toHaveText('About PARROT 669');
  await expect(page.locator('.brand-feature-bird')).toBeVisible();
  await expect(page.locator('.housing-callout')).toBeVisible();
  await expect(page.locator('#lead-form')).toBeVisible();
  await expect(page.locator('.trust-strip')).toBeHidden();
  expect(await page.evaluate(()=>{
    const services=document.querySelector('#services');
    const about=document.querySelector('#about');
    const housing=document.querySelector('.housing-callout');
    return services.compareDocumentPosition(about)&Node.DOCUMENT_POSITION_FOLLOWING &&
      about.compareDocumentPosition(housing)&Node.DOCUMENT_POSITION_FOLLOWING;
  })).toBeTruthy();
  await expectNoOverflow(page);
  await testInfo.attach('home-desktop-1440',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

for(const width of [390,320]){
  test(`compact Home ${width}px keeps localized cards readable and contained`,async({page},testInfo)=>{
    await quietNetwork(page);
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    for(const lang of ['en','es','ca','ru']){
      await page.locator(`.site-footer [data-lang=${lang}]`).click();
      const expected=trustCopy[lang];
      await expect(page.locator('.hero-subject')).toHaveText(expected.subject);
      await expect(page.locator('.hero h1')).toHaveText(expected.slogan);
      await expect(page.locator('.hero-lead')).toHaveText(expected.explanation);
      await expect(page.locator('.trust-guarantee h2,.trust-guarantee h3')).toHaveText([expected.title,expected.title]);
      await expect(page.locator('.trust-guarantee-promise')).toHaveText([expected.promise,expected.promise]);
      await expect(page.locator('.trust-guarantee-agreement')).toHaveText([expected.agreement,expected.agreement]);
      await expect(page.locator('.service-card')).toHaveCount(6);
      await expect(page.locator('#about')).toBeVisible();
      await expect(page.locator('.brand-feature-bird')).toBeVisible();
      if(lang==='ru'){
        const kicker=page.locator('.hero-kicker');
        await expect(kicker).toHaveText('Барселона · Независимый локальный сервис');
        const kickerGeometry=await kicker.evaluate(node=>{
          const rect=node.getBoundingClientRect();
          const textRange=document.createRange();
          textRange.selectNodeContents(node);
          const textRect=textRange.getBoundingClientRect();
          return {
            pill:{left:rect.left,right:rect.right,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth},
            text:{left:textRect.left,right:textRect.right}
          };
        });
        expect(kickerGeometry.pill.left).toBeGreaterThanOrEqual(0);
        expect(kickerGeometry.pill.right).toBeLessThanOrEqual(width+1);
        expect(kickerGeometry.pill.scrollWidth).toBeLessThanOrEqual(kickerGeometry.pill.clientWidth+1);
        expect(kickerGeometry.text.left).toBeGreaterThanOrEqual(kickerGeometry.pill.left);
        expect(kickerGeometry.text.right).toBeLessThanOrEqual(kickerGeometry.pill.right+1);
        const hero=await page.locator('.hero h1').evaluate(node=>{
          const rect=node.getBoundingClientRect();
          return {left:rect.left,right:rect.right,clientWidth:node.clientWidth,scrollWidth:node.scrollWidth};
        });
        expect(hero.left).toBeGreaterThanOrEqual(0);
        expect(hero.right).toBeLessThanOrEqual(width+1);
        expect(hero.scrollWidth).toBeLessThanOrEqual(hero.clientWidth+1);
        await captureEvidence(page,testInfo,{screen:'home',state:'hero-contained',locale:lang,cssViewportWidth:width});
      }
      const geometry=await page.locator('.service-card h3').evaluateAll(nodes=>nodes.map(node=>{
        const rect=node.getBoundingClientRect();
        return {left:rect.left,right:rect.right,width:rect.width,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth};
      }));
      for(const item of geometry){
        expect(item.left).toBeGreaterThanOrEqual(0);
        expect(item.right).toBeLessThanOrEqual(width+1);
        expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth+1);
      }
      const trustGeometry=await page.locator('.trust-guarantee').evaluateAll(nodes=>nodes.map(node=>{
        const rect=node.getBoundingClientRect();
        return {left:rect.left,right:rect.right,height:rect.height,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth};
      }));
      for(const item of trustGeometry){
        expect(item.left).toBeGreaterThanOrEqual(0);
        expect(item.right).toBeLessThanOrEqual(width+1);
        expect(item.height).toBeGreaterThan(0);
        expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth+1);
      }
      await expectNoOverflow(page);
    }
    await testInfo.attach(`home-compact-${width}`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
}

test('compact Menu traps focus, locks scroll and restores focus on Escape',async({page},testInfo)=>{
  await quietNetwork(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const toggle=page.locator('.menu-toggle');
  const menu=page.locator('#mobile-menu');
  await toggle.focus();
  await toggle.click();
  await expect(menu).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  await expect(page.locator('#mobile-menu .mobile-housing-primary')).toBeFocused();
  await captureEvidence(page,testInfo,{
    screen:'home',state:'menu-open-focus',locale:'en',cssViewportWidth:390,
    extra:{focus_target:'#mobile-menu .mobile-housing-primary'}
  });
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#mobile-menu [data-menu-lang=ru]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#mobile-menu .mobile-housing-primary')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-hidden','true');
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
  await expect(toggle).toBeFocused();

  await toggle.click();
  await page.locator('#mobile-menu [data-menu-lang=es]').click();
  await expect(toggle).toHaveAttribute('aria-label','Cerrar menú');
  await page.setViewportSize({width:1100,height:844});
  await expect(menu).toHaveAttribute('aria-hidden','true');
  await expect(toggle).toHaveAttribute('aria-label','Abrir menú');
  await expect(page.locator('body')).not.toHaveClass(/menu-open/);
});

for(const activation of ['pointer','keyboard']){
  test(`compact same-page Menu links focus their visible target with one history entry (${activation})`,async({page})=>{
    await quietNetwork(page);
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    const toggle=page.locator('.menu-toggle');
    const menu=page.locator('#mobile-menu');

    for(const hash of ['#services','#about','#contact']){
      await page.goto('/');
      await page.evaluate(()=>{
        window.__homeMenuPushes=[];
        const push=history.pushState.bind(history);
        history.pushState=(state,title,url)=>{window.__homeMenuPushes.push(String(url));return push(state,title,url);};
      });
      await toggle.click();
      const link=menu.locator(`a[href="${hash}"]`);
      await link.focus();
      if(activation==='pointer') await link.click();
      else await link.press('Enter');

      await expect(page).toHaveURL(new RegExp(hash+'$'));
      await expect(menu).toHaveAttribute('aria-hidden','true');
      await expect(page.locator('body')).not.toHaveClass(/menu-open/);
      await expect.poll(()=>page.evaluate(value=>{
        const target=document.querySelector(value);
        const active=document.activeElement;
        return Boolean(target && active && active.matches('h1,h2,h3') && target.contains(active) && active.tabIndex===-1);
      },hash)).toBe(true);
      expect(await page.evaluate(()=>window.__homeMenuPushes)).toEqual([hash]);
      const targetTop=await page.locator(hash).evaluate(node=>node.getBoundingClientRect().top);
      expect(targetTop).toBeGreaterThanOrEqual(0);
      expect(targetTop).toBeLessThanOrEqual(80);
      await page.keyboard.press('Tab');
      await expect.poll(()=>page.evaluate(()=>{
        const active=document.activeElement;
        return active!==document.body && !active?.closest('#mobile-menu') && active?.getClientRects().length>0;
      })).toBe(true);

      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(toggle).toBeFocused();

      await toggle.focus();
      await toggle.press('Enter');
      await expect(menu).toHaveAttribute('aria-hidden','false');
      await expect(page.locator('#mobile-menu .mobile-housing-primary')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-hidden','true');
      await expect(toggle).toBeFocused();
    }
  });
}

for(const activation of ['pointer','Enter','Space']){
  test(`service cards preserve one history/scroll and return focus on Back (${activation})`,async({page})=>{
    await quietNetwork(page);
    await page.goto('/');
    const card=page.locator('[data-service-card="rental"]');
    const historyBefore=await page.evaluate(()=>history.length);
    const scrolls=await page.evaluate(()=>{
      window.__homeScrolls=0;
      const target=document.querySelector('#contact');
      const original=target.scrollIntoView.bind(target);
      target.scrollIntoView=(options)=>{window.__homeScrolls+=1;return original(options);};
      return window.__homeScrolls;
    });
    expect(scrolls).toBe(0);
    await card.focus();
    if(activation==='pointer')await card.click();
    else await card.press(activation==='Space'?'Space':'Enter');
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact h2')).toBeFocused();
    expect(await page.evaluate(()=>history.length)).toBe(historyBefore+1);
    expect(await page.evaluate(()=>window.__homeScrolls)).toBe(1);
    await page.goBack();
    await expect(card).toBeFocused();
  });
}

test('Enter in the message textarea never submits the preserved lead form',async({page})=>{
  await quietNetwork(page);
  let requests=0;
  await page.unroute('**/api/contact');
  await page.route('**/api/contact',route=>{requests+=1;return route.fulfill({status:200,json:{ok:true}});});
  await page.setViewportSize({width:320,height:900});
  await page.goto('/');
  await page.locator('[name=name]').fill('Alex');
  await page.locator('[name=contact]').fill('alex@example.test');
  const message=page.locator('[name=message]');
  await message.fill('First line');
  await message.press('Enter');
  await message.type('Second line');
  await expect(message).toHaveValue('First line\nSecond line');
  await page.waitForTimeout(100);
  expect(requests).toBe(0);
});
