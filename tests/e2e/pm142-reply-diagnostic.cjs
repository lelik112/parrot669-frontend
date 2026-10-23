// Inert preparation: execution requires separate exact validation admission.
const fs = require('node:fs');
const path = require('node:path');
const {performance} = require('node:perf_hooks');

const LIMITS = Object.freeze({nodeEvents:24, pageSamples:48, rafSamples:24,
  batchSize:4, batches:13, lifetimeMs:20_000, jsonBytes:48*1024, writes:32});
const BINDING = '__pm142ReplyDiagnosticBatch';
const PROBE = '__pm142ReplyDiagnostic';
const kinds = new Set(['install-begin','install-ready','test-body-begin','reply-fill-begin',
  'reply-click-begin','reply-click-complete','test-body-finally','fixture-cleanup-begin',
  'fixture-cleanup-end','page-close','page-crash','context-close','browser-disconnected',
  'observer-dispose','probe-fault']);
const phases = new Set(['begin','sample','focusin','scroll','pointerdown','pointerup','click','submit','keydown','end','fault']);
const roles = new Set(['send','composer','history','root','other','none']);
const statuses = new Set(['passed','failed','timedOut','skipped','interrupted']);
const finite = value => typeof value === 'number' && Number.isFinite(value)
  ? Math.round(Math.max(-9e12,Math.min(9e12,value))*1000)/1000 : null;
const status = value => statuses.has(value) ? value : 'UNKNOWN';

function createRecorder({now=()=>performance.now(), wall=()=>Date.now(), write=()=>{}}={}) {
  const node=[], samples=[];
  let nodeDropped=0, sampleDropped=0, seq=0, writes=0, writeFaults=0;
  let disposed=false, lastStatus='UNKNOWN';
  function push(list,value,cap) { const dropped=list.length===cap; if(dropped)list.shift();list.push(value);return dropped; }
  function snapshot() {
    return {schema:'PM142_REPLY_DIAGNOSTIC_V1',cause:'UNKNOWN',stderr:'NOT_EXPOSED_BY_PUBLIC_BROWSER_FIXTURE',
      clocks:{node:'performance.now() monotonic ms; node wall Date.now() ms',
        page:'performance.now() + timeOrigin; page wall Date.now(); do not subtract across domains'},
      limits:LIMITS,nodeDropped,sampleDropped,writeFaults,writes,disposed,lastStatus,node:[...node],samples:[...samples]};
  }
  function serialize() {
    let value=JSON.stringify(snapshot());
    while(Buffer.byteLength(value)>LIMITS.jsonBytes && samples.length) {
      samples.shift();sampleDropped++;value=JSON.stringify(snapshot());
    }
    if(Buffer.byteLength(value)>LIMITS.jsonBytes) throw new Error('diagnostic schema bound exceeded');
    return value;
  }
  function flush(final=false) {
    if(writes >= (final ? LIMITS.writes : LIMITS.writes-1)) return;
    writes++;
    try { write(serialize()); } catch { writeFaults=Math.min(writeFaults+1,1e6); }
  }
  function mark(kind,observedStatus) {
    if(disposed || !kinds.has(kind)) return;
    lastStatus=status(observedStatus);
    if(push(node,{seq:++seq,kind,nodeMs:finite(now()),wallMs:finite(wall()),status:lastStatus},LIMITS.nodeEvents)) nodeDropped++;
    flush();
  }
  function receive(batch) {
    if(disposed || !Array.isArray(batch)) return;
    for(const raw of batch.slice(0,LIMITS.batchSize)) {
      if(!raw || !phases.has(raw.phase)) continue;
      const rect=raw.rect && typeof raw.rect==='object' ? raw.rect : {};
      const item={seq:finite(raw.seq),phase:raw.phase,pageMs:finite(raw.pageMs),
        pageOriginMs:finite(raw.pageOriginMs),wallMs:finite(raw.wallMs),
        receivedNodeMs:finite(now()),active:roles.has(raw.active)?raw.active:'other',
        trusted:raw.trusted===true,rootScroll:finite(raw.rootScroll),historyScroll:finite(raw.historyScroll),
        rect:{x:finite(rect.x),y:finite(rect.y),width:finite(rect.width),height:finite(rect.height)}};
      if(push(samples,item,LIMITS.pageSamples)) sampleDropped++;
    }
    flush();
  }
  function dispose(observedStatus) { if(disposed)return;mark('observer-dispose',observedStatus);disposed=true;flush(true); }
  return {mark,receive,snapshot,serialize,dispose};
}

// Serialized into the one test-owned Messages page; no application handler is replaced.
function installReplyProbe(config) {
  if(window.top!==window || location.pathname!=='/messages.html' || window[config.probe]) return;
  let started=false,stopped=false,frames=0,count=0,seq=0,batches=0,raf=null,timer=null,queue=[];
  const events=['focusin','scroll','pointerdown','pointerup','click','submit','keydown'];
  const get=id=>document.getElementById(id);
  function role(node) {
    if(!node)return 'none';
    if(node===get('msg-send'))return 'send';
    if(node===document.querySelector('#msg-compose textarea[name="body"]'))return 'composer';
    if(node===get('msg-history'))return 'history';
    if(node===document || node===document.documentElement || node===document.body)return 'root';
    return 'other';
  }
  function flush() {
    if(!queue.length || batches>=config.limits.batches)return;
    const batch=queue;queue=[];batches++;
    try { Promise.resolve(window[config.binding](batch)).catch(()=>{}); } catch {}
  }
  function record(phase,event) {
    if(!started || stopped || count>=config.limits.pageSamples)return;
    try {
      const send=get('msg-send'),history=get('msg-history'),r=send?.getBoundingClientRect();
      queue.push({seq:++seq,phase,pageMs:performance.now(),pageOriginMs:performance.timeOrigin,wallMs:Date.now(),
        active:role(document.activeElement),trusted:event?.isTrusted===true,
        rootScroll:document.scrollingElement?.scrollTop ?? window.scrollY,
        historyScroll:history?.scrollTop ?? null,
        rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null});
    } catch { queue.push({seq:++seq,phase:'fault'});count++;flush();stop();return; }
    count++;
    if(queue.length>=config.limits.batchSize)flush();
    if(count===config.limits.pageSamples)stop();
  }
  function onEvent(event) {
    const target=role(event.target);
    if(target!=='other' || (event.type==='submit' && event.target===get('msg-compose')))record(event.type,event);
  }
  function sample() {
    raf=null;if(stopped)return;
    frames++;record('sample');
    if(!stopped && frames<config.limits.rafSamples)raf=requestAnimationFrame(sample);
  }
  function stop() {
    if(stopped)return;
    flush();stopped=true;
    if(raf!==null)cancelAnimationFrame(raf);
    if(timer!==null)clearTimeout(timer);
    for(const name of events)document.removeEventListener(name,onEvent,true);
    window.removeEventListener('pagehide',stop);
  }
  function start() {
    if(started || stopped)return;
    started=true;
    for(const name of events)document.addEventListener(name,onEvent,{capture:true,passive:true});
    window.addEventListener('pagehide',stop,{once:true});
    timer=setTimeout(stop,config.limits.lifetimeMs);
    record('begin');flush();
    if(!stopped)raf=requestAnimationFrame(sample);
  }
  window[config.probe]={start,stop};
}

async function installReplyDiagnostic({page,browser,testInfo,write,now,wall,
  schedule=setTimeout,unschedule=clearTimeout}={}) {
  const context=page.context();
  const output=write || (value=>{
    const file=testInfo.outputPath('pm142-reply-diagnostic.json');
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value,'utf8');
  });
  const recorder=createRecorder({write:output,now,wall});
  const removers=[],handles=[];let disposed=false,timer=null;
  const observed=()=>testInfo.status;
  const mark=kind=>recorder.mark(kind,observed());
  function retire(handle) {
    // Playwright 1.63 public Disposable; no awaited cleanup/lifecycle ownership.
    try { Promise.resolve(handle?.dispose?.()).catch(()=>{}); } catch {}
  }
  function keep(handle) { if(disposed)retire(handle);else if(handle)handles.push(handle); }
  function dispose() {
    if(disposed)return;disposed=true;
    for(const remove of removers)remove();
    if(timer!==null)unschedule(timer);
    for(const handle of handles.splice(0))retire(handle);
    recorder.dispose(observed());
  }
  function listen(emitter,event,kind,final=false) {
    const fn=()=>{mark(kind);if(final)dispose();};
    emitter.on(event,fn);removers.push(()=>emitter.off(event,fn));
  }
  mark('install-begin');
  listen(page,'close','page-close');listen(page,'crash','page-crash');
  listen(context,'close','context-close',true);listen(browser,'disconnected','browser-disconnected');
  timer=schedule(dispose,LIMITS.lifetimeMs);timer?.unref?.();
  try {
    keep(await page.exposeBinding(BINDING,(source,batch)=>{
      if(!disposed && source.page===page && source.frame===page.mainFrame())recorder.receive(batch);
    }));
    if(!disposed)keep(await page.addInitScript(installReplyProbe,{binding:BINDING,probe:PROBE,limits:LIMITS}));
    if(!disposed)mark('install-ready');
  } catch { mark('probe-fault');dispose(); }
  function probe(method) {
    if(disposed)return;
    // Fire-and-forget observation command: no extra wait/sleep or actionability gate.
    try { Promise.resolve(page.evaluate(({probe,method})=>window[probe]?.[method](),{probe:PROBE,method}))
      .catch(()=>mark('probe-fault')); } catch { mark('probe-fault'); }
  }
  return {mark,
    beginReply(){mark('reply-fill-begin');probe('start');},
    clickBegin(){mark('reply-click-begin');},
    clickComplete(){mark('reply-click-complete');probe('stop');},
    finish(){mark('test-body-finally');},
    dispose,snapshot:recorder.snapshot};
}

module.exports={LIMITS,BINDING,PROBE,createRecorder,installReplyProbe,installReplyDiagnostic};
