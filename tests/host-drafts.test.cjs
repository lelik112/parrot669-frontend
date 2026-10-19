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
const user = (id = 'account-a', name = 'Owner') => ({accountId:id, email:'owner@example.test', username:'owner', profile:{id:'profile-' + id, displayName:name}});
const property = (id, title) => ({id, title, city:'Barcelona', country:'Spain', countryCode:'ES', accommodationType:'entire_place', bedrooms:2, sleeps:4, minStayDays:1, cleaningFeeCents:null, listings:[], availability:[], unavailability:[]});
const tick = async () => {for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve));};

async function setup({verifiedCalendar = false} = {}) {
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
  routes.set('/dashboard', () => ({profile:user().profile, properties:structuredClone(properties)}));
  routes.set('/geocode/countries', () => []);
  w.AbortController = AbortController;
  w.confirm = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch = async (url, init = {}) => {
    const route = String(url).replace('/api/host', '');
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
  w.eval(source + '\nwindow.hostTest = {syncDashboard, renderProperties, getState:()=>state, getDirty:()=>unsavedHostChanges};');
  await tick();
  for (const toggle of [...w.document.querySelectorAll('.host-property-toggle')]) toggle.click();
  await tick();
  const form = id => w.document.querySelector(`[data-property-id="${id}"] .host-property-settings form`);
  const edit = (node, value) => {node.value = value; node.dispatchEvent(new w.Event('input', {bubbles:true}));};
  const submit = node => node.dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  return {w, calls, routes, form, edit, submit, setProperties:next => {properties = next;}, close:() => dom.window.close()};
}

test('real Host keeps B and profile nodes, values, focus/caret and dirty state across save A, refresh and language', async t => {
  const h = await setup(); t.after(h.close);
  const a = h.form('property-a'), b = h.form('property-b'), input = b.elements.title;
  const profile = h.w.document.getElementById('host-profile-form').elements.displayName;
  h.edit(input, 'B draft'); h.edit(profile, 'Profile draft'); input.focus(); input.setSelectionRange(2, 5);
  h.routes.set('PUT /properties/property-a', init => ({...property('property-a', 'Saved A'), ...JSON.parse(init.body)}));
  h.edit(a.elements.title, 'Saved A'); h.submit(a); await tick();
  assert.equal(h.form('property-b'), b); assert.equal(input.value, 'B draft'); assert.equal(profile.value, 'Profile draft');
  await h.w.hostTest.syncDashboard();
  h.w.document.querySelector('[data-host-lang="ru"]').click(); await tick();
  assert.equal(h.form('property-b'), b); assert.equal(b.elements.title, input);
  assert.equal(input.value, 'B draft'); assert.equal(profile.value, 'Profile draft');
  assert.equal(h.w.document.activeElement, input); assert.equal(input.selectionStart, 2); assert.equal(input.selectionEnd, 5);
  assert.equal(h.w.hostTest.getDirty(), true);
  assert.match(b.querySelector('.host-property-title-field span').textContent, /./);
});

test('502 refresh retains known cards and dirty profile/property fields', async t => {
  const h = await setup(); t.after(h.close);
  const b = h.form('property-b'); h.edit(b.elements.title, 'Keep B');
  const p = h.w.document.getElementById('host-profile-form').elements.displayName; h.edit(p, 'Keep profile');
  h.routes.set('/dashboard', () => new Response('{"error":"Unavailable"}', {status:502}));
  await h.w.hostTest.syncDashboard();
  assert.equal(h.form('property-b'), b); assert.equal(b.elements.title.value, 'Keep B'); assert.equal(p.value, 'Keep profile');
  assert.equal(h.w.hostTest.getState().properties.length, 2);
});

test('older property save completion updates baseline but cannot clear later input', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PUT /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Submitted'); h.submit(a); await tick();
  h.edit(a.elements.title, 'Later input');
  pending.resolve(property('property-a', 'Submitted')); await tick();
  assert.equal(h.form('property-a'), a); assert.equal(a.elements.title.value, 'Later input');
  assert.equal(h.w.hostTest.getState().properties[0].title, 'Submitted'); assert.equal(h.w.hostTest.getDirty(), true);
});

test('older profile completion and same-account notification preserve later draft', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), form = h.w.document.getElementById('host-profile-form');
  h.routes.set('PATCH /profile', () => pending.promise);
  h.edit(form.elements.displayName, 'Submitted profile'); h.submit(form); await tick();
  h.edit(form.elements.displayName, 'Later profile');
  pending.resolve({...user().profile, displayName:'Submitted profile'}); await tick();
  assert.equal(form.elements.displayName.value, 'Later profile');
  h.w.ParrotCore.session.updateProfile({displayName:'Other notification'}); await tick();
  assert.equal(form.elements.displayName.value, 'Later profile');
});

test('identity change clears private drafts and stale save cannot alter the new account', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PUT /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Private old input'); h.submit(a); await tick();
  h.setProperties([property('property-c', 'New account property')]);
  h.routes.set('/dashboard', () => ({profile:user('account-b', 'New owner').profile, properties:[property('property-c', 'New account property')]}));
  h.w.ParrotCore.session.setUser(user('account-b', 'New owner')); await tick();
  pending.resolve(property('property-a', 'Old response')); await tick();
  assert.equal(h.form('property-a'), null); assert.equal(h.w.document.body.textContent.includes('Private old input'), false);
  assert.equal(h.w.document.getElementById('host-profile-form').elements.displayName.value, 'New owner');
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

test('settings and stay writes serialize per property, retain sibling drafts and keep current full PUT/null semantics', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  const stay = h.w.document.querySelector('[data-property-id="property-a"] .host-stay-settings');
  h.routes.set('PUT /properties/property-a', () => pending.promise);
  h.edit(stay.elements.minStayDays, '7'); h.edit(stay.elements.cleaningFee, '');
  h.edit(a.elements.title, 'Saved settings'); h.submit(a); await tick(); h.submit(stay); await tick();
  const writes = h.calls.filter(c => c.route === '/properties/property-a' && c.method === 'PUT');
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].body, {title:'Saved settings', accommodationType:'entire_place', bedrooms:2, sleeps:4, minStayDays:1, cleaningFeeCents:null});
  pending.resolve(property('property-a', 'Saved settings')); await tick();
  assert.equal(stay.elements.minStayDays.value, '7'); assert.equal(stay.elements.cleaningFee.value, '');
});

test('period save 204 followed by502 retains known periods, accepted local dates and later draft', async t => {
  const h = await setup(); t.after(h.close);
  h.setProperties([{...property('property-a', 'A'), availability:[{id:'period-a', from:'2026-11-10', to:'2026-11-13', nightlyPriceCents:10000}]}]);
  await h.w.hostTest.syncDashboard();
  const form = h.w.document.querySelector('.host-availability-panel .host-period'), pending = deferred();
  h.routes.set('PUT /availability/period-a', () => pending.promise);
  h.routes.set('/properties/property-a/availability', () => new Response('{"error":"refresh failed"}', {status:502}));
  h.edit(form.elements.from, '2026-11-11'); h.submit(form); await tick();
  h.edit(form.elements.nightlyPrice, '175'); pending.resolve(new Response(null, {status:204})); await tick();
  assert.equal(h.w.document.querySelector('.host-availability-panel .host-period'), form);
  assert.equal(form.elements.from.value, '2026-11-11'); assert.equal(form.elements.to.value, '2026-11-12');
  assert.equal(form.elements.nightlyPrice.value, '175'); assert.equal(form.dataset.hostOperation, 'saved_refresh_failed');
  assert.equal(h.w.hostTest.getState().properties[0].availability[0].to, '2026-11-13');
  assert.match(h.w.document.querySelector('.host-availability-panel .host-inline-error').textContent, /refresh failed/);
});

test('same-account removed resource ignores an earlier write even when an id is subsequently reused', async t => {
  const h = await setup(); t.after(h.close);
  const pending = deferred(), a = h.form('property-a');
  h.routes.set('PUT /properties/property-a', () => pending.promise);
  h.edit(a.elements.title, 'Old pending'); h.submit(a); await tick();
  h.setProperties([]); await h.w.hostTest.syncDashboard();
  h.setProperties([property('property-a', 'Recreated')]); await h.w.hostTest.syncDashboard();
  pending.resolve(property('property-a', 'Old response')); await tick();
  assert.equal(h.w.hostTest.getState().properties[0].title, 'Recreated');
  assert.equal(h.w.document.getElementById('host-status').textContent.includes('saved'), false);
});

test('collapse/expand keeps all dirty field nodes and does not ask to discard them', async t => {
  const h = await setup(); t.after(h.close);
  const form = h.form('property-b'); h.edit(form.elements.title, 'Keep on collapse');
  let confirmations=0;h.w.confirm = () => {confirmations++;return false;};
  const card = h.w.document.querySelector('[data-property-id="property-b"]');
  card.querySelector('.host-property-toggle').click();
  assert.equal(card.querySelector('.host-property-toggle').getAttribute('aria-expanded'),'false');
  card.querySelector('.host-property-toggle').click();
  assert.equal(confirmations,0);
  assert.equal(h.form('property-b'), form); assert.equal(form.elements.title.value, 'Keep on collapse');
  assert.equal(form.closest('.host-property-settings').hidden, false);
});

test('calendar snapshot502 retains known command data without fabricating a new revision', async t => {
  const h = await setup(); t.after(h.close);
  const id = '11111111-1111-4111-8111-111111111111';
  const calendar = {id, provider:'Airbnb', enabled:true, mode:'Active', revision:3};
  h.routes.set('/properties/property-a/calendars', () => ({calendars:[calendar]}));
  await h.w.hostTest.syncDashboard();
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
  h.routes.set('PUT /properties/property-a',()=>property('property-a','Acknowledged'));
  const form=h.form('property-a');h.edit(form.elements.title,'Acknowledged');h.submit(form);await tick();
  pending.resolve({profile:user().profile,properties:[property('property-a','Old read'),property('property-b','B')]});
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
