const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('accepted Home composition makes the three-item preview explicitly lead to all six services',()=>{
  const html=read('public/index.html');
  const cards=[...html.matchAll(/data-service-card="([^"]+)"/g)].map(match=>match[1]);
  assert.match(html,/<body class="home-page">/);
  assert.match(html,/class="presence-card" id="local-presence"/);
  assert.match(html,/data-i18n="presenceLabel">3 EXAMPLES FROM OUR 6 SERVICES/);
  assert.match(html,/class="presence-services-link" href="#services"/);
  assert.match(html,/data-i18n="servicesRelation">All 6 services — including the 3 examples above\./);
  assert.deepEqual(cards,['rental','visit','documents','search','owner','other']);
  assert.match(html,/class="housing-callout"/);
  assert.match(html,/class="housing-cta" href="\/search\.html"/);
  assert.match(html,/assets\/styles\.css\?v=20261018-home-trust/);
  assert.match(html,/type="module" src="\/assets\/entry-home\.js"/);
});

test('Home trust copy renders the exact localized hero copy and two identical visible guarantee groups',()=>{
  const html=read('public/index.html');
  const script=read('public/assets/script.js');
  const expected={
    en:[
      'Local help we stand behind.',
      'We agree the work and price up front, show you the result and take responsibility for our mistakes.',
      'Local help with property in Barcelona',
      'Our work guarantee',
      'If we make a mistake in our work, we’ll refund you and take the next step free of charge.',
      'We agree the scope of work, expected result, price and guarantee terms with you before work begins.'
    ],
    es:[
      'Ayuda de la que nos hacemos responsables.',
      'Acordamos el trabajo y el precio de antemano, mostramos el resultado y nos hacemos responsables de nuestros errores.',
      'Ayuda local con inmuebles en Barcelona',
      'La garantía de nuestro trabajo',
      'Si cometemos un error en nuestro trabajo, te devolveremos el dinero y realizaremos gratis el siguiente paso.',
      'Acordaremos contigo el alcance del trabajo, el resultado esperado, el precio y las condiciones de la garantía antes de empezar.'
    ],
    ca:[
      'Ajuda de la qual ens fem responsables.',
      'Acordem la feina i el preu per endavant, mostrem el resultat i assumim la responsabilitat dels nostres errors.',
      'Ajuda local amb immobles a Barcelona',
      'La garantia de la nostra feina',
      'Si ens equivoquem en la nostra feina, et retornarem els diners i farem el següent pas de franc.',
      "Abans de començar, acordarem amb tu l'abast de la feina, el resultat esperat, el preu i les condicions de la garantia."
    ],
    ru:[
      'Помощь, за которую мы отвечаем.',
      'Согласуем работу и цену заранее, показываем результат и отвечаем за свои ошибки.',
      'Локальная помощь с недвижимостью в Барселоне',
      'Гарантия нашей работы',
      'Если мы ошиблись в своей работе, вернём деньги и следующий шаг сделаем бесплатно.',
      'Объём работы, ожидаемый результат, цену и условия гарантии согласуем с вами до начала работы.'
    ]
  };
  for(const strings of Object.values(expected)){
    for(const value of strings)assert.ok(script.includes(JSON.stringify(value).slice(1,-1)),value);
  }

  const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});
  const {window}=dom;
  window.fetch=async()=>({ok:true,json:async()=>[]});
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=callback=>callback();
  window.scrollTo=()=>{};
  window.HTMLElement.prototype.scrollIntoView=()=>{};
  require('./helpers/core.cjs').installCore(window);
  window.eval(script);
  const groups=[...window.document.querySelectorAll('.trust-guarantee')];
  assert.equal(groups.length,2);
  assert.equal(groups[0].previousElementSibling.className,'hero-actions');
  assert.equal(groups[0].nextElementSibling.className,'hero-points');
  assert.equal(groups[1].previousElementSibling.dataset.i18n,'contactText');
  assert.equal(groups[1].nextElementSibling.className,'contact-note');
  assert.equal(groups[0].querySelector('h2').dataset.i18n,'guaranteeTitle');
  assert.equal(groups[1].querySelector('h3').dataset.i18n,'guaranteeTitle');
  assert.equal(groups.flatMap(group=>[...group.querySelectorAll('a,button,input,select,textarea,[tabindex]')]).length,0);

  for(const [lang,strings] of Object.entries(expected)){
    window.document.querySelector(`[data-lang="${lang}"]`).click();
    assert.equal(window.document.querySelector('.hero-subject').textContent,strings[2]);
    assert.equal(window.document.querySelector('.hero h1').textContent,strings[0]);
    assert.equal(window.document.querySelector('.hero-lead').textContent.trim(),strings[1]);
    for(const group of groups){
      assert.equal(group.querySelector('h2,h3').textContent,strings[3]);
      assert.equal(group.querySelector('.trust-guarantee-promise').textContent,strings[4]);
      assert.equal(group.querySelector('.trust-guarantee-agreement').textContent,strings[5]);
    }
  }
  const ids=[...window.document.querySelectorAll('[id]')].map(node=>node.id);
  assert.equal(new Set(ids).size,ids.length);
  dom.window.close();
});

test('Home trust copy trust styles remain Home-scoped and preserve ordinary-flow text at compact widths',()=>{
  const css=read('public/assets/styles.css');
  const trustSelectorLines=css.split('\n').filter(line=>line.includes('.trust-guarantee'));
  assert.ok(trustSelectorLines.length>10);
  assert.ok(trustSelectorLines.every(line=>line.trim().startsWith('.home-page')));
  assert.match(css,/\.home-page \.trust-guarantee\{[\s\S]*overflow:visible;[\s\S]*overflow-wrap:anywhere;[\s\S]*text-overflow:clip;/);
  assert.doesNotMatch(trustSelectorLines.join('\n'),/display:none|visibility:hidden|white-space:nowrap|line-clamp|text-overflow:ellipsis/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.home-page \.trust-guarantee-hero h2\{font-size:20px\}/);
});

test('About is one destination, reuses the original emblem and renders after the catalogue',()=>{
  const html=read('public/index.html');
  const css=read('public/assets/styles.css');
  assert.equal((html.match(/href="#about"/g)||[]).length,3);
  assert.doesNotMatch(html,/href="#local-presence"/);
  assert.match(html,/<section class="brand-feature" id="about" aria-labelledby="about-title">/);
  assert.match(html,/id="about-title" data-i18n="aboutTitle">About PARROT 669/);
  assert.match(html,/class="brand-feature-bird"[\s\S]*data:image\/webp;base64/);
  assert.match(html,/class="button brand-feature-cta" href="#contact"/);
  assert.ok(html.indexOf('id="services"')<html.indexOf('id="about"'));
  assert.ok(html.indexOf('id="about"')<html.indexOf('class="housing-callout"'));
  assert.match(css,/\.home-page \.brand-feature-bird\{[\s\S]*width:240px/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.home-page \.brand-feature-bird\{width:160px\}/);
  assert.doesNotMatch(css,/\.home-page :is\([^}]*\.brand-feature[^}]*\)\{display:none\}/);
});

test('Home styling is page-scoped and protects compact long labels',()=>{
  const css=read('public/assets/styles.css');
  assert.match(css,/Home composition, scoped to the Home page./);
  assert.match(css,/\.home-page \.service-card h3[\s\S]*overflow-wrap:anywhere/);
  assert.match(css,/@media\(max-width:340px\)/);
  assert.match(css,/\.home-page\.menu-open\{overflow:hidden\}/);
});

test('same-page anchors use one history entry, one scroll and programmatic heading focus',()=>{
  const script=read('public/assets/script.js');
  assert.match(script,/document\.addEventListener\("click", event => \{[\s\S]*a\[href\^="#"\]/);
  assert.match(script,/if \(!document\.body\.classList\.contains\("home-page"\)\) return/);
  assert.match(script,/event\.preventDefault\(\);[\s\S]*navigateHomeAnchor/);
  assert.match(script,/history\.pushState\(null, "", hash\);/);
  assert.match(script,/focusTarget\.setAttribute\("tabindex", "-1"\)/);
  assert.match(script,/focusTarget\.focus\(\{preventScroll:true\}\)/);
  assert.equal((script.match(/history\.pushState\(null, "", hash\)/g)||[]).length,1);
  assert.equal((script.match(/target\.scrollIntoView/g)||[]).length,1);
});

function integratedHome(){
  const dom=new JSDOM(read('public/index.html'),{
    url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true
  });
  const {window}=dom;
  const counts={history:0,scroll:0};
  window.fetch=async()=>({ok:true,json:async()=>[]});
  window.requestAnimationFrame=callback=>callback();
  window.scrollTo=()=>{};
  window.HTMLElement.prototype.getClientRects=function(){return [{width:1,height:1}];};
  window.HTMLElement.prototype.scrollIntoView=function(){counts.scroll+=1;};
  const pushState=window.history.pushState.bind(window.history);
  window.history.pushState=(...args)=>{counts.history+=1;return pushState(...args);};
  require('./helpers/core.cjs').installCore(window);
  window.eval(read('public/assets/lead-form.js'));
  window.eval(read('public/assets/script.js'));
  return {dom,window,document:window.document,counts};
}

function activatePointer(window,node){
  node.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
}

function activateKey(window,node,key){
  const event=new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});
  node.dispatchEvent(event);
  // jsdom does not perform the native anchor Enter default action.
  if(key==='Enter'&&!event.defaultPrevented&&node.matches('a[href]'))activatePointer(window,node);
}

test('both Home scripts produce exactly one history mutation and scroll for the sole native service target',()=>{
  for(const [selector,activation] of [
    ['[data-service="rental"]','pointer'],
    ['[data-service-card="visit"] a[data-service]','pointer'],
    ['[data-service-card="documents"] a[data-service]','Enter']
  ]){
    const app=integratedHome();
    const node=app.document.querySelector(selector);
    node.focus();
    if(activation==='pointer')activatePointer(app.window,node);
    else activateKey(app.window,node,activation);
    assert.equal(app.counts.history,1,`${selector} history`);
    assert.equal(app.counts.scroll,1,`${selector} scroll`);
    assert.equal(app.window.location.hash,'#contact');
    assert.equal(app.document.activeElement,app.document.querySelector('#contact h2'));
    app.dom.window.close();
  }
});

test('nested and repeated service activation keeps one mutation/scroll per activation',()=>{
  const app=integratedHome();
  const link=app.document.querySelector('[data-service-card="owner"] [data-service="owner"]');
  activatePointer(app.window,link);
  assert.deepEqual(app.counts,{history:1,scroll:1});
  activatePointer(app.window,link);
  assert.deepEqual(app.counts,{history:2,scroll:2});
  assert.equal(app.document.activeElement,app.document.querySelector('#contact h2'));
  app.dom.window.close();
});

test('service card body is passive and Space on its sole native link never activates Contact',()=>{
  const app=integratedHome();
  const card=app.document.querySelector('[data-service-card="owner"]');
  const link=card.querySelector('a[data-service]');
  const originalService=app.document.querySelector('[name=service]').value;
  assert.equal(card.hasAttribute('tabindex'),false);assert.notEqual(card.getAttribute('role'),'button');
  activatePointer(app.window,card.querySelector('h3'));
  activateKey(app.window,card,'Enter');activateKey(app.window,card,' ');
  link.focus();activateKey(app.window,link,' ');
  assert.deepEqual(app.counts,{history:0,scroll:0});assert.equal(app.window.location.hash,'');
  assert.equal(app.document.querySelector('[name=service]').value,originalService);
  assert.equal(app.document.activeElement,link);
  app.dom.window.close();
});

test('submitting and success guards block service navigation in the integrated scripts',async()=>{
  for(const state of ['submitting','success']){
    const app=integratedHome();
    app.document.querySelector('[name="name"]').value='Alex';
    app.document.querySelector('[name="contact"]').value='alex@example.test';
    app.document.querySelector('[name="message"]').value='Need help';
    app.window.fetch=state==='submitting'
      ? ()=>new Promise(()=>{})
      : async()=>({ok:true,json:async()=>({ok:true})});
    app.document.getElementById('lead-form').dispatchEvent(
      new app.window.Event('submit',{bubbles:true,cancelable:true})
    );
    if(state==='success')await new Promise(resolve=>setImmediate(resolve));
    const link=app.document.querySelector('[data-service="rental"]');
    activatePointer(app.window,link);
    assert.deepEqual(app.counts,{history:0,scroll:0},state);
    assert.equal(app.window.location.hash,'');
    app.dom.window.close();
  }
});

test('popstate restores the original visible service activator or compact Menu trigger',()=>{
  const serviceApp=integratedHome();
  const card=serviceApp.document.querySelector('[data-service-card="other"] a[data-service]');
  card.focus();
  activateKey(serviceApp.window,card,'Enter');
  serviceApp.window.dispatchEvent(new serviceApp.window.PopStateEvent('popstate'));
  assert.equal(serviceApp.document.activeElement,card);
  serviceApp.dom.window.close();

  const menuApp=integratedHome();
  const toggle=menuApp.document.querySelector('.menu-toggle');
  activatePointer(menuApp.window,toggle);
  const aboutLink=menuApp.document.querySelector('#mobile-menu a[href="#about"]');
  activatePointer(menuApp.window,aboutLink);
  menuApp.window.dispatchEvent(new menuApp.window.PopStateEvent('popstate'));
  assert.equal(menuApp.document.activeElement,toggle);
  menuApp.dom.window.close();
});

test('compact Menu keeps focus containment, Escape return and scroll lock',()=>{
  const script=read('public/assets/script.js');
  assert.match(script,/document\.body\.classList\.toggle\("menu-open", open\)/);
  assert.match(script,/event\.key === "Escape"/);
  assert.match(script,/event\.key !== "Tab"/);
  assert.match(script,/menuReturnFocus instanceof HTMLElement \? menuReturnFocus : menuToggle/);
  assert.match(script,/mobileMenuFocusables\(\)/);
});

test('Existing lead state machine remains wired to the Home form',()=>{
  const html=read('public/index.html');
  const script=read('public/assets/lead-form.js');
  assert.match(html,/id="lead-form" aria-describedby="form-status"/);
  assert.match(html,/id="form-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.equal(read('public/assets/entry-home.js'),'import "./entry.js";\nimport "./lead-form.js";\nimport "./script.js";\n');
  assert.match(script,/requestSubmit|addEventListener\(['"]submit['"]/);
  assert.match(script,/uncertain/);
});
