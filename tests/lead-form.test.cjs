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
const accepted=()=>({ok:true,status:200,json:async()=>({ok:true})});
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return {promise,resolve,reject};};

async function harness(t,{url='https://parrot669.com/',lang='en',fetch=async()=>accepted(),timerClock}={}){
  const dom=new JSDOM(html,{url,runScripts:'dangerously'});
  const w=dom.window;
  // The fake Worker uses Node Request, so pass its matching AbortSignal realm.
  w.AbortController=AbortController;
  if(timerClock){w.setTimeout=timerClock.setTimeout;w.clearTimeout=timerClock.clearTimeout;}
  w.document.documentElement.lang=lang;
  w.fetch=fetch;
  const scrolls=[];
  w.scrollTo=options=>{scrolls.push(options);};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
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
  const context={Request,Response,Headers,URL,AbortController,setTimeout,clearTimeout,console:{error(){}},fetch:async(url)=>{
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
  const h=await harness(t,{url:'https://parrot669.com/?contact=airbnb-listing-conflict#contact',fetch:async()=>{calls++;return accepted()}});
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
  h.w.document.querySelector('[data-service-card] a').click();
  h.w.document.documentElement.lang='ru';
  h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language',{detail:{lang:'ru'}}));
  assert.equal(requests.length,1);
  assert.equal(requests[0].service,'owner');
  assert.equal(h.form.elements.service.value,'owner');
  assert.equal(h.button().disabled,true);
  assert.equal(h.status().dataset.state,'submitting');
  assert.equal(h.status().textContent,'Отправляем…');
  wait.resolve(accepted());
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
  outcome=accepted();
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
  const h=await harness(t,{fetch:async()=>{calls++;if(fail)throw new TypeError('network');return accepted()}});
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
  outcome=accepted();
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

for(const [field,limit] of [['name',120],['contact',200],['message',5000]]){
  for(const delta of [-1,0,1]){
    test(`normalized ${field} length ${limit+delta} is accepted only within the producer limit without truncation`,async t=>{
      const worker=actualWorker('accept');
      const h=await harness(t,{fetch:worker.fetch});
      const value='x'.repeat(limit+delta);
      fill(h,{[field]:value});
      await h.submit();
      assert.equal(worker.providerCalls(),delta>0?0:1);
      assert.equal(h.form.elements[field].value,value);
      assert.equal(h.status().dataset.state,delta>0?'error':'success');
      if(delta<=0)assert.equal(h.receipt().querySelector(`[data-lead-value="${field}"]`).textContent,value);
    });
  }
}

test('receipt shows the existing producer-normalized text while preserving the full raw draft',async t=>{
  const worker=actualWorker('accept');
  const h=await harness(t,{fetch:worker.fetch});
  fill(h,{name:'  Alicia  ',contact:'  +34 600  ',message:'\n  Exact message  \n'});
  await h.submit();
  assert.equal(worker.providerCalls(),1);
  for(const [field,value] of [['name','Alicia'],['contact','+34 600'],['message','Exact message']]){
    assert.equal(h.receipt().querySelector(`[data-lead-value="${field}"]`).textContent,value);
  }
  assert.equal(h.form.elements.message.value,'\n  Exact message  \n');
});

test('UTF-16 limits preserve Unicode and reject overflow before any request without NFC or slicing',async t=>{
  const calls=[];
  const h=await harness(t,{fetch:async(_url,init)=>{calls.push(JSON.parse(init.body));return new Response('{"ok":true}')}});
  const exact='😀'.repeat(2499)+'e\u0301';
  assert.equal(exact.length,5000);
  fill(h,{message:exact+'x'});
  await h.submit();
  assert.equal(calls.length,0);
  assert.equal(h.form.elements.message.value,exact+'x');
  h.form.elements.message.value=exact;
  await h.submit();
  assert.equal(calls.length,1);
  assert.equal(calls[0].message,exact);
  assert.equal(h.receipt().querySelector('[data-lead-value="message"]').textContent,exact);
});

for(const body of ['{}','{"ok":false}','{"ok":"true"}','invalid json']){
  test(`2xx without an explicit true accepted ACK is uncertain: ${body}`,async t=>{
    let calls=0;
    const h=await harness(t,{fetch:async()=>{calls++;return new Response(body)}});
    fill(h,{message:'Keep the whole uncertain draft'});
    await h.submit();
    assert.equal(h.status().dataset.state,'uncertain');
    assert.equal(h.receipt().hidden,true);
    assert.equal(h.form.elements.message.value,'Keep the whole uncertain draft');
    h.w.document.documentElement.lang='ru';
    h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language'));
    await flush();
    assert.equal(calls,1);
    assert.equal(h.form.elements.message.value,'Keep the whole uncertain draft');
  });
}

test('Enter on the nested native service link is not stolen by a card button handler',async t=>{
  const h=await harness(t);
  const link=h.w.document.querySelector('[data-service-card] a');
  const event=new h.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});
  link.dispatchEvent(event);
  assert.equal(event.defaultPrevented,false);
  assert.equal(h.form.elements.service.value,'rental');
  const actual=new JSDOM(fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8'));
  t.after(()=>actual.window.close());
  for(const card of actual.window.document.querySelectorAll('[data-service-card]')){
    assert.equal(card.hasAttribute('tabindex'),false);
    assert.notEqual(card.getAttribute('role'),'button');
    assert.equal(card.querySelectorAll('a[data-service]').length,1);
  }
});

for(const waitingFor of ['headers','body'])test(`browser deadline while waiting for ${waitingFor} preserves raw draft and ignores late ACK`,async t=>{
  const tasks=new Map();let id=0;
  const timerClock={setTimeout(fn,delay){assert.equal(delay,15000);tasks.set(++id,fn);return id},clearTimeout(id){tasks.delete(id)}};
  const late=deferred(),requests=[];
  const h=await harness(t,{timerClock,fetch:async(_url,options)=>{
    requests.push(options);
    if(requests.length>1)return accepted();
    return waitingFor==='headers'?late.promise:{ok:true,status:200,json:()=>late.promise};
  }});
  const raw=' \n  Keep my full draft  \n';
  fill(h,{message:raw});await h.submit();await h.submit();
  assert.equal(requests.length,1);assert.equal(tasks.size,1);
  const [timer,expire]=[...tasks][0];tasks.delete(timer);expire();await flush();
  assert.equal(requests[0].signal.aborted,true);assert.equal(tasks.size,0);
  assert.equal(h.status().dataset.state,'uncertain');assert.equal(h.form.elements.message.value,raw);
  late.resolve(waitingFor==='headers'?accepted():{ok:true});await flush();
  assert.equal(h.status().dataset.state,'uncertain');assert.equal(requests.length,1);
  h.w.document.documentElement.lang='ru';h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language'));
  assert.equal(h.form.elements.message.value,raw);assert.equal(requests.length,1);
  await h.submit();assert.equal(requests.length,2);assert.equal(tasks.size,0);
  assert.equal(h.status().dataset.state,'success');
  assert.equal(h.receipt().querySelector('[data-lead-value=message]').textContent,raw.trim());
  h.form.elements.service.value='visit';h.w.document.dispatchEvent(new h.w.CustomEvent('parrot:language'));
  assert.equal(h.receipt().querySelector('[data-lead-value=service]').textContent,'Owner services');
  assert.equal(JSON.parse(requests[1].body).service,'owner');
});
