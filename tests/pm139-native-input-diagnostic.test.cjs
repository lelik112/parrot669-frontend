const {test}=require('node:test');

test('PM139 causal matrix executes exactly mobile smooth/auto plus Chromium auto',()=>{
  const registrations=[];
  for(const project of ['chromium-desktop','webkit-desktop','mobile-emulation'])
    for(const condition of ['smooth','auto'])for(const scenario of ['connect','save-a'])
      registrations.push({project,condition,scenario,execute:causalCaseApplies(project,condition)});
  assert.equal(registrations.length,12);assert.equal(registrations.filter(x=>x.execute).length,6);
  assert.equal(registrations.filter(x=>!x.execute).length,6);
  assert.equal(registrations.filter(x=>x.execute&&x.project==='mobile-emulation').length,4);
});

test('PM139 root auto intervention changes only document-root inline scroll behavior',()=>{
  for(const rootScroll of ['smooth','auto']){
    const dom=new JSDOM('<html><head><style>html{scroll-behavior:smooth}</style></head><body><input value="keep"></body></html>',{runScripts:'outside-only'});
    try{
      const {window}=dom,body=window.document.body.outerHTML;
      window.eval('('+installRootCondition.toString()+')('+JSON.stringify({rootScroll})+')');
      assert.equal(window.getComputedStyle(window.document.documentElement).scrollBehavior,rootScroll);
      assert.equal(window.document.body.outerHTML,body);
      assert.equal(window.document.documentElement.style.getPropertyPriority('scroll-behavior'),rootScroll==='auto'?'important':'');
    }finally{dom.window.close();}
  }
});

test('PM139 critical press retains four pre/post frames and bubble chain after later ring eviction',async()=>{
  const s=setup('<article data-property-id="11111111-1111-4111-8111-111111111111"><div class="host-property-settings"><form class="host-settings-form"><button type="submit">Save</button></form></div></article><button type="button" id="other">Other</button>');
  try{
    s.runFrames(8);
    const button=s.window.document.querySelector('button[type=submit]'),other=s.window.document.querySelector('#other');
    // Synthetic unit events are not native browser evidence.
    for(const type of ['pointerdown','pointerup','click'])
      button.dispatchEvent(new s.window.Event(type,{bubbles:true,cancelable:true}));
    await Promise.resolve();s.runFrames(8);
    other.dispatchEvent(new s.window.Event('pointerdown',{bubbles:true}));
    for(let n=0;n<60;n++)other.dispatchEvent(new s.window.Event('click',{bubbles:true}));
    await Promise.resolve();
    const data=s.dump(),critical=data.critical[0];
    assert.equal(critical.label,'save-a');assert.equal(critical.before.length,4);assert.equal(critical.after.length,4);
    assert.deepEqual(Array.from(critical.after,frame=>frame.t).length,4);
    for(const type of ['pointerdown','pointerup','click'])
      assert(critical.events.some(e=>e.type===type&&e.phase==='document-bubble'));
    assert(data.dropped.events>0);assert.equal(data.dropped.criticalEvents,0);
  }finally{s.dom.window.close();}
});

test('PM139 cap drops old redundant history before protected critical press and counts every cap removal',()=>{
  const critical={before:Array(4).fill({scroll:[0,1]}),after:Array(4).fill({scroll:[0,2]}),
    events:['pointerdown','pointerup','click'].map(type=>({type,phase:'document-bubble'}))};
  const payload={observation:{frames:Array(24).fill({noise:'x'.repeat(2000)}),
    windows:Array(12).fill({noise:'y'.repeat(1000)}),events:Array(96).fill({noise:'z'.repeat(1000)}),
    critical:[critical]},requests:Array(64).fill({path:'/api/synthetic'})};
  const data=boundedEvidence(payload);
  assert(Buffer.byteLength(JSON.stringify(data))<=65536);
  assert.equal(data.criticalEvidenceComplete,true);
  assert.deepEqual(data.observation.critical,[critical]);
  for(const key of ['frames','windows','events'])
    assert.equal(data.capDropped[key]+data.observation[key].length,payload.observation[key].length);
  assert.equal(data.capDropped.requests+data.requests.length,64);
  assert.equal(payload.observation.events.length,96);
});

test('PM139 overlarge protected evidence reports inconclusive rather than silently losing its last press',()=>{
  const data=boundedEvidence({observation:{critical:[{before:['x'.repeat(100000)],after:[],events:[]}]}});
  assert(Buffer.byteLength(JSON.stringify(data))<=65536);
  assert.equal(data.criticalEvidenceComplete,false);assert.match(data.collectionError,/inconclusive/);
});

test('PM139 standalone JSON persists even a passed case inside the test output directory',async()=>{
  const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pm139-unit-evidence-'));
  try{
    let attachment;
    const info={outputPath:name=>path.join(dir,name),attach:async(name,data)=>{attachment={name,...data};}};
    const data={version:2,status:'passed',observation:{media:{noPreference:true}}};
    const file=await persistEvidence(info,data);
    assert.equal(path.dirname(file),dir);assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),data);
    assert.equal(attachment,undefined); // Exactly one standalone JSON, no copied attachment.
  }finally{await fs.rm(dir,{recursive:true});}
});
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {installNativeInputObserver,boundedEvidence,causalCaseApplies,installRootCondition,persistEvidence}
  =require('./e2e/pm139-native-input-diagnostic.cjs');

function setup(html='<form id="fixture-form"><button type="button" id="fixture-button">Save</button></form>') {
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://127.0.0.1:4173/host.html'});
  const {window}=dom;let serial=0;
  const frames=new Map();
  window.requestAnimationFrame=callback=>{const id=++serial;frames.set(id,callback);return id;};
  window.cancelAnimationFrame=id=>frames.delete(id);
  window.matchMedia=query=>({matches:query.includes('no-preference')});
  window.eval('('+installNativeInputObserver.toString()+')()');
  return {dom,window,frames,runFrames(count){
    for(let n=0;n<count;n++)for(const [id,callback] of [...frames]){frames.delete(id);callback();}
  },dump(){return window.__pm139NativeInputDiagnostic.dump();}};
}

test('PM139 observer installs without mutating production DOM or intercepting activation APIs',()=>{
  const original='<form id="fixture-form"><button type="button" id="fixture-button">Save</button></form>';
  const s=setup(original);
  try{
    assert.equal(s.window.document.body.innerHTML,original);
    assert.doesNotMatch(installNativeInputObserver.toString(),/preventDefault\s*\(|stopPropagation\s*\(|dispatchEvent\s*\(|scrollIntoView\s*\(|\.click\s*\(|\.focus\s*\(|setTimeout\s*\(/);
  }finally{s.dump();s.dom.window.close();}
});

test('PM139 observer leaves a cancellable click uncancelled and the application runs once',async()=>{
  const s=setup();
  try{
    const button=s.window.document.querySelector('button');let calls=0;
    button.addEventListener('click',()=>calls++);
    const event=new s.window.MouseEvent('click',{bubbles:true,cancelable:true,clientX:7,clientY:9});
    assert.equal(button.dispatchEvent(event),true);assert.equal(event.defaultPrevented,false);
    await Promise.resolve();
    const data=s.dump();assert.equal(calls,1);
    assert(data.events.some(x=>x.phase==='document-capture'));
    assert(data.events.some(x=>x.phase==='document-bubble'));
    assert(data.events.some(x=>x.phase==='capture-microtask'));
    assert(data.events.every(x=>x.phase!=='after-dispatch'));
    assert(data.events.every(x=>x.defaultPrevented===false));
  }finally{s.dom.window.close();}
});

test('PM139 observer records actual application cancellation instead of causing it',async()=>{
  const s=setup();
  try{
    const form=s.window.document.querySelector('form');
    form.addEventListener('submit',event=>event.preventDefault());
    const event=new s.window.Event('submit',{bubbles:true,cancelable:true});
    assert.equal(form.dispatchEvent(event),false);
    await Promise.resolve();
    const data=s.dump();
    assert(data.events.some(x=>x.type==='submit'&&x.phase==='document-capture'&&!x.defaultPrevented));
    assert(data.events.some(x=>x.type==='submit'&&x.phase==='document-bubble'&&x.defaultPrevented));
  }finally{s.dom.window.close();}
});

test('PM139 observer retains target, actual listener currentTarget, hit-test and trusted provenance',async()=>{
  const s=setup();
  try{
    const button=s.window.document.querySelector('button');
    s.window.document.elementFromPoint=()=>button;
    button.dispatchEvent(new s.window.MouseEvent('click',{bubbles:true,cancelable:true,clientX:7,clientY:9}));
    await Promise.resolve();
    const event=s.dump().events.find(x=>x.phase==='control-bubble'&&x.currentTarget.tag==='button');
    assert.equal(event.target.id,'fixture-button');assert.equal(event.hit.id,'fixture-button');
    assert.deepEqual(Array.from(event.point),[7,9]);assert.equal(event.isTrusted,false);
  }finally{s.dom.window.close();}
});

test('PM139 observer never serializes input values, user text, HTML or URL query parameters',async()=>{
  const s=setup('<input name="email" value="SENSITIVE_VALUE"><textarea>SENSITIVE_TEXT</textarea>');
  try{
    s.window.document.querySelector('input').dispatchEvent(new s.window.MouseEvent('click',{bubbles:true}));
    await Promise.resolve();
    const text=JSON.stringify(s.dump());
    assert(!text.includes('SENSITIVE_VALUE'));assert(!text.includes('SENSITIVE_TEXT'));
    assert(!text.includes('innerHTML'));assert(!text.includes('icalUrl='));
  }finally{s.dom.window.close();}
});

test('PM139 observer sees subsequently mounted controls without changing their DOM',async()=>{
  const s=setup();
  try{
    const button=s.window.document.createElement('button');button.id='mounted';button.type='button';
    s.window.document.body.appendChild(button);
    await Promise.resolve();
    button.dispatchEvent(new s.window.MouseEvent('click',{bubbles:true}));
    await Promise.resolve();
    assert(s.dump().events.some(x=>x.phase==='control-capture'&&x.currentTarget.id==='mounted'));
    assert.equal(button.outerHTML,'<button id="mounted" type="button"></button>');
  }finally{s.dom.window.close();}
});

test('PM139 observer bounds pre/post frame windows and stops its own sampling at collection',()=>{
  const s=setup();
  try{
    s.runFrames(30);
    s.window.document.querySelector('button').dispatchEvent(new s.window.Event('pointerdown',{bubbles:true}));
    s.runFrames(8);
    const data=s.dump();
    assert.equal(data.frames.length,24);assert(data.dropped.frames>0);
    assert.equal(data.windows[0].before.length,4);assert.equal(data.windows[0].after.length,4);
    assert.equal(data.stopped,true);assert.equal(s.frames.size,0);
    assert.equal(data.media.noPreference,true);assert.equal(data.media.reduce,false);
  }finally{s.dom.window.close();}
});

test('PM139 evidence attachment is capped without mutating the input observation',()=>{
  const payload={observation:{frames:Array(100).fill({rect:'x'.repeat(2000)}),
    windows:Array(20).fill({before:'y'.repeat(2000)}),events:Array(300).fill({target:'z'.repeat(2000)})},
    requests:Array(64).fill({method:'PUT',path:'/api/host/properties/synthetic'})};
  const result=boundedEvidence(payload);
  assert(Buffer.byteLength(JSON.stringify(result))<=64*1024);
  assert.equal(result.trimmed,true);assert.equal(payload.observation.events.length,300);
});
