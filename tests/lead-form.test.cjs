const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/assets/lead-form.js'),'utf8');
const workerSource=fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8').replace('export default {','globalThis.contactWorker = {');

const html=`<!doctype html><html lang="en"><body>
  <header class="topbar"></header>
  <article data-service-card="visit" tabindex="0"><a href="#contact">visit</a></article>
  <section id="contact">
    <form id="lead-form">
      <div id="lead-editor">
        <label>Name<input name="name" required></label>
        <label>Contact<input name="contact" required></label>
        <label>Service<select name="service">
          <option value="rental">Rental verification</option><option value="visit">Property visit</option>
          <option value="documents">Document check</option><option value="search">Property search support</option>
          <option value="owner">Owner services</option><option value="other">Something else</option>
        </select></label>
        <label>Message<textarea name="message" required></textarea></label>
        <input name="website"><button type="submit">Send request</button>
      </div>
      <div id="lead-receipt" tabindex="-1" hidden><h3></h3><dl>
        <dt data-lead-label="name"></dt><dd data-lead-value="name"></dd>
        <dt data-lead-label="contact"></dt><dd data-lead-value="contact"></dd>
        <dt data-lead-label="service"></dt><dd data-lead-value="service"></dd>
        <dt data-lead-label="message"></dt><dd data-lead-value="message"></dd>
      </dl><button id="lead-new-request" type="button"></button></div>
      <p id="form-status" tabindex="-1"></p>
    </form>
  </section>
</body></html>`;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return {promise,resolve,reject};};

async function harness(t,{url='https://parrot669.com/',lang='en',fetch=async()=>({ok:true,status:200})}={}){
  const dom=new JSDOM(html,{url,runScripts:'dangerously'});
  const w=dom.window;
  w.document.documentElement.lang=lang;
  w.fetch=fetch;
  const scrolls=[];
  w.scrollTo=options=>{scrolls.push(options);};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  require('./helpers/core.cjs').installCore(w);
  w.eval(source);
  t.after(()=>dom.window.close());
  const form=w.document.getElementById('lead-form');
  const submit=async()=>{form.dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true}));await flush();};
  return {w,form,submit,scrolls,status:()=>w.document.getElementById('form-status'),editor:()=>w.document.getElementById('lead-editor'),
    receipt:()=>w.document.getElementById('lead-receipt'),button:()=>form.querySelector('button[type=submit]')};
}

function fill(h,{name='Alex',contact='alex@example.test',service='owner',message='Need help'}={}){
  Object.assign(h.form.elements.name,{value:name});
  Object.assign(h.form.elements.contact,{value:contact});
  h.form.elements.service.value=service;
  h.form.elements.message.value=message;
}

function actualWorker(providerMode){
  let providerCalls=0;
  const context={Request,Response,Headers,URL,console:{error(){}},fetch:async(url)=>{
    assert.equal(url,'https://api.resend.com/emails');
    providerCalls+=1;
    if(providerMode==='lost-response')throw new TypeError('synthetic provider response lost after dispatch');
    return new Response('{"id":"synthetic"}',{status:200});
  }};
  vm.createContext(context);
  vm.runInContext(workerSource,context);
  return {
    providerCalls:()=>providerCalls,
    fetch:(_url,options)=>context.contactWorker.fetch(
      new Request('https://parrot669.com/api/contact',options),
      {PUBLIC_ORIGIN:'https://parrot669.com',NOTIFY_TO:'destination@example.test',
        RESEND_API_KEY:'synthetic-not-a-key',RESEND_FROM:'PARROT fixture <sender@example.test>'}
    )
  };
}

test('Airbnb conflict creates an editable translated draft and never submits automatically',async t=>{
  let calls=0;
  const h=await harness(t,{url:'https://parrot669.com/?contact=airbnb-listing-conflict#contact',fetch:async()=>{calls++;return {ok:true}}});
  assert.equal(h.form.elements.service.value,'other');
  assert.match(h.form.elements.message.value,/Airbnb listing ID/);
  assert.equal(calls,0);
  assert.equal(h.status().dataset.state,'editing');
});

test('submitting snapshots once, disables controls and ignores repeated submit and preselect',async t=>{
  const wait=deferred(),requests=[];
  const h=await harness(t,{fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return wait.promise}});
  fill(h);
  const pending=h.submit();
  await flush();
  await h.submit();
  h.w.document.querySelector('[data-service-card]').click();
  h.w.document.documentElement.lang='ru';
  h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language',{detail:{lang:'ru'}}));
  assert.equal(requests.length,1);
  assert.equal(requests[0].service,'owner');
  assert.equal(h.form.elements.service.value,'owner');
  assert.equal(h.button().disabled,true);
  assert.equal(h.status().dataset.state,'submitting');
  assert.equal(h.status().textContent,'Отправляем…');
  wait.resolve({ok:true});
  await pending;await flush();
  assert.equal(h.status().dataset.state,'success');
});

test('explicit HTTP failure preserves the draft and manual retry takes a fresh snapshot',async t=>{
  const requests=[];let outcome={ok:false,status:400};
  const h=await harness(t,{fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return outcome}});
  fill(h);
  await h.submit();
  assert.equal(h.status().dataset.state,'error');
  assert.equal(h.form.elements.message.value,'Need help');
  assert.equal(h.button().textContent,'Try again');
  h.form.elements.message.value='Corrected draft';
  outcome={ok:true,status:200};
  await h.submit();
  assert.equal(requests.length,2);
  assert.equal(requests[1].message,'Corrected draft');
  assert.equal(h.status().dataset.state,'success');
});

test('actual Worker provider response loss is uncertain in every locale and never auto-retries',async t=>{
  const copy={
    en:/may have arrived/i,
    es:/puede haber llegado/i,
    ca:/pot haver arribat/i,
    ru:/могла дойти/i
  };
  for(const lang of Object.keys(copy)){
    const worker=actualWorker('lost-response');
    const h=await harness(t,{lang,fetch:worker.fetch});
    fill(h,{message:'Keep exact synthetic draft'});
    await h.submit();
    assert.equal(worker.providerCalls(),1);
    assert.equal(h.status().dataset.state,'uncertain');
    assert.match(h.status().textContent,copy[lang]);
    assert.equal(h.form.elements.message.value,'Keep exact synthetic draft');
    await flush();
    assert.equal(worker.providerCalls(),1);
  }
});

test('actual Worker pre-delivery validation 400 remains a definitive rejection',async t=>{
  const worker=actualWorker('accept');
  const h=await harness(t,{fetch:worker.fetch});
  fill(h,{name:'   '});
  await h.submit();
  assert.equal(worker.providerCalls(),0);
  assert.equal(h.status().dataset.state,'error');
  assert.match(h.status().textContent,/not accepted/i);
  assert.equal(h.form.elements.name.value,'   ');
});

test('network failure reports an uncertain outcome and never retries without a new submit',async t=>{
  let calls=0,fail=true;
  const h=await harness(t,{fetch:async()=>{calls++;if(fail)throw new TypeError('network');return {ok:true}}});
  fill(h);
  await h.submit();
  assert.equal(calls,1);
  assert.equal(h.status().dataset.state,'uncertain');
  assert.match(h.status().textContent,/may have arrived/i);
  assert.equal(h.button().textContent,'Send again');
  await flush();
  assert.equal(calls,1);
  fail=false;
  await h.submit();
  assert.equal(calls,2);
  assert.equal(h.status().dataset.state,'success');
});

test('manual retry aligns the focused receipt title below the sticky header without an automatic extra request',async t=>{
  const requests=[];let outcome={ok:false,status:500};
  const h=await harness(t,{fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return outcome;}});
  fill(h,{message:'Keep exact uncertain draft'});
  await h.submit();
  assert.equal(h.status().dataset.state,'uncertain');
  assert.equal(requests.length,1);

  h.w.document.querySelector('.topbar').getBoundingClientRect=()=>({bottom:103.5});
  h.w.scrollY=300;
  h.receipt().querySelector('h3').getBoundingClientRect=()=>({top:26.859,bottom:55.859});
  h.scrolls.length=0;
  outcome={ok:true,status:200};
  await h.submit();

  assert.equal(requests.length,2);
  assert.equal(h.status().dataset.state,'success');
  assert.equal(h.w.document.activeElement,h.receipt());
  assert.equal(h.scrolls.length,1);
  assert.equal(h.scrolls[0].left,0);
  assert.equal(h.scrolls[0].behavior,'instant');
  assert.ok(Math.abs(h.scrolls[0].top-207.359)<1e-9);
});

test('confirmed success shows a read-only localized summary and starts a new request explicitly',async t=>{
  const h=await harness(t);
  fill(h,{name:'Alicia',contact:'+34 600',service:'visit',message:'Please visit'});
  await h.submit();
  assert.equal(h.editor().hidden,true);
  assert.equal(h.receipt().hidden,false);
  assert.equal(h.receipt().querySelector('[data-lead-value=name]').textContent,'Alicia');
  assert.equal(h.receipt().querySelector('[data-lead-value=service]').textContent,'Property visit');
  h.w.document.documentElement.lang='es';
  h.form.elements.service.querySelector('[value=visit]').textContent='Visita a propiedad';
  h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language',{detail:{lang:'es'}}));
  assert.equal(h.receipt().querySelector('[data-lead-value=service]').textContent,'Visita a propiedad');
  assert.equal(h.status().dataset.state,'success');
  assert.match(h.status().textContent,/aceptada/);
  h.w.document.getElementById('lead-new-request').click();
  assert.equal(h.status().dataset.state,'editing');
  assert.equal(h.editor().hidden,false);
  assert.equal(h.receipt().hidden,true);
  assert.equal(h.form.elements.name.value,'');
  assert.equal(h.w.document.activeElement,h.form.elements.name);
});
