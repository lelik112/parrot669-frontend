// Authored S4 behavior specifications. Execution is a separately admitted gate.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {installCore}=require('./helpers/core.cjs');
const {createPeriodFixture,propertyId,periodId,secondPeriodId,otherPropertyId}=require('./e2e/host-period-fixture.cjs');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'public/assets/host.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/host.html'),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
const readPath='/api/host/properties/'+propertyId+'/availability';
const putPath=id=>'/api/host/availability/'+id;
const propertyPath='/api/host/properties/'+propertyId;
async function setup(){
  const fixture=createPeriodFixture();
  const dom=new JSDOM(html,{url:'https://offline.test/host.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async(url,init={})=>{
    const result=await fixture.respond(String(url),init.method || 'GET',init.body ? JSON.parse(init.body) : null);
    return new Response(result.status===204 ? null : JSON.stringify(result.body),
      {status:result.status,headers:{'Content-Type':'application/json'}});
  };
  installCore(w);
  w.eval(fs.readFileSync(path.join(root,'public/assets/host-address.js'),'utf8'));
  w.eval(source+'\nwindow.hostTest={syncDashboard,refreshAvailability,deleteProperty,deleteAvailability,renderProperties,getState:()=>state,getDraft:hostDraft,getDrafts:()=>hostDrafts,getWrites:()=>hostPropertyWrites,getDirty:()=>unsavedHostChanges};');
  await tick();
  const row=(id=periodId)=>w.document.querySelector('[data-host-key="availability:'+id+'"]');
  const conditions=()=>w.document.querySelector('[data-property-id="'+propertyId+'"] .host-stay-settings');
  const edit=(input,value)=>{input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const choose=id=>{const select=w.document.getElementById('host-property-select');select.value=id;select.dispatchEvent(new w.Event('change'));};
  const writes=()=>fixture.seen.filter(call=>!['GET','HEAD'].includes(call.method));
  const property=()=>w.hostTest.getState().properties.find(value=>value.id===propertyId);
  return {fixture,w,row,conditions,edit,submit,choose,writes,property,close:()=>w.close()};
}
function enter(h,id=periodId){const form=h.row(id);form.querySelector('.host-period-edit').click();return form;}
function price(h,form,value){h.edit(form.elements.nightlyPrice,value);}
function saved(h,form){assert.equal(form.dataset.state,'saved');assert.equal(h.w.hostTest.getDraft(form).editor.verifyOnly,false);}

test('Idle/Edit/unchanged Save/Cancel retain the same controls and summary baseline through relabel',async t=>{
  const h=await setup();t.after(h.close);const form=h.row(),input=form.elements.from;
  assert.equal(form.dataset.state,'idle');assert.equal(form.querySelector('.host-period-save').hidden,true);
  assert.equal(input.closest('label').hidden,true);assert.equal(input.value,'2030-11-20');
  enter(h);assert.equal(form.querySelector('.host-period-save').disabled,true);
  h.edit(input,'2030-11-21');assert.equal(form.querySelector('.host-period-save').disabled,false);
  h.w.document.querySelector('[data-host-lang="ru"]').click();await tick();
  assert.equal(h.row(),form);assert.equal(form.elements.from,input);assert.equal(input.value,'2030-11-21');
  assert.equal(h.w.hostTest.getDraft(form).server.from,'2030-11-20');
  form.querySelector('.host-period-cancel').click();await tick();
  assert.equal(input.value,'2030-11-20');assert.equal(form.dataset.state,'idle');assert.equal(h.writes().length,0);
  assert.equal(h.w.hostTest.getDirty(),false);
});

for(const [first,last,priceText,cents,end] of [
  ['2030-11-20','2030-11-20','12.50',1250,'2030-11-21'],
  ['2031-12-31','2031-12-31','',null,'2032-01-01'],
  ['2032-02-28','2032-02-29','0.01',1,'2032-03-01'],
  ['2030-03-30','2030-03-31','99.99',9999,'2030-04-01']
])test('inclusive boundary/cents/null '+first+'..'+last+' verifies before Saved',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);
  h.edit(form.elements.from,first);h.edit(form.elements.to,last);price(h,form,priceText);h.submit(form);await tick();
  const write=h.writes()[0];assert.equal(write.method,'PUT');
  assert.deepEqual(write.payload,{period:{from:first,to:end},nightlyPriceCents:cents});
  assert.equal(form.dataset.state,'saving');assert.equal(h.w.hostTest.getWrites().size,0);
  assert.notEqual(form.dataset.hostOperation,'saved');
  pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();saved(h,form);
  assert.equal(form.elements.to.value,last);assert.equal(h.property().availability[0].to,end);
  assert.equal(h.writes().length,1);
});

for(const status of [400,409])test('HTTP '+status+' keeps an editable draft and allows an explicit mutation retry',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  h.fixture.hooks.set('PUT '+putPath(periodId),({json})=>json({error:'Synthetic rejection'},status));
  price(h,form,'81');h.submit(form);await tick();
  assert.equal(form.dataset.state,'error');assert.equal(h.w.hostTest.getDraft(form).editor.verifyOnly,false);
  assert.equal(form.elements.nightlyPrice.value,'81');assert.equal(h.property().availability[0].nightlyPriceCents,8000);
  assert.equal(h.fixture.seen.filter(call=>call.path===readPath).length,0);
  h.fixture.hooks.delete('PUT '+putPath(periodId));h.submit(form);await tick();saved(h,form);
  assert.equal(h.writes().length,2);
});

for(const outcome of ['lost','flat','wrong id','different value'])test(outcome+' ACK cannot report Saved; Check is GET only',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  h.fixture.hooks.set('PUT '+putPath(periodId),({payload,json})=>{
    Object.assign(h.fixture.periods[0],payload.period,{nightlyPriceCents:payload.nightlyPriceCents});
    if(outcome==='lost')throw new TypeError('Synthetic lost ACK');
    if(outcome==='flat')return json(h.fixture.periods[0]);
    const ack=h.fixture.ack(h.fixture.periods[0]);
    return json(outcome==='wrong id' ? {...ack,id:secondPeriodId} : {...ack,nightlyPriceCents:9999});
  });
  price(h,form,'81');h.submit(form);await tick();
  assert.equal(form.dataset.state,'error');assert.equal(h.w.hostTest.getDraft(form).editor.verifyOnly,true);
  assert.equal(h.property().availability[0].nightlyPriceCents,8000);assert.equal(h.writes().length,1);
  h.submit(form);await tick();saved(h,form);assert.equal(h.writes().length,1);
  assert.equal(h.property().availability[0].nightlyPriceCents,8100);
});

test('failed/malformed verification stays Error, duplicate Check is not a write, Cancel reloads not undo',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  h.fixture.hooks.set('GET '+readPath,({json})=>json({error:'Read failed'},502));
  price(h,form,'82');h.submit(form);await tick();
  assert.equal(form.dataset.state,'error');assert.equal(form.dataset.hostOperation,'unknown');
  h.fixture.hooks.set('GET '+readPath,({json})=>json([{id:periodId,from:'bad'}]));
  h.submit(form);await tick();assert.equal(form.dataset.state,'error');assert.equal(h.writes().length,1);
  const pending=deferred();h.fixture.hooks.set('GET '+readPath,()=>pending.promise);
  form.querySelector('.host-period-cancel').click();h.submit(form);await tick();
  assert.equal(h.writes().length,1);
  pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();
  assert.equal(form.dataset.state,'idle');assert.equal(form.elements.nightlyPrice.value,'82');assert.equal(h.writes().length,1);
});

test('duplicate submit and later field versions cannot be cleared by the original confirmation',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('PUT '+putPath(periodId),()=>pending.promise);
  price(h,form,'83');h.submit(form);h.submit(form);await tick();assert.equal(h.writes().length,1);
  price(h,form,'84');Object.assign(h.fixture.periods[0],{nightlyPriceCents:8300});
  pending.resolve(h.fixture.json(null,204));await tick();
  assert.equal(form.dataset.state,'editing');assert.equal(form.elements.nightlyPrice.value,'84');
  assert.equal(h.w.hostTest.getDraft(form).server.nightlyPrice,'83');assert.equal(h.w.hostTest.getDirty(),true);
});

test('one property mutation lock: a busy conditions save keeps its known draft and retries explicitly',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred(),conditions=h.conditions();
  h.fixture.hooks.set('PUT '+putPath(periodId),()=>pending.promise);
  price(h,form,'85');h.submit(form);await tick();h.edit(conditions.elements.minStayDays,'7');h.submit(conditions);await tick();
  assert.equal(h.writes().length,1);assert.equal(conditions.elements.minStayDays.value,'7');
  assert.equal(h.w.hostTest.getDraft(conditions).editor.verifyOnly,false);
  Object.assign(h.fixture.periods[0],{nightlyPriceCents:8500});pending.resolve(h.fixture.json(null,204));await tick();
  h.submit(conditions);await tick();saved(h,conditions);
  assert.deepEqual(h.writes()[1].payload,{minStayDays:7});assert.equal(h.writes()[1].method,'PATCH');
});

test('conditions verification merges only conditions, preserving a peer period and newer condition input',async t=>{
  const h=await setup();t.after(h.close);const conditions=h.conditions(),pending=deferred();
  h.fixture.hooks.set('GET /api/host/dashboard',()=>pending.promise);
  h.edit(conditions.elements.cleaningFee,'7.50');h.submit(conditions);await tick();
  assert.equal(h.w.hostTest.getWrites().size,0);const olderDashboard=h.fixture.snapshot();
  h.edit(conditions.elements.minStayDays,'9');
  const form=enter(h);price(h,form,'86');h.submit(form);await tick();saved(h,form);
  pending.resolve(h.fixture.json(olderDashboard));await tick();
  assert.equal(h.property().availability[0].nightlyPriceCents,8600);
  assert.equal(conditions.elements.minStayDays.value,'9');assert.equal(conditions.dataset.state,'editing');
  assert.equal(h.property().cleaningFeeCents,750);
});

test('reverse direction: period read invalidated by conditions write offers Check and retains both drafts',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);
  price(h,form,'87');h.submit(form);await tick();
  const conditions=h.conditions();h.edit(conditions.elements.minStayDays,'5');h.submit(conditions);await tick();saved(h,conditions);
  pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();assert.equal(form.dataset.state,'error');
  h.fixture.hooks.delete('GET '+readPath);h.submit(form);await tick();saved(h,form);
  assert.equal(h.property().minStayDays,5);assert.equal(h.writes().length,2);
});

async function peerRace(h,absence=false){
  const reads=[];h.fixture.hooks.set('GET '+readPath,()=>{const pending=deferred();reads.push(pending);return pending.promise;});
  const a=enter(h),b=enter(h,secondPeriodId);
  price(h,a,'88');h.submit(a);await tick();const aSnapshot=clone(h.fixture.periods);
  price(h,b,'89');h.submit(b);await tick();const bSnapshot=clone(h.fixture.periods);
  reads[0].resolve(h.fixture.json(h.fixture.wire(aSnapshot)));await tick();assert.equal(a.dataset.state,'error');
  h.submit(a);await tick(); // read[2]: after both mutations, before B confirmation.
  if(absence){
    reads[1].resolve(h.fixture.json(h.fixture.wire(bSnapshot.map(row=>row.id===secondPeriodId ? {...row,nightlyPriceCents:9000} : row))));
    await tick();assert.equal(b.dataset.state,'error');
    b.querySelector('.host-period-cancel').click();await tick();
    reads[3].resolve(h.fixture.json(h.fixture.wire(bSnapshot.filter(row=>row.id!==secondPeriodId))));await tick();
  }else{reads[1].resolve(h.fixture.json(h.fixture.wire(bSnapshot)));await tick();saved(h,b);}
  reads[2].resolve(h.fixture.json(h.fixture.wire(aSnapshot)));await tick();saved(h,a);
  if(absence){assert.equal(h.row(secondPeriodId),null);assert.equal(h.property().availability.some(row=>row.id===secondPeriodId),false);}
  else assert.equal(h.property().availability.find(row=>row.id===secondPeriodId).nightlyPriceCents,8900);
}
test('two peer confirmations: older whole-list verification cannot roll back confirmed B',async t=>{const h=await setup();t.after(h.close);await peerRace(h);});
test('confirmed peer absence defeats an older whole-list verification',async t=>{const h=await setup();t.after(h.close);await peerRace(h,true);});

test('successful property DELETE retires pending verification first and keeps unrelated property drafts',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.choose(otherPropertyId);const other=h.w.document.querySelector('[data-property-id="'+otherPropertyId+'"] .host-property-settings form');
  h.edit(other.elements.title,'Keep unrelated draft');h.choose(propertyId);
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);price(h,form,'90');h.submit(form);await tick();
  const late=clone(h.fixture.periods);assert.equal(h.w.hostTest.getWrites().size,0);
  await h.w.hostTest.deleteProperty(h.property());assert.equal(h.property(),undefined);
  assert.equal([...h.w.hostTest.getDrafts().keys()].some(key=>key.includes(propertyId)),false);
  pending.resolve(h.fixture.json(h.fixture.wire(late)));await tick();assert.equal(h.property(),undefined);
  assert.equal(other.elements.title.value,'Keep unrelated draft');assert.equal(h.w.hostTest.getDirty(),true);
});
for(const outcome of ['cancel','failed'])test(outcome+' property DELETE does not retire pending verification',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);price(h,form,'91');h.submit(form);await tick();
  if(outcome==='cancel')h.w.confirm=()=>false;
  else h.fixture.hooks.set('DELETE '+propertyPath,({json})=>json({error:'Synthetic failed delete'},400));
  await h.w.hostTest.deleteProperty(h.property());assert.ok(h.property());
  pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();
  if(outcome==='cancel')saved(h,form);
  else {assert.equal(form.dataset.state,'error');h.fixture.hooks.delete('GET '+readPath);h.submit(form);await tick();saved(h,form);}
  assert.equal(h.row(),form);
});

test('session epoch change retires the old owner and ignores late confirmation',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);price(h,form,'92');h.submit(form);await tick();
  h.w.ParrotCore.session.setUser(null);await tick();pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();
  assert.equal(h.w.document.querySelector('.host-period-editor'),null);
  assert.equal(h.w.hostTest.getDrafts().size,0);assert.equal(h.w.hostTest.getWrites().size,0);
});

test('condition fee clears to null sparsely; Cancel and same-account notifications retain peer draft',async t=>{
  const h=await setup();t.after(h.close);const conditions=h.conditions(),form=enter(h);
  price(h,form,'93');h.edit(conditions.elements.cleaningFee,'7.50');h.submit(conditions);await tick();saved(h,conditions);
  h.edit(conditions.elements.minStayDays,'8');conditions.querySelector('.host-period-cancel').click();await tick();
  assert.equal(conditions.elements.minStayDays.value,'1');assert.equal(form.elements.nightlyPrice.value,'93');
  h.edit(conditions.elements.cleaningFee,'');h.submit(conditions);await tick();saved(h,conditions);
  assert.deepEqual(h.writes().at(-1).payload,{cleaningFeeCents:null});
  h.w.ParrotCore.session.updateProfile({displayName:'Same-account update'});await tick();
  await h.w.hostTest.syncDashboard();
  assert.equal(h.row(),form);assert.equal(form.elements.nightlyPrice.value,'93');
  assert.equal(h.conditions(),conditions);assert.equal(h.writes().length,2);
});

test('older whole-dashboard GET cannot roll back a subsequent period confirmation',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),verification=deferred(),dashboard=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>verification.promise);
  const old=h.fixture.snapshot();price(h,form,'94');h.submit(form);await tick();
  h.fixture.hooks.set('GET /api/host/dashboard',()=>dashboard.promise);
  const refresh=h.w.hostTest.syncDashboard();await tick();
  verification.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();saved(h,form);
  dashboard.resolve(h.fixture.json(old));await refresh;await tick();
  assert.equal(h.property().availability[0].nightlyPriceCents,9400);
  assert.equal(h.row(),form);assert.equal(h.w.hostTest.getDraft(form).server.nightlyPrice,'94');
  enter(h);assert.equal(form.querySelector('.host-period-save').disabled,true);
});

test('successful period DELETE retires its pending verification before a stale whole-list completion',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  h.fixture.hooks.set('GET '+readPath,()=>pending.promise);price(h,form,'95');h.submit(form);await tick();
  const late=clone(h.fixture.periods),period=h.property().availability.find(value=>value.id===periodId);
  await h.w.hostTest.deleteAvailability(h.property(),period);
  assert.equal(h.row(),null);
  pending.resolve(h.fixture.json(h.fixture.wire(late)));await tick();
  assert.equal(h.row(),null);assert.equal(h.property().availability.some(value=>value.id===periodId),false);
  assert.ok(h.row(secondPeriodId));assert.equal(h.writes().filter(call=>call.method==='PUT').length,1);
});

test('a later edit made while ambiguous Cancel checks the server is not overwritten',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  h.fixture.hooks.set('PUT '+putPath(periodId),()=>{throw new Error('Synthetic lost ACK');});
  price(h,form,'96');h.submit(form);await tick();assert.equal(form.dataset.state,'error');
  const pending=deferred();h.fixture.hooks.set('GET '+readPath,()=>pending.promise);
  form.querySelector('.host-period-cancel').click();await tick();price(h,form,'97');
  pending.resolve(h.fixture.json(h.fixture.wire(h.fixture.periods)));await tick();
  assert.equal(form.elements.nightlyPrice.value,'97');assert.equal(form.dataset.state,'editing');
  assert.equal(h.w.hostTest.getDraft(form).server.nightlyPrice,'80');assert.equal(h.writes().length,1);
});


for(const mutate of [row=>({...row,propertyId:otherPropertyId}),row=>({...row,id:secondPeriodId}),
  row=>({...row,period:undefined,from:row.period.from,to:row.period.to}),
  row=>({...row,period:{from:'2030-02-30',to:'2030-03-05'}}),row=>({...row,nightlyPriceCents:0})])
test('A empty ACK followed by a foreign/flat/invalid current-state row stays unconfirmed',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  h.fixture.hooks.set('GET '+readPath,({json})=>json([mutate(h.fixture.ack(h.fixture.periods[0]))]));
  price(h,form,'81');h.submit(form);await tick();
  assert.equal(form.dataset.state,'error');assert.equal(form.dataset.hostOperation,'unknown');
  assert.equal(h.w.hostTest.getDraft(form).editor.verifyOnly,true);assert.equal(h.writes().length,1);
  assert.equal(h.property().availability[0].nightlyPriceCents,8000);
  h.fixture.hooks.delete('GET '+readPath);h.submit(form);await tick();saved(h,form);assert.equal(h.writes().length,1);
});

test('button labels: period input/change and repeated refresh preserve equal text nodes',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h);
  price(h,form,'81.25');
  const labels=['h4','.host-period-edit','[data-host-key="save-label"]','.host-period-cancel']
    .map(selector=>form.querySelector(selector));
  const texts=labels.map(node=>node.firstChild),observer=new h.w.MutationObserver(()=>{});
  t.after(()=>observer.disconnect());
  for(const node of labels)observer.observe(node,{childList:true});
  for(const type of ['input','change'])form.elements.nightlyPrice.dispatchEvent(new h.w.Event(type,{bubbles:true}));
  form.hostRefresh();form.hostRefresh();
  labels.forEach((node,index)=>assert.equal(node.firstChild,texts[index],node.className||node.tagName));
  assert.equal(observer.takeRecords().length,0);
  assert.equal(form.dataset.state,'editing');assert.equal(h.writes().length,0);
});

test('button labels: source input/change and repeated refresh preserve equal text nodes',async t=>{
  const h=await setup();t.after(h.close);
  const form=h.w.document.querySelector('[data-property-id="'+propertyId+'"] .host-source-form');
  h.edit(form.elements.icalUrl,'https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123');
  const labels=[form.querySelector('[data-source-preview-button]'),form.querySelector('[data-source-save]')];
  const texts=labels.map(node=>node.firstChild),observer=new h.w.MutationObserver(()=>{});
  t.after(()=>observer.disconnect());
  for(const node of labels)observer.observe(node,{childList:true});
  for(const type of ['input','change'])form.elements.icalUrl.dispatchEvent(new h.w.Event(type,{bubbles:true}));
  form.hostRefresh();form.hostRefresh();
  labels.forEach((node,index)=>assert.equal(node.firstChild,texts[index],node.textContent));
  assert.equal(observer.takeRecords().length,0);
  assert.equal(labels[0].disabled,false);assert.equal(labels[1].disabled,true);
  assert.equal(h.writes().length,0);
});

test('button labels: real saving state and language changes still update period labels',async t=>{
  const h=await setup();t.after(h.close);const form=enter(h),pending=deferred();
  const label=form.querySelector('[data-host-key="save-label"]');
  assert.equal(label.textContent,'Save changes');const original=label.firstChild;
  h.fixture.hooks.set('PUT '+putPath(periodId),()=>pending.promise);
  price(h,form,'81.25');h.submit(form);await tick();
  assert.equal(form.dataset.state,'saving');assert.equal(label.textContent,'Saving…');
  assert.notEqual(label.firstChild,original);assert.equal(form.querySelector('.host-period-cancel').disabled,true);
  Object.assign(h.fixture.periods[0],{nightlyPriceCents:8125});
  pending.resolve(h.fixture.json(null,204));await tick();saved(h,form);
  assert.equal(label.textContent,'Save changes');assert.equal(h.writes().length,1);
  h.w.document.querySelector('[data-host-lang="ru"]').click();await tick();
  assert.equal(h.row(),form);assert.equal(label.textContent,'Сохранить изменения');
  assert.equal(form.querySelector('.host-period-edit').textContent,'Изменить');
  assert.equal(form.querySelector('.host-period-cancel').textContent,'Отмена');
  h.w.document.querySelector('[data-host-lang="en"]').click();await tick();
  assert.equal(label.textContent,'Save changes');assert.equal(h.writes().length,1);
});

test('button labels: source relabel keeps preview lease and exact-value invalidation',async t=>{
  const h=await setup();t.after(h.close);const pending=deferred();
  const form=h.w.document.querySelector('[data-property-id="'+propertyId+'"] .host-source-form');
  const preview=form.querySelector('[data-source-preview-button]'),save=form.querySelector('[data-source-save]');
  const publicLinks='/api/host/properties/'+propertyId+'/public-links';
  h.fixture.hooks.set('POST '+publicLinks,()=>pending.promise);
  h.edit(form.elements.icalUrl,'https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123');
  preview.click();await tick();
  assert.equal(preview.disabled,true);assert.equal(save.disabled,true);
  preview.dispatchEvent(new h.w.MouseEvent('click',{bubbles:true}));await tick();
  assert.equal(h.writes().length,1);assert.equal(h.writes()[0].method,'POST');
  h.w.document.querySelector('[data-host-lang="ru"]').click();await tick();
  assert.equal(preview.textContent,'Проверить ссылку');assert.equal(save.textContent,'Сохранить источник');
  assert.equal(preview.disabled,true);
  pending.resolve(h.fixture.json({listingId:'123',publicUrl:'https://www.airbnb.com/rooms/123'}));await tick();
  assert.equal(form.querySelector('[data-source-preview]').getAttribute('href'),'https://www.airbnb.com/rooms/123');
  assert.equal(save.disabled,false);assert.equal(h.writes().length,1);
  h.edit(form.elements.icalUrl,'https://www.airbnb.com/calendar/ical/456.ics?s=SyntheticOnly456');
  assert.equal(save.disabled,true);assert.equal(form.querySelector('[data-source-preview]').hidden,true);
  assert.equal(h.writes().length,1);
});
