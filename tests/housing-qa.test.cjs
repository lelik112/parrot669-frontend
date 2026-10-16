const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const read=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<6;i++)await tick()}
const item={propertyId:'11111111-1111-4111-8111-111111111111',propertyTitle:'Name <test>',city:'Barcelona',accommodationType:'private_room',bedrooms:3,sleeps:3,ownerDisplayName:'Host',links:[],price:{estimatedAmountCents:6300,nights:7,cleaningFeeCents:700}};
test('BUG-024 contact route preselects a localized, non-identifying Airbnb conflict context',async t=>{
  for(const [language,expected] of [['en',/already connected to another account/],['es',/conectado a otra cuenta/],['ca',/connectat a un altre compte/],['ru',/привязано к другому аккаунту/]]){
    const dom=new JSDOM(read('index.html'),{url:'https://parrot669.com/?contact=airbnb-listing-conflict#contact',runScripts:'outside-only'});t.after(()=>dom.window.close());
    const w=dom.window;w.localStorage.setItem('parrot669-language',language);w.fetch=async()=>({ok:true,json:async()=>[]});
    w.eval(read('assets/lead-form.js'));
    w.eval(read('assets/script.js'));
    const form=w.document.getElementById('lead-form');
    assert.equal(form.elements.service.value,'other');
    assert.match(form.elements.message.value,expected);
    assert.doesNotMatch(form.elements.message.value,/\d{4,}/);
  }
});
async function searchApp(t,search=()=>[item]){
  const dom=new JSDOM(read('search.html'),{url:'https://parrot669.com/search',runScripts:'outside-only'});t.after(()=>dom.window.close());
  const w=dom.window,calls=[];w.localStorage.setItem('parrot669-language','ru');
  w.fetch=async url=>{calls.push(String(url));return {ok:true,json:async()=>String(url).includes('/locations/countries')?[{code:'ES',name:'Spain'}]:String(url).includes('/locations/cities')?[{name:'Barcelona'}]:search(url)}};
  w.eval(read('assets/search.js'));await settle();
  const form=w.document.getElementById('availability-form');form.elements.country.value='ES';form.elements.country.dispatchEvent(new w.Event('change'));await settle();
  form.elements.from.value='2026-10-01';form.elements.to.value='2026-10-08';
  return {w,calls,form,$:id=>w.document.getElementById(id),submit:async()=>{form.dispatchEvent(new w.Event('submit',{cancelable:true}));await settle()}};
}
test('negative, invalid-precision and reversed budgets stop search; zero and decimals are preserved',async t=>{
  const a=await searchApp(t);const field=a.$('filter-price-to');
  for(const value of ['-100','1.234']){
    field.value=value;await a.submit();assert.equal(a.calls.filter(x=>x.startsWith('/api/search')).length,0);
    assert.equal(field.getAttribute('aria-invalid'),'true');assert.match(a.$('availability-results').textContent,/отрицательной|корректную/);
  }
  field.value='0';await a.submit();assert.match(a.calls.at(-1),/maxPriceCents=0(?:&|$)/);
  field.value='90.50';await a.submit();assert.match(a.calls.at(-1),/maxPriceCents=9050(?:&|$)/);
  a.$('filter-price-from').value='100';const before=a.calls.length;await a.submit();assert.equal(a.calls.length,before);assert.match(a.$('availability-results').textContent,/не может быть больше/);
});
test('live filter rejects bad price and stale response cannot overwrite that error',async t=>{
  let finish;const a=await searchApp(t,()=>new Promise(resolve=>finish=resolve));
  await a.submit();a.$('filter-price-to').value='-1';a.$('filter-price-to').dispatchEvent(new a.w.Event('change'));await settle();
  finish([item]);await settle();assert.match(a.$('availability-results').textContent,/отрицательной/);assert.equal(a.$('availability-results').querySelectorAll('article').length,0);
});
test('language changes translate loaded cards and statuses without another search',async t=>{
  const a=await searchApp(t);await a.submit();const before=a.calls.length;
  assert.match(a.$('availability-results').textContent,/3 спальных места/);
  a.w.document.querySelector('[data-search-lang="es"]').click();assert.match(a.$('availability-results').textContent,/Habitación privada/);
  assert.match(a.$('availability-results').textContent,/3 plazas/);assert.equal(a.calls.length,before);
  assert.match(a.$('availability-results').textContent,/Name <test>/);assert.equal(a.$('availability-results').querySelector('test'),null);
  a.w.document.querySelector('[data-search-lang="ru"]').click();assert.match(a.$('availability-results').textContent,/Отдельная комната/);
  a.$('filter-price-to').value='-1';await a.submit();a.w.document.querySelector('[data-search-lang="ca"]').click();assert.match(a.$('availability-results').textContent,/negatiu/);
});
test('Russian capacity forms include teens and quantities ending in one or two',async t=>{
  const quantities=[1,2,3,5,11,21,22,25,31,40];const a=await searchApp(t,()=>quantities.map(n=>({...item,sleeps:n})));await a.submit();
  const facts=[...a.w.document.querySelectorAll('.availability-facts')].map(n=>n.textContent);
  for(const [index,expected]of ['1 спальное место','2 спальных места','3 спальных места','5 спальных мест','11 спальных мест','21 спальное место','22 спальных места','25 спальных мест','31 спальное место','40 спальных мест'].entries())assert.ok(facts[index].includes(expected),facts[index]);
});
async function recoveryApp(t,{hash='',handler=()=>({status:202}),language='ru'}={}){
  const dom=new JSDOM(read('recover.html'),{url:'https://parrot669.com/recover.html'+hash,runScripts:'outside-only'});t.after(()=>dom.window.close());
  const w=dom.window,calls=[];w.localStorage.setItem('parrot669-language',language);
  w.fetch=async (url,init)=>{const request={url,body:JSON.parse(init.body)};calls.push(request);const result=await handler(request);return {ok:result.status<400,status:result.status,json:async()=>result.body||{}}};
  w.eval(read('assets/recover.js'));return {w,calls,$:id=>w.document.getElementById(id),submit:async id=>{w.document.getElementById(id).dispatchEvent(new w.Event('submit',{cancelable:true}));await settle()}};
}
test('recovery request gives generic localized guidance and preserves form after a network failure',async t=>{
  let fail=true;const a=await recoveryApp(t,{handler:()=>{if(fail)throw Error('offline');return {status:202}}});
  a.$('recovery-request').elements.email.value='owner@example.test';await a.submit('recovery-request');assert.match(a.$('recovery-status').textContent,/Не удалось/);assert.equal(a.$('recovery-request').elements.email.disabled,false);
  fail=false;await a.submit('recovery-request');assert.deepEqual(a.calls.at(-1).body,{email:'owner@example.test',language:'ru'});assert.match(a.$('recovery-status').textContent,/Если аккаунт существует/);
});
test('reset secret leaves the URL, is never persisted, mismatched passwords do not submit, success requires login',async t=>{
  const token='x'.repeat(43);const a=await recoveryApp(t,{hash:'#token='+token,handler:()=>({status:204})});const form=a.$('recovery-confirm');
  assert.equal(a.w.location.hash,'');assert.equal(form.hidden,false);assert.equal(a.$('recovery-request').hidden,true);
  form.elements.password.value='new-test-password';form.elements.repeat.value='different-password';await a.submit('recovery-confirm');assert.equal(a.calls.length,0);assert.match(a.$('recovery-status').textContent,/не совпадают/);
  form.elements.repeat.value='new-test-password';await a.submit('recovery-confirm');assert.equal(a.calls[0].body.token,token);assert.equal(form.hidden,true);assert.equal(form.elements.password.value,'');assert.match(a.$('recovery-status').textContent,/Войдите заново/);
  assert.equal(a.w.localStorage.length,1);assert.equal(a.w.sessionStorage.length,0);assert.equal(a.w.document.querySelector('meta[name="referrer"]').content,'no-referrer');
});
test('expired reset link offers a fresh request and double submit is blocked',async t=>{
  let finish;const a=await recoveryApp(t,{hash:'#token='+'y'.repeat(43),handler:()=>new Promise(resolve=>finish=resolve)});const form=a.$('recovery-confirm');
  form.elements.password.value=form.elements.repeat.value='new-test-password';await a.submit('recovery-confirm');await a.submit('recovery-confirm');assert.equal(a.calls.length,1);
  finish({status:400,body:{error:'reset token is invalid or expired'}});await settle();assert.equal(a.$('recovery-again').hidden,false);assert.match(a.$('recovery-status').textContent,/устарела/);
  a.$('recovery-again').click();assert.equal(a.$('recovery-request').hidden,false);assert.equal(form.hidden,true);
});
