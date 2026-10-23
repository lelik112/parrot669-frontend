const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {JSDOM}=require('jsdom');
const {LIMITS,BINDING,PROBE,createRecorder,installReplyProbe,installReplyDiagnostic}=require('./e2e/pm142-reply-diagnostic.cjs');

test('reply recorder caps and redacts fixed-schema data with explicit independent clocks',()=>{
  let tick=10;const written=[];
  const r=createRecorder({now:()=>++tick,wall:()=>1792448009000,write:v=>written.push(v)});
  for(let i=0;i<100;i++){
    r.mark('reply-click-begin','failed');
    r.receive([{seq:i,phase:'click',pageMs:i,pageOriginMs:1792448000000,wallMs:1792448000000+i,
      active:'password-secret',trusted:true,rootScroll:i,historyScroll:NaN,
      rect:{x:Infinity,y:2,width:3,height:4},messageBody:'PRIVATE BODY',headers:'SECRET TOKEN',url:'PRIVATE URL'}]);
  }
  r.mark('untrusted-secret','SECRET STATUS');
  r.dispose('failed');r.mark('page-close','passed');r.receive([{phase:'click'}]);
  const s=JSON.parse(r.serialize());
  assert.equal(s.node.length,LIMITS.nodeEvents);assert.equal(s.samples.length,LIMITS.pageSamples);
  assert.equal(s.samples.at(-1).seq,99);assert.equal(s.samples.at(-1).active,'other');
  assert.equal(s.samples.at(-1).rect.x,null);assert.equal(s.samples.at(-1).historyScroll,null);
  assert.equal(s.node.at(-1).kind,'observer-dispose');assert.equal(s.disposed,true);
  assert(s.nodeDropped>0 && s.sampleDropped>0);assert(written.length<=LIMITS.writes);
  assert(s.samples.at(-1).pageOriginMs>1e12,'real current epoch must not be clamped to 2001');
  assert(s.node.at(-1).wallMs>1e12);assert(s.samples.at(-1).receivedNodeMs>s.samples[0].receivedNodeMs);
  assert(Buffer.byteLength(r.serialize())<=LIMITS.jsonBytes);
  assert(!/PRIVATE|SECRET|password-secret|messageBody|headers/.test(r.serialize()));
  assert.equal(s.cause,'UNKNOWN');assert.match(s.clocks.page,/do not subtract/);
});

test('diagnostic writer errors stay diagnostic, never replace application/test failure',()=>{
  const r=createRecorder({write:()=>{throw Error('secret path');}});
  assert.doesNotThrow(()=>{r.mark('install-begin','passed');r.dispose('failed');});
  assert(r.snapshot().writeFaults>0);assert(!r.serialize().includes('secret path'));
});

function fake() {
  const page=new EventEmitter(),context=new EventEmitter(),browser=new EventEmitter(),frame={};
  const binding={},scripts=[],evaluations=[],written=[],timers=[],handles=[];
  const handle=()=>{const h={retired:0,dispose(){this.retired++;return Promise.resolve();}};handles.push(h);return h;};
  page.context=()=>context;page.mainFrame=()=>frame;
  page.exposeBinding=async(name,fn)=>{binding[name]=fn;return handle();};
  page.addInitScript=async(fn,config)=>{scripts.push({fn,config});return handle();};
  page.evaluate=(fn,arg)=>{evaluations.push({fn,arg});return Promise.resolve();};
  const info={status:'passed'},schedule=(fn,ms)=>{
    const t={fn,ms,unrefCalled:false,unref(){this.unrefCalled=true;}};timers.push(t);return t;
  };
  return {page,context,browser,frame,binding,scripts,evaluations,written,timers,handles,info,
    options:{page,browser,testInfo:info,write:v=>written.push(JSON.parse(v)),schedule,
      unschedule:t=>{t.cleared=true;}}};
}

test('one-page listeners precede navigation, preserve event order and detach after context close',async()=>{
  const h=fake(),d=await installReplyDiagnostic(h.options);
  assert.equal(h.scripts.length,1);assert.equal(h.page.listenerCount('crash'),1);
  assert.equal(h.timers[0].ms,20_000);assert(h.timers[0].unrefCalled);
  d.mark('test-body-begin');d.beginReply();d.clickBegin();
  assert.equal(h.evaluations.length,1,'observation dispatched without waiting for a new gate');
  h.info.status='failed';h.page.emit('crash',Error('PRIVATE ERROR'));h.browser.emit('disconnected');
  d.finish();d.mark('fixture-cleanup-begin');d.mark('fixture-cleanup-end');
  assert.equal(h.context.listenerCount('close'),1,'must retain late-close observation after body finally');
  h.context.emit('close');
  const kinds=d.snapshot().node.map(x=>x.kind);
  assert(kinds.indexOf('page-crash')<kinds.indexOf('test-body-finally'));
  assert(kinds.indexOf('context-close')>kinds.indexOf('test-body-finally'));
  assert.equal(h.page.listenerCount('close'),0);assert.equal(h.page.listenerCount('crash'),0);
  assert.equal(h.context.listenerCount('close'),0);assert.equal(h.browser.listenerCount('disconnected'),0);
  assert(h.timers[0].cleared);assert(h.handles.every(h=>h.retired===1));assert.equal(d.snapshot().cause,'UNKNOWN');
  assert(!JSON.stringify(h.written).includes('PRIVATE ERROR'));
  const writes=h.written.length;h.page.emit('close');d.dispose();assert.equal(h.written.length,writes);
});

test('probe transport ignores other pages/subframes and never retains unknown fields',async()=>{
  const h=fake(),d=await installReplyDiagnostic(h.options),send=h.binding[BINDING];
  send({page:{},frame:h.frame},[{phase:'click'}]);
  send({page:h.page,frame:{}},[{phase:'click'}]);
  assert.equal(d.snapshot().samples.length,0);
  send({page:h.page,frame:h.frame},[{phase:'click',body:'PRIVATE',active:'send'}]);
  assert.equal(d.snapshot().samples.length,1);assert(!JSON.stringify(d.snapshot()).includes('PRIVATE'));
  d.dispose();send({page:h.page,frame:h.frame},[{phase:'click'}]);assert.equal(d.snapshot().samples.length,1);
});

test('deadline and setup/dispatch failures do not close a page, add waits or retain listeners',async()=>{
  const h=fake();h.page.exposeBinding=async()=>{throw Error('PRIVATE SETUP');};
  const d=await installReplyDiagnostic(h.options);
  assert(d.snapshot().disposed);assert.equal(h.context.listenerCount('close'),0);
  d.beginReply();assert.equal(h.evaluations.length,0);
  const j=fake(),e=await installReplyDiagnostic(j.options);
  j.page.evaluate=()=>Promise.reject(Error('PRIVATE EVALUATE'));e.beginReply();
  await Promise.resolve();await Promise.resolve();
  assert(e.snapshot().node.some(x=>x.kind==='probe-fault'));
  j.timers[0].fn();assert(e.snapshot().disposed);assert.equal(j.browser.listenerCount('disconnected'),0);
});

test('a setup handle resolving after the passive deadline retires immediately without more setup',async()=>{
  const h=fake();let resolve;
  const handle={retired:0,dispose(){this.retired++;return Promise.reject(Error('already closed'));}};
  h.page.exposeBinding=()=>new Promise(r=>{resolve=r;});
  const pending=installReplyDiagnostic(h.options);
  h.timers[0].fn();resolve(handle);
  const d=await pending;await Promise.resolve();
  assert(d.snapshot().disposed);assert.equal(handle.retired,1);assert.equal(h.scripts.length,0);
  assert.equal(h.context.listenerCount('close'),0);
});

function pageProbe(t,url='https://example.test/messages.html?private=NEVER_CAPTURE') {
  const dom=new JSDOM('<html><body><input type="password" value="SECRET"><form id="msg-compose"><textarea name="body">PRIVATE BODY</textarea><button id="msg-send">Send</button></form><div id="msg-history"></div></body></html>',
    {url,runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());
  const w=dom.window,batches=[],frames=new Map(),timers=new Map();let id=0;
  w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};w.cancelAnimationFrame=i=>frames.delete(i);
  w.setTimeout=(fn)=>{timers.set(++id,fn);return id;};w.clearTimeout=i=>timers.delete(i);
  w[BINDING]=batch=>{batches.push(batch);return Promise.resolve();};
  w.eval('('+installReplyProbe.toString()+')('+JSON.stringify({binding:BINDING,probe:PROBE,limits:LIMITS})+')');
  return {w,batches,frames,timers,flushFrame(){const [i,fn]=frames.entries().next().value;frames.delete(i);fn();}};
}

test('browser observer reads no bodies, never suppresses native submit, and self-cleans bounded frames',t=>{
  const h=pageProbe(t),w=h.w,send=w.document.getElementById('msg-send');
  assert.equal(h.batches.length,0);w[PROBE].start();w[PROBE].start();
  w.document.querySelector('textarea').focus();
  const click=new w.Event('click',{bubbles:true,cancelable:true});send.dispatchEvent(click);
  const submit=new w.Event('submit',{bubbles:true,cancelable:true});w.document.getElementById('msg-compose').dispatchEvent(submit);
  assert.equal(click.defaultPrevented,false);assert.equal(submit.defaultPrevented,false);
  while(h.frames.size)h.flushFrame();
  assert(h.batches.flat().filter(x=>x.phase==='sample').length<=LIMITS.rafSamples);
  assert(h.batches.flat().some(x=>x.phase==='click'));assert(h.batches.flat().some(x=>x.phase==='submit'));
  w[PROBE].stop();assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
  const count=h.batches.flat().length;send.dispatchEvent(click);assert.equal(h.batches.flat().length,count);
  assert(!/PRIVATE|SECRET|NEVER_CAPTURE|private=/.test(JSON.stringify(h.batches)));
});

test('browser sample/transport caps survive event storms; non-Messages pages remain untouched',t=>{
  const h=pageProbe(t);h.w[PROBE].start();
  for(let i=0;i<500;i++)h.w.document.getElementById('msg-send').dispatchEvent(new h.w.Event('pointerdown',{bubbles:true}));
  assert.equal(h.batches.flat().length,LIMITS.pageSamples);assert(h.batches.length<=LIMITS.batches);
  assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
  const other=pageProbe(t,'https://example.test/host.html');assert.equal(other.w[PROBE],undefined);assert.equal(other.batches.length,0);
});

test('pagehide and hard observer deadline remove passive page listeners without acting on lifecycle',t=>{
  for(const reason of ['pagehide','deadline']) {
    const h=pageProbe(t);h.w[PROBE].start();
    if(reason==='pagehide')h.w.dispatchEvent(new h.w.Event('pagehide'));
    else [...h.timers.values()][0]();
    assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
    const count=h.batches.flat().length;
    h.w.document.getElementById('msg-send').dispatchEvent(new h.w.Event('click',{bubbles:true}));
    assert.equal(h.batches.flat().length,count);
  }
});

test('observer geometry failure stays a content-free diagnostic fault and stops only itself',t=>{
  const h=pageProbe(t);
  h.w.document.getElementById('msg-send').getBoundingClientRect=()=>{throw Error('PRIVATE RECT FAILURE');};
  assert.doesNotThrow(()=>h.w[PROBE].start());
  assert.equal(h.batches.flat().at(-1).phase,'fault');
  assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
  assert(!JSON.stringify(h.batches).includes('PRIVATE RECT'));
});
