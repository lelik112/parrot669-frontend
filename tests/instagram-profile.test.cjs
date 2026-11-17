// Authored regression specifications; runtime remains NOT_RUN under the existing guard boundary.
const test=require('node:test'),assert=require('node:assert/strict');
const {createInstagramReader,validInstagram}=require('../public/assets/instagram-profile.js');
const {createHttp}=require('../public/assets/shared/http.js');
const {createSession}=require('../public/assets/shared/session.js');
const {createStorage}=require('../public/assets/shared/storage.js');
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
const user=(parrotId='P669-AAAA-AAAA-AAAA-AAAA',accountId='account-a')=>({accountId,parrotId,displayName:'Owner'});
const response=(body,status=200)=>new Response(JSON.stringify(body),{status});
function fixture(){
  const calls=[],changes=[];let handler=()=>response(null);
  const session=createSession({storage:createStorage({}),http:createHttp({fetch:(path,init)=>{calls.push({path,init});return handler(path,init);}})});
  const reader=createInstagramReader({request:(...args)=>session.request(...args),onChange:s=>changes.push(s)});
  session.subscribe(s=>reader.setSession({accountId:s.user?.accountId,epoch:s.epoch,status:s.status}));session.setUser(user());
  return {session,reader,calls,changes,reply:fn=>handler=fn};
}
test('exact owner None/Some and ASCII username grammar; no normalization/private fields',()=>{
  for(const value of [null,{userName:'Name._123',verified:false},{userName:'A'.repeat(30),verified:true}])assert.equal(validInstagram(value),true);
  for(const name of ['', 'a'.repeat(31),'@name','https://instagram.com/name',' name','name\n','name\r','é','nаme',null,[]])
    assert.equal(validInstagram({userName:name,verified:false}),false,JSON.stringify(name));
  for(const value of [{},{userName:'name'},{userName:'name',verified:'false'},{userName:'name',verified:false,history:[]},
    {userName:'name',verified:false,waiting:true},[],false])assert.equal(validInstagram(value),false);
});
for(const value of [null,{userName:'Some.Name',verified:false},{userName:'Some.Name',verified:true}])
test('real JSON/session boundary adopts exact owner projection '+JSON.stringify(value),async()=>{
  const f=fixture();assert.equal(f.reader.state.value,undefined);f.reply(()=>response(value));
  assert.equal(await f.reader.load(),true);assert.deepEqual(f.reader.state,{phase:'ready',value,busy:false});
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].path,'/api/instagram');assert.equal(f.calls[0].init.method,'GET');
  assert.equal(f.calls[0].init.body,undefined);
});
test('first error is unknown, malformed success rejected, own prior snapshot explicitly stale on failed refresh',async()=>{
  const f=fixture();f.reply(()=>response({userName:'Private',verified:false,history:['CANARY']}));
  assert.equal(await f.reader.load(),false);assert.equal(f.reader.state.phase,'error');assert.equal(f.reader.state.value,undefined);
  f.reply(()=>response({userName:'Own.Name',verified:true}));await f.reader.load();
  f.reply(()=>response({error:'CANARY'},503));assert.equal(await f.reader.load(),false);
  assert.deepEqual(f.reader.state,{phase:'error',value:{userName:'Own.Name',verified:true},busy:false});
  assert.equal(JSON.stringify(f.reader.state).includes('CANARY'),false);assert.equal(f.calls.length,3);
});
for(const [next,status] of [[user('P669-BBBB-BBBB-BBBB-BBBB'),200],[user('P669-BBBB-BBBB-BBBB-BBBB'),401],
  [user('P669-BBBB-BBBB-BBBB-BBBB','account-b'),200],[user('P669-BBBB-BBBB-BBBB-BBBB','account-b'),401]])
test('late old owner '+next.accountId+'/'+status+' cannot paint or expire new identity',async()=>{
  const f=fixture(),held=deferred();f.reply(()=>held.promise);const old=f.reader.load();
  f.session.setUser(next);assert.equal(f.reader.state.value,undefined);
  f.reply(()=>response({userName:'Current',verified:false}));await f.reader.load();
  held.resolve(response(status===200?{userName:'OldPrivate',verified:true}:{error:'expired'},status));await old;
  assert.equal(f.session.status,'authenticated');assert.equal(f.reader.state.value.userName,'Current');
  assert.equal(JSON.stringify(f.changes.at(-1)).includes('OldPrivate'),false);
});
test('metadata notifications preserve in-flight read; duplicate load coalesces without another request',async()=>{
  const f=fixture(),held=deferred();f.reply(()=>held.promise);const work=f.reader.load();
  f.session.updateProfile({displayName:'Renamed'});assert.equal(await f.reader.load(),false);assert.equal(f.calls.length,1);
  held.resolve(response(null));await work;assert.equal(f.reader.state.phase,'ready');assert.equal(f.reader.state.value,null);
});
test('logout/pagehide abort and clear own snapshot; no automatic retry or persistent state',async()=>{
  const f=fixture();f.reply(()=>response({userName:'Own',verified:false}));await f.reader.load();
  const held=deferred();f.reply(()=>held.promise);const pending=f.reader.load();
  const signal=f.calls.at(-1).init.signal;f.reader.setSession({status:'checking',epoch:null});
  assert.equal(signal.aborted,true);assert.deepEqual(f.reader.state,{phase:'anonymous',value:undefined,busy:false});
  held.resolve(response({userName:'Late',verified:true}));await pending;
  assert.equal(f.reader.state.value,undefined);assert.equal(await f.reader.load(),false);assert.equal(f.calls.length,2);
  f.session.setUser(null);assert.equal(f.reader.state.value,undefined);
});
