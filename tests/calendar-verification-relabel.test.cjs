const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../public/assets/calendar-verification.js'),'utf8');
const tick=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
const required={status:'Required',canStart:true,canCheck:false,minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'};

function setup(request){
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://offline.test',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,calls=[],timers=[],cleared=[],statuses=[];
  w.AbortController=AbortController;
  w.setTimeout=(callback,delay)=>{timers.push({callback,delay});return timers.length;};
  w.clearTimeout=id=>cleared.push(id);
  w.eval(source);
  const panel=w.ParrotCalendarVerification.create({calendar:{id:'calendar-a',enabled:true},request:async(url,options)=>{
    calls.push({url,options});return request(url,options);
  },onStatus:value=>statuses.push(value)});
  w.document.body.append(panel.node);
  return {w,panel,calls,timers,cleared,statuses,close:()=>{panel.dispose();dom.window.close();}};
}

test('verification relabel preserves date nodes, values and focus without HTTP, timer or status events',async t=>{
  const h=setup(()=>required);t.after(h.close);await tick();
  const inputs=[...h.panel.node.querySelectorAll('input')],label=inputs[0].parentNode.firstChild;
  inputs[0].value='2026-11-10';inputs[1].value='2026-11-12';inputs[0].focus();
  const before={requests:h.calls.length,timers:h.timers.length,cleared:h.cleared.length,statuses:h.statuses.length};
  for(const language of ['es','ca','ru','en'])h.panel.updateLanguage(language);
  h.panel.updateLanguage('ru');
  assert.deepEqual([...h.panel.node.querySelectorAll('input')],inputs);
  assert.equal(inputs[0].parentNode.firstChild,label);assert.equal(label.nodeValue,'Первая ночь');
  assert.equal(inputs[0].value,'2026-11-10');assert.equal(inputs[1].value,'2026-11-12');assert.equal(h.w.document.activeElement,inputs[0]);
  assert.equal(h.panel.name,'Календарь Airbnb');
  assert.deepEqual({requests:h.calls.length,timers:h.timers.length,cleared:h.cleared.length,statuses:h.statuses.length},before);
});

test('relabel retains an existing pending-status poll timer and emits no duplicate status',async t=>{
  const h=setup(()=>({status:'Pending',baselineReady:true,canCheck:false,nextCheckAt:'2026-11-01T10:00:00Z'}));
  t.after(h.close);await tick();
  assert.equal(h.timers.length,1);assert.equal(h.timers[0].delay,15000);
  const timer=h.timers[0],cleared=h.cleared.length,statuses=h.statuses.length;
  h.panel.updateLanguage('ru');h.panel.updateLanguage('es');
  assert.equal(h.timers.length,1);assert.equal(h.timers[0],timer);assert.equal(h.cleared.length,cleared);
  assert.equal(h.calls.length,1);assert.equal(h.statuses.length,statuses);
  assert.equal(h.calls[0].options.signal.aborted,false);
});

test('relabel during start preserves the pending controller, exclusive API payload and busy operation',async t=>{
  let finish;
  const pending=new Promise(resolve=>finish=resolve);
  const h=setup((url,options)=>options.method==='GET'?required:pending);t.after(h.close);await tick();
  const inputs=[...h.panel.node.querySelectorAll('input')];inputs[0].value='2026-11-10';inputs[1].value='2026-11-12';
  h.panel.node.querySelector('button').click();await tick();
  assert.equal(h.calls.length,2);const command=h.calls[1];
  assert.equal(command.options.method,'POST');assert.deepEqual(JSON.parse(command.options.body),{from:'2026-11-10',to:'2026-11-13'});
  const statuses=h.statuses.length,cleared=h.cleared.length,timers=h.timers.length;
  h.panel.updateLanguage('ru');
  assert.equal(command.options.signal.aborted,false);assert.equal(h.calls.length,2);
  assert.equal(h.statuses.length,statuses);assert.equal(h.cleared.length,cleared);assert.equal(h.timers.length,timers);
  assert.equal(h.panel.node.getAttribute('aria-busy'),'true');assert.equal(h.panel.node.querySelector('button').disabled,true);
  finish({status:'Pending',baselineReady:false,canCheck:false});await tick();
  assert.equal(h.panel.node.getAttribute('aria-busy'),'false');assert.equal(h.statuses.length,statuses+1);
  assert.match(h.panel.node.querySelector('strong').textContent,/Получаем/);
});
