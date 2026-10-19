const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../public/assets/calendar-verification.js'),'utf8');
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(setImmediate);};
const required={status:'Required',canStart:true,canCheck:false,
  minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'};

test('PM142 actual DatePeriod + keyed relabel seam sends 10→13 once and hydrates 10→12 without a second increment',async t=>{
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://offline.test',runScripts:'outside-only'});
  const w=dom.window;w.AbortController=AbortController;
  const timers=new Map();let timerId=0;
  w.setTimeout=(callback,delay)=>{timers.set(++timerId,{callback,delay});return timerId;};
  w.clearTimeout=id=>timers.delete(id);
  w.eval(source);
  let complete;
  const held=new Promise(resolve=>{complete=resolve;}),calls=[];
  const panel=w.ParrotCalendarVerification.create({calendar:{id:'calendar-a',enabled:true},request:async(url,options)=>{
    calls.push({url,options});return options.method==='GET'?required:held;
  }});
  w.document.body.append(panel.node);
  const panels=[panel];t.after(()=>{for(const p of panels)p.dispose();dom.window.close();});
  await flush();
  const inputs=[...panel.node.querySelectorAll('input')];
  inputs[0].value='2026-11-10';inputs[1].value='2026-11-12';inputs[0].focus();
  panel.node.querySelector('button').click();await flush();
  const command=calls.find(call=>call.options.method==='POST');
  assert.deepEqual(JSON.parse(command.options.body),{from:'2026-11-10',to:'2026-11-13'});
  const before={calls:calls.length,timers:timers.size};
  for(const lang of ['ru','es','ca','en'])panel.updateLanguage(lang);
  assert.deepEqual([...panel.node.querySelectorAll('input')],inputs);
  assert.equal(w.document.activeElement,inputs[0]);
  assert.equal(command.options.signal.aborted,false);
  assert.equal(panel.node.getAttribute('aria-busy'),'true');
  assert.deepEqual({calls:calls.length,timers:timers.size},before);
  complete({...required,status:'Pending',canStart:false,canCheck:true,baselineReady:true,
    selectedFrom:'2026-11-10',selectedTo:'2026-11-13',expectedAction:'Close'});
  await flush();
  assert.match(panel.node.querySelector('.calendar-verification-selected').textContent,/2026-11-10 – 2026-11-12/);
  assert.equal(panel.node.getAttribute('aria-busy'),'false');
  assert.equal(calls.filter(call=>call.options.method==='POST').length,1);
  const reloadCalls=[];
  const reloaded=w.ParrotCalendarVerification.create({calendar:{id:'calendar-a',enabled:true},request:async(url,options)=>{
    reloadCalls.push({url,options});return {...required,status:'Cancelled',
      selectedFrom:'2026-11-10',selectedTo:'2026-11-13',expectedAction:'Close'};
  }});
  panels.push(reloaded);w.document.body.append(reloaded.node);await flush();
  const hydrated=[...reloaded.node.querySelectorAll('input')];
  assert.deepEqual(hydrated.map(input=>input.value),['2026-11-10','2026-11-12']);
  reloaded.updateLanguage('ru');reloaded.updateLanguage('en');
  assert.deepEqual([...reloaded.node.querySelectorAll('input')],hydrated);
  assert.equal(reloadCalls.length,1);
  reloaded.node.querySelector('button').click();await flush();
  assert.deepEqual(reloadCalls.filter(call=>call.options.method==='POST').map(call=>JSON.parse(call.options.body)),
    [{from:'2026-11-10',to:'2026-11-13'}]);
  assert.equal(hydrated[1].value,'2026-11-12');
});
