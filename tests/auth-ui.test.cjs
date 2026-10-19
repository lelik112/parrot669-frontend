const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/host.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/host.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/assets/styles.css'), 'utf8');

// Run the real controller against a small DOM/API test double. No live accounts
// or network requests are used. Layout is checked separately in the browser.
function element(tag = 'div') {
  const listeners = new Map();
  const attributes = new Map();
  const children = [];
  const controls = [];
  const node = {
    tagName: tag.toUpperCase(), children,
    hidden: false, open: false, disabled: false, value: '', textContent: '',
    dataset: {}, elements: {}, controls,
    addEventListener(type, fn) {
      listeners.set(type, [...(listeners.get(type) || []), fn]);
    },
    removeEventListener(type, fn) {
      listeners.set(type, (listeners.get(type) || []).filter(listener => listener !== fn));
    },
    async emit(type, extra = {}) {
      for (const fn of listeners.get(type) || []) {
        await fn({preventDefault() {}, target: this, ...extra});
      }
    },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttributeNames() {return [...attributes.keys()];},
    hasAttribute(name) {return attributes.has(name);},
    getAttribute(name) { return attributes.get(name); },
    removeAttribute(name) { attributes.delete(name); },
    append(...nodes) { for (const child of nodes) this.insertBefore(child, null); },
    insertBefore(child, before) {
      child.remove();
      const index = before ? children.indexOf(before) : children.length;
      children.splice(index, 0, child); child.parentElement=this;
    },
    remove() {
      const siblings=this.parentElement?.children;
      if(siblings){const index=siblings.indexOf(this);if(index>=0)siblings.splice(index,1);}
      this.parentElement=null;
    },
    closest(selector) {
      if(selector==='form' && this.tagName==='FORM') return this;
      if(selector==='[data-host-island]' && this.dataset.hostIsland) return this;
      return this.parentElement?.closest(selector) || null;
    },
    contains(target) { return this === target || children.some(child => child.contains(target)); },
    replaceChildren() { children.length = 0; },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0];
    },
    querySelectorAll(selector) {
      const descendants = [...controls, ...children.flatMap(n => [n, ...n.querySelectorAll('*')])];
      return [...new Set(descendants)].filter(n => selector === '*' || selector.split(',').some(s =>
        s.startsWith('.') ? n.className?.split(' ').includes(s.slice(1)) :
        n.tagName === s.toUpperCase() || controls.includes(n) && ['input','button'].includes(s)));
    },
    focus() { this.focused = true; },
    scrollIntoView(options) {this.scrollIntoViewOptions=options;},
    showModal() { this.open = true; },
    close() { this.open = false; void this.emit('close'); },
    getBoundingClientRect() { return {left:100, right:500, top:100, bottom:600}; }
  };
  node.classList={
    contains(name){return (node.className || '').split(' ').includes(name);},
    toggle(name, force){
      const classes=new Set((node.className || '').split(' ').filter(Boolean));
      const enabled=force ?? !classes.has(name);
      if(enabled)classes.add(name);else classes.delete(name);
      node.className=[...classes].join(' ');return enabled;
    }
  };
  for(const [property,attribute] of Object.entries({className:'class',id:'id',name:'name',type:'type',title:'title',placeholder:'placeholder',min:'min',max:'max',step:'step',href:'href',target:'target',rel:'rel'}))
    Object.defineProperty(node,property,{get:()=>attributes.get(attribute)||'',set:value=>attributes.set(attribute,String(value)),configurable:true});
  for(const property of ['hidden','disabled','required'])
    Object.defineProperty(node,property,{get:()=>attributes.has(property),set:value=>value?attributes.set(property,''):attributes.delete(property),configurable:true});
  return node;
}

function setup(routes = {}, search = '', {hash = '', sessionData = {}, layout = {}, transport} = {}) {
  routes['/auth/logout']??={status:204};
  routes['/geocode/countries']??={body:[{code:'ES',name:'Spain'},{code:'FR',name:'France'},{code:'BY',name:'Belarus'}]};
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => {
    const node=element(match[1].endsWith('-form')?'form':'div');node.id=match[1];return [match[1],node];
  }));
  nodes.get('host-profile-return').dataset.hostI18n='profileReturn';
  for (const id of ['login-form', 'register-form']) {
    const form = nodes.get(id);
    for (const key of ['login', 'username', 'email', 'password', 'displayName']) {
      form.elements[key] = element();
      form.elements[key].value = key === 'email' ? 'test@example.test' : 'test-value-123';
      form.controls.push(form.elements[key]);
    }
    form.controls.push(element());
  }
  const profileForm = nodes.get('host-profile-form');
  profileForm.elements.displayName = element('input');
  profileForm.elements.displayName.name = 'displayName';
  profileForm.controls.push(profileForm.elements.displayName);
  profileForm.controls.push(element('button'));
  const modes = ['login', 'register'].map(mode => {
    const node = element();
    node.dataset.authMode = mode;
    return node;
  });
  const calls = [];
  const requests = [];
  const windowListeners = new Map();
  const sandbox = {
    document: {
      ...element('document'),
      documentElement: {scrollHeight:layout.scrollHeight||0},
      getElementById: id => nodes.get(id),
      querySelectorAll: selector => selector === '[data-auth-mode]' ? modes :
        selector === '[data-host-i18n]' ? [nodes.get('host-profile-return')] : [],
      createElement: element
    },
    navigator: {language:'en'},
    localStorage: {getItem() {return null;}, setItem() {}},
    window: {location: {search, pathname:'/host', hash, origin:'https://parrot669.com'},addEventListener(type,fn){windowListeners.set(type,[...(windowListeners.get(type)||[]),fn]);},removeEventListener(type,fn){windowListeners.set(type,(windowListeners.get(type)||[]).filter(listener=>listener!==fn));},innerHeight:layout.innerHeight||800,scrollY:380,scrollTo(x,y){
      const requested=typeof x==='object'?x.top:y;
      const height=Number(sandbox.document.documentElement.scrollHeight)||requested+this.innerHeight;
      this.scrollY=Math.min(requested,Math.max(0,height-this.innerHeight));
      this.restoredScroll=this.scrollY;this.scrollOptions=typeof x==='object'?x:{top:y};
    }},
    sessionStorage: {values:new Map(Object.entries(sessionData)),setItem(key,value){this.values.set(key,value);},getItem(key){return this.values.get(key)||null;},removeItem(key){this.values.delete(key);}},
    requestAnimationFrame: fn=>fn(),
    history: {replaceState() {}},
    Headers, URLSearchParams, AbortController, setTimeout, clearTimeout, confirm: () => true,
    FormData: class {
      constructor(form) {this.form = form;}
      get(key) {return (this.form.elements[key] || this.form.querySelectorAll('*').find(n => n.name === key))?.value;}
      has(key) {return this.get(key) !== undefined;}
    },
    fetch: async (url, options) => {
      const route = url.replace('/api/host', '');
      calls.push(route);
      requests.push({url, route, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null});
      if (transport) {
        const response = await transport(url, options);
        if (response) return response;
      }
      const result = typeof routes[route] === 'function' ? await routes[route](options) : routes[route]
        ?? ((options.method||'GET')==='GET' && /^\/properties\/[^/]+\/calendars$/.test(route) ? {body:{calendars:[]}} : undefined);
      const status = result?.status ?? (!result && route === '/auth/me' ? 401 : 200);
      return {status, ok:status < 400, json:async () => result?.body ?? {error:'Test error'}};
    }
  };
  Object.assign(sandbox.window,{fetch:(...args)=>sandbox.fetch(...args),localStorage:sandbox.localStorage,
    sessionStorage:sandbox.sessionStorage,Headers,AbortController,setTimeout,clearTimeout});
  require('./helpers/core.cjs').installCore(sandbox.window);
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'public/assets/host-address.js'), 'utf8'), sandbox);
  vm.runInContext(source, sandbox);
  return {nodes, modes, calls, requests, run: code => vm.runInContext(code, sandbox),emitWindow:async(type,event={})=>{
    for(const listener of windowListeners.get(type)||[]) await listener(event);
  }};
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const user = {accountId:'test-account',email:'test@example.test'};

const flushHost = async () => { for(let i=0;i<10;i++) await settle(); };
const privateProperty = (id,title) => ({id,title,city:'Barcelona',bedrooms:1,sleeps:2,availability:[],unavailability:[],calendars:[]});

test('PM138 R1: /me A→B clears private DOM/controllers/context before B dashboard resolves',async()=>{
  let current={accountId:'account-a',username:'A',profile:{id:'profile-a'}};
  let resolveB;
  const bDashboard=new Promise(resolve=>resolveB=resolve);
  const app=setup({'/auth/me':()=>({body:current}),'/dashboard':()=>current.accountId==='account-a'
    ? {body:{properties:[privateProperty('private-a','PRIVATE A')]}} : bDashboard});
  await flushHost();
  const oldCard=app.nodes.get('host-properties').children[0];
  app.run('expandedPropertyIds.add("private-a");unsavedHostChanges=true;newPropertyAddress.house.value="PRIVATE ADDRESS"');
  let disposed=0;app.run('calendarVerificationPanels').push({dispose(){disposed++;}});
  app.run('propertyAddressEditors').set('old-form',{dispose(){disposed++;}});
  const before=app.calls.filter(x=>x==='/dashboard').length;
  current={accountId:'account-b',username:'B',profile:{id:'profile-b'}};
  await app.run('window.ParrotCore.session.refresh()');
  assert.equal(app.run('accountId'),'account-b');
  assert.equal(app.nodes.get('host-properties').children.includes(oldCard),false);
  assert.equal(app.run('state.properties.length'),0);assert.equal(disposed,2);
  assert.equal(app.run('propertyAddressEditors.size'),0);
  assert.equal(app.run('expandedPropertyIds.size'),0);assert.equal(app.run('unsavedHostChanges'),false);
  assert.equal(app.run('newPropertyAddress.house.value'),'');
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before+1);
  resolveB({body:{properties:[privateProperty('private-b','PRIVATE B')]}});await flushHost();
  assert.equal(app.run('state.properties[0].id'),'private-b');
  assert.equal(app.nodes.get('host-properties').children[0].dataset.propertyId,'private-b');
  const bCard=app.nodes.get('host-properties').children[0];
  app.run('expandedPropertyIds.add("private-b");hostProfileForm.elements.displayName.value="Same account draft";captureHostDraft(hostProfileForm);hostDirtyState();window.ParrotCore.session.updateProfile({displayName:"Same account"})');
  assert.equal(app.nodes.get('host-properties').children[0],bCard);
  assert.equal(app.run('expandedPropertyIds.has("private-b")'),true);assert.equal(app.run('unsavedHostChanges'),true);
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before+1);
});

test('PM138 R1: delayed A dashboard cannot overwrite B dashboard or private DOM',async()=>{
  let current={accountId:'account-a',profile:{id:'profile-a'}},resolveA;
  const aDashboard=new Promise(resolve=>resolveA=resolve);
  const app=setup({'/auth/me':()=>({body:current}),'/dashboard':()=>current.accountId==='account-a'
    ? aDashboard : {body:{properties:[privateProperty('private-b','B')]}}});
  await flushHost();current={accountId:'account-b',profile:{id:'profile-b'}};
  await app.run('window.ParrotCore.session.refresh()');await flushHost();
  assert.equal(app.run('state.properties[0]?.id'),'private-b');
  const card=app.nodes.get('host-properties').children[0];
  resolveA({body:{properties:[privateProperty('private-a','A')]}});await flushHost();
  assert.equal(app.run('accountId'),'account-b');assert.equal(app.run('state.properties[0].id'),'private-b');
  assert.equal(app.nodes.get('host-properties').children[0],card);
});

test('PM138 R3: Host permits only producer-derived empty operations',async()=>{
  const routes={'/auth/me':{body:user},'/dashboard':{body:{properties:[]}}};
  for(const route of ['/calendars/cal-1/sync','/calendars/cal-1/activate','/calendars/cal-1','/availability/av-1','/properties/p-1','/listings/l-1','/unavailability/u-1','/profile','/properties/p-1/calendars','/properties/p-1/public-links']) routes[route]={status:204};
  const app=setup(routes);await flushHost();
  for(const [method,route] of [['PUT','/properties/p-1/public-links'],['POST','/calendars/cal-1/sync'],['POST','/calendars/cal-1/activate'],['PUT','/calendars/cal-1'],['DELETE','/calendars/cal-1'],['DELETE','/availability/av-1'],['DELETE','/properties/p-1'],['DELETE','/listings/l-1'],['DELETE','/unavailability/u-1']])
    assert.equal(await app.run(`api(${JSON.stringify(route)},{method:${JSON.stringify(method)}})`),null,method+' '+route);
  for(const [method,route] of [['GET','/properties/p-1/public-links'],['POST','/properties/p-1/public-links'],['DELETE','/properties/p-1/public-links'],['GET','/calendars/cal-1'],['GET','/calendars/cal-1/activate'],['PUT','/calendars/cal-1/activate'],['PATCH','/profile'],['POST','/properties/p-1/calendars'],['DELETE','/profile'],['PUT','/unavailability/u-1'],['PATCH','/properties/p-1'],['PUT','/availability/av-1']])
    await assert.rejects(app.run(`api(${JSON.stringify(route)},{method:${JSON.stringify(method)}})`),{kind:'protocol',status:204});
  for(const command of ['syncCalendar({id:"cal-1"})','setCalendarEnabled({id:"cal-1"},false)']) {
    const count=app.calls.filter(x=>x==='/dashboard').length;
    await app.run(command);assert.equal(app.calls.filter(x=>x==='/dashboard').length,count);
    assert.equal(app.nodes.get('host-status').className.includes('error'),true);
  }
});

const calendarProperty='11111111-1111-4111-8111-111111111111';
const calendarId='22222222-2222-4222-8222-222222222222';
const calendarView=(extra={})=>({id:calendarId,provider:'Airbnb',listingId:'123',publicUrl:'https://www.airbnb.com/rooms/123',
  enabled:true,mode:'Active',revision:7,status:'Connected',lastSyncedAt:null,lastSuccessAt:null,lastError:null,reservationBlocks:[],...extra});
function calendarSetup({snapshot={body:{calendars:[calendarView()]}},command={status:204},dashboard}={}){
  return setup({'/auth/me':{body:user},'/dashboard':dashboard||{body:{properties:[{
    ...privateProperty(calendarProperty,'Snapshot property'),listings:[{id:'listing-1',url:'https://www.airbnb.com/rooms/123'}],
    // A bogus embedded dashboard calendar must never be a command source.
    calendars:[calendarView({revision:999})]
  }]}},[`/properties/${calendarProperty}/calendars`]:snapshot,
    [`/calendars/${calendarId}/sync`]:command,[`/calendars/${calendarId}/activate`]:command,[`/calendars/${calendarId}`]:command});
}
const calendarCommand='state.properties[0].calendars[0]';

for(const [name,expression,method,suffix,extra] of [
  ['sync',`syncCalendar(${calendarCommand})`,'POST','/sync',{}],
  ['disable',`setCalendarEnabled(${calendarCommand},false)`,'PUT','',{mode:'Disabled'}],
  ['enable',`setCalendarEnabled(${calendarCommand},true)`,'POST','/activate',{}],
  ['delete',`disconnectCalendar(${calendarCommand})`,'DELETE','',{}]
]) test(`PM138 calendar ${name} uses actual snapshot revision and guarded refresh`,async()=>{
  const app=calendarSetup({snapshot:{body:{calendars:[calendarView(name==='enable'?{mode:'Disabled',enabled:false}:{})]}}});await flushHost();
  assert.equal(app.run(calendarCommand+'.revision'),7);
  assert.equal(app.run(calendarCommand+'.status'),'connected');
  const before=app.calls.filter(x=>x==='/dashboard').length;
  await app.run(expression);
  const request=app.requests.find(r=>r.method===method&&r.route===`/calendars/${calendarId}${suffix}`);
  assert.deepEqual(request?.body,{...extra,expectedRevision:7});
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before+1);
  assert.equal(app.calls.filter(x=>x===`/properties/${calendarProperty}/calendars`).length,2);
  assert.equal(app.nodes.get('host-status').className.includes('error'),false);
});

for(const [name,snapshot] of [
  ['missing calendars',{body:{}}],['null calendar',{body:{calendars:[null]}}],
  ['missing revision',{body:{calendars:[calendarView({revision:undefined})]}}],
  ['string revision',{body:{calendars:[calendarView({revision:'7'})]}}],
  ['negative revision',{body:{calendars:[calendarView({revision:-1})]}}],
  ['fractional revision',{body:{calendars:[calendarView({revision:1.5})]}}],
  ['unsafe revision',{body:{calendars:[calendarView({revision:Number.MAX_SAFE_INTEGER+1})]}}],
  ['unknown mode',{body:{calendars:[calendarView({mode:'active'})]}}],
  ['missing mode',{body:{calendars:[calendarView({mode:undefined})]}}],
  ['duplicate ids',{body:{calendars:[calendarView(),calendarView()]}}],
  ['missing enabled',{body:{calendars:[calendarView({enabled:undefined})]}}],
  ['invalid id',{body:{calendars:[calendarView({id:'not-a-calendar'})]}}],
  ['empty snapshot',{body:{calendars:[]}}],['unexpected204',{status:204}],
  ['unavailable',{status:503,body:{code:'SERVICE_UNAVAILABLE',error:'Snapshot unavailable'}}],
  ['anonymous',{status:401,body:{code:'AUTHENTICATION_REQUIRED',error:'Sign in'}}],
  ['cross-owner refusal',{status:404,body:{code:'NOT_FOUND',error:'Not found'}}]
]) test(`PM138 calendar ${name} never sends a command or trusts dashboard data`,async()=>{
  const app=calendarSetup({snapshot});await flushHost();
  const selected='state.properties[0]?.calendars[0]';
  for(const expression of ['syncCalendar','disconnectCalendar'])await app.run(`${expression}(${selected})`);
  await app.run(`setCalendarEnabled(${selected},false)`);
  await app.run(`setCalendarEnabled(${selected},true)`);
  assert.equal(app.requests.filter(r=>r.route.startsWith('/calendars/')).length,0);
  assert.equal(app.nodes.get('host-status').className.includes('error'),true);
});

for(const [status,code] of [[412,'CALENDAR_STALE'],[409,'CALENDAR_DISABLED'],[409,'CALENDAR_INVALID_TRANSITION']])
for(const command of [`syncCalendar(${calendarCommand})`,`setCalendarEnabled(${calendarCommand},false)`,`setCalendarEnabled(${calendarCommand},true)`,`disconnectCalendar(${calendarCommand})`])
test(`PM138 calendar ${command} ${status}/${code} is failure without refresh or retry`,async()=>{
  const app=calendarSetup({command:{status,body:{code,error:'Synthetic calendar refusal'}}});await flushHost();
  const before=app.calls.filter(x=>x==='/dashboard').length;
  await app.run(command);
  assert.equal(app.requests.filter(r=>r.route.startsWith(`/calendars/${calendarId}`)).length,1);
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before);
  assert.equal(app.nodes.get('host-status').textContent,'Synthetic calendar refusal');
  assert.equal(app.nodes.get('host-status').className.includes('error'),true);
  assert.equal(app.run(calendarCommand+'.revision'),7);
});

test('PM138 calendar rejects fabricated and obsolete snapshot objects, accepts revision zero',async()=>{
  const app=calendarSetup({snapshot:{body:{calendars:[calendarView({revision:0})]}}});await flushHost();
  await app.run(`syncCalendar(${JSON.stringify(calendarView())})`);
  assert.equal(app.requests.some(r=>r.route===`/calendars/${calendarId}/sync`),false);
  app.run('globalThis.oldCalendar=state.properties[0].calendars[0]');
  await app.run('syncDashboard()');
  await app.run('syncCalendar(oldCalendar)');
  assert.equal(app.requests.some(r=>r.route===`/calendars/${calendarId}/sync`),false);
  await app.run(`syncCalendar(${calendarCommand})`);
  assert.deepEqual(app.requests.find(r=>r.route===`/calendars/${calendarId}/sync`).body,{expectedRevision:0});
});

for(const status of [200,401])test(`PM138 delayed old-account calendar snapshot ${status} cannot rebuild or expire B`,async()=>{
  let current={accountId:'account-a',profile:{id:'profile-a'}},resolveA;
  const pending=new Promise(resolve=>resolveA=resolve);
  const app=setup({'/auth/me':()=>({body:current}),'/dashboard':()=>({body:{properties:[privateProperty(current.accountId==='account-a'?calendarProperty:'private-b',current.accountId)]}}),
    [`/properties/${calendarProperty}/calendars`]:()=>pending});
  await flushHost();current={accountId:'account-b',profile:{id:'profile-b'}};
  await app.run('window.ParrotCore.session.refresh()');await flushHost();
  const card=app.nodes.get('host-properties').children[0];
  resolveA(status===200?{body:{calendars:[calendarView()]}}:{status:401,body:{error:'old A expired',code:'AUTHENTICATION_REQUIRED'}});await flushHost();
  assert.equal(app.run('accountId'),'account-b');assert.equal(app.run('state.properties[0].id'),'private-b');
  assert.equal(app.nodes.get('host-properties').children[0],card);
  assert.equal(app.run('window.ParrotCore.session.status'),'authenticated');
  assert.equal(app.requests.some(r=>r.route.startsWith('/calendars/')),false);
});

test('PM138 snapshots stay with their property; one refused snapshot does not hide another property',async()=>{
  const second='33333333-3333-4333-8333-333333333333';
  const app=setup({'/auth/me':{body:user},'/dashboard':{body:{properties:[privateProperty(calendarProperty,'A'),privateProperty(second,'B')]}},
    [`/properties/${calendarProperty}/calendars`]:{body:{calendars:[calendarView({mode:'Frozen'})]}},
    [`/properties/${second}/calendars`]:{status:404,body:{code:'NOT_FOUND',error:'Snapshot not available'}},
    [`/calendars/${calendarId}`]:{status:204}});
  await flushHost();
  assert.equal(app.run('state.properties.length'),2);
  assert.equal(app.run('state.properties[0].calendars[0].mode'),'Frozen');
  assert.equal(app.run('state.properties[1].calendars.length'),0);
  assert.equal(app.nodes.get('host-status').textContent,'Snapshot not available');
  // Moving a valid object into a different property does not grant a command.
  app.run('globalThis.moved=state.properties[0].calendars.pop();state.properties[1].calendars.push(moved)');
  await app.run('setCalendarEnabled(moved,false)');
  assert.equal(app.requests.some(r=>r.route.startsWith('/calendars/')),false);
});

test('PM138 overlapping same-session dashboard loads cannot replace a newer revision with a delayed snapshot',async()=>{
  let resolveOld,attempt=0;
  const old=new Promise(resolve=>resolveOld=resolve);
  const app=calendarSetup({snapshot:()=>++attempt===1?old:{body:{calendars:[calendarView({revision:9})]}}});
  await flushHost();await app.run('syncDashboard()');
  assert.equal(app.run(calendarCommand+'.revision'),9);
  const card=app.nodes.get('host-properties').children[0];
  resolveOld({body:{calendars:[calendarView({revision:7})]}});await flushHost();
  assert.equal(app.run(calendarCommand+'.revision'),9);assert.equal(app.nodes.get('host-properties').children[0],card);
});

for(const status of [204,401])test(`PM138 old-account calendar command ${status} cannot refresh or report success into B`,async()=>{
  let resolveCommand;
  const pending=new Promise(resolve=>resolveCommand=resolve);
  const app=calendarSetup({command:()=>pending});await flushHost();
  const command=app.run(`syncCalendar(${calendarCommand})`);
  await flushHost();
  app.run('window.ParrotCore.session.setUser({accountId:"account-b",profile:{id:"profile-b"}})');
  await flushHost();const before=app.calls.filter(r=>r==='/dashboard').length;
  app.nodes.get('host-status').textContent='B status';
  resolveCommand(status===204?{status:204}:{status:401,body:{code:'AUTHENTICATION_REQUIRED',error:'Old account'}});
  await command;await flushHost();
  assert.equal(app.run('accountId'),'account-b');assert.equal(app.run('window.ParrotCore.session.status'),'authenticated');
  assert.equal(app.calls.filter(r=>r==='/dashboard').length,before);
  assert.equal(app.nodes.get('host-status').textContent,'B status');
});

test('host profile saves public name, keeps account identity private and retains input on a 400', async()=>{
  let fail = true;
  const app = setup({
    '/auth/me':{body:{accountId:'owner-1',email:'private@example.test',username:'my-login',profile:{id:'owner-profile',displayName:'Old host'}}},
    '/dashboard':{body:{profile:{id:'owner-profile',displayName:'Old host'},properties:[]}},
    '/profile':()=>fail ? {status:400,body:{error:'Invalid name'}} : {body:{parrotId:'PAR-TEST',displayName:'New host',createdAt:'2030-01-01'}}
  });
  await settle();
  assert.equal(app.nodes.get('host-profile').hidden,false);
  assert.equal(app.nodes.get('host-profile-email').textContent,'private@example.test');
  assert.equal(app.nodes.get('host-profile-username').textContent,'my-login');
  const form=app.nodes.get('host-profile-form');
  assert.equal(form.elements.displayName.value,'Old host');
  form.elements.displayName.value='New host';
  await form.emit('submit');
  assert.equal(form.elements.displayName.value,'New host');
  assert.equal(app.requests.at(-1).method,'PATCH');
  assert.equal(app.requests.at(-1).url,'/api/host/profile');
  assert.deepEqual(app.requests.at(-1).body,{displayName:'New host'});
  fail=false;
  await form.emit('submit');
  assert.equal(form.elements.displayName.value,'New host');
  assert.equal(app.nodes.get('host-status').textContent,'Host name saved.');
});

test('PM-049: Host clears private BFCache DOM before session revalidation',async()=>{
  let current={accountId:'owner-1',email:'private@example.test',username:'owner',profile:{id:'owner-profile',displayName:'Host'}};
  const app=setup({
    '/auth/me':()=>current ? {body:current} : {status:401,body:{error:'unauthorized'}},
    '/dashboard':{body:{profile:{id:'owner-profile',displayName:'Host'},properties:[]}}
  });
  await settle();
  assert.equal(app.nodes.get('host-profile').hidden,false);
  assert.equal(app.nodes.get('host-profile-email').textContent,'private@example.test');
  current=null;
  const pending=app.emitWindow('pageshow',{persisted:true});
  assert.equal(app.nodes.get('host-profile').hidden,true);
  assert.equal(app.nodes.get('host-profile-email').textContent,'');
  assert.equal(app.nodes.get('host-properties').children.length,0);
  await pending; await settle();
  assert.equal(app.nodes.get('host-auth-links').hidden,false);
  assert.equal(app.calls.filter(route=>route==='/auth/me').length,2);
});

test('profile return points to the same conversation only for the original signed-in account',async()=>{
  const conversation='22222222-2222-4222-8222-222222222222';
  const key='parrot669-profile-return';
  const sessionData={[key]:JSON.stringify({accountId:'owner-1',conversationId:conversation,savedAt:Date.now()})};
  const routes={
    '/auth/me':{body:{accountId:'owner-1',email:'private@example.test',username:'owner',profile:{id:'owner-profile',displayName:'Owner'}}},
    '/dashboard':{body:{profile:{id:'owner-profile',displayName:'Owner'},properties:[]}}
  };
  const owner=setup(routes,'?fromMessages=1',{hash:'#host-profile',sessionData});
  await settle();
  const back=owner.nodes.get('host-profile-return');
  assert.equal(owner.nodes.get('host-profile').hidden,false);
  assert.equal(back.hidden,false);
  assert.equal(back.href,`/messages.html?conversation=${conversation}`);
  owner.run("applyLanguage('ru')");
  assert.equal(back.textContent,'← Вернуться к диалогу');
  await owner.nodes.get('reset-host').emit('click');
  assert.equal(back.hidden,true);
  assert.equal(owner.run(`sessionStorage.getItem('${key}')`),null);

  const different=setup({...routes,'/auth/me':{body:{...routes['/auth/me'].body,accountId:'other-account'}}},'?fromMessages=1',{hash:'#host-profile',sessionData});
  await settle();
  assert.equal(different.nodes.get('host-profile-return').hidden,true);
  const anonymous=setup({},'?fromMessages=1',{hash:'#host-profile',sessionData});
  await settle();
  assert.equal(anonymous.nodes.get('host-profile').hidden,true);
  assert.equal(anonymous.nodes.get('host-profile-return').hidden,true);
  const stale=setup(routes,'?fromMessages=1',{hash:'#host-profile',sessionData:{[key]:JSON.stringify({accountId:'owner-1',conversationId:conversation,savedAt:Date.now()-86400001})}});
  await settle();
  assert.equal(stale.nodes.get('host-profile-return').hidden,true);
});

const cityId='locationiq:323126006243';
const cityBounds={west:2.0524977,south:41.3170353,east:2.2283555,north:41.4679135};
const cityFixture={address:'Barcelona, Spain',countryCode:'ES',country:'Spain',city:'Barcelona',latitude:41.39,longitude:2.16,placeId:cityId,resultType:'city',street:null,houseNumber:null,bounds:cityBounds};
const streetFixture={...cityFixture,address:"Carrer d'Alfons el Magnànim, Barcelona, Spain",latitude:41.42,longitude:2.22,placeId:'locationiq:321209898040',street:"Carrer d'Alfons el Magnànim",resultType:'street',bounds:null};
const addressFixture={...streetFixture,address:"Carrer d'Alfons el Magnànim 40, Barcelona, Spain",houseNumber:'40'};
delete addressFixture.bounds;
const cityRoute='/geocode/autocomplete?type=city&country=ES&q=barcelona';
const streetRoute='/geocode/autocomplete?type=street&country=ES&q=alfo&cityId='+encodeURIComponent(cityId)+'&city=Barcelona&bounds='+encodeURIComponent(Object.values(cityBounds).join(','));
const lookupRoutes={[cityRoute]:{body:[cityFixture]},[streetRoute]:{body:[streetFixture]}};
function addressTimers(app){
  app.run('var addressTimer = null; var addressDelay = null; setTimeout = (fn,ms) => { addressTimer = fn; addressDelay = ms; return 1; }; clearTimeout = () => { addressTimer = null; };');
  return () => app.run('addressTimer ? addressTimer() : undefined');
}
async function chooseCity(app,editor=app.run('newPropertyAddress')){
  editor.country.value='ES';await editor.country.emit('change');
  const flush=addressTimers(app);
  editor.city.input.value='Barcelona';await editor.city.input.emit('input');await flush();
  await editor.city.node.querySelector('.host-address-option').emit('click');
  return flush;
}
async function chooseStreet(app,editor=app.run('newPropertyAddress')){
  const flush=await chooseCity(app,editor);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  await editor.street.node.querySelector('.host-address-option').emit('click');
  editor.house.value='40';await editor.house.emit('input');
  return editor;
}

test('countries are loaded once; lookup waits for country, three characters and a 700ms pause', async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=app.run('newPropertyAddress'),flush=addressTimers(app);
  assert.equal(editor.city.input.disabled,true);
  assert.equal(editor.street.input.disabled,true);
  assert.equal(app.calls.filter(x=>x.includes('/autocomplete')).length,0);
  editor.country.value='ES';await editor.country.emit('change');
  editor.city.input.value='Ba';await editor.city.input.emit('input');await flush();
  assert.equal(app.calls.filter(x=>x.includes('/autocomplete')).length,0);
  editor.city.input.value='Barcelona';await editor.city.input.emit('input');
  assert.equal(app.run('addressDelay'),700);
  assert.equal(app.calls.filter(x=>x.includes('/autocomplete')).length,0);
  await flush();
  await editor.city.input.emit('keydown',{key:'ArrowDown'});
  await editor.city.input.emit('keydown',{key:'Enter'});
  assert.equal(editor.street.input.disabled,false);
  propertyCard(app);await settle();
  assert.equal(app.calls.filter(x=>x==='/geocode/countries').length,1);
});

test('city then street without a house number can be chosen; house entry uses no provider request',async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=await chooseStreet(app);
  assert.deepEqual(JSON.parse(JSON.stringify(editor.getValue())),addressFixture);
  const count=app.calls.filter(x=>x.includes('/autocomplete')).length;
  editor.house.value='40 bis';await editor.house.emit('input');
  assert.equal(editor.getValue().houseNumber,'40 bis');
  assert.equal(editor.getValue().resultType,'street');
  assert.equal(app.calls.filter(x=>x.includes('/autocomplete')).length,count);
  editor.house.value='';
  assert.throws(()=>editor.getValue(),/house number/);
});

test('browser autofill text never submits a stale normalized selection in create or edit',async()=>{
  const app=setup(lookupRoutes);await settle();
  const create=app.run('newPropertyAddress');
  propertyCard(app);
  await settle();
  const edit=app.run('Array.from(propertyAddressEditors.values())[0]');
  await edit.change.emit('click');
  for(const editor of [create,edit]){
    await chooseStreet(app,editor);
    editor.street.input.value='A saved browser address';
    assert.throws(()=>editor.getValue(),/Select a street/);
    editor.street.input.value=streetFixture.street;
    editor.city.input.value='Madrid';
    assert.throws(()=>editor.getValue(),/Select a city/);
    editor.city.input.value=cityFixture.city;
    editor.country.value='FR';
    assert.throws(()=>editor.getValue(),/Select a city/);
    editor.country.value='ES';
    assert.deepEqual(JSON.parse(JSON.stringify(editor.getValue())),addressFixture);
    editor.city.input.value='Saved city';await editor.city.input.emit('change');
    assert.equal(editor.street.input.value,'');
    assert.equal(editor.street.input.disabled,true);
    assert.throws(()=>editor.getValue(),/Select a city/);
  }
});

test('place search keeps keyboard selection and does not repeat lookups on change after input',async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=app.run('newPropertyAddress'),flush=await chooseCity(app);
  assert.equal(editor.street.input.type,'search');
  assert.equal(editor.street.input.name,'search-street');
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  const count=app.calls.length;
  await editor.street.input.emit('change');await flush();
  assert.equal(app.calls.length,count);
  await editor.street.input.emit('keydown',{key:'ArrowDown'});
  assert.equal(editor.street.input.getAttribute('aria-activedescendant'),editor.street.node.querySelector('.host-address-option').id);
  await editor.street.input.emit('keydown',{key:'Enter'});
  editor.house.value='40';
  assert.deepEqual(JSON.parse(JSON.stringify(editor.getValue())),addressFixture);
  await editor.street.input.emit('change');await flush();
  assert.equal(app.calls.length,count);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  await editor.street.input.emit('keydown',{key:'Escape'});
  assert.equal(editor.street.input.getAttribute('aria-expanded'),'false');
});

test('changing country or city clears downstream selections and prevents mixed-address submission',async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=await chooseStreet(app);
  editor.city.input.value='Madrid';await editor.city.input.emit('input');
  assert.equal(editor.street.input.value,'');
  assert.equal(editor.street.input.disabled,true);
  assert.equal(editor.house.value,'');
  assert.throws(()=>editor.getValue(),/Select a city/);
  editor.country.value='FR';await editor.country.emit('change');
  assert.equal(editor.city.input.value,'');
  await app.nodes.get('property-form').emit('submit');
  assert.equal(app.requests.some(r=>r.method==='POST'),false);
  editor.dispose();
});

test('mobile tap survives input blur before click; scrolling never selects and outside taps dismiss',async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=app.run('newPropertyAddress'),flush=await chooseCity(app);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  const option=editor.street.node.querySelector('.host-address-option'),doc=app.run('document');
  await doc.emit('pointerdown',{target:option.children[0],pointerType:'touch'});
  await editor.street.node.emit('focusout',{relatedTarget:null});
  assert.equal(editor.street.input.getAttribute('aria-expanded'),'true');
  await option.emit('pointercancel',{pointerType:'touch'});
  assert.equal(editor.street.input.value,'alfo');
  await option.emit('click');
  assert.equal(editor.street.input.value,streetFixture.street);
  editor.house.value='40';
  assert.deepEqual(JSON.parse(JSON.stringify(editor.getValue())),addressFixture);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  await doc.emit('pointerdown',{target:element('button'),pointerType:'touch'});
  assert.equal(editor.street.input.getAttribute('aria-expanded'),'false');
});

test('retyping the same scoped query uses cache; focusing fields does not create lookups',async()=>{
  const app=setup(lookupRoutes);await settle();
  const editor=await chooseStreet(app),flush=addressTimers(app);
  const count=app.calls.length;
  editor.street.input.value=' ALFO ';await editor.street.input.emit('input');await flush();
  assert.equal(app.calls.length,count);
  await editor.street.input.emit('keydown',{key:'Escape'});
  await editor.street.input.emit('focus');
  assert.equal(app.calls.length,count);
  assert.equal(editor.street.input.getAttribute('aria-expanded'),'true');
  editor.street.input.value='new';await editor.street.input.emit('input');
  await editor.street.input.emit('keydown',{key:'Escape'});
  await editor.street.input.emit('focus');
  assert.equal(app.calls.length,count);
});

test('late street response after a country change cannot re-open old suggestions',async()=>{
  let resolve;
  const app=setup({...lookupRoutes,[streetRoute]:()=>new Promise(r=>resolve=r)});await settle();
  const editor=app.run('newPropertyAddress'),flush=await chooseCity(app);
  editor.street.input.value='alfo';await editor.street.input.emit('input');const pending=flush();
  editor.country.value='FR';await editor.country.emit('change');
  resolve({body:[streetFixture]});await pending;
  assert.equal(editor.street.input.getAttribute('aria-expanded'),'false');
  assert.equal(editor.street.input.value,'');
  assert.equal(editor.street.input.disabled,true);
});

test('failed lookup preserves input and offers retry; streets must belong to the selected city',async()=>{
  let failed=true;
  const app=setup({...lookupRoutes,[streetRoute]:()=>failed?{status:503,body:{error:'unavailable'}}:{body:[cityFixture,{...streetFixture,city:'Badalona'},streetFixture]}});
  await settle();
  const editor=app.run('newPropertyAddress'),flush=await chooseCity(app);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  assert.equal(editor.street.input.value,'alfo');
  const retry=editor.street.node.querySelector('.host-address-retry');assert.equal(retry.hidden,false);
  failed=false;await retry.emit('click');
  assert.equal(editor.street.node.querySelectorAll('.host-address-option').length,1);
  await editor.street.node.querySelector('.host-address-option').emit('click');
  assert.throws(()=>editor.getValue(),/house number/);
});

test('create sends the combined address and resets dependent fields after successful saving',async()=>{
  const app=setup({...lookupRoutes,'/properties':options=>({status:201,body:{id:'created-address',...JSON.parse(options.body),country:'Spain',countryCode:'ES'}})});
  await settle();const editor=await chooseStreet(app),form=app.nodes.get('property-form');
  for(const [key,value] of Object.entries({title:'Barcelona home',bedrooms:'1',sleeps:'2',accommodationType:'entire_place'})){
    form.elements[key]=element('input');form.elements[key].value=value;
  }
  await form.emit('submit');
  assert.deepEqual(app.requests.find(r=>r.route==='/properties'&&r.method==='POST').body.address,addressFixture);
  assert.equal(editor.country.value,'');assert.equal(editor.city.input.value,'');
  assert.equal(editor.street.input.disabled,true);assert.equal(editor.house.disabled,true);
});

test('quota error keeps the typed street and retry works without reselecting the city',async()=>{
  let limited=true;
  const app=setup({...lookupRoutes,[streetRoute]:()=>limited?{status:429,body:{error:'rate limit'}}:{body:[streetFixture]}});
  await settle();const editor=app.run('newPropertyAddress'),flush=await chooseCity(app);
  editor.street.input.value='alfo';await editor.street.input.emit('input');await flush();
  assert.equal(editor.street.input.value,'alfo');
  assert.match(editor.street.node.querySelector('.host-address-status').textContent,/Too many address searches/);
  limited=false;await editor.street.node.querySelector('.host-address-retry').emit('click');
  assert.equal(editor.street.node.querySelectorAll('.host-address-option').length,1);
  const attribution=editor.node.querySelector('.host-address-attribution');
  assert.equal(attribution.href,'https://locationiq.com/');
  assert.equal(attribution.textContent,'Search by LocationIQ.com');
});

test('city suggestions without valid bounds cannot enable street search',async()=>{
  const app=setup({...lookupRoutes,[cityRoute]:{body:[{...cityFixture,bounds:null},{...cityFixture,bounds:{...cityBounds,east:-190}},cityFixture]}});
  await settle();const editor=app.run('newPropertyAddress');
  editor.country.value='ES';await editor.country.emit('change');const flush=addressTimers(app);
  editor.city.input.value='Barcelona';await editor.city.input.emit('input');await flush();
  assert.equal(editor.city.node.querySelectorAll('.host-address-option').length,1);
});

test('saved legacy location is preserved without lookups until Change address is chosen',async()=>{
  const app=setup({'/properties/property-1':{status:400,body:{error:'Address validation failed'}}});await settle();propertyCard(app);
  const legacy={...addressFixture,street:null,houseNumber:null,resultType:null};
  app.run('state.properties[0].address='+JSON.stringify(legacy)+'; renderProperties();');
  const editor=app.run('Array.from(propertyAddressEditors.values())[0]');
  const form=app.nodes.get('host-properties').children[0].querySelector('.host-settings-form');
  assert.equal(editor.getValue(),undefined);
  assert.equal(editor.city.input.disabled,true);
  await form.emit('submit');await settle();
  assert.equal(app.requests.find(r=>r.method==='PATCH').body.address,undefined);
  assert.equal(editor.city.input.disabled,true);
  assert.equal(app.calls.filter(x=>x.includes('/autocomplete')).length,0);
  assert.equal(form.querySelector('.host-form-error').textContent,'Address validation failed');
});

test('address replacement keeps draft on 400 and can be canceled to preserve the saved location',async()=>{
  const app=setup({...lookupRoutes,'/properties/property-1':{status:400,body:{error:'select a full address with a street and house number'}}});
  await settle();propertyCard(app);await settle();
  const editor=app.run('Array.from(propertyAddressEditors.values())[0]');
  const form=app.nodes.get('host-properties').children[0].querySelector('.host-settings-form');
  await editor.change.emit('click');await chooseStreet(app,editor);
  await form.emit('submit');await settle();
  assert.deepEqual(app.requests.find(r=>r.method==='PATCH').body.address,addressFixture);
  assert.equal(editor.house.value,'40');
  assert.equal(editor.house.disabled,false);
  await editor.change.emit('click');
  assert.equal(editor.getValue(),undefined);
  assert.equal(editor.house.disabled,true);
});

test('date hints follow selection, automatic end date and clearing; saved prices keep a visible label', async () => {
  const app=setup();
  await settle();
  const card=propertyCard(app);
  for(const selector of ['.host-dates','.host-unavailability-add']){
    const form=card.querySelector(selector);
    const inputs=form.querySelectorAll('input');
    const hints=form.querySelectorAll('.host-date-hint');
    assert.equal(hints.length,2);
    assert.equal(hints.every(h=>!h.hidden && h.textContent==='Select date'),true);
    inputs[0].value='2026-10-10';
    await inputs[0].emit('change');
    assert.equal(inputs[1].value,'2026-10-10');
    assert.equal(hints.every(h=>h.hidden),true);
    inputs[1].value='';
    await inputs[1].emit('input');
    assert.equal(hints[1].hidden,false);
    assert.equal(inputs[1].dataset.empty,'true');
  }
  const row=card.querySelector('.host-availability-panel').querySelector('.host-period');
  const price=row.querySelector('.host-price-label');
  assert.equal(price.children[0].textContent,'Price per night, €');
  assert.equal(price.querySelector('input').value,'100');
  assert.equal(row.querySelectorAll('.host-date-hint').every(h=>h.hidden),true);
  const actions=row.querySelector('.host-period-actions');
  assert.equal(actions.querySelectorAll('button').length,2);
  assert.equal(actions.querySelectorAll('input').length,0);
});

test('manual blocks have a separate panel, send no price and preserve availability through CRUD', async () => {
  const block = {id:'block-1', from:'2026-10-02', to:'2026-10-04'};
  const app = setup({
    '/properties/property-1/unavailability':options => ({status:201,body:{...block,...JSON.parse(options.body)}}),
    '/unavailability/block-1':options => options.method === 'DELETE'
      ? {status:204} : {body:{...block,...JSON.parse(options.body)}}
  });
  await settle();
  let card = propertyCard(app);
  const original = app.run('JSON.stringify(state.properties[0].availability)');
  const panel = card.querySelector('.host-unavailability-panel');
  assert.ok(card.querySelector('.host-availability-panel'));
  assert.equal(panel.querySelectorAll('input').length, 2);
  let form = panel.querySelector('.host-unavailability-add');
  form.querySelectorAll('input')[0].value = block.from;
  form.querySelectorAll('input')[1].value = block.to;
  await form.emit('submit');
  assert.deepEqual(app.requests.find(r => r.method === 'POST').body, {from:block.from,to:'2026-10-05'});
  card = app.nodes.get('host-properties').children[0];
  form = card.querySelector('.host-unavailability-period');
  form.querySelectorAll('input')[1].value = '2026-10-05';
  await form.querySelectorAll('input')[1].emit('input');
  assert.equal(form.querySelector('.host-block-button').hidden, false);
  await form.emit('submit');
  assert.deepEqual(app.requests.find(r => r.method === 'PUT').body, {from:block.from,to:'2026-10-06'});
  assert.equal(app.run('state.properties[0].unavailability[0].to'), '2026-10-06');
  form = app.nodes.get('host-properties').children[0].querySelector('.host-unavailability-period');
  app.run('confirm = () => false');
  await form.querySelector('.danger').emit('click');
  assert.equal(app.requests.some(r => r.method === 'DELETE'), false);
  app.run('confirm = () => true');
  await form.querySelector('.danger').emit('click');
  assert.equal(app.run('state.properties[0].unavailability.length'), 0);
  assert.equal(app.run('JSON.stringify(state.properties[0].availability)'), original);
});

for(const [language,title,first,last,saved,removed] of [
  ['en','Closed dates','First night','Last night (included)','Dates closed for search.','Dates reopened.'],
  ['es','Fechas cerradas','Primera noche','Última noche (incluida)','Fechas cerradas para la búsqueda.','Fechas reabiertas.'],
  ['ca','Dates tancades','Primera nit','Última nit (inclosa)','Dates tancades per a la cerca.','Dates reobertes.'],
  ['ru','Закрытые даты','Первая ночь','Последняя ночь (включительно)','Даты закрыты для поиска.','Закрытие снято.']
]){
  test(`closed dates: ${language} separates draft, saved and removed states`,async()=>{
    const app=setup({
      '/properties/property-1/unavailability':options=>({status:201,body:{id:'block-1',...JSON.parse(options.body)}}),
      '/unavailability/block-1':{status:204}
    });await settle();propertyCard(app);
    app.run(`lang=${JSON.stringify(language)}; renderProperties()`);
    const panel=()=>app.nodes.get('host-properties').children[0].querySelector('.host-unavailability-panel');
    assert.equal(panel().querySelector('h3').textContent,title);
    assert.equal(panel().querySelector('.host-block-feedback'),undefined);
    const form=panel().querySelector('.host-unavailability-add');
    assert.deepEqual(form.querySelectorAll('.host-date-label').map(n=>n.children[0].textContent),[first,last]);
    form.querySelectorAll('input').forEach(input=>input.value='2026-10-02');
    const availability=app.run('JSON.stringify(state.properties[0].availability)');
    await form.emit('submit');
    assert.deepEqual(app.requests.find(r=>r.method==='POST').body,{from:'2026-10-02',to:'2026-10-03'});
    assert.equal(panel().querySelector('.host-block-feedback').textContent,saved);
    assert.ok(panel().querySelector('.host-unavailability-period').querySelector('.host-period-heading'));
    assert.equal(panel().querySelector('.host-unavailability-add').querySelectorAll('input').every(n=>!n.value),true);
    const row=panel().querySelector('.host-unavailability-period');
    await row.querySelector('.danger').emit('click');
    assert.equal(panel().querySelector('.host-unavailability-period'),undefined);
    assert.ok(panel().querySelector('.host-block-feedback').textContent.startsWith(removed));
    assert.equal(app.run('JSON.stringify(state.properties[0].availability)'),availability);
  });
}

for (const action of ['add','edit']) {
  for (const status of [400,409]) {
    test(`manual block ${action}: HTTP ${status} keeps the draft and shows the error`, async () => {
      const route = action === 'add' ? '/properties/property-1/unavailability' : '/unavailability/block-1';
      const app = setup({[route]:{status,body:{code:status===409 ? 'UNAVAILABILITY_OVERLAP' : 'INVALID_REQUEST',error:status===409
        ? 'unavailability period overlaps an existing block'
        : 'to must be after from; end date is exclusive'}}});
      await settle();
      propertyCard(app);
      app.run('lang="ru"; state.properties[0].unavailability=[{id:"block-1",from:"2026-10-02",to:"2026-10-04"}]; renderProperties()');
      const form = app.nodes.get('host-properties').children[0].querySelector(
        action === 'add' ? '.host-unavailability-add' : '.host-unavailability-period');
      const inputs = form.querySelectorAll('input');
      inputs[0].value = '2026-10-03'; inputs[1].value = '2026-10-06';
      await form.emit('submit');
      assert.match(form.querySelector('.host-form-error').textContent, /[А-Яа-я]/);
      assert.equal(inputs[0].value,'2026-10-03');
      assert.equal(inputs[1].value,'2026-10-06');
      assert.equal(inputs.every(n => !n.disabled), true);
      assert.equal(app.run('state.properties[0].unavailability[0].from'),'2026-10-02');
    });
  }
}

test('manual block duplicate submission sends a single request', async () => {
  let resolve;
  const route='/properties/property-1/unavailability';
  const app=setup({[route]:()=>new Promise(r=>resolve=r)});
  await settle();
  const form=propertyCard(app).querySelector('.host-unavailability-add');
  const inputs=form.querySelectorAll('input');
  inputs[0].value='2026-10-02'; inputs[1].value='2026-10-04';
  const pending=form.emit('submit');
  await form.emit('submit');
  assert.equal(app.calls.filter(p=>p===route).length,1);
  resolve({status:201,body:{id:'block-1',...app.requests.find(r=>r.route===route).body}});
  await pending;
  assert.equal(app.run('state.properties[0].unavailability.length'),1);
});

function propertyCard(app) {
  app.run(`state = {...emptyState(), authenticated:true, properties:[{
    id:'property-1', title:'Test home', city:'Barcelona', bedrooms:1, sleeps:2,
    availability:[{id:'period-1', from:'2026-10-01', to:'2026-10-05', nightlyPriceCents:10000}]
  }]}; expandedPropertyIds.add('property-1'); renderProperties();`);
  return app.nodes.get('host-properties').children[0];
}

test('BUG-024: listing conflict codes render safe localized guidance and support only for other or neutral ownership', async () => {
  const cases=[
    ['AIRBNB_LISTING_ALREADY_CONNECTED_TO_THIS_PROPERTY',/already connected to this property/,false],
    ['AIRBNB_LISTING_ALREADY_CONNECTED_TO_YOUR_ACCOUNT',/one of your properties/,false],
    ['AIRBNB_LISTING_CONNECTED_TO_ANOTHER_ACCOUNT',/another PARROT account/,true],
    ['AIRBNB_LISTING_ALREADY_CONNECTED',/Try again or contact us/,true]
  ];
  for(const [code,expected,support] of cases){
    const route='/properties/property-1/listings';
    const app=setup({[route]:{status:409,body:{error:'generic server fallback',code}}});
    await settle();
    const form=propertyCard(app).querySelectorAll('form').find(candidate=>
      candidate.querySelectorAll('input').some(input=>input.name==='externalId'));
    form.querySelector('input').value='424242';
    await form.emit('submit');
    await settle();
    const error=form.querySelector('.host-form-error');
    assert.match(error.textContent,expected);
    const link=error.querySelector('.host-form-support-link');
    assert.equal(Boolean(link),support);
    if(link) assert.equal(link.href,'https://parrot669.com/?contact=airbnb-listing-conflict#contact');
    assert.deepEqual(app.requests.find(request=>request.route===route).body,{platform:'Airbnb',externalId:'424242'});
  }
});

test('existing ranges render the last covered night and round-trip without shifting dates or price', async () => {
  const stored={id:'period-1',from:'2026-10-01',to:'2026-10-05',nightlyPriceCents:10000};
  const app=setup({
    '/availability/period-1':{body:{id:stored.id,propertyId:'property-1',period:{from:stored.from,to:stored.to},nightlyPriceCents:stored.nightlyPriceCents,createdAt:'2026-10-01T00:00:00Z'}},
    '/properties/property-1/availability':{body:[stored]},
    '/unavailability/block-1':{body:{id:'block-1',from:'2026-10-10',to:'2026-10-11'}}
  });
  await settle();
  propertyCard(app);
  app.run('state.properties[0].unavailability=[{id:"block-1",from:"2026-10-10",to:"2026-10-11"}]; renderProperties()');
  for(let i=0;i<2;i++){
    const card=app.nodes.get('host-properties').children[0];
    const available=card.querySelector('.host-availability-panel').querySelector('.host-period');
    const blocked=card.querySelector('.host-unavailability-period');
    assert.equal(available.querySelectorAll('input')[1].value,'2026-10-04');
    assert.equal(blocked.querySelectorAll('input')[1].value,'2026-10-10');
    assert.equal(blocked.querySelectorAll('input')[1].min,'2026-10-10');
    await available.querySelectorAll('input')[1].emit('input');
    assert.equal(available.querySelector('button').hidden,true);
    await available.emit('submit');
    await blocked.emit('submit');
  }
  for(const req of app.requests.filter(r=>r.method==='PUT')){
    assert.deepEqual(req.body,req.route.includes('/unavailability/')
      ? {from:'2026-10-10',to:'2026-10-11'}
      : {from:stored.from,to:stored.to,nightlyPriceCents:stored.nightlyPriceCents});
  }
});

test('owner ranges include the final night, allow one night and handle month/year/leap boundaries', async () => {
  for(const [first,last,end,nights] of [
    ['2026-09-10','2026-09-15','2026-09-16',6],
    ['2026-09-15','2026-09-15','2026-09-16',1],
    ['2026-12-31','2026-12-31','2027-01-01',1],
    ['2028-02-28','2028-02-29','2028-03-01',2],
    ['2026-03-28','2026-03-30','2026-03-31',3]
  ]){
    const app=setup({
      '/properties/property-1/availability':options=> options.method==='POST'
        ? {status:201,body:{id:'new',...JSON.parse(options.body)}} : {body:[]},
      '/properties/property-1/unavailability':options=>({status:201,body:{id:'block-1',...JSON.parse(options.body)}})
    });
    await settle();
    const card=propertyCard(app);
    for(const selector of ['.host-dates','.host-unavailability-add']){
      const form=card.querySelector(selector),inputs=form.querySelectorAll('input');
      inputs[0].value=first;
      await inputs[0].emit('change');
      assert.equal(inputs[1].min,first);
      assert.equal(inputs[1].value,first);
      inputs[1].value=last;
      if(inputs[2]) inputs[2].value='100';
      await form.emit('submit');
    }
    for(const req of app.requests.filter(r=>r.method==='POST')){
      assert.equal(req.body.from,first); assert.equal(req.body.to,end);
      assert.equal((Date.parse(req.body.to)-Date.parse(req.body.from))/86400000,nights);
      assert.equal(req.body.nightlyPriceCents,req.route.endsWith('/availability')?10000:undefined);
    }
  }
});

test('deletion confirmations use the same inclusive dates as the owner forms', async () => {
  const app=setup();
  await settle(); propertyCard(app);
  app.run('var confirmed=[]; confirm=text=>{confirmed.push(text);return false}; state.properties[0].unavailability=[{id:"block-1",from:"2026-10-10",to:"2026-10-11"}]; renderProperties()');
  const card=app.nodes.get('host-properties').children[0];
  await card.querySelector('.host-availability-panel').querySelector('.host-period').querySelector('.danger').emit('click');
  await card.querySelector('.host-unavailability-period').querySelector('.danger').emit('click');
  const messages=JSON.parse(app.run('JSON.stringify(confirmed)'));
  assert.match(messages[0],/2026-10-01.*2026-10-04/);
  assert.match(messages[1],/2026-10-10.*2026-10-10/);
  assert.equal(app.requests.some(r=>r.method==='DELETE'),false);
});

for (const status of [400, 409]) {
  for (const action of ['add', 'edit']) {
    test(`${action} range: HTTP ${status} is shown beside dates and keeps the draft`, async () => {
      const route = action === 'add' ? '/properties/property-1/availability' : '/availability/period-1';
      const app = setup({[route]:{status,body:{error:'availability period overlaps an existing period',code:'AVAILABILITY_OVERLAP'}}});
      await settle();
      app.run('lang = "ru"');
      const card = propertyCard(app);
      const form = card.querySelector(action === 'add' ? '.host-dates' : '.host-period');
      const inputs = form.querySelectorAll('input');
      inputs[0].value = '2026-10-03';
      inputs[1].value = '2026-10-09';
      inputs[2].value = '125';
      await inputs[0].emit('input');
      await form.emit('submit');
      assert.match(form.querySelector('.host-form-error').textContent, /пересекаются/);
      assert.equal(form.querySelector('.host-form-error').getAttribute('role'), 'alert');
      assert.equal(app.nodes.get('host-status').getAttribute('role'), 'alert');
      assert.equal(inputs[0].value, '2026-10-03');
      assert.equal(inputs[1].value, '2026-10-09');
      assert.equal(inputs[2].value, '125');
      assert.equal(inputs.every(input => !input.disabled), true);
      assert.equal(app.nodes.get('host-properties').children[0], card);
      assert.equal(app.requests.find(r => r.route === route).body.nightlyPriceCents, 12500);
      const close = app.nodes.get('host-status').querySelector('.host-status-close');
      await close.emit('click');
      assert.equal(app.nodes.get('host-status').textContent, '');
      assert.equal(form.querySelector('.host-form-error').hidden, false);
    });
  }
}

test('saving a range blocks duplicate submits; retry clears its old error and refreshes on success', async () => {
  let resolve;
  const routes = {'/availability/period-1':{status:400,body:{error:'Invalid range'}}};
  const app = setup(routes);
  await settle();
  const form = propertyCard(app).querySelector('.host-period');
  await form.emit('submit');
  assert.equal(form.querySelector('.host-form-error').textContent, 'Invalid range');
  routes['/availability/period-1'] = () => new Promise(r => resolve = r);
  routes['/properties/property-1/availability'] = {body:[{id:'period-1',from:'2026-10-06',to:'2026-10-10'}]};
  form.querySelectorAll('input')[0].value = '2026-10-06';
  form.querySelectorAll('input')[1].value = '2026-10-10';
  const pending = form.emit('submit');
  assert.equal(form.querySelector('.host-form-error').hidden, true);
  assert.equal(form.getAttribute('aria-busy'), 'true');
  assert.equal(form.querySelectorAll('button').every(button => button.disabled), true);
  assert.equal(form.querySelectorAll('input').every(input => !input.disabled), true);
  await form.emit('submit');
  assert.equal(app.calls.filter(route => route === '/availability/period-1').length, 2);
  resolve({body:{id:'period-1',propertyId:'property-1',period:{from:'2026-10-06',to:'2026-10-11'},nightlyPriceCents:null,createdAt:'2026-10-01T00:00:00Z'}});
  await pending;
  const updated = app.nodes.get('host-properties').children[0].querySelector('.host-period');
  assert.equal(updated, form);
  assert.equal(updated.querySelectorAll('input')[0].value, '2026-10-06');
  assert.equal(updated.querySelector('.host-form-error').hidden, true);
});

test('collapse stays alone in the header; destructive action is only in the expanded footer', async () => {
  const app = setup();
  await settle();
  let card = propertyCard(app);
  assert.equal(card.querySelector('.host-property-head-actions').children.length, 1);
  assert.equal(card.querySelector('.host-property-toggle').getAttribute('aria-expanded'), 'true');
  assert.match(card.querySelector('.host-property-footer').children[0].textContent, /Delete/);
  await card.querySelector('.host-property-toggle').emit('click');
  card = app.nodes.get('host-properties').children[0];
  assert.equal(card.querySelector('.host-property-head-actions').children.length, 1);
  assert.equal(card.querySelector('.host-property-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(card.querySelector('.host-property-footer').hidden, true);
  await card.querySelector('.host-property-toggle').emit('click');
  assert.equal(app.nodes.get('host-properties').children[0].querySelector('.host-property-head-actions').children.length, 1);
});

test('mobile menu has one Housing entry opening search; search stays left of hosts', () => {
  const home = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const search = fs.readFileSync(path.join(root, 'public/search.html'), 'utf8');
  assert.match(home, /<nav aria-label="Mobile navigation">\s*<a class="mobile-housing-primary" href="\/search.html"/);
  assert.match(css, /\.mobile-menu nav a\.mobile-housing-primary\{[^}]*background:var\(--lime\)/);
  const mobileMenu = home.split('id="mobile-menu"')[1].split('<main')[0];
  assert.equal((mobileMenu.match(/data-i18n="navHousing"/g) || []).length, 1);
  assert.equal((mobileMenu.match(/href="\/search.html"/g) || []).length, 1);
  for (const page of [html, search]) {
    const tabs = page.match(/<nav class="housing-tabs"[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.deepEqual([...tabs.matchAll(/href="([^"]+)"/g)].map(match => match[1]), ['/search.html', '/host.html', '/messages.html']);
  }
  const messages = fs.readFileSync(path.join(root, 'public/messages.html'), 'utf8');
  for (const page of [html, messages]) {
    assert.equal((page.match(/href="\/messages\.html"/g) || []).length, 1);
    assert.equal((page.match(/data-msg-unread/g) || []).length, 1);
  }
  assert.doesNotMatch(html, /host-shortcuts|host-step|>01</);
  assert.doesNotMatch(css, /\.housing-tabs[^{}]*\{[^}]*\border\s*:/);
  assert.match(css, /\.housing-tabs a\.active\{background:var\(--lime\)/);
  assert.match(html, /class="active housing-host-link" aria-current="page"/);
  assert.match(search, /href="\/search.html" class="active" aria-current="page"/);
  assert.match(search, /class="housing-host-link"/);
  assert.match(css, /\.host-status\.error\{\s*position:fixed/);
});

test('login sends either email or username in the login field', async () => {
  for (const value of ['  My Name  ', '  test@example.test  ']) {
    const app = setup({'/auth/login':{body:{...user, username:'My Name'}}, '/dashboard':{body:{properties:[]}}});
    await settle();
    app.nodes.get('login-form').elements.login.value = value;
    await app.nodes.get('login-form').emit('submit');
    const request = app.requests.find(r => r.route === '/auth/login');
    assert.equal(request.body.login, value.trim());
    assert.equal(request.body.email, undefined);
    assert.equal(app.nodes.get('host-account-email').textContent, 'My Name');
    assert.equal(app.nodes.get('host-account-email').getAttribute('title'), undefined);
  }
  assert.match(html, /name="login" type="text" autocomplete="username"/);
});

test('registration sends username separately from display name and email', async () => {
  const app = setup({'/auth/register':{status:201, body:{}}});
  await settle();
  const form = app.nodes.get('register-form');
  form.elements.username.value = '  Aleksey  ';
  form.elements.displayName.value = 'Host name';
  await form.emit('submit');
  const request = app.requests.find(r => r.route === '/auth/register');
  assert.equal(request.body.username, 'Aleksey');
  assert.equal(request.body.displayName, 'Host name');
  assert.equal(request.body.email, user.email);
  assert.equal(app.nodes.get('host-account-session').hidden, true);
});

test('hidden overrides all author display rules and inline auth starts hidden until session resolution', () => {
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important\s*\}/);
  assert.match(html, /id="host-auth-links" hidden/);
  assert.match(html, /class="host-auth-dialog host-auth-inline" id="auth-dialog" aria-labelledby="auth-dialog-title" hidden/);
});

test('session loading blocks opening auth; restored session hides guest controls', async () => {
  let resolve;
  const app = setup({'/auth/me': () => new Promise(r => resolve = r), '/dashboard':{body:{properties:[]}}});
  app.run('openAuth("login")');
  assert.equal(app.nodes.get('auth-dialog').hidden, true);
  resolve({body:user});
  await settle();
  assert.equal(app.nodes.get('host-auth-links').hidden, true);
  assert.equal(app.nodes.get('host-account-session').hidden, false);
  assert.equal(app.nodes.get('host-account-email').textContent, 'ACCOUNT');
  assert.equal(app.nodes.get('property-panel').hidden, false);
  assert.equal(app.nodes.get('host-hero').hidden, false);
  app.run('openAuth("register")');
  assert.equal(app.nodes.get('auth-dialog').hidden, true);
});

test('guest sees inline login/register while signed-in cabinet content stays hidden', async () => {
  const app = setup();
  await settle();
  assert.equal(app.nodes.get('host-auth-links').hidden, false);
  assert.equal(app.nodes.get('host-account-session').hidden, true);
  assert.equal(app.nodes.get('auth-dialog').hidden, false);
  assert.equal(app.nodes.get('host-hero').hidden, true);
  assert.equal(app.nodes.get('property-panel').hidden, true);
  await app.nodes.get('open-login').emit('click');
  assert.equal(app.nodes.get('login-form').hidden, false);
  assert.equal(app.nodes.get('register-form').hidden, true);
  await app.modes[1].emit('click');
  assert.equal(app.nodes.get('login-form').hidden, true);
  assert.equal(app.nodes.get('register-form').hidden, false);
  assert.equal(app.modes[1].getAttribute('aria-pressed'), 'true');
  for(const [language,login,register] of [
    ['en','Log in','Create account'],['es','Iniciar sesión','Crear cuenta'],
    ['ca','Iniciar sessió','Crear compte'],['ru','Войти','Создать аккаунт']
  ]){
    app.run(`applyLanguage('${language}')`);
    assert.equal(app.run('tr("loginTitle")'),login);
    assert.equal(app.run('tr("registerTitle")'),register);
  }
});

test('register deep link opens the inline register mode without duplicating forms', async () => {
  const app = setup({}, '?register=1');
  await settle();
  assert.equal(app.nodes.get('auth-dialog').hidden, false);
  assert.equal(app.nodes.get('login-form').hidden, true);
  assert.equal(app.nodes.get('register-form').hidden, false);
  assert.equal((html.match(/id="login-form"/g) || []).length, 1);
  assert.equal((html.match(/id="register-form"/g) || []).length, 1);
});

test('successful login hides inline auth and shows only authenticated controls', async () => {
  const app = setup({'/auth/login':{body:user}, '/dashboard':{body:{properties:[]}}});
  await settle();
  app.run('openAuth("login")');
  await app.nodes.get('login-form').emit('submit');
  assert.equal(app.nodes.get('auth-dialog').hidden, true);
  assert.equal(app.nodes.get('host-auth-links').hidden, true);
  assert.equal(app.nodes.get('host-account-session').hidden, false);
  await app.nodes.get('register-form').emit('submit');
  assert.equal(app.calls.includes('/auth/register'), false);
});

test('auth request disables switching and duplicate submission; errors stay in form', async () => {
  let resolve;
  const app = setup({'/auth/login': () => new Promise(r => resolve = r)});
  await settle();
  app.run('openAuth("login")');
  const submission = app.nodes.get('login-form').emit('submit');
  assert.equal(app.modes[1].disabled, true);
  app.run('openAuth("register")');
  await app.nodes.get('login-form').emit('submit');
  assert.equal(app.calls.filter(p => p === '/auth/login').length, 1);
  resolve({status:503, body:{error:'Try again'}});
  await submission;
  assert.equal(app.nodes.get('auth-dialog').hidden, false);
  assert.equal(app.nodes.get('register-form').hidden, true);
  assert.equal(app.nodes.get('login-form').querySelector('.host-form-error').textContent, 'Try again');
  assert.equal(app.modes[1].disabled, false);
});

test('registration keeps user logged out until email is verified', async () => {
  const app = setup({'/auth/register':{status:201, body:{}}});
  await settle();
  app.run('openAuth("register")');
  await app.nodes.get('register-form').emit('submit');
  assert.equal(app.nodes.get('auth-dialog').hidden, false);
  assert.equal(app.nodes.get('login-form').hidden, false);
  assert.equal(app.nodes.get('register-form').hidden, true);
  assert.equal(app.nodes.get('host-account-session').hidden, true);
  assert.match(app.nodes.get('host-status').textContent, /Check your email/);
});

test('logout failure preserves authenticated UI; success restores guest UI', async () => {
  const routes = {'/auth/me':{body:user}, '/dashboard':{body:{properties:[]}}, '/auth/logout':{status:503}};
  const app = setup(routes);
  await settle();
  await app.nodes.get('reset-host').emit('click');
  assert.equal(app.nodes.get('host-auth-links').hidden, true);
  assert.equal(app.nodes.get('host-account-session').hidden, false);
  routes['/auth/logout'] = {status:204};
  await app.nodes.get('reset-host').emit('click');
  assert.equal(app.nodes.get('host-auth-links').hidden, false);
  assert.equal(app.nodes.get('host-account-session').hidden, true);
  assert.equal(app.nodes.get('property-panel').hidden, true);
});

test('failed session check releases loading guard', async () => {
  const app = setup({'/auth/me':{status:503}});
  await settle();
  app.run('openAuth("login")');
  assert.equal(app.nodes.get('auth-dialog').hidden, false);
});

test('verification restores session without showing auth modal', async () => {
  const app = setup({'/auth/verify-email':{body:user}, '/dashboard':{body:{properties:[]}}}, '?verifyEmail=test-token');
  await settle();
  assert.equal(app.nodes.get('host-auth-links').hidden, true);
  assert.equal(app.nodes.get('host-account-session').hidden, false);
  assert.equal(app.nodes.get('auth-dialog').hidden, true);
  assert.equal(app.run('sessionLoading'), false);
});

test('unverified email login explains the next step in the selected language',async()=>{
  const app=setup({'/auth/login':{status:401,body:{error:'email verification required',code:'EMAIL_VERIFICATION_REQUIRED'}}});await settle();
  app.run('applyLanguage("ru");openAuth("login")');await app.nodes.get('login-form').emit('submit');
  assert.match(app.nodes.get('login-form').querySelector('.host-form-error').textContent,/Подтвердите email по ссылке/);
  assert.match(html,/href="\/recover.html"/);
});

test('property name can be edited, errors preserve it, successful save refreshes the heading without replacing periods',async()=>{
  let fail=true;
  const app=setup({'/properties/property-1':options=>fail?{status:400,body:{error:'title is required',code:'TITLE_REQUIRED'}}:{body:{id:'property-1',city:'Barcelona',country:'Spain',countryCode:'ES',accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,cleaningFeeCents:null,address:null,createdAt:'2026-10-01T00:00:00Z',...JSON.parse(options.body)}}});await settle();
  let card=propertyCard(app);let form=card.querySelector('.host-settings-form');const input=form.querySelectorAll('input').find(n=>n.name==='title');
  assert.equal(input.value,'Test home');input.value='  Новый дом 🏠 <test>  ';
  await app.run('updatePropertySettings(state.properties[0],propertiesNode.children[0].querySelector(".host-settings-form"))');
  assert.equal(input.value,'  Новый дом 🏠 <test>  ');assert.equal(input.disabled,false);
  assert.match(form.querySelector('.host-form-error').textContent,/Enter a property name/);
  fail=false;await app.run('updatePropertySettings(state.properties[0],propertiesNode.children[0].querySelector(".host-settings-form"))');
  assert.equal(app.requests.filter(r=>r.method==='PATCH').at(-1).body.title,'  Новый дом 🏠 <test>  ');
  assert.equal(app.run('state.properties[0].title'),'  Новый дом 🏠 <test>  ');
  assert.equal(app.nodes.get('host-properties').children[0].querySelector('strong').textContent,'  Новый дом 🏠 <test>  ');
  assert.equal(app.run('state.properties[0].availability[0].id'),'period-1');
});

test('host navigation asks before dropping a draft and restores only this account’s object context',async()=>{
  const app=setup();await settle();
  app.run('setAuthenticated({accountId:"host-a",email:"host@example.test"});renderAuthState();state.properties=[{id:"property-1"}];expandedPropertyIds.add("property-1");unsavedHostChanges=true');
  app.run('confirm=()=>false');
  const click=()=>app.run('document.emit("click",{target:{closest:()=>({isConnected:true,origin:"https://parrot669.com",pathname:"/messages.html"})},preventDefault(){this.cancelled=true}})');
  const rejected=await click();assert.equal(rejected,undefined);
  assert.equal(app.run('sessionStorage.values.size'),0);
  app.run('confirm=()=>true');await click();
  assert.equal(app.run('JSON.parse(sessionStorage.getItem("parrot669-host-return:host-a")).scrollY'),380);
  const scroll=app.run('expandedPropertyIds.clear();state.properties=[{id:"property-1"}];restoreHostContext()');
  assert.equal(app.run('expandedPropertyIds.has("property-1")'),true);
  assert.equal(scroll,380);
  assert.equal(app.run('sessionStorage.values.size'),0);
  app.run('sessionStorage.setItem("parrot669-host-return:host-a",JSON.stringify({ids:["property-1"],scrollY:300}));setAuthenticated({accountId:"host-b",email:"b@example.test"});expandedPropertyIds.clear();restoreHostContext()');
  assert.equal(app.run('expandedPropertyIds.size'),0);
});

test('return from Messages restores the saved position without smooth scrolling',async()=>{
  const app=setup({'/dashboard':{body:{properties:[]}}});await settle();
  app.run('setAuthenticated({accountId:"host-a",email:"host@example.test"});sessionStorage.setItem("parrot669-host-return:host-a",JSON.stringify({ids:[],scrollY:3329}))');
  await app.run('syncDashboard()');
  assert.equal(app.run('window.scrollOptions.top'),3329);
  assert.equal(app.run('window.scrollOptions.behavior'),'instant');
  assert.equal(app.run('sessionStorage.getItem("parrot669-host-return:host-a")'),null);
});

test('return from Messages retries the saved position after late host layout growth',async()=>{
  const app=setup({'/dashboard':{body:{properties:[]}}},'',{layout:{scrollHeight:1200,innerHeight:600}});await settle();
  app.run('setAuthenticated({accountId:"host-a",email:"host@example.test"});sessionStorage.setItem("parrot669-host-return:host-a",JSON.stringify({ids:[],scrollY:2678}))');
  await app.run('syncDashboard()');
  assert.equal(app.run('window.scrollY'),600);
  app.run('document.documentElement.scrollHeight=3614');
  await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(app.run('window.scrollY'),2678);
  assert.equal(app.run('window.scrollOptions.behavior'),'instant');
});

test('Messages property deep link opens only the owned card and returns to its conversation',async()=>{
  const first='11111111-1111-4111-8111-111111111111';
  const second='22222222-2222-4222-8222-222222222222';
  const conversation='33333333-3333-4333-8333-333333333333';
  const routes={'/auth/me':{body:{accountId:'owner-a',email:'owner@example.test'}},
    '/dashboard':{body:{properties:[{id:first,title:'First home',city:'Barcelona',bedrooms:1,sleeps:2},
      {id:second,title:'Second home',city:'Barcelona',bedrooms:2,sleeps:3}]}}};
  const app=setup(routes,`?property=${second}&conversation=${conversation}`);
  await settle();
  const cards=app.nodes.get('host-properties').children;
  assert.equal(cards.length,2);
  assert.equal(cards[0].dataset.propertyId,first);
  assert.equal(cards[1].dataset.propertyId,second);
  assert.equal(app.run(`expandedPropertyIds.has('${first}')`),false);
  assert.equal(app.run(`expandedPropertyIds.has('${second}')`),true);
  assert.equal(cards[1].focused,true);
  assert.equal(cards[1].scrollIntoViewOptions.block,'start');
  assert.equal(app.nodes.get('host-property-context').hidden,false);
  assert.equal(app.nodes.get('host-property-return').href,`/messages.html?conversation=${conversation}`);
  assert.match(app.nodes.get('host-property-context-status').textContent,/property from your conversation/);
  assert.deepEqual(app.calls.filter(path=>path.startsWith('/properties/')),[`/properties/${first}/calendars`,`/properties/${second}/calendars`]);

  const other=setup({'/auth/me':routes['/auth/me'],'/dashboard':{body:{properties:[routes['/dashboard'].body.properties[0]]}}},
    `?property=${second}&conversation=${conversation}`);
  await settle();
  assert.equal(other.run(`expandedPropertyIds.has('${first}')`),false);
  assert.match(other.nodes.get('host-property-context-status').textContent,/no longer available in this account/);
  assert.equal(other.nodes.get('host-properties').children[0].focused,undefined);
  assert.equal(other.nodes.get('host-property-context').scrollIntoViewOptions.block,'start');
  assert.equal(other.nodes.get('host-property-return').href,`/messages.html?conversation=${conversation}`);
  const unauth=setup({},`?property=${second}&conversation=${conversation}`);
  await settle();
  assert.equal(unauth.nodes.get('property-panel').hidden,true);
  assert.equal(unauth.nodes.get('host-property-context').hidden,true);
});


test('PM-071: saved listing without calendar shows Host trust copy only in the unverified state', async () => {
  const app=setup();
  await settle();
  propertyCard(app);
  const render=calendars=>app.run(`lang="ru";
    state.properties[0].listing={id:"listing-1",platform:"Airbnb",url:"https://www.airbnb.com/rooms/123",showInSearch:true};
    state.properties[0].calendars=${JSON.stringify(calendars)};
    renderProperties();`);

  render([]);
  let card=app.nodes.get('host-properties').children[0];
  assert.equal(
    card.querySelector('.host-calendar-unverified').querySelector('strong').textContent,
    'Календарь не подключён · контроль не подтверждён'
  );
  assert.equal(
    card.querySelector('.host-listing-unverified-note').textContent,
    'Ссылка на Airbnb видна гостям, но календарь ещё не подтверждён'
  );

  for(const calendar of [
    [{id:'calendar-1',provider:'Airbnb',enabled:true,status:'connected',reservationBlocks:[]}],
    [{id:'calendar-1',provider:'Airbnb',enabled:true,status:'connected',verificationStatus:'verified',reservationBlocks:[]}]
  ]){
    render(calendar);
    card=app.nodes.get('host-properties').children[0];
    assert.equal(card.querySelector('.host-calendar-unverified'),undefined);
    assert.equal(card.querySelector('.host-listing-unverified-note'),undefined);
  }
});


test('calendar request and dashboard use the canonical Airbnb provider', async () => {
  const route='/properties/property-1/public-links';
  const app=setup({[route]:{status:204}});
  await settle();
  propertyCard(app);
  await app.run(`connectCalendar(state.properties[0], {querySelector:()=>null,querySelectorAll:()=>[],elements:{},controls:[]})`);
  assert.equal(app.requests.find(request=>request.route===route).body.provider,'Airbnb');
  propertyCard(app);
  app.run(`state.properties[0].listing={id:'listing-1',platform:'Airbnb',url:'https://www.airbnb.com/rooms/123'}; state.properties[0].calendars=[{id:'calendar-1',provider:'Airbnb',enabled:true,status:'connected',reservationBlocks:[]}]; renderProperties()`);
  const buttons=app.nodes.get('host-properties').querySelectorAll('button');
  assert.ok(buttons.some(button=>button.textContent===app.run('tr("syncNow")')), buttons.map(button=>button.textContent).join('|'));
});

// Real Host/controller → shared session/HTTP → real Worker; only the backend
// transport is synthetic. Producer contract: PublicLinkRoutes/Request on 9b80af3d.
const connectWorkerSource = fs.readFileSync(path.join(root,'src/index.js'),'utf8')
  .replace('export default {','globalThis.worker = {');
const connectPath = `/properties/${calendarProperty}/public-links`;
const connectUrl = 'https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123';
function connectSetup(producer) {
  const upstream=[];
  const worker={URL,Headers,Response,console,fetch:async(url,init)=>{
    const body=await new Response(init.body).json();
    upstream.push({url,method:init.method,headers:init.headers,body});
    // Unlike a loose route mock, reject an obsolete endpoint or method.
    assert.equal(url,'https://api.example.test/api'+connectPath);
    assert.equal(init.method,'PUT');
    assert.deepEqual(body,{provider:'Airbnb',icalUrl:connectUrl});
    // Existing CalendarSource.parseAirbnb shape: ?s=, alphanumeric token.
    assert.match(body.icalUrl,/^https:\/\/www\.airbnb\.com\/calendar\/ical\/[0-9]{1,32}\.ics\?s=[A-Za-z0-9]+$/);
    assert.equal(init.headers.get('Cookie'),'parrot_session=synthetic');
    assert.equal(init.headers.get('Authorization'),null);
    return producer();
  }};
  vm.createContext(worker);vm.runInContext(connectWorkerSource,worker);
  const app=setup({'/auth/me':{body:user},'/dashboard':{body:{properties:[{...privateProperty(calendarProperty,'Connect property'),
    listings:[{id:'listing-1',url:'https://www.airbnb.com/rooms/123'}]}]}}},'',{
    transport:async(url,options)=>{
      if((options.method||'GET')==='GET')return;
      const headers=new Headers(options.headers);
      headers.set('Origin','https://parrot669.com');headers.set('Cookie','other=private; parrot_session=synthetic');
      headers.set('Authorization','Bearer untrusted');
      return worker.worker.fetch(new Request('https://parrot669.com'+url,{...options,headers}),{
        PUBLIC_ORIGIN:'https://parrot669.com',API_ORIGIN:'https://api.example.test'
      });
    }
  });
  return {...app,upstream};
}
async function submitConnect(app) {
  app.run(`expandedPropertyIds.add(${JSON.stringify(calendarProperty)});renderProperties()`);
  const form=app.nodes.get('host-properties').querySelector('.host-calendar-form');
  assert.ok(form,'connected listing exposes the existing calendar form');
  form.querySelector('input').value='  '+connectUrl+'  ';
  return {form,submit:()=>app.run('connectCalendar(state.properties[0],propertiesNode.querySelector(".host-calendar-form"))')};
}
function assertConnectRequest(app) {
  assert.equal(app.upstream.length,1);
  const request=app.upstream[0];
  assert.equal(request.url,'https://api.example.test/api'+connectPath);
  assert.equal(request.method,'PUT');
  assert.deepEqual(request.body,{provider:'Airbnb',icalUrl:connectUrl});
}

test('calendar connect sends actual serialized PUT through Worker and accepts only producer 204',async()=>{
  const app=connectSetup(()=>new Response(null,{status:204}));await flushHost();
  const {submit,form}=await submitConnect(app),before=app.calls.filter(x=>x==='/dashboard').length;
  await submit();
  assertConnectRequest(app);
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before+1);
  assert.equal(form.querySelector('.host-form-error'),undefined);
  assert.equal(form.querySelector('input').disabled,false);
});

for(const [label,status,body] of [
  ['JSON object',200,'{}'],['JSON array',200,'[]'],['null',200,'null'],['malformed JSON',200,'{broken'],
  ['empty 200',200,''],['created JSON',201,'{"id":"invented"}'],['accepted JSON',202,'{}'],
  ['auth',401,'{"code":"AUTHENTICATION_REQUIRED","error":"Sign in"}'],
  ['ownership',403,'{"code":"FORBIDDEN","error":"Unavailable"}'],
  ['not found',404,'{"code":"NOT_FOUND","error":"Unavailable"}'],
  ['rate limit',429,'{"code":"RATE_LIMITED","error":"Try later"}']
])test(`calendar connect ${label} preserves input and does not refresh or retry`,async()=>{
  const app=connectSetup(()=>new Response(body,{status,headers:{'Content-Type':'application/json'}}));await flushHost();
  const {submit,form}=await submitConnect(app),before=app.calls.filter(x=>x==='/dashboard').length;
  await submit();await flushHost();
  assertConnectRequest(app);
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before);
  assert.equal(form.querySelector('input').value,'  '+connectUrl+'  ');
  assert.equal(form.querySelector('input').disabled,false);
  if(status!==401)assert.ok(form.querySelector('.host-form-error')?.textContent);
  assert.equal(app.nodes.get('host-status').className.includes('success'),false);
  if(status===401)assert.equal(app.run('state.authenticated'),false);
});

for(const status of [204,403])test(`late calendar connect ${status} cannot mutate a replacement session`,async()=>{
  let release;const pending=new Promise(resolve=>release=resolve);
  const app=connectSetup(()=>pending);await flushHost();
  const {submit}=await submitConnect(app);const work=submit();await flushHost();
  app.run('window.ParrotCore.session.setUser({accountId:"replacement",profile:{id:"replacement-profile"}})');
  await flushHost();
  const before=app.calls.filter(x=>x==='/dashboard').length;
  const message=app.nodes.get('host-status').textContent;
  release(new Response(status===204?null:'{"code":"FORBIDDEN","error":"OLD PRIVATE ERROR"}',{status}));
  await work;await flushHost();
  assertConnectRequest(app);
  assert.equal(app.nodes.get('host-status').textContent,message);
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before);
});

test('calendar connect refuses a stale property before making a request',async()=>{
  const app=connectSetup(()=>new Response(null,{status:204}));await flushHost();
  await submitConnect(app);
  app.run('globalThis.oldConnectProperty=state.properties[0];state.properties=[]');
  await app.run('connectCalendar(oldConnectProperty,propertiesNode.querySelector(".host-calendar-form"))');
  assert.equal(app.upstream.length,0);
});

test('calendar connect completion cannot refresh a replaced property in the same session',async()=>{
  let release;const pending=new Promise(resolve=>release=resolve);
  const app=connectSetup(()=>pending);await flushHost();
  const {submit}=await submitConnect(app);const work=submit();await flushHost();
  app.run('state.properties=state.properties.map(property=>({...property}));renderProperties();message("Replacement property state")');
  const before=app.calls.filter(x=>x==='/dashboard').length;
  release(new Response(null,{status:204}));await work;await flushHost();
  assertConnectRequest(app);
  assert.equal(app.nodes.get('host-status').textContent,'Replacement property state');
  assert.equal(app.calls.filter(x=>x==='/dashboard').length,before);
});
