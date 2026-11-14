const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {createCore} = require('../public/assets/shared/core.js');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/host.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/host.html'), 'utf8');
const deferred = () => {let resolve, reject; const promise = new Promise((a, b) => {resolve = a; reject = b;}); return {promise, resolve, reject};};
const dashboardProfile = user => ({id:user.parrotId,displayName:user.displayName});
const user = (id = 'account-a', name = 'Owner') => ({accountId:id, email:'owner@example.test', username:'owner', parrotId:id === 'account-a' ? 'P669-AAAA-AAAA-AAAA' : 'P669-BBBB-BBBB-BBBB', displayName:name});
const property = (id, title) => ({id, title, city:'Barcelona', cityNative:null, country:'Spain', countryCode:'ES', accommodationType:'entire_place', bedrooms:2, sleeps:4, minStayDays:1, cleaningFeeCents:null, createdAt:'2026-10-01T00:00:00Z', address:null, listings:[], availability:[], unavailability:[]});
const tick = async () => {for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve));};

async function setup({verifiedCalendar = false, address = false} = {}) {
  const dom = new JSDOM(html, {url:'https://offline.test/host.html', runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window, calls = [], routes = new Map();
  let properties = [property('property-a', 'A'), property('property-b', 'B')];
  const calendarId='11111111-1111-4111-8111-111111111111';
  if(verifiedCalendar){
    properties[0].listings=[{id:'listing-a',url:'https://www.airbnb.com/rooms/123'}];
    routes.set('/properties/property-a/calendars',()=>({calendars:[{id:calendarId,provider:'Airbnb',mode:'Active',enabled:true,revision:1,status:'Connected'}]}));
    routes.set(`/calendars/${calendarId}/verification`,()=>({status:'Required',canStart:true,canCheck:false,minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'}));
  }
  routes.set('/auth/me', () => user());
  routes.set('/dashboard', () => ({profile:dashboardProfile(user()), properties:structuredClone(properties)}));
  routes.set('/geocode/countries', () => address ? [{code:'ES',name:'Spain'}] : []);
  w.AbortController = AbortController;
  w.confirm = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch = async (url, init = {}) => {
    const rawRoute=String(url).replace('/api/host','');
    const route=rawRoute.startsWith('/dashboard?')?'/dashboard':rawRoute.startsWith('/geocode/countries?')?'/geocode/countries':rawRoute;
    calls.push({route, method:init.method || 'GET', body:init.body && JSON.parse(init.body)});
    const handler = routes.get((init.method || 'GET') + ' ' + route) || routes.get(route);
    const result = handler ? await handler(init) : route.endsWith('/calendars') ? {calendars:[]} : undefined;
    if (result instanceof Response) return result;
    if (result === undefined) throw new Error('Unexpected offline route: ' + route);
    return new Response(JSON.stringify(result), {status:200, headers:{'Content-Type':'application/json'}});
  };
  w.ParrotCore = createCore(w);
  w.eval(fs.readFileSync(path.join(root, 'public/assets/host-address.js'), 'utf8'));
  if(verifiedCalendar)w.eval(fs.readFileSync(path.join(root, 'public/assets/calendar-verification.js'), 'utf8'));
  w.eval(source + '\nwindow.hostTest = {syncDashboard, renderProperties, getState:()=>state, getDirty:()=>unsavedHostChanges, getVerification:id=>hostVerificationViews.get(id), getEditor:form=>propertyAddressEditors.get(form), getDraft:hostDraft, getCreateEditor:()=>newPropertyAddress};');
  await tick();
  const choose=id=>{const select=w.document.getElementById('host-property-select');select.value=id;select.dispatchEvent(new w.Event('change'));};
  // Mount both keyed owners once, then return to A. Switching retains drafts.
  for(const id of ['property-a','property-b','property-a'])choose(id);
  await tick();
  const form = id => w.document.querySelector(`[data-property-id="${id}"] .host-property-settings form`);
  const edit = (node, value) => {node.value = value; node.dispatchEvent(new w.Event('input', {bubbles:true}));};
  const submit = node => node.dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  const saveProperty=value=>{properties=properties.map(p=>p.id===value.id?value:p);return new Response(null,{status:204});};
  return {w, calls, routes, form, edit, submit, choose, saveProperty, setProperties:next => {properties = next;}, close:() => dom.window.close()};
}

const houseAddress=number=>({type:'full',country:{code:'ES',name:'Spain'},locality:'Barcelona',localityNative:null,street:'Main Street',houseNumber:number});
const houseId=number=>number==='1'?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222';
async function useHouse(h,editor,number='1'){
  h.edit(editor.house,number);
  const language=h.w.document.documentElement.lang;
  h.routes.set('/geocode/houses/confirm?'+new URLSearchParams({language}),()=>[{confirmationId:houseId(number),address:houseAddress(number)}]);
  editor.find.click();await tick();
  assert.throws(()=>editor.getValue(),/Confirm|Подтвердите/,'Find cannot choose on behalf of the user');
  editor.node.querySelector('.host-house-use').click();
  assert.equal(editor.getValue(),houseId(number));
}
async function selectAddress(h, form) {
  const editor=form.id==='property-form'?h.w.hostTest.getCreateEditor():h.w.hostTest.getEditor(form);
  const city={selectionId:'city-a',address:{type:'city',country:{code:'ES',name:'Spain'},locality:'Barcelona',localityNative:null}};
  const street={selectionId:'street-a',address:{...city.address,type:'street',street:'Main Street'}};
  if(form.id!=='property-form')editor.change.click();editor.country.value='ES';editor.country.dispatchEvent(new h.w.Event('change',{bubbles:true}));
  h.routes.set('/geocode/cities?'+new URLSearchParams({q:'bar',language:'en',country:'ES'}),()=>[city]);
  h.edit(editor.city.input,'bar');await editor.city.search();editor.city.node.querySelector('[role=option]').click();
  h.routes.set('/geocode/streets?'+new URLSearchParams({q:'main',language:'en',city:'city-a'}),()=>[street]);
  h.edit(editor.street.input,'main');await editor.street.search();editor.street.node.querySelector('[role=option]').click();
  await useHouse(h,editor);
  return editor;
}
const propertyWrites=h=>h.calls.filter(c=>c.method==='PATCH' && c.route==='/properties/property-a');
function acknowledgeHouse(h,number='1'){
  h.routes.set('PATCH /properties/property-a',init=>{
    const payload=JSON.parse(init.body);
    assert.equal(payload.address===undefined || typeof payload.address==='string',true);
    return h.saveProperty({...h.w.hostTest.getState().properties.find(p=>p.id==='property-a'),...payload,address:houseAddress(number)});
  });
}

test('B empty 204 plus explicit current-state read retires submitted selection; title-only PATCH omits UUID',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form);acknowledgeHouse(h);
  h.submit(form);await tick();
  assert.deepEqual(propertyWrites(h)[0].body,{address:houseId('1')});
  assert.equal(form.dataset.hostOperation,'saved');assert.equal(h.w.hostTest.getDraft(form).addressDirty,false);
  const nodes=[editor.city.input,editor.street.input,editor.house];
  h.edit(form.elements.title,'Title only');h.submit(form);await tick();
  assert.deepEqual(propertyWrites(h)[1].body,{title:'Title only'});
  assert.deepEqual([editor.city.input,editor.street.input,editor.house],nodes);
  assert.equal(editor.house.value,'1');assert.equal(h.w.hostTest.getDirty(),false);
  assert.deepEqual(JSON.parse(JSON.stringify(h.w.hostTest.getState().properties[0].address)),houseAddress('1'));
});

test('B late address generation survives earlier 204 and must Find/Use again before explicit Save',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form),pending=deferred();
  h.routes.set('PATCH /properties/property-a',()=>pending.promise);
  h.submit(form);await tick();h.edit(editor.house,'2');h.edit(form.elements.title,'Later title');
  pending.resolve(h.saveProperty({...property('property-a','A'),address:houseAddress('1')}));await tick();
  assert.equal(editor.house.value,'2');assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);
  assert.equal(form.elements.title.value,'Later title');assert.equal(h.w.hostTest.getDirty(),true);
  h.submit(form);await tick();assert.equal(propertyWrites(h).length,1);
  await useHouse(h,editor,'2');acknowledgeHouse(h,'2');h.submit(form);await tick();
  assert.deepEqual(propertyWrites(h)[1].body,{title:'Later title',address:houseId('2')});
  h.edit(form.elements.title,'Third title');h.submit(form);await tick();
  assert.deepEqual(propertyWrites(h)[2].body,{title:'Third title'});
});

test('B later same-value address generation cannot be retired by an earlier ACK',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form),pending=deferred();
  h.routes.set('PATCH /properties/property-a',()=>pending.promise);h.submit(form);await tick();
  h.edit(editor.house,'2');h.edit(editor.house,'1');
  pending.resolve(h.saveProperty({...property('property-a','A'),address:houseAddress('1')}));await tick();
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);
  assert.throws(()=>editor.getValue(),/Confirm/);
  await useHouse(h,editor);acknowledgeHouse(h);h.submit(form);await tick();
  assert.deepEqual(propertyWrites(h)[1].body,{address:houseId('1')});
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,false);
});

test('B autofill mismatch cannot reuse a confirmation, including after an acknowledged save',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form);
  editor.house.value='2';h.submit(form);await tick();assert.equal(propertyWrites(h).length,0);
  await useHouse(h,editor,'2');acknowledgeHouse(h,'2');h.submit(form);await tick();
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,false);
  editor.change.click();editor.house.value='3';h.edit(form.elements.title,'Title with unselected address');
  h.submit(form);await tick();assert.equal(propertyWrites(h).length,1);
});

for(const outcome of ['invalid ACK','lost ACK','HTTP failure'])test('B '+outcome+' retains address; matching GET cannot prove lost mutation or replay it',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form);
  h.routes.set('PATCH /properties/property-a',()=>{
    if(outcome==='lost ACK')throw new TypeError('synthetic transport loss');
    if(outcome==='HTTP failure')return new Response('{"error":"Rejected"}',{status:400});
    return {...property('property-a','A'),id:'wrong-property'};
  });
  h.submit(form);await tick();
  assert.equal(form.dataset.hostOperation,outcome==='HTTP failure'?'failed':'unknown');
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);assert.equal(editor.house.value,'1');
  assert.equal(h.w.hostTest.getState().properties[0].address,null);
  h.setProperties([{...property('property-a','A'),address:houseAddress('1')}]);
  await h.w.hostTest.syncDashboard();h.w.document.querySelector('[data-host-lang="ru"]').click();await tick();
  assert.equal(propertyWrites(h).length,1);assert.equal(h.w.hostTest.getDirty(),true);
  if(outcome==='HTTP failure'){
    acknowledgeHouse(h);h.submit(form);await tick();assert.equal(propertyWrites(h).length,2);
    assert.equal(form.dataset.hostOperation,'saved');
  }else{
    editor.change.click();assert.equal(editor.house.value,'1');
    assert.equal(editor.node.querySelector('.host-house-cancel').hidden,true,'UNKNOWN cannot be discarded as though it rolled back the command');
    form.querySelector('.host-house-review').click();await tick();
    assert.equal(form.dataset.hostOperation,'unknown');
    assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);
    h.submit(form);await tick();assert.equal(propertyWrites(h).length,1);
    assert.equal(editor.house.value,'1');assert.match(form.querySelector('.host-form-error').textContent,/ответ|response/i);
  }
});

for(const outcome of ['lost response','malformed 201','wrong 204','empty 201'])test('B create '+outcome+' never infers a peer ID or repeats POST during current-state review',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.w.document.getElementById('property-form');
  const editor=await selectAddress(h,form);
  h.edit(form.elements.title,'New house');h.edit(form.elements.bedrooms,'1');h.edit(form.elements.sleeps,'2');
  h.routes.set('POST /properties',()=>{
    if(outcome==='lost response')throw new TypeError('lost create response');
    if(outcome==='malformed 201')return new Response('{"id":"untrusted-id"}',{status:201});
    return new Response(null,{status:outcome==='wrong 204'?204:201});
  });
  h.submit(form);await tick();
  const writes=()=>h.calls.filter(c=>c.method==='POST'&&c.route==='/properties');
  assert.equal(writes().length,1);assert.equal(writes()[0].body.address,houseId('1'));
  assert.deepEqual(Object.keys(writes()[0].body).sort(),['accommodationType','address','bedrooms','sleeps','title']);
  assert.equal(h.w.hostTest.getState().properties.length,2,'create ACK does not synthesize a property');
  if(outcome!=='empty 201'){
    assert.equal(form.dataset.hostOperation,'unknown');assert.equal(form.elements.title.value,'New house');assert.equal(editor.house.value,'1');
  }else{
    assert.equal(form.dataset.hostOperation,'saved');assert.equal(editor.house.value,'');
  }
  h.setProperties([...h.w.hostTest.getState().properties,property('peer-created','New house')]);
  form.querySelector('.host-house-review').click();await tick();
  assert.equal(h.w.document.getElementById('host-property-select').value,'property-a','matching peer item is not selected');
  assert.equal(writes().length,1);
  if(outcome!=='empty 201'){
    assert.equal(form.dataset.hostOperation,'unknown');assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);
    h.submit(form);await tick();assert.equal(writes().length,1);
  }
});

test('B pending create ACK cannot retire a newer raw address/title draft',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.w.document.getElementById('property-form');
  const editor=await selectAddress(h,form),pending=deferred();
  h.edit(form.elements.title,'Submitted house');h.edit(form.elements.bedrooms,'1');h.edit(form.elements.sleeps,'2');
  h.routes.set('POST /properties',()=>pending.promise);h.submit(form);await tick();
  h.edit(editor.house,'0042 B');h.edit(form.elements.title,'Newer house');
  pending.resolve(new Response(null,{status:201}));await tick();
  assert.equal(form.elements.title.value,'Newer house');assert.equal(editor.house.value,'0042 B');
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);assert.throws(()=>editor.getValue(),/Confirm/);
  assert.equal(h.calls.filter(c=>c.method==='POST'&&c.route==='/properties').length,1);
});

for(const failure of ['Find400','streets400'])test('B F1 '+failure+' drops cached contexts and requires explicit same-query city then street recovery',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  let editor=await selectAddress(h,form);acknowledgeHouse(h);h.submit(form);await tick();
  const saved=JSON.stringify(h.w.hostTest.getState().properties[0].address);
  const savedText=editor.node.querySelector('.host-address-saved p').textContent;
  const cityPath='/geocode/cities?'+new URLSearchParams({q:'bar',language:'en',country:'ES'});
  const streetPath='/geocode/streets?'+new URLSearchParams({q:'main',language:'en',city:'city-a'});
  const confirmPath='/geocode/houses/confirm?language=en';
  const reads=()=>h.calls.filter(c=>c.route===cityPath || c.route===streetPath);
  const initialReads=reads().length;
  assert.equal(initialReads,2,'both caches were primed by real GETs');
  editor=await selectAddress(h,form);
  assert.equal(reads().length,initialReads,'ordinary repeat selections still use the primed cache');
  const nodes=[editor.city.input,editor.street.input,editor.house];
  const oldCityOption=editor.city.node.querySelector('[role=option]');
  const oldUse=editor.node.querySelector('.host-house-use');
  h.edit(editor.house,'0042 B');h.edit(form.elements.title,'Keep this title');
  let cityContext=false,streetContext=false;
  const city={selectionId:'city-a',address:{type:'city',country:{code:'ES',name:'Spain'},locality:'Barcelona',localityNative:null}};
  const street={selectionId:'street-a',address:{...city.address,type:'street',street:'Main Street'}};
  const missing=message=>new Response(JSON.stringify({error:message,code:'INVALID_REQUEST'}),{status:400});
  h.routes.set(cityPath,()=>{cityContext=true;return [city];});
  h.routes.set(streetPath,()=>{
    if(!cityContext)return missing('select the city again');
    streetContext=true;return [street];
  });
  h.routes.set(confirmPath,init=>{
    assert.deepEqual(JSON.parse(init.body),{street:'street-a',number:'0042 B'});
    if(!streetContext)return missing('select the street again');
    return [{confirmationId:houseId('2'),address:houseAddress('0042 B')}];
  });
  const beforeFailure=h.calls.length,writesBefore=propertyWrites(h).length;
  if(failure==='Find400'){editor.find.click();await tick();}
  else{
    const path='/geocode/streets?'+new URLSearchParams({q:'main street',language:'en',city:'city-a'});
    h.routes.set(path,()=>missing('select the city again'));
    // Same selected label, but a previously unqueried path reaches the reset server.
    await editor.street.search();
  }
  assert.equal(h.calls.length,beforeFailure+1,'400 must not start an automatic parent lookup or retry');
  assert.equal(propertyWrites(h).length,writesBefore);
  assert.equal(JSON.stringify(h.w.hostTest.getState().properties[0].address),saved);
  assert.equal(editor.node.querySelector('.host-address-saved p').textContent,savedText);
  assert.deepEqual([editor.city.input,editor.street.input,editor.house],nodes);
  assert.equal(editor.city.input.value,'Barcelona');assert.equal(editor.street.input.value,'Main Street');
  assert.equal(editor.house.value,'0042 B');assert.equal(form.elements.title.value,'Keep this title');
  assert.equal(editor.street.input.disabled,true);assert.equal(editor.find.disabled,true);
  assert.equal(editor.node.querySelectorAll('.host-house-use').length,0);
  assert.equal(form.querySelector('button[type=submit]').disabled,true);
  oldCityOption.click();oldUse.click();
  assert.throws(()=>editor.getValue(),/city/i,'old option and confirmation cannot restore trust');
  const atRest=h.calls.length;
  editor.city.input.focus();editor.street.input.focus();await editor.street.search();
  assert.equal(h.calls.length,atRest,'focus and child search without a fresh parent issue no requests');
  h.submit(form);await tick();
  assert.equal(propertyWrites(h).length,writesBefore);assert.notEqual(form.dataset.hostOperation,'saved');
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,true);

  h.edit(editor.city.input,'bar');await editor.city.search();
  assert.deepEqual(h.calls.slice(atRest).map(c=>[c.method,c.route]),[['GET',cityPath]],'same city query must reach server');
  editor.city.node.querySelector('[role=option]').click();
  assert.equal(editor.street.input.value,'Main Street');assert.equal(editor.house.value,'0042 B');
  assert.equal(editor.find.disabled,true,'raw street text is not a fresh street selection');
  h.edit(editor.street.input,'main');await editor.street.search();
  editor.street.node.querySelector('[role=option]').click();
  assert.deepEqual(h.calls.slice(atRest).map(c=>[c.method,c.route]),[['GET',cityPath],['GET',streetPath]],'same-query recovery is parent before child');
  assert.equal(editor.house.value,'0042 B');assert.equal(editor.find.disabled,false);
  assert.throws(()=>editor.getValue(),/Confirm/i,'fresh lookups alone do not confirm the house');
  editor.find.click();await tick();
  assert.deepEqual(h.calls.slice(atRest).map(c=>[c.method,c.route]),[['GET',cityPath],['GET',streetPath],['POST',confirmPath]]);
  assert.throws(()=>editor.getValue(),/Confirm/i,'Find does not choose the returned candidate');
  editor.node.querySelector('.host-house-use').click();assert.equal(editor.getValue(),houseId('2'));
  assert.equal(propertyWrites(h).length,writesBefore,'recovery and Use never mutate the property');
  acknowledgeHouse(h,'0042 B');h.submit(form);await tick();
  assert.equal(propertyWrites(h).length,writesBefore+1);
  assert.deepEqual(propertyWrites(h).at(-1).body,{title:'Keep this title',address:houseId('2')});
  assert.equal(form.dataset.hostOperation,'saved');
  assert.equal(h.w.hostTest.getDraft(form).addressDirty,false);
  editor.change.click();h.edit(editor.city.input,'another city');editor.city.cancel();
  assert.equal(editor.street.input.value,'');assert.equal(editor.house.value,'','normal parent edits still clear downstream raw fields');
});

test('B actor switch fences pending house lookup and clears selected confirmation/cache',async t=>{
  const h=await setup({address:true});t.after(h.close);const form=h.form('property-a');
  const editor=await selectAddress(h,form),pending=deferred();
  h.routes.set('/geocode/houses/confirm?language=en',()=>pending.promise);
  editor.find.click();await tick();
  h.setProperties([property('property-c','New owner house')]);
  h.routes.set('/dashboard',()=>({profile:dashboardProfile(user('account-b')),properties:[property('property-c','New owner house')]}));
  h.w.ParrotCore.session.setUser(user('account-b'));await tick();
  pending.resolve([{confirmationId:houseId('1'),address:houseAddress('1')}]);await tick();
  assert.equal(h.form('property-a'),null);assert.equal(editor.node.querySelectorAll('.host-house-use').length,0);
  assert.equal(h.w.hostTest.getCreateEditor().house.value,'');
  assert.equal(h.w.document.body.textContent.includes('Main Street'),false);
});

test('real Host keeps B draft/focus and the common editor link across save A, refresh and language', async t => {
  const h = await setup(); t.after(h.close);
  h.choose('property-b');
  const a = h.form('property-a'), b = h.form('property-b'), input = b.elements.title;
  const profile = h.w.document.getElementById('host-profile-editor');
  assert.equal(h.w.document.getElementById('host-profile-form'),null);assert.equal(profile.getAttribute('href'),'/my-profile.html');
  h.edit(input, 'B draft'); input.focus(); input.setSelectionRange(2, 5);
  h.routes.set('PATCH /properties/property-a', init => h.saveProperty({...property('property-a', 'Saved A'), ...JSON.parse(init.body)}));
  h.edit(a.elements.title, 'Saved A'); h.submit(a); await tick();
  assert.equal(h.form('property-b'), b); assert.equal(input.value, 'B draft'); assert.equal(h.w.document.getElementById('host-profile-editor'),profile);
  await h.w.hostTest.syncDashboard();
  h.w.document.querySelector('[data-host-lang="ru"]').click(); await tick();
  assert.equal(h.form('property-b'), b); assert.equal(b.elements.title, input);
  assert.equal(input.value, 'B draft'); assert.equal(h.w.document.getElementById('host-profile-editor'),profile);
  assert.equal(h.w.document.activeElement, input); assert.equal(input.selectionStart, 2); assert.equal(input.selectionEnd, 5);
  assert.equal(h.w.hostTest.getDirty(), true);
  assert.match(b.querySelector('.host-property-title-field span').textContent, /./);
});

test('502 refresh retains known cards and dirty property fields with one common profile editor', async t => {
  const h = await setup(); t.after(h.close);
  const b = h.form('property-b'); h.edit(b.elements.title, 'Keep B');
  const p = h.w.document.getElementById('host-profile-editor');
  h.routes.set('/dashboard', () => new Response('{"error":"Unavailable"}', {status:502}));
  await h.w.hostTest.syncDashboard();
  assert.equal(h.form('property-b'), b); assert.equal(b.elements.title.value, 'Keep B'); assert.equal(h.w.document.getElementById('host-profile-editor'),p);
  assert.equal(h.w.hostTest.getState().properties.length, 2);
});

test('older property save completion updates baseline but cannot clear later input', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PATCH /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Submitted'); h.submit(a); await tick();
  h.edit(a.elements.title, 'Later input');
  pending.resolve(h.saveProperty(property('property-a', 'Submitted'))); await tick();
  assert.equal(h.form('property-a'), a); assert.equal(a.elements.title.value, 'Later input');
  assert.equal(h.w.hostTest.getState().properties[0].title, 'Submitted'); assert.equal(h.w.hostTest.getDirty(), true);
});

test('same-account profile notification preserves housing draft and cannot revive a Host profile writer', async t => {
  const h=await setup();t.after(h.close);
  const form=h.form('property-a'),link=h.w.document.getElementById('host-profile-editor');
  h.edit(form.elements.title,'Keep housing draft');
  h.w.ParrotCore.session.updateProfile({displayName:'Other notification'});await tick();
  assert.equal(h.form('property-a'),form);assert.equal(form.elements.title.value,'Keep housing draft');
  assert.equal(h.w.document.getElementById('host-profile-editor'),link);
  assert.equal(h.w.document.getElementById('host-profile-form'),null);
  assert.equal(h.calls.some(c=>c.route==='/profile'),false);
});

test('identity change clears private drafts and stale save cannot alter the new account', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PATCH /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Private old input'); h.submit(a); await tick();
  h.setProperties([property('property-c', 'New account property')]);
  h.routes.set('/dashboard', () => ({profile:dashboardProfile(user('account-b', 'New owner')), properties:[property('property-c', 'New account property')]}));
  h.w.ParrotCore.session.setUser(user('account-b', 'New owner')); await tick();
  pending.resolve(new Response(null,{status:204})); await tick();
  assert.equal(h.form('property-a'), null); assert.equal(h.w.document.body.textContent.includes('Private old input'), false);
  assert.equal(h.w.document.getElementById('host-profile-form'),null);
  assert.equal(h.w.hostTest.getState().profile.displayName,'New owner');
  assert.equal(h.w.hostTest.getState().properties[0].id, 'property-c');
});

test('unknown period create keeps draft and is never automatically resent by refresh/relabel', async t => {
  const h = await setup(); t.after(h.close);
  const form = h.w.document.querySelector('[data-property-id="property-a"] .host-dates');
  h.edit(form.elements.from, '2026-11-10'); h.edit(form.elements.to, '2026-11-12');
  h.routes.set('POST /properties/property-a/availability', () => {throw new TypeError('offline after dispatch');});
  h.submit(form); await tick(); await h.w.hostTest.syncDashboard();
  h.w.document.querySelector('[data-host-lang="es"]').click(); await tick();
  assert.equal(h.w.document.querySelector('[data-property-id="property-a"] .host-dates'), form);
  assert.equal(form.elements.from.value, '2026-11-10'); assert.equal(form.elements.to.value, '2026-11-12');
  assert.equal(h.calls.filter(c => c.route === '/properties/property-a/availability' && c.method === 'POST').length, 1);
});

test('settings and stay writes serialize per property, retain sibling drafts and send only dirty PATCH fields', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  const stay = h.w.document.querySelector('[data-property-id="property-a"] .host-stay-settings');
  h.routes.set('PATCH /properties/property-a', () => pending.promise);
  h.edit(stay.elements.minStayDays, '7'); h.edit(stay.elements.cleaningFee, '');
  h.edit(a.elements.title, 'Saved settings'); h.submit(a); await tick(); h.submit(stay); await tick();
  const writes = h.calls.filter(c => c.route === '/properties/property-a' && c.method === 'PATCH');
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].body, {title:'Saved settings'});
  pending.resolve(h.saveProperty(property('property-a', 'Saved settings'))); await tick();
  assert.equal(stay.elements.minStayDays.value, '7'); assert.equal(stay.elements.cleaningFee.value, '');
});

test('PM144 property PATCH captures only dirty fields, preserves title whitespace and clears only an edited fee', async t => {
  const h=await setup();t.after(h.close);
  const form=h.form('property-a');
  let server=property('property-a','A');
  h.routes.set('PATCH /properties/property-a',init=>{
    server={...server,...JSON.parse(init.body)};h.setProperties([server,property('property-b','B')]);return new Response(null,{status:204});
  });
  h.edit(form.elements.title,'  Exact title 🏠  ');h.submit(form);await tick();
  const first=h.calls.filter(c=>c.method==='PATCH' && c.route==='/properties/property-a');
  assert.equal(first.length,1);assert.deepEqual(first[0].body,{title:'  Exact title 🏠  '});
  assert.equal(h.w.hostTest.getState().properties[0].title,'  Exact title 🏠  ');
  const stay=h.w.document.querySelector('[data-property-id="property-a"] .host-stay-settings');
  h.edit(stay.elements.cleaningFee,'7.50');h.submit(stay);await tick();
  assert.deepEqual(h.calls.filter(c=>c.method==='PATCH').at(-1).body,{cleaningFeeCents:750});
  h.edit(stay.elements.cleaningFee,'');h.submit(stay);await tick();
  assert.deepEqual(h.calls.filter(c=>c.method==='PATCH').at(-1).body,{cleaningFeeCents:null});
  assert.equal(h.calls.some(c=>c.method==='PUT' && c.route==='/properties/property-a'),false);
});

for(const [name,mutate] of [
  ['wrong identity',v=>({...v,id:'property-b'})],['missing required field',v=>{delete v.bedrooms;return v;}],
  ['missing fee',v=>{delete v.cleaningFeeCents;return v;}],['invalid fee',v=>({...v,cleaningFeeCents:-1})],
  ['invalid accommodation',v=>({...v,accommodationType:'invented'})],['missing address',v=>{delete v.address;return v;}],
  ['partial address',v=>({...v,address:{address:'incomplete'}})],
  ['invalid timestamp',v=>({...v,createdAt:'not-a-date'})]
])test(`PM144 ${name} property GET after empty ACK retains the draft, baseline and unknown outcome without retry`,async t=>{
  const h=await setup();t.after(h.close);const form=h.form('property-a');
  h.routes.set('PATCH /properties/property-a',()=>new Response(null,{status:204}));
  h.routes.set('/dashboard',()=>({properties:[mutate(property('property-a','Submitted'))]}));
  h.edit(form.elements.title,'Submitted');h.submit(form);await tick();
  assert.equal(h.w.hostTest.getState().properties[0].title,'A');
  assert.equal(form.elements.title.value,'Submitted');assert.equal(form.dataset.hostOperation,'unknown');
  assert.equal(h.w.hostTest.getDirty(),true);assert.equal(h.calls.filter(c=>c.method==='PATCH').length,1);
});

for(const [name,mutate] of [
  ['wrong period identity',v=>({...v,id:'period-other'})],['wrong property',v=>({...v,propertyId:'property-b'})],
  ['flat legacy ACK',v=>({...v,period:undefined,from:'2026-11-10',to:'2026-11-13'})],
  ['zero range',v=>({...v,period:{from:'2026-11-10',to:'2026-11-10'}})],
  ['invalid date',v=>({...v,period:{from:'2026-02-30',to:'2026-03-04'}})],
  ['missing price',v=>{delete v.nightlyPriceCents;return v;}],['invalid price',v=>({...v,nightlyPriceCents:0})]
])test(`PM144 ${name} availability ACK cannot replace the saved row or clear a draft`,async t=>{
  const h=await setup();t.after(h.close);
  h.setProperties([{...property('property-a','A'),availability:[{id:'period-a',propertyId:'property-a',period:{from:'2026-11-10',to:'2026-11-13'},createdAt:'2026-10-01T00:00:00Z',nightlyPriceCents:null}]}]);
  await h.w.hostTest.syncDashboard();const form=h.w.document.querySelector('.host-period');
  h.routes.set('PUT /availability/period-a',()=>mutate({id:'period-a',propertyId:'property-a',
    period:{from:'2026-11-11',to:'2026-11-13'},nightlyPriceCents:null,createdAt:'2026-10-01T00:00:00Z'}));
  h.edit(form.elements.from,'2026-11-11');h.submit(form);await tick();
  assert.equal(form.dataset.hostOperation,'unknown');assert.equal(form.elements.from.value,'2026-11-11');
  assert.equal(h.w.hostTest.getState().properties[0].availability[0].from,'2026-11-10');
  assert.equal(h.calls.filter(c=>c.route==='/availability/period-a').length,1);
});

test('period empty204 followed by502 stays unconfirmed and retains known periods and later draft', async t => {
  const h = await setup(); t.after(h.close);
  h.setProperties([{...property('property-a', 'A'), availability:[{id:'period-a',propertyId:'property-a',period:{from:'2026-11-10',to:'2026-11-13'},createdAt:'2026-10-01T00:00:00Z',nightlyPriceCents:10000}]}]);
  await h.w.hostTest.syncDashboard();
  const form = h.w.document.querySelector('.host-availability-panel .host-period'), pending = deferred();
  h.routes.set('PUT /availability/period-a', () => pending.promise);
  h.routes.set('/properties/property-a/availability', () => new Response('{"error":"refresh failed"}', {status:502}));
  h.edit(form.elements.from, '2026-11-11'); h.submit(form); await tick();
  h.edit(form.elements.nightlyPrice, '175'); pending.resolve(new Response(null,{status:204})); await tick();
  assert.equal(h.w.document.querySelector('.host-availability-panel .host-period'), form);
  assert.equal(form.elements.from.value, '2026-11-11'); assert.equal(form.elements.to.value, '2026-11-12');
  assert.equal(form.elements.nightlyPrice.value, '175'); assert.equal(form.dataset.hostOperation, 'unknown');
  assert.equal(form.dataset.state,'error');assert.equal(h.w.hostTest.getDraft(form).editor.verifyOnly,true);
  assert.equal(h.w.hostTest.getState().properties[0].availability[0].to, '2026-11-13');
  assert.match(form.querySelector('.host-form-error').textContent, /refresh failed/);
});

test('same-account removed resource ignores an earlier write even when an id is subsequently reused', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PATCH /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Old pending'); h.submit(a); await tick();
  h.setProperties([]); await h.w.hostTest.syncDashboard();
  h.setProperties([property('property-a', 'Recreated')]); await h.w.hostTest.syncDashboard();
  pending.resolve(new Response(null,{status:204})); await tick();
  assert.equal(h.w.hostTest.getState().properties[0].title, 'Recreated');
  assert.equal(h.w.document.getElementById('host-status').textContent.includes('saved'), false);
});

test('workspace switching keeps all dirty field nodes and does not ask to discard them', async t => {
  const h=await setup();t.after(h.close);h.choose('property-b');
  const form=h.form('property-b');h.edit(form.elements.title,'Keep on switch');
  let confirmations=0;h.w.confirm=()=>{confirmations++;return false;};
  const card=h.w.document.querySelector('[data-property-id="property-b"]');
  h.choose('property-a');assert.equal(card.hidden,true);h.choose('property-b');
  assert.equal(card.hidden,false);assert.equal(confirmations,0);
  assert.equal(h.form('property-b'),form);assert.equal(form.elements.title.value,'Keep on switch');
});

test('calendar snapshot502 retains known command data without fabricating a new revision', async t => {
  const h = await setup(); t.after(h.close);
  const id = '11111111-1111-4111-8111-111111111111';
  const calendar = {id, provider:'Airbnb', enabled:true, mode:'Active', revision:3, status:'Connected'};
  h.routes.set('/properties/property-a/calendars', () => ({calendars:[calendar]}));
  await h.w.hostTest.syncDashboard();
  assert.equal(h.w.hostTest.getState().properties[0].calendars[0].revision, 3);
  assert.equal(h.w.hostTest.getState().properties[0].calendarReadError, false);
  h.routes.set('/properties/property-a/calendars', () => new Response('{"error":"calendar unavailable"}', {status:502}));
  await h.w.hostTest.syncDashboard();
  assert.equal(h.w.hostTest.getState().properties[0].calendars[0].revision, 3);
  assert.match(h.w.document.getElementById('host-status').textContent, /calendar unavailable/);
});

test('actual Host relabel keeps the verification controller/date nodes and issues no extra status request',async t=>{
  const h=await setup({verifiedCalendar:true});t.after(h.close);
  const panel=h.w.document.querySelector('.calendar-verification'),from=panel.querySelectorAll('input')[0],to=panel.querySelectorAll('input')[1];
  h.edit(from,'2026-11-10');h.edit(to,'2026-11-12');from.focus();
  const before=h.calls.filter(c=>c.route.endsWith('/verification')).length;
  assert.equal(before,1);
  const button=h.w.document.querySelector('[data-host-lang="ru"]');
  button.dispatchEvent(new h.w.MouseEvent('pointerdown',{bubbles:true}));button.focus();button.click();await tick();
  assert.equal(h.w.document.querySelector('.calendar-verification'),panel);
  assert.equal(panel.querySelectorAll('input')[0],from);assert.equal(from.value,'2026-11-10');assert.equal(to.value,'2026-11-12');
  assert.equal(h.w.document.activeElement,from);
  assert.match(h.w.document.querySelector('.host-calendar-sync h3').textContent,/Календарь Airbnb/);
  assert.equal(h.calls.filter(c=>c.route.endsWith('/verification')).length,before);
});

test('dashboard read started before an acknowledged write cannot roll back that write',async t=>{
  const h=await setup();t.after(h.close);
  const pending=deferred();h.routes.set('/dashboard',()=>pending.promise);
  const refresh=h.w.hostTest.syncDashboard();await tick();
  h.routes.set('PATCH /properties/property-a',()=>h.saveProperty(property('property-a','Acknowledged')));
  h.routes.set('/dashboard',()=>({properties:[property('property-a','Acknowledged'),property('property-b','B')]}));
  const form=h.form('property-a');h.edit(form.elements.title,'Acknowledged');h.submit(form);await tick();
  pending.resolve({profile:dashboardProfile(user()),properties:[property('property-a','Old read'),property('property-b','B')]});
  await refresh;
  assert.equal(h.w.hostTest.getState().properties[0].title,'Acknowledged');assert.equal(form.elements.title.value,'Acknowledged');
});

test('server reordering keeps keyed cards/fields, focus and selection',async t=>{
  const h=await setup();t.after(h.close);
  const form=h.form('property-b'),input=form.elements.title;
  h.edit(input,'B draft');input.focus();input.setSelectionRange(1,4);
  h.setProperties([property('property-b','New B baseline'),property('property-a','A')]);
  await h.w.hostTest.syncDashboard();
  assert.equal(h.w.document.getElementById('host-properties').firstElementChild.dataset.propertyId,'property-b');
  assert.equal(h.form('property-b'),form);assert.equal(input.value,'B draft');assert.equal(h.w.document.activeElement,input);
  assert.equal(input.selectionStart,1);assert.equal(input.selectionEnd,4);
});

test('listing removed during a visibility write ignores its late response and updates clean checkbox baselines',async t=>{
  const h=await setup();t.after(h.close);
  const withListing=visible=>({...property('property-a','A'),listings:[{id:'listing-a',url:'https://www.airbnb.com/rooms/123',showInSearch:visible}]});
  h.setProperties([withListing(true)]);await h.w.hostTest.syncDashboard();
  const checkbox=h.w.document.querySelector('.host-listing-visibility input');
  h.setProperties([withListing(false)]);await h.w.hostTest.syncDashboard();assert.equal(checkbox.checked,false);
  const pending=deferred();h.routes.set('PUT /listings/listing-a',()=>pending.promise);
  checkbox.checked=true;checkbox.dispatchEvent(new h.w.Event('change',{bubbles:true}));await tick();
  h.setProperties([property('property-a','A')]);await h.w.hostTest.syncDashboard();
  pending.resolve(new Response(null,{status:204}));await tick();
  assert.equal(h.w.hostTest.getState().properties[0].listing,null);
  assert.equal(h.w.document.querySelector('.host-listing-visibility'),null);
  assert.equal(h.w.document.getElementById('host-status').textContent.includes('saved'),false);
});

test('F1: Disable and Enable retain the real verification island, controller and dates with usable Start',async t=>{
  const h=await setup({verifiedCalendar:true});t.after(h.close);
  const id='11111111-1111-4111-8111-111111111111';
  const controller=h.w.hostTest.getVerification(id),panel=controller.node;
  const inputs=[...panel.querySelectorAll('input')],start=panel.querySelector('button');
  let enabled=true,revision=1,disposed=0;
  const dispose=controller.dispose;controller.dispose=()=>{disposed++;dispose();};
  h.edit(inputs[0],'2026-11-10');h.edit(inputs[1],'2026-11-12');
  h.routes.set('/properties/property-a/calendars',()=>({calendars:[{id,provider:'Airbnb',mode:enabled?'Active':'Disabled',enabled,revision,status:'Connected'}]}));
  h.routes.set('PUT /calendars/'+id,()=>{enabled=false;revision++;return new Response(null,{status:204});});
  h.routes.set('POST /calendars/'+id+'/activate',()=>{enabled=true;revision++;return new Response(null,{status:204});});
  const toggle=()=>h.w.document.querySelectorAll('.host-calendar-control-group button')[1];
  toggle().click();await tick();
  assert.equal(h.w.document.querySelector('.calendar-verification'),panel);
  assert.equal(panel.isConnected,true);assert.equal(start.hidden,true);
  assert.equal(panel.querySelector('.calendar-verification-dates').hidden,true);
  toggle().click();await tick();
  assert.equal(h.w.document.querySelector('.calendar-verification'),panel);
  assert.equal(panel.isConnected,true);assert.equal(h.w.hostTest.getVerification(id),controller);
  assert.deepEqual([...panel.querySelectorAll('input')],inputs);
  assert.equal(inputs[0].value,'2026-11-10');assert.equal(inputs[1].value,'2026-11-12');
  assert.equal(panel.querySelector('.calendar-verification-dates').hidden,false);
  assert.equal(start.hidden,false);assert.equal(start.disabled,false);assert.equal(disposed,0);
  assert.equal(h.calls.filter(c=>c.route.endsWith('/verification')).length,1);
  h.routes.set('POST /calendars/'+id+'/verification/start',()=>({status:'Pending',baselineReady:false,canCheck:false}));
  start.click();await tick();
  assert.deepEqual(h.calls.filter(c=>c.method!=='GET'&&c.route.includes('/calendars/')).map(({route,method,body})=>({route,method,body})),[
    {route:'/calendars/'+id,method:'PUT',body:{mode:'Disabled',expectedRevision:1}},
    {route:'/calendars/'+id+'/activate',method:'POST',body:{expectedRevision:2}},
    {route:'/calendars/'+id+'/verification/start',method:'POST',body:{from:'2026-11-10',to:'2026-11-13'}}
  ]);
});

test('F2: calendar replacement binds current actions to B revisions and rejects detached A and B controls',async t=>{
  const h=await setup({verifiedCalendar:true});t.after(h.close);
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  const oldActions=[...h.w.document.querySelectorAll('.host-calendar-actions button')];
  let enabled=true,revision=2,removed=false;
  h.routes.set('/properties/property-a/calendars',()=>({calendars:removed?[]:[{id:b,provider:'Airbnb',mode:enabled?'Active':'Disabled',enabled,revision,status:'Connected'}]}));
  h.routes.set('/calendars/'+b+'/verification',()=>({status:'Required',canStart:true,canCheck:false,minSelectableDate:'2026-11-01',maxSelectableDate:'2027-04-01'}));
  h.routes.set('POST /calendars/'+b+'/sync',()=>{revision++;return new Response(null,{status:204});});
  h.routes.set('PUT /calendars/'+b,()=>{enabled=false;revision++;return new Response(null,{status:204});});
  h.routes.set('POST /calendars/'+b+'/activate',()=>{enabled=true;revision++;return new Response(null,{status:204});});
  h.routes.set('DELETE /calendars/'+b,()=>{removed=true;return new Response(null,{status:204});});
  await h.w.hostTest.syncDashboard();await tick();
  const current=()=>[...h.w.document.querySelectorAll('.host-calendar-actions button')];
  assert.equal(h.w.hostTest.getState().properties[0].calendars[0].id,b);
  assert.equal(h.w.hostTest.getVerification(a),undefined);
  assert.equal(current().every(button=>!oldActions.includes(button)),true);
  let confirmations=0;h.w.confirm=()=>{confirmations++;return true;};
  const status=h.w.document.getElementById('host-status').textContent;
  for(const button of oldActions)button.click();await tick();
  assert.equal(confirmations,0);assert.equal(h.w.document.getElementById('host-status').textContent,status);
  assert.equal(h.calls.filter(c=>c.method!=='GET'&&c.route.includes('/calendars/')).length,0);
  current()[0].click();await tick();
  current()[1].click();await tick();
  current()[1].click();await tick();
  const removedActions=current();current()[2].click();await tick();
  const afterDelete=h.w.document.getElementById('host-status').textContent;
  for(const button of [...oldActions,...removedActions])button.click();await tick();
  assert.equal(confirmations,1);assert.equal(h.w.document.getElementById('host-status').textContent,afterDelete);
  assert.deepEqual(h.calls.filter(c=>c.method!=='GET'&&c.route.includes('/calendars/')).map(({route,method,body})=>({route,method,body})),[
    {route:'/calendars/'+b+'/sync',method:'POST',body:{expectedRevision:2}},
    {route:'/calendars/'+b,method:'PUT',body:{mode:'Disabled',expectedRevision:3}},
    {route:'/calendars/'+b+'/activate',method:'POST',body:{expectedRevision:4}},
    {route:'/calendars/'+b,method:'DELETE',body:{expectedRevision:5}}
  ]);
});

test('F2: detached actions cannot command a calendar that still exists in the current snapshot',async t=>{
  const h=await setup({verifiedCalendar:true});t.after(h.close);
  const actions=h.w.document.querySelector('.host-calendar-actions'),buttons=[...actions.querySelectorAll('button')];
  actions.remove();
  let confirmations=0;h.w.confirm=()=>{confirmations++;return true;};
  const status=h.w.document.getElementById('host-status').textContent;
  for(const button of buttons)button.click();await tick();
  assert.equal(h.w.hostTest.getState().properties[0].calendars.length,1);
  assert.equal(confirmations,0);assert.equal(h.w.document.getElementById('host-status').textContent,status);
  assert.equal(h.calls.filter(c=>c.method!=='GET'&&c.route.includes('/calendars/')).length,0);
});


test('A property empty204 is followed by one canonical GET; failed read retains draft and explicit retry is GET-only',async t=>{
  const h=await setup();t.after(h.close);const form=h.form('property-a');let reads=0,fail=true;
  h.routes.set('PATCH /properties/property-a',()=>h.saveProperty(property('property-a','Current title')));
  h.routes.set('/dashboard',()=>{reads++;return fail?new Response('{"error":"read unavailable"}',{status:502}):{properties:[property('property-a','Current title')]};});
  h.edit(form.elements.title,'Current title');h.submit(form);await tick();
  assert.equal(reads,1);assert.equal(form.dataset.hostOperation,'unknown');assert.equal(form.elements.title.value,'Current title');
  assert.equal(propertyWrites(h).length,1);assert.equal(h.w.hostTest.getState().properties[0].title,'A');
  fail=false;h.submit(form);await tick();assert.equal(reads,2);assert.equal(propertyWrites(h).length,1);
  assert.equal(form.dataset.hostOperation,'saved');assert.equal(h.w.hostTest.getState().properties[0].title,'Current title');
});
test('A obsolete JSON command ACK remains a protocol error; an explicit current-state read cannot resend it',async t=>{
  const h=await setup();t.after(h.close);const form=h.form('property-a');
  h.routes.set('PATCH /properties/property-a',()=>property('property-a','Submitted'));
  h.edit(form.elements.title,'Submitted');h.submit(form);await tick();
  assert.equal(form.dataset.hostOperation,'unknown');assert.equal(propertyWrites(h).length,1);
  h.submit(form);await tick();assert.equal(propertyWrites(h).length,1);assert.equal(form.dataset.hostOperation,'unknown');
});
test('A listing ACK cannot be treated as state; failed GET404 keeps the next action read-only',async t=>{
  const h=await setup();t.after(h.close);let visible=false,reads=0;
  const saved=()=>({...property('property-a','A'),listings:[{id:'listing-a',url:'https://www.airbnb.com/rooms/123',showInSearch:visible}]});
  h.setProperties([saved()]);await h.w.hostTest.syncDashboard();
  const checkbox=h.w.document.querySelector('.host-listing-visibility input');
  h.routes.set('PUT /listings/listing-a',()=>{visible=true;return new Response(null,{status:204});});
  h.routes.set('/dashboard',()=>{reads++;return new Response('{"error":"not found"}',{status:404});});
  checkbox.checked=true;checkbox.dispatchEvent(new h.w.Event('change',{bubbles:true}));await tick();
  assert.equal(reads,1);assert.equal(h.w.hostTest.getState().properties[0].listing.showInSearch,false);
  h.routes.set('/dashboard',()=>{reads++;return {properties:[saved()]};});
  checkbox.dispatchEvent(new h.w.Event('change',{bubbles:true}));await tick();
  assert.equal(reads,2);assert.equal(h.calls.filter(c=>c.method==='PUT'&&c.route==='/listings/listing-a').length,1);
  assert.equal(h.w.hostTest.getState().properties[0].listing.showInSearch,true);
});
// House-only B adapts the original R1 address scenarios to published typed DTOs.
// This source packet claims no executable PASS; the A cases remain intact.


test('A lost period creation cannot be resent or attributed to a row merely matching its dates',async t=>{
  const h=await setup();t.after(h.close);const form=h.w.document.querySelector('[data-property-id="property-a"] .host-dates');
  h.edit(form.elements.from,'2026-11-10');h.edit(form.elements.to,'2026-11-12');
  h.routes.set('POST /properties/property-a/availability',()=>{throw new TypeError('lost create ACK');});
  h.routes.set('/properties/property-a/availability',()=>[{id:'peer-created',propertyId:'property-a',period:{from:'2026-11-10',to:'2026-11-13'},nightlyPriceCents:null,createdAt:'2026-10-01T00:00:00Z'}]);
  h.submit(form);await tick();h.submit(form);await tick();
  assert.equal(h.calls.filter(c=>c.method==='POST'&&c.route==='/properties/property-a/availability').length,1);
  assert.equal(h.calls.filter(c=>c.method==='GET'&&c.route==='/properties/property-a/availability').length,1);
  assert.equal(form.dataset.hostOperation,'unknown');assert.equal(form.elements.from.value,'2026-11-10');assert.equal(h.w.hostTest.getDirty(),true);
});

test('A lost known-ID unavailability edit checks canonical nested row without repeating its direct-body PUT',async t=>{
  const h=await setup();t.after(h.close);
  const block={id:'block-a',propertyId:'property-a',period:{from:'2026-11-10',to:'2026-11-13'},createdAt:'2026-10-01T00:00:00Z'};
  h.setProperties([{...property('property-a','A'),unavailability:[block]}]);await h.w.hostTest.syncDashboard();
  const form=h.w.document.querySelector('.host-unavailability-period');
  h.routes.set('PUT /unavailability/block-a',()=>{throw new TypeError('lost edit ACK');});
  h.routes.set('/properties/property-a/unavailability',()=>[{...block,period:{from:'2026-11-11',to:'2026-11-13'}}]);
  h.edit(form.elements.from,'2026-11-11');h.submit(form);await tick();
  assert.equal(form.dataset.hostOperation,'unknown');h.submit(form);await tick();
  const writes=h.calls.filter(c=>c.method==='PUT'&&c.route==='/unavailability/block-a');
  assert.equal(writes.length,1);assert.deepEqual(writes[0].body,{from:'2026-11-11',to:'2026-11-13'});
  assert.equal(h.w.hostTest.getState().properties[0].unavailability[0].from,'2026-11-11');
  assert.equal(form.dataset.hostOperation,'saved');
});
