// S5 source specifications only; runtime execution is a separate gate.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {installCore}=require('./helpers/core.cjs');
const root=path.join(__dirname,'..');
const propertyId='11111111-1111-4111-8111-111111111111',calendarId='22222222-2222-4222-8222-222222222222';
const url='https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123',publicUrl='https://www.airbnb.com/rooms/123';
const sourcePath=`/properties/${propertyId}/public-links`,snapshotPath=`/properties/${propertyId}/calendars`;
const view=(extra={})=>({id:calendarId,provider:'Airbnb',listingId:'123',publicUrl,enabled:true,mode:'Active',revision:7,status:'Connected',lastSuccessAt:null,lastSyncedAt:null,lastError:null,reservationBlocks:[],...extra});
const copy=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
async function setup({calendars=[],verification='Required'}={}){
  const fixture={calendars,verification,seen:[],hooks:new Map()};
  const dom=new JSDOM(fs.readFileSync(path.join(root,'public/host.html'),'utf8'),{url:'https://offline.test/host.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async(raw,init={})=>{
    const rawRoute=String(raw).replace('/api/host','');
    const route=rawRoute.startsWith('/dashboard?')?'/dashboard':rawRoute.startsWith('/geocode/countries?')?'/geocode/countries':rawRoute;
    const method=init.method || 'GET',body=init.body?JSON.parse(init.body):null;
    const call={route,method,body};fixture.seen.push(call);
    const hook=fixture.hooks.get(method+' '+route);if(hook)return hook(call);
    let value,status=200;
    if(route==='/auth/me')value={accountId:propertyId,email:'owner@example.test',username:'owner',parrotId:'P669-AAAA-AAAA-AAAA',displayName:'Owner'};
    else if(route==='/dashboard')value={properties:[{id:propertyId,title:'Source property',city:'Barcelona',countryCode:'ES',country:'Spain',accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,cleaningFeeCents:null,address:null,createdAt:'2030-01-01T00:00:00Z',availability:[],unavailability:[],listings:fixture.calendars.length?[{id:propertyId,url:publicUrl,showInSearch:true}]:[]}]};
    else if(route===snapshotPath)value={calendars:copy(fixture.calendars)};
    else if(route==='/geocode/countries')value=[{code:'ES',name:'Spain'}];
    else if(route===sourcePath && method==='POST')value={listingId:'123',publicUrl};
    else if(route===sourcePath && method==='PUT'){fixture.calendars=[view()];status=204;}
    else if(route===`/calendars/${calendarId}/verification`)value={status:fixture.verification};
    else if(route===`/calendars/${calendarId}/verification/cancel`){fixture.verification='Cancelled';value={status:'Cancelled'};}
    else if(route.startsWith('/calendars/') && method!=='GET'){
      const current=fixture.calendars[0];assert.equal(body.expectedRevision,current.revision);
      if(method==='DELETE')fixture.calendars=[];
      else fixture.calendars=[{...current,mode:route.endsWith('/activate')?'Active':body.mode || current.mode,enabled:(body.mode || 'Active')!=='Disabled',revision:current.revision+1}];
      status=204;
    }else throw Error('Unspecified fixture request '+method+' '+route);
    return new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  };
  installCore(w);w.eval(fs.readFileSync(path.join(root,'public/assets/host-address.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(root,'public/assets/host.js'),'utf8')+'\nwindow.s5={previewCalendarSource,connectCalendar,syncDashboard,performCalendarLifecycle,checkCalendarLifecycle,stopCalendarWaiting,renderProperties,calendarRevision,calendarErrorUnknown,getState:()=>state,readView:property=>hostCalendarViews.read(property),viewCount:()=>hostCalendarViews.size,commands:hostCalendarViews,disposeHostProperty,clearPrivatePresentation,revalidateRestoredPage,hostDirtyState,getDirty:()=>unsavedHostChanges,getDraft:hostDraft,getWrites:()=>hostPropertyWrites};');
  await tick();
  const property=()=>w.s5.getState().properties.find(item=>item.id===propertyId);
  const form=()=>w.document.querySelector('.host-source-form');
  const edit=value=>{form().elements.icalUrl.value=value;form().elements.icalUrl.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const preview=()=>w.s5.previewCalendarSource(property(),form());
  const save=()=>w.s5.connectCalendar(property(),form());
  const sourceWrites=()=>fixture.seen.filter(call=>call.route===sourcePath && call.method==='PUT');
  return {w,fixture,property,form,edit,preview,save,sourceWrites,close:()=>w.close()};
}
test('preview is token-free, explicit and invalidated by each edit; no POST result is a save',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();
  assert.equal(h.form().querySelector('[data-source-preview]').href,publicUrl);
  assert.equal(h.form().querySelector('[data-source-preview]').textContent.includes('SyntheticOnly123'),false);
  assert.equal(h.sourceWrites().length,0);assert.equal(h.form().querySelector('[data-source-save]').disabled,false);
  h.edit(url+'X');assert.equal(h.form().querySelector('[data-source-preview]').hidden,true);
  await h.save();assert.equal(h.sourceWrites().length,0);assert.match(h.form().textContent,/Preview this exact link/);
});
for(const preview of [null,[],{}, {listingId:'123',publicUrl:publicUrl+'?token=private'}, {listingId:'123',publicUrl:'https://airbnb.com.evil.test/rooms/123'}, {listingId:'123',publicUrl,token:'private'}])
test('malformed or private/spoofed preview never enables save '+JSON.stringify(preview),async t=>{
  const h=await setup();t.after(h.close);h.fixture.hooks.set('POST '+sourcePath,()=>new Response(JSON.stringify(preview),{status:200}));h.edit(url);await h.preview();await h.save();
  assert.equal(h.sourceWrites().length,0);assert.equal(h.form().querySelector('[data-source-preview]').hidden,true);
});
test('pending verification refused consent leaves source untouched and sends no cancel',async t=>{
  const h=await setup({calendars:[view()],verification:'Pending'});t.after(h.close);h.w.confirm=()=>false;
  h.edit(url);await h.preview();await h.save();assert.equal(h.sourceWrites().length,0);
  assert.equal(h.fixture.seen.filter(call=>call.route.endsWith('/verification/cancel')).length,0);
  assert.equal(h.w.s5.viewCount(),0);assert.equal(h.form().elements.icalUrl.value,url);
});
test('accepted cancellation is awaited before explicit source PUT; unchanged producer identity is not refetched by client',async t=>{
  const h=await setup({calendars:[view()],verification:'Pending'});t.after(h.close);
  h.edit(url);await h.preview();await h.save();
  const calls=h.fixture.seen.filter(call=>call.route===sourcePath || call.route.includes('/verification'));
  assert.deepEqual(calls.map(call=>[call.method,call.route]),[['POST',sourcePath],['GET',`/calendars/${calendarId}/verification`],['POST',`/calendars/${calendarId}/verification/cancel`],['PUT',sourcePath]]);
  assert.deepEqual(h.sourceWrites()[0].body,{provider:'Airbnb',icalUrl:url});assert.equal(h.form().elements.icalUrl.value,'');
  assert.equal(h.w.s5.viewCount(),0);
});
for(const outcome of ['damaged200','lost','server500'])test('ambiguous source '+outcome+' stays unknown; Check is GET-only and never replays',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();
  h.fixture.hooks.set('PUT '+sourcePath,()=>{
    if(outcome==='lost')throw new TypeError('transport lost');
    return new Response('{}',{status:outcome==='server500'?500:200});
  });
  await h.save();assert.equal(h.w.s5.readView(h.property()).phase,'unknown');assert.equal(h.sourceWrites().length,1);
  await h.save();assert.equal(h.sourceWrites().length,1);await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.sourceWrites().length,1);assert.equal(h.w.s5.viewCount(),1);
  h.fixture.calendars=[view()];await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.sourceWrites().length,1);assert.equal(h.w.s5.viewCount(),0);
});
test('definitive structured conflict preserves source draft with no fabricated Saved',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();h.fixture.hooks.set('PUT '+sourcePath,()=>new Response(JSON.stringify({code:'CONFLICT',error:'immutable source'}),{status:409}));
  await h.save();assert.equal(h.w.s5.viewCount(),0);assert.equal(h.form().elements.icalUrl.value,url);assert.equal(h.sourceWrites().length,1);assert.match(h.form().textContent,/not accepted/);
});
for(const mutation of ['input','account','property','revision'])test('late preview cannot authorize after '+mutation+' change',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const held=deferred();h.fixture.hooks.set('POST '+sourcePath,()=>held.promise);
  h.edit(url);const work=h.preview();await tick();
  if(mutation==='input')h.edit(url+'X');
  if(mutation==='account')h.w.ParrotCore.session.setUser(null);
  if(mutation==='property')h.w.s5.getState().properties=[];
  if(mutation==='revision'){h.fixture.calendars=[view({revision:8})];await h.w.s5.syncDashboard();}
  held.resolve(new Response(JSON.stringify({listingId:'123',publicUrl}),{status:200}));await work;
  if(h.property() && h.form())assert.equal(h.w.s5.getDraft(h.form()).sourcePreview,undefined);
  assert.equal(h.sourceWrites().length,0);
});
for(const [mode,command,method,suffix,extra] of [['Active','sync','POST','/sync',{}],['Active','freeze','PUT','',{mode:'Frozen'}],['Frozen','disable','PUT','',{mode:'Disabled'}],['Disabled','activate','POST','/activate',{}],['Disabled','delete','DELETE','',{}]])
test('current '+mode+' '+command+' uses exact expectedRevision, then authoritative GET only',async t=>{
  const h=await setup({calendars:[view({mode,enabled:mode!=='Disabled'})]});t.after(h.close);const calendar=h.property().calendars[0];
  assert.equal(calendar.status,'Connected');await h.w.s5.performCalendarLifecycle(calendar,command);
  const writes=h.fixture.seen.filter(call=>call.method!=='GET');assert.deepEqual(writes,[{route:`/calendars/${calendarId}${suffix}`,method,body:{...extra,expectedRevision:7}}]);
  assert.equal(h.w.s5.viewCount(),0);assert.equal(h.fixture.seen.filter(call=>call.route===snapshotPath).length,2);
});
for(const [mode,command] of [['Disabled','sync'],['Frozen','sync'],['Disabled','freeze'],['Active','activate']])test('illegal direct '+mode+' '+command+' neither claims nor sends',async t=>{
  const h=await setup({calendars:[view({mode,enabled:mode!=='Disabled'})]});t.after(h.close);await h.w.s5.performCalendarLifecycle(h.property().calendars[0],command);
  assert.equal(h.fixture.seen.filter(call=>call.method!=='GET').length,0);assert.equal(h.w.s5.viewCount(),0);
});
test('412 and damaged/lost command resolution never replay or invent a dashboard revision',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);
  h.fixture.hooks.set('POST '+`/calendars/${calendarId}/sync`,()=>new Response(JSON.stringify({code:'CALENDAR_STALE',error:'stale'}),{status:412}));
  h.fixture.hooks.set('GET '+snapshotPath,()=>new Response('{}',{status:200}));
  await h.w.s5.performCalendarLifecycle(h.property().calendars[0],'sync');assert.equal(h.w.s5.readView(h.property()).phase,'unknown');
  await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.fixture.seen.filter(call=>call.method!=='GET').length,1);
  assert.throws(()=>h.w.s5.calendarRevision(h.property().calendars[0]));
  h.fixture.hooks.delete('GET '+snapshotPath);h.fixture.calendars=[view({revision:9})];await h.w.s5.checkCalendarLifecycle(h.property());
  assert.equal(h.property().calendars[0].revision,9);assert.equal(h.w.s5.viewCount(),0);
});
test('Stop retires UI ownership; late reply cannot report success, Check cannot run ahead of transport',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const held=deferred();h.fixture.hooks.set(`POST /calendars/${calendarId}/sync`,()=>held.promise);
  const work=h.w.s5.performCalendarLifecycle(h.property().calendars[0],'sync');await tick();h.w.s5.stopCalendarWaiting(h.property());
  const reads=h.fixture.seen.filter(call=>call.method==='GET').length;await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.fixture.seen.filter(call=>call.method==='GET').length,reads);
  held.resolve(new Response(null,{status:204}));await work;assert.equal(h.w.s5.readView(h.property()).phase,'unknown');
  assert.equal(h.w.s5.readView(h.property()).transportPending,false);await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.w.s5.viewCount(),0);
  assert.equal(h.fixture.seen.filter(call=>call.method!=='GET').length,1);
});
test('retired property source completion cannot resurrect or clear a replacement draft',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();const held=deferred();h.fixture.hooks.set('PUT '+sourcePath,()=>held.promise);
  const work=h.save();await tick();const old=h.property();h.w.s5.getState().properties=h.w.s5.getState().properties.map(value=>({...value}));h.w.s5.renderProperties();
  h.form().elements.icalUrl.value='new draft';held.resolve(new Response(null,{status:204}));await work;
  assert.notEqual(h.property(),old);assert.equal(h.form().elements.icalUrl.value,'new draft');assert.equal(h.sourceWrites().length,1);
});

for(const error of [
  {kind:'protocol',status:200},{kind:'protocol',status:204},{kind:'network',status:0},
  {kind:'timeout',status:0},{kind:'abort',status:0},{kind:'http',status:500,code:'INTERNAL_ERROR'},
  {kind:'http',status:429,code:'RATE_LIMITED'},{kind:'http',status:400,code:''}
])test('structured ambiguous classification '+JSON.stringify(error),async t=>{
  const h=await setup();t.after(h.close);assert.equal(h.w.s5.calendarErrorUnknown(error),true);
});
for(const status of [400,401,403,404,409,412])test('structured definitive HTTP classification '+status,async t=>{
  const h=await setup();t.after(h.close);assert.equal(h.w.s5.calendarErrorUnknown({kind:'http',status,code:'DEFINITE_REFUSAL'}),false);
});
test('damaged cancellation ACK cannot authorize source PUT or optimistic rollback',async t=>{
  const h=await setup({calendars:[view()],verification:'Pending'});t.after(h.close);h.edit(url);await h.preview();
  h.fixture.hooks.set(`POST /calendars/${calendarId}/verification/cancel`,()=>new Response('{}',{status:200}));
  await h.save();assert.equal(h.sourceWrites().length,0);assert.equal(h.w.s5.readView(h.property()).phase,'unknown');assert.equal(h.fixture.calendars[0].revision,7);
});
test('a newer revision defeats older read without trusting dashboard or enabling commands',async t=>{
  const h=await setup({calendars:[view({revision:9})]});t.after(h.close);h.fixture.calendars=[view({revision:7})];await h.w.s5.syncDashboard();
  assert.equal(h.property().calendars[0].revision,9);assert.equal(h.property().calendarReadError,true);
  await h.w.s5.performCalendarLifecycle(h.property().calendars[0],'sync');assert.equal(h.fixture.seen.filter(call=>call.method!=='GET').length,0);
});

test('Pending/failed read retains a confirmed sync problem; only current Connected clears it',async t=>{
  const h=await setup({calendars:[view({status:'Error',lastError:'synthetic safe failure',lastSuccessAt:'2030-01-01T00:00:00Z'})]});t.after(h.close);
  h.fixture.calendars=[view({status:'Pending',revision:8})];await h.w.s5.syncDashboard();assert.equal(h.property().calendarSyncProblems[0].lastError,'synthetic safe failure');
  h.fixture.hooks.set('GET '+snapshotPath,()=>new Response('{}',{status:200}));await h.w.s5.syncDashboard();assert.equal(h.property().calendarSyncProblems.length,1);
  h.fixture.hooks.delete('GET '+snapshotPath);h.fixture.calendars=[view({revision:9,lastSuccessAt:'2030-01-02T00:00:00Z'})];await h.w.s5.syncDashboard();assert.equal(h.property().calendarSyncProblems.length,0);
});

test('command observations are immutable display copies, never writable records or revision authority',async t=>{
  const h=await setup({calendars:[view({reservationBlocks:[{from:'2030-01-01',to:'2030-01-02'}]})]});t.after(h.close);
  const owner=h.w.s5.commands,calendar=h.property().calendars[0],ticket=owner.begin(h.property(),calendar,'sync');
  const observed=h.w.s5.readView(h.property());
  assert.equal(Object.isFrozen(owner),true);assert.equal(Object.isFrozen(ticket),true);
  for(const name of ['set','delete','clear','entries','values'])assert.equal(owner[name],undefined);
  assert.equal(observed.transport,undefined);assert.equal(ticket.transport,undefined);assert.equal(ticket.lastConfirmed,undefined);
  assert.equal(Reflect.set(observed,'phase','success'),false);
  assert.equal(Reflect.set(observed.lastConfirmed,'revision',999),false);
  assert.equal(Reflect.set(observed.lastConfirmed.reservationBlocks[0],'from','invented'),false);
  assert.notEqual(observed.lastConfirmed,calendar);assert.notEqual(observed.lastConfirmed.reservationBlocks,calendar.reservationBlocks);
  assert.equal(owner.get(propertyId).phase,'pending');assert.equal(h.w.s5.readView(h.property()).phase,'pending');
  assert.throws(()=>h.w.s5.calendarRevision(observed.lastConfirmed));assert.equal(h.w.s5.calendarRevision(calendar),7);
  owner.transportSettled(ticket);assert.equal(observed.transportPending,true);assert.equal(owner.read(h.property()).transportPending,false);
});

test('one command view and the existing property lease exclude another begin without changing the lease',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands,property=h.property();
  const lease={synthetic:'existing property writer'};h.w.s5.getWrites().set(propertyId,lease);
  assert.equal(owner.begin(property,property.calendars[0],'sync'),null);assert.equal(owner.size,0);
  assert.equal(h.w.s5.getWrites().get(propertyId),lease);h.w.s5.getWrites().delete(propertyId);
  const ticket=owner.begin(property,property.calendars[0],'sync');assert.ok(ticket);
  assert.equal(owner.begin(property,property.calendars[0],'disable'),null);assert.equal(owner.size,1);
  owner.close(ticket);assert.equal(owner.size,0);assert.equal(h.fixture.seen.filter(call=>call.method!=='GET').length,0);
});

test('a busy source draft discards only its new observation and does not release or acknowledge the draft',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();
  const draft=h.w.s5.getDraft(h.form()),operation={synthetic:'already saving'};draft.operation=operation;
  await h.save();assert.equal(h.w.s5.viewCount(),0);assert.equal(h.sourceWrites().length,0);
  assert.equal(draft.operation,operation);assert.equal(h.form().elements.icalUrl.value,url);
});

test('Stop during source reconciliation preserves replacement ownership and a newer unacknowledged draft',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();const held=deferred();
  h.fixture.hooks.set('GET '+snapshotPath,()=>held.promise);
  const work=h.save();await tick();assert.equal(h.w.s5.readView(h.property()).transportPending,false);
  const reads=h.fixture.seen.filter(call=>call.route===snapshotPath).length;assert.equal(reads,2);
  h.w.s5.stopCalendarWaiting(h.property());h.edit(url+'Newer');
  held.resolve(new Response(JSON.stringify({calendars:[view()]}),{status:200}));await work;
  assert.equal(h.w.s5.readView(h.property()).stopped,true);assert.equal(h.w.s5.readView(h.property()).phase,'unknown');
  assert.equal(h.form().elements.icalUrl.value,url+'Newer');assert.equal(h.w.s5.getDraft(h.form()).dirty.has('icalUrl'),true);
  h.fixture.hooks.delete('GET '+snapshotPath);await h.w.s5.checkCalendarLifecycle(h.property());
  assert.equal(h.w.s5.viewCount(),0);assert.equal(h.form().elements.icalUrl.value,url+'Newer');assert.equal(h.sourceWrites().length,1);
});

for(const stage of ['verification','cancellation'])test('Stop during source '+stage+' never sends the next mutation or prematurely releases its lease',async t=>{
  const h=await setup({calendars:[view()],verification:stage==='cancellation'?'Pending':'Required'});t.after(h.close);
  h.edit(url);await h.preview();const held=deferred();
  const route=`/calendars/${calendarId}/verification`+(stage==='cancellation'?'/cancel':'');
  h.fixture.hooks.set((stage==='cancellation'?'POST ':'GET ')+route,()=>held.promise);
  const work=h.save();await tick();const lease=h.w.s5.getWrites().get(propertyId);assert.ok(lease);
  const before=h.fixture.seen.length;h.w.s5.stopCalendarWaiting(h.property());
  assert.equal(h.fixture.seen.length,before);assert.equal(h.w.s5.getWrites().get(propertyId),lease);
  await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.fixture.seen.length,before);
  held.resolve(new Response(JSON.stringify({status:stage==='cancellation'?'Cancelled':'Required'}),{status:200}));await work;
  assert.equal(h.sourceWrites().length,0);assert.equal(h.w.s5.getWrites().size,0);
  assert.equal(h.w.s5.readView(h.property()).phase,'unknown');assert.equal(h.w.s5.readView(h.property()).transportPending,false);
  assert.equal(h.form().elements.icalUrl.value,url);
});

test('an in-progress Check blocks another read, and an empty snapshot cannot resolve initial source creation',async t=>{
  const h=await setup();t.after(h.close);h.edit(url);await h.preview();
  h.fixture.hooks.set('PUT '+sourcePath,()=>new Response('{}',{status:500}));await h.save();
  const held=deferred();h.fixture.hooks.set('GET '+snapshotPath,()=>held.promise);
  const work=h.w.s5.checkCalendarLifecycle(h.property());await tick();assert.equal(h.w.s5.readView(h.property()).checking,true);
  const reads=h.fixture.seen.filter(call=>call.method==='GET').length;
  await h.w.s5.checkCalendarLifecycle(h.property());assert.equal(h.fixture.seen.filter(call=>call.method==='GET').length,reads);
  held.resolve(new Response(JSON.stringify({calendars:[]}),{status:200}));await work;
  assert.equal(h.w.s5.readView(h.property()).checking,false);assert.equal(h.w.s5.readView(h.property()).phase,'unknown');
  assert.equal(h.form().elements.icalUrl.value,url);assert.equal(h.sourceWrites().length,1);
});

for(const cleanup of ['forgetProperty','reset','same-id replacement'])test('late tickets after '+cleanup+' cannot remove, settle or recreate a newer command',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands;
  const old=owner.begin(h.property(),h.property().calendars[0],'sync');owner.stop(h.property());
  if(cleanup==='same-id replacement'){
    h.w.s5.getState().properties=[{...h.property()}];h.w.s5.renderProperties();
  }else if(cleanup==='reset')owner.reset();
  else h.w.s5.disposeHostProperty(propertyId);
  assert.equal(owner.size,0);owner.transportSettled(old);assert.equal(owner.size,0);
  const next=owner.begin(h.property(),h.property().calendars[0],'disable');assert.ok(next);
  owner.close(old);owner.markUnknown(old);owner.finishCheck(old,true);owner.transportSettled(old);
  assert.equal(owner.size,1);assert.equal(owner.isCurrent(next),true);assert.equal(owner.isCurrent(old),false);
  assert.equal(owner.read(h.property()).phase,'pending');assert.equal(owner.read(h.property()).transportPending,true);
});

test('Stop makes old completion inert while its original transport alone releases the replacement Check',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands,property=h.property();
  const old=owner.begin(property,property.calendars[0],'sync');owner.stop(property);
  assert.equal(owner.isCurrent(old),false);owner.close(old);owner.markUnknown(old);owner.finishCheck(old,true);
  assert.equal(owner.size,1);assert.equal(owner.beginCheck(property),undefined);
  owner.transportSettled(old);const check=owner.beginCheck(property);assert.ok(check);
  assert.equal(owner.read(property).stopped,true);assert.equal(owner.read(property).phase,'unknown');
  owner.finishCheck(check,false);assert.equal(owner.read(property).checking,false);
  owner.finishCheck(check,true);assert.equal(owner.size,0);
});

test('account/epoch reset retires tickets and leaves no private command observation',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands;
  const old=owner.begin(h.property(),h.property().calendars[0],'sync');h.w.ParrotCore.session.setUser(null);await tick();
  owner.transportSettled(old);owner.markUnknown(old);owner.close(old);assert.equal(owner.isCurrent(old),false);
  assert.equal(owner.size,0);assert.equal(h.w.s5.getState().authenticated,false);
});

test('pending and stopped unknown observations retain leave warning until current Check closes them',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands,property=h.property();
  h.w.s5.hostDirtyState();assert.equal(h.w.s5.getDirty(),false);
  const ticket=owner.begin(property,property.calendars[0],'sync');h.w.s5.hostDirtyState();assert.equal(h.w.s5.getDirty(),true);
  h.w.s5.stopCalendarWaiting(property);h.w.s5.hostDirtyState();assert.equal(h.w.s5.getDirty(),true);
  owner.transportSettled(ticket);await h.w.s5.checkCalendarLifecycle(property);h.w.s5.hostDirtyState();
  assert.equal(owner.size,0);assert.equal(h.w.s5.getDirty(),false);
});

test('BFCache revalidation synchronously clears observations before restoring the authenticated snapshot',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const owner=h.w.s5.commands;
  const old=owner.begin(h.property(),h.property().calendars[0],'sync'),held=deferred();
  h.fixture.hooks.set('GET /auth/me',()=>held.promise);
  const work=h.w.s5.revalidateRestoredPage();assert.equal(owner.size,0);
  assert.equal(owner.isCurrent(old),false);owner.transportSettled(old);assert.equal(owner.size,0);
  held.resolve(new Response(JSON.stringify({accountId:propertyId,parrotId:'P669-AAAA-AAAA-AAAA',displayName:'Owner'}),{status:200}));
  await work;await tick();assert.equal(owner.size,0);assert.equal(h.w.s5.getState().authenticated,true);
});

test('Check without an observation stays GET-only and accepts a new authenticated calendar object',async t=>{
  const h=await setup({calendars:[view()]});t.after(h.close);const old=h.property().calendars[0];
  const before=h.fixture.seen.length;h.fixture.calendars=[view({revision:8})];
  await h.w.s5.checkCalendarLifecycle(h.property());
  assert.ok(h.fixture.seen.length>before);assert.equal(h.fixture.seen.slice(before).every(call=>call.method==='GET'),true);
  assert.equal(h.w.s5.viewCount(),0);assert.notEqual(h.property().calendars[0],old);
  assert.equal(h.w.s5.calendarRevision(h.property().calendars[0]),8);assert.throws(()=>h.w.s5.calendarRevision(old));
});

for(const [from,to] of [['P669-AAAA-AAAA-AAAA','P669-BBBB-BBBB-BBBB'],['P669-BBBB-BBBB-BBBB','P669-AAAA-AAAA-AAAA']])
for(const status of [204,500])test(`PM094 profile epoch retires old source transport without clearing its replacement: ${from} to ${to}, ${status}`,async t=>{
  const h=await setup();t.after(h.close);const session=h.w.ParrotCore.session;
  const identity=id=>({...session.user,parrotId:id,displayName:'Owner'});
  session.setUser(identity(from));await tick();
  const oldProperty=h.property(),oldForm=h.form(),old=deferred(),next=deferred();let sends=0;
  h.fixture.hooks.set('PUT '+sourcePath,()=>++sends===1?old.promise:next.promise);
  h.edit(url);await h.preview();const oldWork=h.save();await tick();
  const oldLease=h.w.s5.getWrites().get(propertyId);assert.ok(oldLease);
  session.setUser(identity(to));
  assert.equal(oldForm.isConnected,false);assert.equal(h.w.s5.viewCount(),0);
  assert.equal(h.w.s5.getWrites().size,0);await tick();assert.notEqual(h.property(),oldProperty);
  h.edit(url+'NewIdentity');await h.preview();const newWork=h.save();await tick();
  const newLease=h.w.s5.getWrites().get(propertyId),newForm=h.form();assert.ok(newLease);assert.notEqual(newLease,oldLease);
  old.resolve(new Response(status===204?null:'{}',{status}));await oldWork;
  assert.equal(h.w.s5.getWrites().get(propertyId),newLease);assert.equal(h.form(),newForm);
  assert.equal(h.w.s5.readView(h.property()).transportPending,true);
  assert.equal(h.form().elements.icalUrl.value,url+'NewIdentity');assert.equal(h.sourceWrites().length,2);
  next.resolve(new Response('{}',{status:500}));await newWork;
  assert.equal(h.w.s5.getWrites().size,0);assert.equal(h.w.s5.readView(h.property()).phase,'unknown');
  assert.equal(h.form().elements.icalUrl.value,url+'NewIdentity');assert.equal(h.sourceWrites().length,2);
});

test('PM094 name-only session change preserves the Host draft, pending lease and dashboard count',async t=>{
  const h=await setup();t.after(h.close);const session=h.w.ParrotCore.session,held=deferred();
  h.fixture.hooks.set('PUT '+sourcePath,()=>held.promise);h.edit(url);await h.preview();
  const work=h.save();await tick();const form=h.form(),lease=h.w.s5.getWrites().get(propertyId),epoch=session.epoch;
  const reads=h.fixture.seen.filter(call=>call.route==='/dashboard').length;
  session.updateProfile({displayName:'Renamed'});await tick();
  assert.equal(session.epoch,epoch);assert.equal(h.form(),form);assert.equal(form.elements.icalUrl.value,url);
  assert.equal(h.w.s5.getWrites().get(propertyId),lease);assert.equal(h.w.s5.readView(h.property()).transportPending,true);
  assert.equal(h.fixture.seen.filter(call=>call.route==='/dashboard').length,reads);
  held.resolve(new Response('{}',{status:500}));await work;assert.equal(h.sourceWrites().length,1);
});
