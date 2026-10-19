const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {installNativeInputObserver,boundedEvidence}=require('./e2e/pm139-native-input-diagnostic.cjs');

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
    assert(data.events.some(x=>x.phase==='after-dispatch'));
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
    assert(data.events.some(x=>x.type==='submit'&&x.phase==='after-dispatch'&&x.defaultPrevented));
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
