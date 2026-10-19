const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../public/assets/calendar-verification.js'),'utf8');
const id='11111111-1111-4111-8111-111111111111';
const required={status:'Required',attemptsCount:0,maxAttempts:3,canStart:true,canCheck:false,
  minSelectableDate:'2030-09-23',maxSelectableDate:'2031-03-23'};
const ready={...required,status:'Pending',attemptId:'attempt-1',attemptsCount:1,baselineReady:true,canStart:false,canCheck:true,canCancel:true,
  selectedFrom:'2030-11-01',selectedTo:'2030-11-03',expectedAction:'Close',expiresAt:'2030-09-23T12:30:00Z'};
const waiting={...ready,canCheck:false,checksCount:1,nextCheckAt:'2030-09-23T12:05:00Z'};
const verified={...waiting,status:'Verified',verifiedAt:'2030-09-23T12:05:00Z',nextCheckAt:null};
const cancelled={...ready,status:'Cancelled',canStart:true,canCheck:false,canCancel:false,nextCheckAt:null};
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

async function harness(t,{handler=()=>required,language='ru',enabled=true}={}){
  const dom=new JSDOM('<main><input id="draft" value="unsaved price"></main>',{runScripts:'outside-only',url:'https://parrot669.com/host'});
  const w=dom.window,calls=[],timers=new Map(),statuses=[];let sequence=0,unauthorized=0,visibility='visible';
  Object.defineProperty(w.document,'visibilityState',{get:()=>visibility});
  w.setTimeout=(fn,ms)=>{timers.set(++sequence,{fn,ms});return sequence;};w.clearTimeout=id=>timers.delete(id);
  w.eval(source);
  const panel=w.ParrotCalendarVerification.create({calendar:{id,enabled},language,
    onUnauthorized:()=>unauthorized++,onStatus:value=>statuses.push(value),request:async(path,options={})=>{
      const call={path,...options};calls.push(call);return handler(call);
    }});
  w.document.querySelector('main').append(panel.node);t.after(()=>{panel.dispose();dom.window.close();});await flush();
  return {w,panel,calls,timers,statuses,button:()=>panel.node.querySelector('button'),
    cancelButton:()=>panel.node.querySelector('.calendar-verification-cancel'),unauthorized:()=>unauthorized,
    text:()=>panel.node.textContent,click:async()=>{panel.node.querySelector('button').click();await flush();},
    cancel:async()=>{panel.node.querySelector('.calendar-verification-cancel').click();await flush();},
    choose:(first='2030-11-01',last='2030-11-02')=>{const [from,to]=panel.node.querySelectorAll('input');from.value=first;to.value=last;},
    tick:async()=>{const [key,value]=timers.entries().next().value;timers.delete(key);value.fn();await flush();},
    visible:value=>{visibility=value;w.document.dispatchEvent(new w.Event('visibilitychange'));}};
}

test('start captures the baseline before Check; double click sends once and verification preserves unrelated drafts',async t=>{
  const pending=deferred();let state=required;
  const h=await harness(t,{handler:call=>{
    if(call.path.endsWith('/start'))return pending.promise;
    if(call.path.endsWith('/check'))return state=verified;
    return state;
  }});
  assert.match(h.text(),/Требуется проверка/);
  h.choose();
  await h.click();await h.click();
  assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
  assert.equal(h.button().disabled,true);
  state=ready;pending.resolve(ready);await flush();
  assert.equal(h.button().textContent,'Проверить');
  assert.match(h.text(),/Закройте в Airbnb все выбранные ночи/);
  assert.match(h.text(),/2030-11-01 – 2030-11-02/);
  await h.click();
  assert.match(h.text(),/✓ Управление календарём подтверждено/);
  assert.equal(h.button().hidden,true);
  assert.equal(h.w.document.getElementById('draft').value,'unsaved price');
  assert.equal(h.timers.size,0);
  assert.deepEqual(h.calls.filter(c=>c.method==='POST').map(c=>c.path),[
    `/calendars/${id}/verification/start`,`/calendars/${id}/verification/check`]);
  assert.deepEqual(JSON.parse(h.calls.find(c=>c.path.endsWith('/start')).body),{from:'2030-11-01',to:'2030-11-03'});
});

test('pending verification can be cancelled and returns to a clear start-ready state',async t=>{
  let state=ready;
  const h=await harness(t,{handler:call=>call.path.endsWith('/cancel')?(state=cancelled):state});
  assert.equal(h.cancelButton().hidden,false);
  assert.equal(h.cancelButton().textContent,'Отменить проверку');
  await h.cancel();
  assert.deepEqual(h.calls.filter(c=>c.method==='POST').map(c=>c.path),[`/calendars/${id}/verification/cancel`]);
  assert.match(h.text(),/Проверка отменена/);
  assert.match(h.text(),/Можно выбрать другие ночи/);
  assert.equal(h.button().textContent,'Начать новую попытку');
  assert.equal(h.button().hidden,false);
  assert.equal(h.cancelButton().hidden,true);
  assert.equal(h.panel.node.querySelector('.calendar-verification-dates').hidden,false);
  assert.doesNotMatch(h.text(),/Попытка 1 из 3/);
});
test('pending status polls only GET; hidden pages pause polling and never schedule provider checks in the browser',async t=>{
  let state=waiting;const h=await harness(t,{handler:()=>state});
  assert.equal(h.button().hidden,true);
  assert.match(h.text(),/проверит календарь автоматически/);
  assert.equal([...h.timers.values()][0].ms,15000);
  await h.tick();assert(h.calls.every(c=>!c.method||c.method==='GET'));
  h.visible('hidden');assert.equal(h.timers.size,0);
  state=verified;h.visible('visible');await flush();
  assert.match(h.text(),/подтверждено/);assert.equal(h.timers.size,0);
});

test('waiting instructions do not point to a hidden Check in any language after Check or reload',async t=>{
  const languages=[
    ['en',/then check here/,/PARROT will check automatically/,/Next automatic check:/],
    ['es',/comprueba aquí/,/PARROT comprobará el calendario automáticamente/,/Próxima comprobación automática:/],
    ['ca',/comprova-ho aquí/,/PARROT comprovarà el calendari automàticament/,/Propera comprovació automàtica:/],
    ['ru',/нажмите «Проверить»/,/PARROT проверит календарь автоматически/,/Следующая автоматическая проверка:/]
  ];
  for(const [language,manual,automatic,next] of languages){
    for(const expectedAction of ['Close','Open']){
      const readyState={...ready,expectedAction};
      const waitingState={...waiting,expectedAction};
      const h=await harness(t,{language,handler:call=>call.path.endsWith('/check')?waitingState:readyState});
      assert.equal(h.button().hidden,false);
      assert.match(h.panel.node.querySelector('p').textContent,manual);
      await h.click();
      assert.equal(h.button().hidden,true);
      assert.doesNotMatch(h.panel.node.querySelector('p').textContent,manual);
      assert.match(h.text(),automatic);
      assert.match(h.text(),next);
      assert.match(h.text(),/2030-11-01 – 2030-11-02/);
      const reloaded=await harness(t,{language,handler:()=>waitingState});
      assert.equal(reloaded.button().hidden,true);
      assert.doesNotMatch(reloaded.panel.node.querySelector('p').textContent,manual);
      assert.match(reloaded.text(),automatic);
    }
  }
});

test('429 reloads the blocked state; cooldown displays the deadline and refreshes once when it ends',async t=>{
  let state=required;
  const h=await harness(t,{handler:call=>{
    if(call.method==='POST'){
      state={...required,status:'Blocked',attemptsCount:3,canStart:false,blockedUntil:new Date(Date.now()+86400000).toISOString()};
      throw Object.assign(Error('blocked'),{status:429});
    }return state;
  }});
  h.choose();
  await h.click();
  assert.match(h.text(),/временно заблокирована/);assert.match(h.text(),/Попытка 3 из 3/);
  assert.match(h.text(),/Новая попытка будет доступна после/);
  assert.equal(h.button().hidden,true);
  assert([...h.timers.values()][0].ms>86000000);
  state=required;await h.tick();assert.equal(h.button().textContent,'Начать проверку');
  assert.equal(h.button().hidden,false);
});

test('load/network failures offer status retry without replaying an uncertain start request',async t=>{
  let offline=true;
  const h=await harness(t,{handler:call=>{
    if(offline || call.method==='POST')throw Error('offline');return ready;
  }});
  assert.match(h.text(),/Не удалось загрузить статус/);
  assert.equal(h.button().textContent,'Обновить статус');
  offline=false;await h.click();assert.equal(h.button().textContent,'Проверить');
  await h.click();assert.equal(h.button().textContent,'Обновить статус');
  await h.click();assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
});

test('disposal aborts in-flight requests and late responses cannot update a removed panel',async t=>{
  const pending=deferred();const h=await harness(t,{handler:()=>pending.promise});
  h.panel.dispose();assert.equal(h.calls[0].signal.aborted,true);
  pending.resolve(verified);await flush();
  assert.equal(h.statuses.length,0);assert.equal(h.timers.size,0);
});

test('disabled calendars show no verification actions; expired sessions stop polling',async t=>{
  const disabled=await harness(t,{enabled:false,handler:()=>({...ready,canCheck:false})});
  assert.match(disabled.text(),/Календарь выключен/);assert.equal(disabled.button().hidden,true);
  assert.equal(disabled.cancelButton().hidden,false);
  const expired=await harness(t,{handler:()=>{throw Object.assign(Error('expired'),{status:401});}});
  assert.equal(expired.unauthorized(),1);assert.equal(expired.timers.size,0);
});

test('verification and cancellation states are translated in EN, ES, CA and RU',async t=>{
  const labels=[['en','Calendar control verified','Verification cancelled','Cancel verification'],
    ['es','Control del calendario verificado','Verificación cancelada','Cancelar verificación'],
    ['ca','Control del calendari verificat','Verificació cancel·lada','Cancel·lar verificació'],
    ['ru','Управление календарём подтверждено','Проверка отменена','Отменить проверку']];
  for(const [language,verifiedLabel,cancelledLabel,cancelLabel] of labels){
    const done=await harness(t,{language,handler:()=>verified});assert(done.text().includes(verifiedLabel));
    const stopped=await harness(t,{language,handler:()=>cancelled});assert(stopped.text().includes(cancelledLabel));
    const active=await harness(t,{language,handler:()=>ready});assert.equal(active.cancelButton().textContent,cancelLabel);
  }
});

test('enum spelling does not affect half-open periods or expose unsupported cancellation',async t=>{
  const {canCancel,...legacyReady}=ready;
  const legacy={...legacyReady,status:'pending',expectedAction:'close'};
  const h=await harness(t,{handler:()=>legacy});
  assert.equal(h.panel.node.dataset.status,'pending');
  assert.equal(h.button().textContent,'Проверить');
  assert.equal(h.cancelButton().hidden,true);
  assert.match(h.text(),/Закройте в Airbnb все выбранные ночи/);
  assert.equal([...h.timers.values()][0].ms,15000);
  assert.equal(h.calls.some(call=>call.path.endsWith('/cancel')),false);
});

test('start requires inclusive dates and rejected booked nights can be selected again',async t=>{
  let state=required;
  const h=await harness(t,{handler:call=>call.path.endsWith('/start')?(state={...ready,status:'Rejected',baselineReady:false,canCheck:false,
    canStart:true,expectedAction:null,lastError:'choose_unreserved_dates'}):state});
  await h.click();assert.match(h.text(),/Выберите даты с 2030-09-23 по 2031-03-23/);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,0);
  h.choose('2030-11-02','2030-11-01');await h.click();
  assert.equal(h.calls.filter(c=>c.method==='POST').length,0);
  h.choose();await h.click();
  assert.match(h.text(),/есть бронь/);
  assert.equal(h.panel.node.querySelector('.calendar-verification-dates').hidden,false);
  assert.match(h.text(),/2030-11-01 – 2030-11-02/);
});

test('changing the first night resets the last-night picker and submits the newly chosen inclusive range',async t=>{
  const h=await harness(t);
  const [from,to]=h.panel.node.querySelectorAll('.calendar-verification-dates input');
  from.value='2030-11-01';to.value='2030-11-05';
  from.value='2031-02-17';from.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  from.dispatchEvent(new h.w.Event('change',{bubbles:true}));
  assert.equal(to.min,'2031-02-17');
  assert.equal(to.value,'2031-02-17');
  to.value='2031-02-18';
  await h.click();
  const start=h.calls.find(c=>c.path.endsWith('/start'));
  assert.deepEqual(JSON.parse(start.body),{from:'2031-02-17',to:'2031-02-19'});

  // Clearing the first night also removes the obsolete selected end date.
  from.value='';from.dispatchEvent(new h.w.Event('change',{bubbles:true}));
  assert.equal(to.min,'2030-09-23');assert.equal(to.max,'2031-03-23');assert.equal(to.value,'');
});

test('reloaded pending action remains precise and does not allow editing challenge dates',async t=>{
  const h=await harness(t,{handler:()=>({...ready,expectedAction:'Open'})});
  assert.match(h.text(),/Откройте все выбранные ночи/);
  assert.equal(h.panel.node.querySelector('.calendar-verification-dates').hidden,true);
  assert.equal(h.button().textContent,'Проверить');
});


test('server bounds drive picker min/max, localized copy and inclusive boundary validation',async t=>{
  for(const [language,phrase] of [
    ['en',/six calendar months/],['es',/seis meses naturales/],
    ['ca',/sis mesos naturals/],['ru',/шесть календарных месяцев/]
  ]){
    const h=await harness(t,{language});
    const [from,to]=h.panel.node.querySelectorAll('input');
    assert.equal(from.min,'2030-09-23');assert.equal(from.max,'2031-03-23');
    assert.equal(to.min,'2030-09-23');assert.equal(to.max,'2031-03-23');
    assert.match(h.text(),phrase);assert.match(h.text(),/2030-09-23/);assert.match(h.text(),/2031-03-23/);
  }

  const boundary=await harness(t);
  boundary.choose('2031-03-23','2031-03-23');await boundary.click();
  assert.equal(boundary.calls.filter(c=>c.method==='POST').length,1);

  const invalid=await harness(t);
  for(const [first,last] of [
    ['2030-09-22','2030-09-23'],
    ['2030-09-24','2030-09-23'],
    ['2031-03-23','2031-03-24'],
    ['2031-03-24','2031-03-24']
  ]){
    invalid.choose(first,last);await invalid.click();
  }
  assert.equal(invalid.calls.filter(c=>c.method==='POST').length,0);
  assert.match(invalid.text(),/2030-09-23/);assert.match(invalid.text(),/2031-03-23/);
});

test('inclusive UI dates submit once as half-open periods and reload with the original last night',async t=>{
  for(const [first,last,end] of [
    ['2030-10-10','2030-10-12','2030-10-13'],
    ['2030-12-31','2030-12-31','2031-01-01'],
    ['2031-01-31','2031-02-01','2031-02-02'],
    ['2031-03-23','2031-03-23','2031-03-24']
  ]){
    let state=required;
    const handler=call=>{
      if(call.path.endsWith('/start'))state={...ready,selectedFrom:first,selectedTo:end};
      return state;
    };
    const h=await harness(t,{handler});h.choose(first,last);await h.click();
    assert.deepEqual(JSON.parse(h.calls.find(c=>c.method==='POST').body),{from:first,to:end});
    assert.match(h.text(),new RegExp(`${first} – ${last}`));
    const reload=await harness(t,{handler});
    assert.match(reload.text(),new RegExp(`${first} – ${last}`));
    assert.deepEqual([...reload.panel.node.querySelectorAll('input')].map(i=>i.value),[first,last]);
    await reload.tick();
    assert.match(reload.text(),new RegExp(`${first} – ${last}`));
    assert.equal(reload.calls.some(c=>c.method==='POST'),false);
  }
});
