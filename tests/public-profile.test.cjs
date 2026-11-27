const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {installCore}=require('./helpers/core.cjs');

const html = fs.readFileSync(path.join(__dirname,'../public/profile.html'),'utf8');
const script = fs.readFileSync(path.join(__dirname,'../public/assets/public-profile.js'),'utf8');
const parrotId='P669-AAAA-AAAA-AAAA-AAAA';
const otherId='P669-BBBB-BBBB-BBBB-BBBB';
const propertyId='11111111-1111-4111-8111-111111111111';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const profile=(overrides={})=>({
  profile:{parrotId,displayName:'Anna',about:'Clear agreements.'},
  property:null,
  ...overrides,
});

// The production loader is private to its IIFE. Observe its terminal DOM commit,
// without replacing the loader, HTTP boundary or error handling.
function profileUpdate(h, action) {
  const loading=h.document.getElementById('profile-loading');
  const terminal=['profile-content','profile-unavailable','profile-error']
    .map(id=>h.document.getElementById(id));
  return new Promise((resolve,reject)=>{
    const observer=new h.window.MutationObserver(()=>{
      if(loading.hidden && terminal.some(node=>!node.hidden)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(h.document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
    try {
      action();
      assert.equal(loading.hidden,false,'action must start a public-profile load');
    } catch(error) {
      observer.disconnect();
      reject(error);
    }
  });
}

const accountId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const user=(id=parrotId)=>({accountId,email:'owner@example.test',username:'owner',parrotId:id,displayName:'Owner'});
async function page({url=`https://parrot669.com/p/${parrotId}`,responses=[],authUser=null,authResponse=null,observeLifecycle=false}={}) {
  const calls=[];
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.fetch=async (input,init={})=>{
    calls.push({url:String(input),init});
    if(String(input)==='/api/host/auth/me')return authResponse ? authResponse(input,init) : new Response(JSON.stringify(authUser || {code:'AUTHENTICATION_REQUIRED',error:'Unauthorized'}),{status:authUser?200:401});
    const next=responses.shift();
    if(typeof next==='function')return next(input,init);
    const value=next || {status:401,body:{error:'unauthorized',code:'AUTHENTICATION_REQUIRED'}};
    return new Response(JSON.stringify(value.body),{status:value.status,headers:{'Content-Type':'application/json'}});
  };
  const core=installCore(dom.window);
  // Observe the real session subscription, without replacing session behavior.
  const lifecycle={active:0,subscribed:0,disposed:0,notifications:0};
  if(observeLifecycle) {
    const subscribe=core.session.subscribe;
    core.session.subscribe=listener=>{
      lifecycle.active++;lifecycle.subscribed++;
      const dispose=subscribe(state=>{lifecycle.notifications++;listener(state);});
      return ()=>{lifecycle.active--;lifecycle.disposed++;dispose();};
    };
  }
  dom.window.eval(script);
  await tick();await tick();
  return {dom,window:dom.window,document:dom.window.document,calls,lifecycle};
}

test('person-only profile renders long plain text safely and omits empty About/property',async t=>{
  const displayName='<img src=x onerror=alert(1)> A very long public name';
  const h=await page({responses:[
    {status:200,body:profile({profile:{parrotId,displayName,about:null}})},
  ]});
  t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-name').textContent,displayName);
  assert.equal(h.document.querySelector('#profile-name img'),null);
  assert.equal(h.document.querySelector('#profile-about-section').hidden,true);
  assert.equal(h.document.querySelector('#profile-property').hidden,true);
  assert.equal(h.document.querySelector('#profile-person-only').hidden,false);
  assert.equal(h.document.querySelector('#profile-content').hidden,false);
});

test('selected property keeps dates and safe published links with honest calendar statuses',async t=>{
  const payload=profile({property:{
    id:propertyId,title:'Casa <Lumen>',city:'Barcelona',cityNative:null,accommodationType:'entire_place',
    bedrooms:2,sleeps:4,minStayDays:3,listings:[
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/123',calendarControlStatus:'verified'},
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/124',calendarControlStatus:'pending'},
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/125',calendarControlStatus:'unverified'},
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/126',calendarControlStatus:'recheck_required'},
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/127',calendarControlStatus:'failed'},
      {provider:'Airbnb',url:'https://www.airbnb.com/rooms/128',calendarControlStatus:'lost'},
      {provider:'Airbnb',url:'javascript:alert(1)',calendarControlStatus:'verified'},
    ],
  }});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}&from=2027-05-01&to=2027-05-05`,
    responses:[{status:200,body:payload}],authUser:user(otherId)});
  t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-property-title').textContent,'Casa <Lumen> · Barcelona');
  const links=Array.from(h.document.querySelectorAll('.profile-listing'));
  assert.equal(links.length,6);
  assert.equal(links[0].getAttribute('href'),'https://www.airbnb.com/rooms/123');
  assert.equal(links[0].textContent,'Airbnb ↗');
  assert.equal(links.some(link=>link.getAttribute('href').startsWith('javascript:')),false);
  assert.deepEqual(Array.from(h.document.querySelectorAll('.profile-listing-status'),node=>node.textContent),[
    'Calendar control confirmed ✓',
    'The host has not finished calendar verification',
    'Calendar control not confirmed',
    'Calendar verification needs to be repeated',
    'Calendar control not confirmed',
    'Calendar control not confirmed',
  ]);
  const contact=new URL(h.document.querySelector('#profile-contact').href);
  assert.equal(contact.searchParams.get('property'),propertyId);
  assert.equal(contact.searchParams.get('from'),'2027-05-01');
  assert.equal(contact.searchParams.get('to'),'2027-05-05');
  assert.equal(h.document.querySelector('#profile-contact').hidden,false);
  assert.equal(h.document.querySelector('#profile-edit').hidden,true);
});

test('Edit replaces Contact only after a positive public-id owner match',async t=>{
  const payload=profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',
    bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,
    responses:[{status:200,body:payload}],authUser:user()});
  t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-contact').hidden,true);
  assert.equal(h.document.querySelector('#profile-edit').hidden,false);
});

test('retry discards an interrupted stale response and keeps the newer profile',async t=>{
  let resolveFirst;
  const first=new Promise(resolve=>{resolveFirst=resolve;});
  const h=await page({responses:[
    ()=>first,
    {status:200,body:profile({profile:{parrotId,displayName:'New result',about:'new'}})},
  ]});
  t.after(()=>h.dom.window.close());
  h.document.querySelector('#profile-retry').click();
  await tick();await tick();
  resolveFirst(new Response(JSON.stringify(profile({profile:{parrotId,displayName:'Stale result',about:'old'}})),{status:200}));
  await tick();await tick();
  assert.equal(h.document.querySelector('#profile-name').textContent,'New result');
});

test('transient error exposes focused Retry and activation recovers',async t=>{
  const h=await page({responses:[
    {status:502,body:{error:'temporary'}},
    {status:200,body:profile({profile:{parrotId,displayName:'Recovered',about:'ready'}})},
  ]});
  t.after(()=>h.dom.window.close());
  const retry=h.document.querySelector('#profile-retry');
  assert.equal(h.document.querySelector('#profile-error').hidden,false);
  assert.equal(retry.hidden,false);
  assert.equal(h.document.activeElement,retry);
  retry.click();
  await tick();await tick();
  assert.equal(h.document.querySelector('#profile-content').hidden,false);
  assert.equal(h.document.querySelector('#profile-name').textContent,'Recovered');
});

test('404 unavailable, network retry focus, safe same-origin return and four locale controls',async t=>{
  const h=await page({url:`https://parrot669.com/p/${parrotId}?returnTo=%2Fmessages.html%3Fconversation%3Dabc`,
    responses:[{status:404,body:{error:'Not found'}}]});
  let completion=Promise.resolve();
  t.after(async()=>{try{await completion;}finally{h.dom.window.close();}});
  assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
  assert.equal(h.document.querySelector('#profile-back').getAttribute('href'),'/messages.html?conversation=abc');
  assert.equal(h.document.querySelectorAll('[data-lang]').length,4);
  completion=profileUpdate(h,()=>h.document.querySelector('[data-lang="ru"]').click());
  assert.equal(h.document.documentElement.lang,'ru');
  assert.equal(h.document.querySelector('#profile-back span').textContent,'Назад');
  await completion;
  assert.equal(h.document.querySelector('#profile-loading').hidden,true);
  assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
  assert.equal(h.document.activeElement,h.document.querySelector('#profile-unavailable'));
});

test('locale fixture completion waits for the real unavailable response and DOM commit',async t=>{
  let release,started;
  const pending=new Promise(resolve=>{release=resolve;});
  const requested=new Promise(resolve=>{started=resolve;});
  const h=await page({responses:[{status:404,body:{error:'Not found'}},()=>{started();return pending;}]});
  let completion=Promise.resolve();
  t.after(async()=>{try{await completion;}finally{h.dom.window.close();}});
  completion=profileUpdate(h,()=>h.document.querySelector('[data-lang="ru"]').click());
  await requested;
  try {
    assert.equal(h.document.querySelector('#profile-loading').hidden,false);
    assert.equal(h.document.querySelector('#profile-unavailable').hidden,true);
  } finally {
    release(new Response(JSON.stringify({error:'Not found'}),{status:404}));
  }
  await completion;
  assert.equal(h.document.querySelector('#profile-loading').hidden,true);
  assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
  assert.equal(h.document.activeElement,h.document.querySelector('#profile-unavailable'));
  assert.equal(h.document.documentElement.lang,'ru');
  const reads=h.calls.filter(call=>call.url.startsWith('/api/p/'));
  assert.equal(reads.length,2);
  assert.equal(new URL(reads[1].url,'https://parrot669.com').searchParams.get('language'),'ru');
});

for(const about of ['',null,'line one\n<script>alert(1)</script>','x'.repeat(500)])test('About is optional bounded plain text '+String(about).slice(0,20),async t=>{
  const h=await page({responses:[{status:200,body:profile({profile:{parrotId,displayName:'Anna',about}})}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-about-section').hidden,!about);
  assert.equal(h.document.querySelector('#profile-about script'),null);
  assert.equal(h.document.querySelector('#profile-about').textContent,about || '');
});
for(const body of [null,[],{},profile({profile:{parrotId:'OTHER',displayName:'Wrong'}}),profile({profile:{parrotId,displayName:'Anna',about:'x'.repeat(501)}}),{...profile(),accountId:'private'}])test('consumer rejects malformed/wide/foreign body '+JSON.stringify(body).slice(0,65),async t=>{
  const h=await page({responses:[{status:200,body}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-error').hidden,false);assert.equal(h.document.querySelector('#profile-content').hidden,true);
});
test('public 401 cannot expire an independently refreshed authenticated Core session',async t=>{
  const h=await page({authUser:user(otherId),responses:[{status:401,body:{code:'AUTHENTICATION_REQUIRED',error:'Hidden'}}]});t.after(()=>h.dom.window.close());
  assert.equal(h.window.ParrotCore.session.status,'authenticated');assert.equal(h.window.ParrotCore.session.user.accountId,accountId);
  assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
});
test('session subscription removes stale owner action, a legacy alias is never an owner fact',async t=>{
  const body=profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,responses:[{status:200,body}],authUser:user()});t.after(()=>h.dom.window.close());
  const edit=h.document.querySelector('#profile-edit'),contact=h.document.querySelector('#profile-contact');assert.equal(edit.hidden,false);
  h.window.ParrotCore.session.setUser({...user(otherId),accountId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',profile:{id:otherId,parrotId,displayName:'Other'}});
  assert.equal(edit.hidden,true);assert.equal(contact.hidden,false);
  h.window.ParrotCore.session.setUser(null);assert.equal(edit.hidden,true);
});
test('Retry aborts the earlier public transport and only the new revision may render',async t=>{
  let firstSignal,release;
  const pending=new Promise(resolve=>{release=resolve;});
  const h=await page({responses:[(_url,init)=>{firstSignal=init.signal;return pending;},{status:200,body:profile()}]});t.after(()=>h.dom.window.close());
  h.document.querySelector('#profile-retry').click();await tick();await tick();assert.equal(firstSignal.aborted,true);
  release(new Response(JSON.stringify(profile({profile:{parrotId,displayName:'Late',about:null}})),{status:200}));await tick();
  assert.equal(h.document.querySelector('#profile-name').textContent,'Anna');
});
for(const returnTo of ['https://evil.example/x','//evil.example/x','/\\evil.example/x','javascript:alert(1)'])test('return rejects cross-origin or script navigation '+returnTo,async t=>{
  const h=await page({url:`https://parrot669.com/p/${parrotId}?returnTo=${encodeURIComponent(returnTo)}`,responses:[{status:200,body:profile()}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-back').getAttribute('href'),'/search.html');
});
for(const query of ['debug=1','property=one&property=two','property='])test('invalid page context does not fetch public data '+query,async t=>{
  const h=await page({url:`https://parrot669.com/p/${parrotId}?${query}`});t.after(()=>h.dom.window.close());
  assert.equal(h.calls.filter(c=>c.url.startsWith('/api/p/')).length,0);assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
});
for(const id of ['PAR-OLD','P669-K7M2Q8XZ','p669-aaaa-aaaa-aaaa-aaaa','P669-AAAA-AAAA-AAAA-AAAG',
  ' P669-AAAA-AAAA-AAAA-AAAA','P669-AAAA-AAAA-AAAA-AAAA\n','11111111-1111-4111-8111-111111111111'])
test('noncanonical profile path does not fetch data or recover an alias '+JSON.stringify(id),async t=>{
  const h=await page({url:`https://parrot669.com/p/${encodeURIComponent(id)}`});t.after(()=>h.dom.window.close());
  assert.equal(h.calls.filter(c=>c.url.startsWith('/api/p/')).length,0);
  assert.equal(h.document.querySelector('#profile-unavailable').hidden,false);
});
test('invalid calendar dates are omitted rather than normalized into Contact',async t=>{
  const body=profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}&from=2027-02-30&to=2027-03-05`,responses:[{status:200,body}]});t.after(()=>h.dom.window.close());
  const target=new URL(h.document.querySelector('#profile-contact').href);assert.equal(target.searchParams.has('from'),false);assert.equal(target.searchParams.has('to'),false);
});

test('late owner refresh cannot overwrite a newer authenticated account epoch',async t=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const body=profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,responses:[{status:200,body}],authResponse:()=>pending});t.after(()=>h.dom.window.close());
  h.window.ParrotCore.session.setUser({...user(otherId),accountId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'});
  release(new Response(JSON.stringify(user()),{status:200}));await tick();await tick();
  assert.equal(h.document.querySelector('#profile-edit').hidden,true);assert.equal(h.document.querySelector('#profile-contact').hidden,false);
  assert.equal(h.window.ParrotCore.session.user.parrotId,otherId);
});

const heldResponse=()=>{
  let release;
  const promise=new Promise(resolve=>{release=resolve;});
  return {promise,release:body=>release(new Response(JSON.stringify(body),{status:200}))};
};
const lifetimeEvent=(w,type,persisted=false)=>w.dispatchEvent(new w.PageTransitionEvent(type,{persisted}));
const publicReads=h=>h.calls.filter(call=>call.url.startsWith('/api/p/'));
const authReads=h=>h.calls.filter(call=>call.url==='/api/host/auth/me');
const ownerPayload=()=>profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',
  bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});

test('pagehide aborts a held public read, unsubscribes and ignores its late owner payload',async t=>{
  const held=heldResponse();
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,
    responses:[()=>held.promise],authUser:user(),observeLifecycle:true});
  t.after(()=>{lifetimeEvent(h.window,'pagehide');h.dom.window.close();});
  assert.equal(h.lifecycle.active,1);assert.equal(publicReads(h).length,1);
  const signal=publicReads(h)[0].init.signal;
  lifetimeEvent(h.window,'pagehide');
  assert.equal(signal.aborted,true);
  assert.deepEqual([h.lifecycle.active,h.lifecycle.subscribed,h.lifecycle.disposed],[0,1,1]);
  const before={name:h.document.querySelector('#profile-name').textContent,notifications:h.lifecycle.notifications};
  h.window.ParrotCore.session.setUser({...user(),displayName:'Hidden change'});
  assert.equal(h.lifecycle.notifications,before.notifications);
  held.release(ownerPayload());await tick();await tick();
  assert.equal(h.document.querySelector('#profile-name').textContent,before.name);
  assert.equal(h.document.querySelector('#profile-edit').hidden,true);
  assert.equal(h.document.querySelector('#profile-content').hidden,true);
  assert.equal(publicReads(h).length,1);assert.equal(authReads(h).length,1);
  lifetimeEvent(h.window,'pagehide');assert.equal(h.lifecycle.disposed,1);
});

for(const account of ['same','changed'])test(`persisted return revalidates real Core before ${account}-account owner proof and does not accumulate subscriptions`,async t=>{
  const auth=[heldResponse(),heldResponse()],reads=[heldResponse(),heldResponse()];
  let authCount=0;
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,
    responses:[{status:200,body:ownerPayload()},...reads.map(read=>()=>read.promise)],
    authResponse:()=>++authCount===1 ? new Response(JSON.stringify(user()),{status:200}) : auth[authCount-2].promise,
    observeLifecycle:true});
  t.after(()=>{lifetimeEvent(h.window,'pagehide');h.dom.window.close();});
  const edit=h.document.querySelector('#profile-edit'),contact=h.document.querySelector('#profile-contact');
  assert.equal(edit.hidden,false);assert.equal(h.lifecycle.active,1);
  for(let cycle=0;cycle<2;cycle++) {
    lifetimeEvent(h.window,'pagehide');
    assert.equal(h.lifecycle.active,0);assert.equal(edit.hidden,true);
    const notifications=h.lifecycle.notifications;
    h.window.ParrotCore.session.setUser({...user(),displayName:`Hidden ${cycle}`});
    assert.equal(h.lifecycle.notifications,notifications);assert.equal(edit.hidden,true);
    const epoch=h.window.ParrotCore.session.epoch;
    lifetimeEvent(h.window,'pageshow',true);
    assert.equal(h.window.ParrotCore.session.status,'checking');
    assert.ok(h.window.ParrotCore.session.epoch>epoch);
    assert.equal(h.window.ParrotCore.session.user,undefined);
    assert.equal(edit.hidden,true);
    assert.deepEqual([h.lifecycle.active,h.lifecycle.subscribed,h.lifecycle.disposed],[1,cycle+2,cycle+1]);
    assert.equal(publicReads(h).length,cycle+2);assert.equal(authReads(h).length,cycle+2);
    reads[cycle].release(ownerPayload());await tick();await tick();
    assert.equal(h.document.querySelector('#profile-content').hidden,false);
    assert.equal(edit.hidden,true,'public payload alone cannot restore stale owner proof');
    const current=account==='same' ? user() : {...user(otherId),accountId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};
    auth[cycle].release(current);await tick();await tick();
    assert.equal(h.window.ParrotCore.session.status,'authenticated');
    assert.equal(h.window.ParrotCore.session.user.accountId,current.accountId);
    assert.equal(edit.hidden,account!=='same');assert.equal(contact.hidden,account==='same');
    const before=h.lifecycle.notifications;
    h.window.ParrotCore.session.updateProfile({displayName:`Current ${cycle}`});
    assert.equal(h.lifecycle.notifications,before+1,'one current subscription, not duplicate callbacks');
    assert.equal(publicReads(h).length,cycle+2);assert.equal(authReads(h).length,cycle+2);
  }
  const settledSignals=publicReads(h).map(call=>call.init.signal);
  assert.equal(settledSignals.length,3);
  assert.ok(settledSignals.every(signal=>!signal.aborted),'all three public reads settled before final pagehide');
  lifetimeEvent(h.window,'pagehide');
  assert.deepEqual([h.lifecycle.active,h.lifecycle.subscribed,h.lifecycle.disposed],[0,3,3]);
  // Real Core HTTP detaches caller abort forwarding once a response settles.
  // The held-read case above separately requires in-flight transport cancellation.
  assert.ok(settledSignals.every(signal=>!signal.aborted),'pagehide does not retroactively abort settled transports');
  const before=h.lifecycle.notifications;h.window.ParrotCore.session.setUser(null);
  assert.equal(h.lifecycle.notifications,before);assert.equal(edit.hidden,true);
});


test('A nullable city renders native label, preserves identity/dates and refetches only the selected locale',async t=>{
  const payload=profile({property:{id:propertyId,title:'Casa',city:null,cityNative:'Барселона',accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}&from=2027-05-01&to=2027-05-05`,
    responses:[{status:200,body:payload},{status:200,body:payload}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-property-title').textContent,'Casa · Барселона');
  const before=h.document.querySelector('#profile-contact').href;
  h.document.querySelector('[data-lang="ru"]').click();await tick();await tick();
  assert.equal(h.document.querySelector('#profile-property-title').textContent,'Casa · Барселона');
  assert.equal(h.document.querySelector('#profile-contact').href,before);
  const requests=h.calls.filter(c=>c.url.startsWith('/api/p/'));
  assert.equal(requests.length,2);const query=new URL(requests[1].url,'https://parrot669.com').searchParams;
  assert.equal(query.get('property'),propertyId);assert.equal(query.get('language'),'ru');
});
test('A a late old-locale projection cannot replace the current identity or name',async t=>{
  let release;
  const pending=new Promise(resolve=>release=resolve);
  const h=await page({responses:[()=>pending,{status:200,body:profile({profile:{parrotId,displayName:'Current RU',about:null}})}]});
  t.after(()=>h.dom.window.close());h.document.querySelector('[data-lang="ru"]').click();await tick();await tick();
  release(new Response(JSON.stringify(profile({profile:{parrotId,displayName:'Late EN',about:null}}))));await tick();await tick();
  assert.equal(h.document.querySelector('#profile-name').textContent,'Current RU');
});


test('flat same-account ParrotId replacement immediately retires public owner controls',async t=>{
  const body=profile({property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',bedrooms:1,sleeps:2,minStayDays:1,listings:[]}});
  const h=await page({url:`https://parrot669.com/p/${parrotId}?property=${propertyId}`,responses:[{status:200,body}],authUser:user()});t.after(()=>h.dom.window.close());
  assert.equal(h.document.querySelector('#profile-edit').hidden,false);
  const session=h.window.ParrotCore.session,epoch=session.epoch;
  session.setUser({...user(otherId),displayName:'Other identity'});
  assert.equal(session.epoch,epoch+1);assert.equal(session.user.accountId,accountId);
  assert.equal(h.document.querySelector('#profile-edit').hidden,true);
  assert.equal(h.document.querySelector('#profile-contact').hidden,false);
});

for(const instagram of [null,'Verified.Name_123','x'.repeat(30),'.','..'])test('public Instagram CORE row '+instagram,async t=>{
  const h=await page({responses:[{status:200,body:profile({profile:{parrotId,displayName:'Anna',about:null,instagram}})}]});t.after(()=>h.dom.window.close());
  const section=h.document.getElementById('profile-instagram-section'),link=h.document.getElementById('profile-instagram');
  assert.equal(section.hidden,instagram===null);assert.equal(link.textContent,instagram?`@${instagram} ↗`:'');
  if(instagram && !['.','..'].includes(instagram)){
    assert.equal(link.href,`https://www.instagram.com/${instagram}/`);assert.equal(link.rel,'noopener noreferrer');assert.equal(link.target,'_blank');
  }else assert.equal(link.hasAttribute('href'),false);
});
for(const instagram of [{userName:'Private',verified:false},'@handle','handle\n','é',true])test('browser rejects private/malformed Instagram '+JSON.stringify(instagram),async t=>{
  const h=await page({responses:[{status:200,body:profile({profile:{parrotId,displayName:'Anna',instagram}})}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.getElementById('profile-error').hidden,false);assert.equal(h.document.getElementById('profile-content').hidden,true);
  assert.equal(h.document.getElementById('profile-instagram').hasAttribute('href'),false);
});
test('Some then public None removes Instagram text and href identically to an absent/unverified account',async t=>{
  const h=await page({responses:[{status:200,body:profile({profile:{parrotId,displayName:'Anna',instagram:'Old.Name'}})},
    {status:200,body:profile({profile:{parrotId,displayName:'Anna',instagram:null}})}]});t.after(()=>h.dom.window.close());
  assert.equal(h.document.getElementById('profile-instagram-section').hidden,false);
  await profileUpdate(h,()=>h.document.getElementById('profile-retry').click());
  assert.equal(h.document.getElementById('profile-instagram-section').hidden,true);
  assert.equal(h.document.getElementById('profile-instagram').textContent,'');assert.equal(h.document.getElementById('profile-instagram').hasAttribute('href'),false);
});
