const test=require('node:test');
const assert=require('node:assert/strict');
const {createHttp,HttpError}=require('../public/assets/shared/http.js');
const {createStorage}=require('../public/assets/shared/storage.js');
const {createSession}=require('../public/assets/shared/session.js');
const {createAuth}=require('../public/assets/shared/auth.js');
const worker=require('../src/index.js').default;
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers});
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};};
const user=(account='account-a',name='First')=>({accountId:account,username:name,parrotId:account==='account-a'?'P669-AAAA-AAAA-AAAA':'P669-BBBB-BBBB-BBBB',displayName:name});
const root=()=>({});

test('PM094 canonical profile grammar rejects aliases, coercion and normalization',()=>{
  const {isParrotId}=require('../public/assets/shared/identity.js');
  for(const value of ['P669-AAAA-AAAA-AAAA','P669-Z999-2345-6HJK'])assert.equal(isParrotId(value),true);
  for(const value of [null,undefined,{},['P669-AAAA-AAAA-AAAA'],123,'PAR-OLD',
    '11111111-1111-4111-8111-111111111111','p669-aaaa-aaaa-aaaa',
    ' P669-AAAA-AAAA-AAAA','P669-AAAA-AAAA-AAAA ','P669-AAAA-AAAA-AAAA\n',
    'P669-AAAA-AAAA-AAAI','P669-AAAA-AAAA-AAAO','P669-AAAA-AAAA-AAA1','P669-AAAA-AAAA-AAA0',
    'P669-AAAA-AAAA-AAA','P669-AAAA-AAAA-AAAAA','P669-ＡAAA-AAAA-AAAA'])
    assert.equal(isParrotId(value),false,JSON.stringify(value));
});

test('PM094 same-account ParrotId changes retire in-flight responses without clearing drafts',async()=>{
  for(const next of ['P669-BBBB-BBBB-BBBB','P669-CCCC-CCCC-CCCC'])for(const status of [200,401]){
    const wait=defer(),storage=createStorage(root());
    const session=createSession({http:createHttp({fetch:()=>wait.promise}),storage});
    session.setUser(user());const epoch=session.epoch;
    const draft=JSON.stringify({body:'Unconfirmed',pending:{payload:{clientMessageId:'same-key'}}});
    storage.session.setItem('parrot669-draft:account-a:thread',draft);
    const old=session.request('/private',{authenticated:true});
    session.setUser({...user(),parrotId:next});
    assert.equal(session.epoch,epoch+1);
    wait.resolve(response(status===200?{private:'old'}:{error:'expired'},status));
    await assert.rejects(old,{kind:'stale'});
    assert.equal(session.status,'authenticated');assert.equal(session.user.parrotId,next);
    assert.equal(storage.session.getItem('parrot669-draft:account-a:thread'),draft);
    session.setUser(user());assert.equal(session.epoch,epoch+2,'A to B to A must remain a new epoch');
  }
});


test('flat AuthUser rejects missing/malformed identity without disturbing the current epoch or request',async()=>{
  const wait=defer(),storage=createStorage(root());
  const session=createSession({http:createHttp({fetch:()=>wait.promise}),storage});
  const current=user();session.setUser(current);const epoch=session.epoch;
  storage.session.setItem('parrot669-draft:account-a:thread','private');
  const pending=session.request('/private',{authenticated:true});
  for(const value of [{accountId:'account-a',profile:{id:current.parrotId}},
    ...[undefined,null,'',' ',[],current.accountId,'p669-aaaa-aaaa-aaaa'].map(parrotId=>({...current,parrotId}))]){
    assert.throws(()=>session.setUser(value),{kind:'protocol'});
    assert.equal(session.user,current);assert.equal(session.epoch,epoch);
    assert.equal(session.status,'authenticated');
    assert.equal(storage.session.getItem('parrot669-draft:account-a:thread'),'private');
  }
  wait.resolve(response({private:'current'}));assert.deepEqual(await pending,{private:'current'});
});

for(const status of [401,403,404,409,429,500,502,503])test(`HTTP preserves status/code/error/requestId ${status}`,async()=>{
  const http=createHttp({fetch:async()=>response({code:'SOME_FUTURE_CODE',error:'Safe text',requestId:'body-id'},status,{'X-Request-ID':'header-id'})});
  await assert.rejects(http('/api'),e=>e instanceof HttpError&&e.kind==='http'&&e.status===status&&e.code==='SOME_FUTURE_CODE'&&e.error==='Safe text'&&e.requestId==='body-id');
});

test('HTTP merges caller Headers, passes cancellation and does not mutate caller input',async()=>{
  const caller=new AbortController(),headers=new Headers({'X-Test':'yes','Content-Type':'application/custom'});
  let received;
  const http=createHttp({fetch:async(path,init)=>{received=init;return response({ok:true});}});
  await http('/api',{method:'POST',body:'{}',headers,signal:caller.signal});
  assert.equal(received.headers.get('X-Test'),'yes');assert.equal(received.headers.get('Content-Type'),'application/custom');
  assert.equal(received.headers.get('Accept'),'application/json');assert.equal(headers.has('Accept'),false);
  assert.notEqual(received.signal,caller.signal);assert.equal(received.credentials,'same-origin');
});

test('HTTP accepts 204 only for an explicitly empty contract',async()=>{
  const http=createHttp({fetch:async()=>new Response(null,{status:204})});
  assert.equal(await http('/delete',{expected:'empty'}),null);
  await assert.rejects(http('/list'),{kind:'protocol',status:204});
  await assert.rejects(createHttp({fetch:async()=>response({})})('/delete',{expected:'empty'}),{kind:'protocol'});
});

test('malformed JSON and wrong successful DTO are protocol errors with requestId',async()=>{
  await assert.rejects(createHttp({fetch:async()=>new Response('broken',{headers:{'X-Request-ID':'r'}})})('/api'),{kind:'protocol',requestId:'r'});
  await assert.rejects(createHttp({fetch:async()=>response({items:[]})})('/api',{validate:Array.isArray}),{kind:'protocol'});
  await assert.rejects(createHttp({fetch:async()=>response(null)})('/api'),{kind:'protocol'});
  assert.equal(await createHttp({fetch:async()=>response(null)})('/optional',{validate:v=>v===null}),null);
});

test('network failures remain distinct from HTTP and protocol errors',async()=>{
  await assert.rejects(createHttp({fetch:async()=>{throw new TypeError('offline');}})('/api'),{kind:'network',status:0});
  await assert.rejects(createHttp({fetch:async()=>new Response('not json',{status:502,headers:{'X-Request-ID':'upstream'}})})('/api'),{kind:'http',status:502,requestId:'upstream'});
});

test('deadline covers body consumption, aborts once, cleans timer and never retries POST',async()=>{
  let calls=0,fire,cleared=0,signal;
  const http=createHttp({fetch:async(p,init)=>{calls++;signal=init.signal;return {status:200,ok:true,headers:new Headers(),json:()=>new Promise(()=>{})};},
    setTimeout:fn=>{fire=fn;return 17;},clearTimeout:id=>{assert.equal(id,17);cleared++;}});
  const pending=http('/api',{method:'POST',body:'{}'});await Promise.resolve();fire();
  await assert.rejects(pending,{kind:'timeout'});assert.equal(signal.aborted,true);assert.equal(calls,1);assert.equal(cleared,1);
});

test('caller abort before and during fetch is distinguished and listener is removed',async()=>{
  const before=new AbortController();before.abort();let calls=0;
  const http=createHttp({fetch:async()=>{calls++;return new Promise(()=>{});}});
  await assert.rejects(http('/api',{signal:before.signal}),{kind:'abort'});assert.equal(calls,0);
  const during=new AbortController();let added=0,removed=0;
  const signal={get aborted(){return during.signal.aborted;},addEventListener(...a){added++;during.signal.addEventListener(...a);},removeEventListener(...a){removed++;during.signal.removeEventListener(...a);}};
  const pending=http('/api',{signal});during.abort();await assert.rejects(pending,{kind:'abort'});
  assert.equal(added,1);assert.equal(removed,1);assert.equal(calls,1);
});

test('successful request cleans deadline and caller listener',async()=>{
  let clear=0,remove=0;
  const signal={aborted:false,addEventListener(){},removeEventListener(){remove++;}};
  await createHttp({fetch:async()=>response({}),setTimeout:()=>4,clearTimeout:id=>{assert.equal(id,4);clear++;}})('/api',{signal});
  assert.equal(clear,1);assert.equal(remove,1);
});

test('late response and late 401 from the previous account cannot update or expire the new identity',async()=>{
  for(const status of [200,401]){
    const wait=defer(),storage=createStorage(root());
    const session=createSession({http:createHttp({fetch:()=>wait.promise}),storage});
    session.setUser(user());const pending=session.request('/private',{authenticated:true});
    session.setUser(user('account-b'));wait.resolve(response(status===200?{private:'old'}:{code:'AUTHENTICATION_REQUIRED',error:'expired'},status));
    await assert.rejects(pending,{kind:'stale'});assert.equal(session.user.accountId,'account-b');
  }
});

test('same account profile update notifies without changing identity epoch; IDs are distinct',()=>{
  const session=createSession({http:()=>{},storage:createStorage(root())});const updates=[];
  const unsubscribe=session.subscribe(s=>updates.push(s));session.setUser(user());const epoch=session.epoch;
  session.updateProfile({displayName:'Updated',accountId:'injected',parrotId:'P669-CCCC-CCCC-CCCC',id:'P669-CCCC-CCCC-CCCC',profile:{id:'P669-CCCC-CCCC-CCCC'}});assert.equal(session.epoch,epoch);assert.equal(updates.length,2);
  assert.equal(session.user.displayName,'Updated');assert.equal(session.user.accountId,'account-a');
  assert.equal(session.user.parrotId,'P669-AAAA-AAAA-AAAA');assert.equal(Object.hasOwn(session.user,'profile'),false);assert.notEqual(session.user.accountId,session.user.parrotId);
  for(const value of [null,[],{}, {id:'P669-BBBB-BBBB-BBBB'}, {displayName:null}])session.updateProfile(value);
  assert.equal(session.epoch,epoch);assert.equal(updates.length,2);assert.equal(session.user.displayName,'Updated');
  unsubscribe();session.setUser(user('b'));assert.equal(updates.length,2);
});

for(const [from,to] of [['P669-AAAA-AAAA-AAAA','P669-BBBB-BBBB-BBBB'],['P669-BBBB-BBBB-BBBB','P669-AAAA-AAAA-AAAA']])
for(const outcome of ['success','401','network'])test(`PM094 refresh fences same-account ${from} to ${to}: ${outcome}`,async()=>{
  const old=defer(),current=defer();let calls=0;
  const session=createSession({http:()=>++calls===1?old.promise:current.promise,storage:createStorage(root())});
  const identity=id=>({...user(),parrotId:id,displayName:'Current'});
  session.setUser(identity(from));const epoch=session.epoch,stale=session.refresh();
  session.setUser(identity(to));assert.equal(session.epoch,epoch+1);
  const fresh=session.refresh();assert.equal(calls,2);
  if(outcome==='success')old.resolve(identity(from));
  else old.resolve(Promise.reject(new HttpError(outcome==='401'?'http':'network',{status:outcome==='401'?401:0})));
  await stale;
  assert.equal(session.status,'authenticated');assert.equal(session.user.parrotId,to);
  const coalesced=session.refresh();assert.equal(calls,2,'old finally must not release the current refresh');
  current.resolve(identity(to));await Promise.all([fresh,coalesced]);
  assert.equal(session.epoch,epoch+1);assert.equal(session.user.parrotId,to);
});

test('session schema errors are not anonymous; network failure is not expiry',async()=>{
  for(const data of [{},{accountId:'a',profile:{}},{accountId:'a',profile:{id:'P669-AAAA-AAAA-AAAA'}},null,
    ...[undefined,null,'',' ',[],123,'11111111-1111-4111-8111-111111111111','p669-aaaa-aaaa-aaaa'].map(parrotId=>({...user(),parrotId}))]){
    const session=createSession({http:createHttp({fetch:async()=>response(data)}),storage:createStorage(root())});
    await assert.rejects(session.refresh(),{kind:'protocol'});assert.equal(session.status,'unavailable');assert.equal(session.user,undefined);
  }
  const session=createSession({http:async()=>{throw new HttpError('network');},storage:createStorage(root())});
  session.setUser(user());await assert.rejects(session.refresh(),{kind:'network'});assert.equal(session.user.accountId,'account-a');
});

test('concurrent refresh coalesces and a stale me response cannot replace a newer login',async()=>{
  let count=0;const wait=defer();const session=createSession({http:()=>{count++;return wait.promise;},storage:createStorage(root())});
  const first=session.refresh(),second=session.refresh();session.setUser(user('b'));wait.resolve(user('a'));
  await Promise.all([first,second]);assert.equal(count,1);assert.equal(session.user.accountId,'b');
});

test('expiry hides the session and retains drafts; same user restores, changed user and explicit logout clear',async()=>{
  const storage=createStorage(root());let value=user();const session=createSession({http:async()=>value,storage});
  session.setUser(user());storage.session.setItem('parrot669-draft:account-a:thread','secret');
  session.setUser(null,{reason:'expired'});assert.equal(session.user,null);assert.equal(session.status,'expired');
  assert.equal(storage.session.getItem('parrot669-draft:account-a:thread'),'secret');
  session.setUser(user());assert.equal(storage.session.getItem('parrot669-draft:account-a:thread'),'secret');
  session.setUser(user('b'));assert.equal(storage.session.getItem('parrot669-draft:account-a:thread'),null);
  storage.session.setItem('parrot669-draft:b:thread','private');session.setUser(null,{reason:'logout'});
  assert.equal(storage.session.getItem('parrot669-draft:b:thread'),null);
});

test('BFCache revalidation hides identity synchronously before me resolves',async()=>{
  const wait=defer(),events=[];const session=createSession({http:()=>wait.promise,storage:createStorage(root())});
  session.setUser(user());session.subscribe(state=>events.push(state));const pending=session.revalidate();
  assert.equal(session.user,undefined);assert.equal(session.status,'checking');assert.equal(events.at(-1).user,undefined);
  wait.resolve(user());await pending;assert.equal(session.user.accountId,'account-a');
});

test('storage access/quota/removal failures preserve main operations and tombstone private drafts',async()=>{
  const backing={getItem:()=> 'old-private',setItem(){throw Error('quota');},removeItem(){throw Error('blocked');},length:1,key:()=> 'parrot669-draft:a:thread'};
  const storage=createStorage({get localStorage(){throw Error('denied');},sessionStorage:backing});
  storage.local.setItem('lang','ru');assert.equal(storage.local.getItem('lang'),'ru');
  storage.clearPrivate('a');assert.equal(storage.session.getItem('parrot669-draft:a:thread'),null);
  await createHttp({fetch:async()=>response({ok:true})})('/api');
});

test('auth rejection cannot expire a working session; logout clears through the shared controller',async()=>{
  let result=response({error:'bad login',code:'INVALID_REQUEST'},401);
  const storage=createStorage(root()),session=createSession({http:createHttp({fetch:async()=>result}),storage});
  const auth=createAuth(session);session.setUser(user());await assert.rejects(auth('/login',{method:'POST',body:'{}'}),{status:401});
  assert.equal(session.user.accountId,'account-a');result=new Response(null,{status:204});
  await auth('/logout',{method:'POST'});assert.equal(session.status,'anonymous');assert.equal(session.user,null);
});

test('PM138 R3: auth logout/recovery-confirm are empty; login/reset-request are JSON',async()=>{
  const session=createSession({http:createHttp({fetch:async()=>new Response(null,{status:204})}),storage:createStorage(root())});
  const auth=createAuth(session);
  assert.equal(await auth('/logout',{method:'POST'}),null);
  assert.equal(await auth('/password-reset/confirm',{method:'POST',body:'{}'}),null);
  for(const path of ['/login','/password-reset/request','/verify-email','/me'])
    await assert.rejects(auth(path,{method:'POST',body:'{}'}),{kind:'protocol',status:204});
  for(const path of ['/logout','/password-reset/confirm'])
    await assert.rejects(auth(path),{kind:'protocol',status:204});
});

test('real imported Worker preserves upstream diagnostics and rejects unknown API/origin/QA requests',async()=>{
  const original=globalThis.fetch,seen=[];
  globalThis.fetch=async(url,init)=>{seen.push({url,init});return response({error:'safe',code:'CONFLICT',requestId:'r'},409,{'X-Request-ID':'r','Retry-After':'3','X-Private':'hidden'});};
  const env={PUBLIC_ORIGIN:'https://site.example.test',API_ORIGIN:'https://backend.example.test',QA_HOSTNAMES:'qa.example.test',QA_WORKER_SECRET:'synthetic-qa-value-long-enough-for-tests',ASSETS:{fetch(){throw Error('API reached assets');}}};
  try {
    const result=await worker.fetch(new Request('https://site.example.test/api/host/dashboard',{headers:{Cookie:'parrot_session=synthetic; unrelated=private','X-Parrot-QA-Worker':'forged'}}),env);
    assert.equal(result.status,409);assert.equal(result.headers.get('X-Request-ID'),'r');assert.equal(result.headers.get('Retry-After'),'3');assert.equal(result.headers.has('X-Private'),false);
    assert.equal(seen[0].init.headers.get('Cookie'),'parrot_session=synthetic');assert.equal(seen[0].init.headers.has('X-Parrot-QA-Worker'),false);
    const missing=await worker.fetch(new Request('https://site.example.test/api/not-allowed'),env);assert.equal(missing.status,404);assert.equal((await missing.json()).code,'NOT_FOUND');
    assert.equal((await worker.fetch(new Request('https://other.example.test/api/host/dashboard'),env)).status,403);
    assert.equal((await worker.fetch(new Request('https://site.example.test/api/host/auth/login',{method:'POST',headers:{Origin:'https://foreign.example.test'}}),env)).status,403);
    assert.equal((await worker.fetch(new Request('https://qa.example.test/api/host/dashboard'),{...env,QA_WORKER_SECRET:''})).status,503);
    assert.equal((await worker.fetch(new Request('https://qa.example.test/api/contact',{method:'POST'}),env)).status,403);
    const http=createHttp({fetch:(path,init)=>worker.fetch(new Request('https://site.example.test'+path,init),env)});
    await assert.rejects(http('/api/host/dashboard'),{kind:'http',status:409,code:'CONFLICT',requestId:'r'});
  } finally {globalThis.fetch=original;}
});


test('A empty success is exact-status and exact-body, with opt-in 201 reserved for a named contract',async()=>{
  for(const status of [200,201,202])await assert.rejects(
    createHttp({fetch:async()=>new Response(null,{status})})('/command',{expected:'empty'}),{kind:'protocol',status});
  assert.equal(await createHttp({fetch:async()=>new Response(null,{status:201})})('/named-create',{expected:'empty',successStatus:201}),null);
  for(const body of ['null','{}',' '])await assert.rejects(
    createHttp({fetch:async()=>new Response(body,{status:201})})('/named-create',{expected:'empty',successStatus:201}),{kind:'protocol',status:201});
  await assert.rejects(createHttp({fetch:async()=>new Response(null,{status:204})})('/named-create',{expected:'empty',successStatus:201}),{kind:'protocol',status:204});
  await assert.rejects(createHttp({fetch:async()=>new Response(null,{status:201})})('/json-default'),{kind:'protocol',status:201});
});
test('A empty ACK body read remains under the deadline and never resends the write',async()=>{
  let calls=0,fire,clears=0,signal;
  const http=createHttp({fetch:async(_path,init)=>{calls++;signal=init.signal;return {ok:true,status:204,text:()=>new Promise(()=>{})};},
    setTimeout:fn=>{fire=fn;return 1;},clearTimeout:()=>{clears++;}});
  const pending=http('/command',{method:'PATCH',expected:'empty'});await Promise.resolve();fire();
  await assert.rejects(pending,{kind:'timeout'});assert.equal(signal.aborted,true);assert.equal(calls,1);assert.equal(clears,1);
});


test('A explicit JSON success status rejects the wrong successful status without weakening DTO validation',async()=>{
  assert.deepEqual(await createHttp({fetch:async()=>response({id:'created'},201)})('/create',{successStatus:201}),{id:'created'});
  await assert.rejects(createHttp({fetch:async()=>response({id:'created'},200)})('/create',{successStatus:201}),{kind:'protocol',status:200});
  await assert.rejects(createHttp({fetch:async()=>response(null,201)})('/create',{successStatus:201}),{kind:'protocol',status:201});
  await assert.rejects(createHttp({fetch:async()=>response({},201)})('/read',{successStatus:200}),{kind:'protocol',status:201});
});
