const test=require('node:test');
const assert=require('node:assert/strict');
const {createProfileEditor,profileSettings,profileValidation}=require('../public/assets/profile-editor.js');
const {HttpError,createHttp}=require('../public/assets/shared/http.js');
const {createSession}=require('../public/assets/shared/session.js');
const {createStorage}=require('../public/assets/shared/storage.js');

const profile=(extra={})=>({parrotId:'P669-AAAA-AAAA-AAAA-AAAA',displayName:'First',about:'Saved',published:false,revision:4,...extra});
test('own settings require the canonical P669 grammar without alias normalization',()=>{
  for(const parrotId of ['PAR-OLD','P669-K7M2Q8XZ','P669-AAAA-AAAA-AAAA-AAAG','P669-AAAA-AAAA-AAAA-AAAI',
    'p669-aaaa-aaaa-aaaa-aaaa',' P669-AAAA-AAAA-AAAA-AAAA','P669-AAAA-AAAA-AAAA-AAAA\n',
    '11111111-1111-4111-8111-111111111111'])assert.equal(profileSettings(profile({parrotId})),false,parrotId);
});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(initial=profile()){
  const calls=[];let handler=()=>initial;
  const editor=createProfileEditor({request:async(path,options)=>{calls.push({path,...options});return handler(path,options);}});
  editor.setSession({accountId:'account-a',epoch:1,status:'authenticated'});
  return {editor,calls,reply:fn=>{handler=fn;},load:()=>editor.load()};
}

test('own snapshot is required before any fields, false visibility or mutation exists',async()=>{
  const f=fixture();assert.equal(f.editor.state.confirmed,null);assert.equal(f.editor.state.draft,null);
  assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,0);
  await f.load();assert.equal(f.editor.state.dirty,false);assert.equal(f.editor.state.confirmed.published,false);
  assert.equal(await f.editor.save(4),false);
});

test('one full atomic PATCH, explicit null clear, exact ACK and no publication/session field changes',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:' New name ',about:''});
  f.reply((path,options)=>{
    assert.equal(path,'/api/host/profile');assert.equal(options.method,'PATCH');assert.equal(options.authenticated,true);
    assert.deepEqual(JSON.parse(options.body),{displayName:' New name ',about:null,expectedRevision:4});
    return {success:true,revision:5};
  });
  assert.equal(await f.editor.save(4),true);
  assert.deepEqual(f.editor.state.confirmed,profile({displayName:' New name ',about:null,revision:5}));
  assert.equal(f.editor.state.dirty,false);assert.equal(f.calls.length,2);
});

test('a newer draft survives a late valid ACK for the exact submitted snapshot',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'Submitted',about:'Sent'});
  const pending=deferred();f.reply(()=>pending.promise);
  const save=f.editor.save(4);assert.equal(f.editor.state.sent.snapshot.displayName,'Submitted');
  f.editor.edit({displayName:'Newer',about:'Unsent'});
  assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,2);
  pending.resolve({success:true,revision:5});assert.equal(await save,true);
  assert.equal(f.editor.state.confirmed.displayName,'Submitted');assert.equal(f.editor.state.draft.displayName,'Newer');
  assert.equal(f.editor.state.dirty,true);assert.equal(f.editor.state.notice,'form.newer.title');
});

test('UTF-16 lengths match exact backend Size[String]; no trimming or character normalization is invented',()=>{
  assert.deepEqual(profileValidation({displayName:'a'.repeat(120),about:'😀'.repeat(250)}),{});
  assert.equal(profileValidation({displayName:'😀'.repeat(61),about:''}).displayName,'form.name.max');
  assert.equal(profileValidation({displayName:'Name',about:'😀'.repeat(251)}).about,'form.about.max');
  assert.equal(profileValidation({displayName:'   ',about:''}).displayName,'form.name.required');
  assert.equal(profileSettings(profile({displayName:' Name ',about:' About '})),true);
  assert.equal(profileSettings(profile({displayName:'bad\nname'})),false);
});

test('validation blocks the whole command, without partially writing the other field',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'',about:'Updated About'});
  assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,1);
  assert.equal(f.editor.state.confirmed.about,'Saved');assert.equal(f.editor.state.errors.displayName,'form.name.required');
  f.editor.edit({displayName:'Valid',about:'x'.repeat(501)});
  assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,1);
});

for(const result of [{success:true},{success:false,revision:5},{success:true,revision:'5'},{success:true,revision:4},
  {success:true,revision:6},{success:true,revision:5,displayName:'Unexpected'},{success:true,revision:2**53}]){
  test(`invalid ACK ${JSON.stringify(result)} remains unknown without promoting the sent data`,async()=>{
    const f=fixture();await f.load();f.editor.edit({displayName:'Sent'});f.reply(()=>result);
    assert.equal(await f.editor.save(4),false);assert.equal(f.editor.state.confirmed.displayName,'First');
    assert.equal(f.editor.state.uncertain.kind,'save');assert.equal(f.editor.state.canWrite,false);
    const count=f.calls.length;assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,count);
  });
}

for(const error of [new HttpError('timeout'),new HttpError('network'),new HttpError('protocol'),new HttpError('http',{status:500})]){
  test(`${error.kind}/${error.status} does not imply definite refusal or permit a blind resend`,async()=>{
    const f=fixture();await f.load();f.editor.edit({displayName:'Draft'});f.reply(()=>{throw error;});
    assert.equal(await f.editor.save(4),false);assert.equal(f.editor.state.notice,'form.unknown.title');
    assert.equal(f.editor.state.draft.displayName,'Draft');assert.equal(f.editor.state.canWrite,false);
    assert.equal(await f.editor.save(4),false);assert.equal(f.calls.length,2);
  });
}

test('readback at the old revision is a snapshot, not settlement, and cannot unlock another write',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'Draft'});f.reply(()=>{throw new HttpError('timeout');});
  await f.editor.save(4);f.reply(()=>profile());await f.load();
  assert.equal(f.editor.state.notice,'form.readback.title');assert.equal(f.editor.state.draft.displayName,'Draft');
  assert.equal(f.editor.state.uncertain.expectedRevision,4);assert.equal(f.editor.state.canWrite,false);
  assert.equal(await f.editor.save(4),false);
});

test('a strictly newer readback provides a CAS barrier, never a causal Save success or automatic replay',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'Draft'});f.reply(()=>{throw new HttpError('network');});await f.editor.save(4);
  f.reply(()=>profile({displayName:'Another writer',revision:5}));await f.load();
  assert.equal(f.editor.state.uncertain,null);assert.equal(f.editor.state.canWrite,true);
  assert.equal(f.editor.state.notice,'form.readback.title');assert.equal(f.editor.state.draft.displayName,'Draft');
  assert.equal(f.calls.filter(c=>c.method==='PATCH').length,1);
  assert.equal(await f.editor.save(4),false,'old rendered revision cannot authorize a new write');
});

test('412 conflict requires a fresh read; draft stays separate from confirmed data',async()=>{
  const f=fixture();await f.load();f.editor.edit({about:'My draft'});f.reply(()=>{throw new HttpError('http',{status:412,code:'PROFILE_STALE'});});
  await f.editor.save(4);assert.equal(f.editor.state.conflict,true);assert.equal(f.editor.state.canWrite,false);
  f.reply(()=>profile({about:'Other author',revision:5}));await f.load();
  assert.equal(f.editor.state.confirmed.about,'Other author');assert.equal(f.editor.state.draft.about,'My draft');assert.equal(f.editor.state.dirty,true);
});

test('known definite 400 rejection keeps the exact draft and permits only an explicit corrected save',async()=>{
  const f=fixture();await f.load();f.editor.edit({about:'Unsupported\ncontrol'});
  f.reply((_path,options)=>{assert.equal(JSON.parse(options.body).about,'Unsupported\ncontrol');throw new HttpError('http',{status:400});});
  await f.editor.save(4);assert.equal(f.editor.state.notice,'form.refused.title');assert.equal(f.editor.state.uncertain,null);
  assert.equal(f.editor.state.draft.about,'Unsupported\ncontrol');assert.equal(f.editor.state.confirmed.about,'Saved');assert.equal(f.calls.length,2);
});

test('only saved allowlisted person data enters private preview, never account/identity/draft/property',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'Unsent secret'});
  f.reply((path,options)=>{assert.equal(path,'/api/host/public-profile/preview');assert.equal(options.method,undefined);return {profile:profile(),property:null};});
  await f.editor.openPreview();assert.equal(f.editor.state.preview.profile.displayName,'First');
  assert.deepEqual(Object.keys(f.editor.state.preview.profile).sort(),['about','displayName','parrotId','published','revision']);
  assert.equal(f.editor.state.draft.displayName,'Unsent secret');assert.equal(f.calls.filter(c=>c.method).length,0);
});

for(const body of [{profile:profile({email:'private@example.invalid'}),property:null},{profile:profile(),property:{id:'not-selected'}},
  {profile:profile(),property:null,accountId:'private'}])test('unexpected preview shape fails locally without private fallback',async()=>{
  const f=fixture();await f.load();f.reply(()=>body);assert.equal(await f.editor.openPreview(),false);
  assert.equal(f.editor.state.preview.phase,'error');assert.equal(f.editor.state.preview.profile,null);assert.equal(f.editor.state.draft.displayName,'First');
});

test('Publish is separate explicit consent tied to the exact saved preview and shared revision',async()=>{
  const f=fixture();await f.load();assert.equal(await f.editor.publish(4),false);assert.equal(f.calls.length,1);
  f.reply(()=>({profile:profile(),property:null}));await f.editor.openPreview({review:true});
  f.reply((path,options)=>{assert.equal(path,'/api/host/public-profile/publish');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{expectedRevision:4});return {success:true,revision:5};});
  assert.equal(await f.editor.publish(4),true);assert.equal(f.editor.state.confirmed.published,true);
  assert.equal(f.editor.state.confirmed.displayName,'First');assert.equal(f.calls.filter(c=>c.method==='PATCH').length,0);
});

test('dirty blocks publication; new saved data invalidates a prior review instead of silently publishing it',async()=>{
  const f=fixture();await f.load();f.editor.edit({about:'Dirty'});
  assert.equal(await f.editor.openPreview({review:true}),false);assert.equal(f.calls.length,1);f.editor.discard();
  f.reply(()=>({profile:profile(),property:null}));await f.editor.openPreview({review:true});
  f.reply(()=>profile({displayName:'Changed',revision:5}));await f.load();
  assert.equal(await f.editor.publish(5),false);assert.equal(f.editor.state.notice,'preview.changed');
  assert.equal(f.calls.filter(c=>c.method).length,0);
});

test('Hide is fenced, remains available with dirty text, and neither saves nor discards it',async()=>{
  const f=fixture(profile({published:true}));await f.load();f.editor.edit({about:'Unsent'});
  f.reply((_path,options)=>{assert.equal(options.method,'DELETE');assert.deepEqual(JSON.parse(options.body),{expectedRevision:4});return {success:true,revision:5};});
  assert.equal(await f.editor.hide(3),false);assert.equal(await f.editor.hide(4),true);
  assert.equal(f.editor.state.confirmed.published,false);assert.equal(f.editor.state.confirmed.about,'Saved');assert.equal(f.editor.state.draft.about,'Unsent');assert.equal(f.editor.state.dirty,true);
});

for(const published of [false,true])test('visibility unknown preserves only last-confirmed state and allows read recovery, not replay',async()=>{
  const f=fixture(profile({published}));await f.load();
  if(!published){f.reply(()=>({profile:profile(),property:null}));await f.editor.openPreview({review:true});}
  f.reply(()=>{throw new HttpError('timeout');});await (published?f.editor.hide(4):f.editor.publish(4));
  assert.equal(f.editor.state.uncertain.kind,published?'hide':'publish');assert.equal(f.editor.state.confirmed.published,published);
  const count=f.calls.length;assert.equal(await f.editor.hide(4),false);assert.equal(await f.editor.publish(4),false);assert.equal(f.calls.length,count);
});

test('no stale own read or ACK can repopulate private state after session/account change',async()=>{
  for(const command of ['read','save','preview']){
    const f=fixture();if(command!=='read')await f.load();
    const wait=deferred();f.reply(()=>wait.promise);
    if(command==='save')f.editor.edit({displayName:'Old account draft'});
    const pending=command==='read'?f.load():command==='save'?f.editor.save(4):f.editor.openPreview();
    f.editor.setSession({accountId:'account-b',epoch:2,status:'authenticated'});
    assert.equal(f.editor.state.draft,null);assert.equal(f.editor.state.confirmed,null);
    wait.resolve(command==='read'?profile():command==='save'?{success:true,revision:5}:{profile:profile(),property:null});
    assert.equal(await pending,false);assert.equal(f.editor.state.confirmed,null);assert.equal(f.editor.state.draft,null);
  }
});

test('expiry and same-account revalidation clear private editor memory; no login replay is scheduled',async()=>{
  const f=fixture();await f.load();f.editor.edit({displayName:'Private draft'});
  f.editor.setSession({status:'expired',epoch:2});assert.equal(f.editor.state.draft,null);assert.equal(f.editor.state.phase,'anonymous');
  const count=f.calls.length;f.editor.setSession({accountId:'account-a',status:'authenticated',epoch:3});assert.equal(f.calls.length,count);
  await f.load();assert.equal(f.editor.state.draft.displayName,'First');assert.equal(f.calls.filter(c=>c.method).length,0);
  f.editor.setSession({status:'unavailable',epoch:4});assert.equal(f.editor.state.phase,'load-error');
});

test('shared HTTP/session integration rejects late 401 from the old account without expiring the new user',async()=>{
  const wait=deferred(),storage=createStorage({});let delayed=false;
  const session=createSession({storage,http:createHttp({fetch:async()=>delayed?wait.promise:new Response(JSON.stringify(profile()),{headers:{'Content-Type':'application/json'}})})});
  session.setUser({accountId:'account-a',parrotId:'P669-AAAA-AAAA-AAAA-AAAA'});
  const editor=createProfileEditor({request:(...args)=>session.request(...args)});
  session.subscribe(s=>editor.setSession({accountId:s.user?.accountId,epoch:s.epoch,status:s.status}));
  await editor.load();editor.edit({displayName:'Old'});delayed=true;const saving=editor.save(4);
  session.setUser({accountId:'account-b',parrotId:'P669-BBBB-BBBB-BBBB-BBBB'});wait.resolve(new Response('{}',{status:401}));
  assert.equal(await saving,false);assert.equal(session.user.accountId,'account-b');assert.equal(editor.state.draft,null);
});

test('same-account P669 replacement retires private editor drafts and late save ACK',async()=>{
  const wait=deferred();let delayed=false;
  const session=createSession({storage:createStorage({}),http:createHttp({fetch:async()=>delayed?wait.promise
    :new Response(JSON.stringify(profile()),{headers:{'Content-Type':'application/json'}})})});
  session.setUser({accountId:'account-a',parrotId:'P669-AAAA-AAAA-AAAA-AAAA'});
  const editor=createProfileEditor({request:(...args)=>session.request(...args)});
  session.subscribe(s=>editor.setSession({accountId:s.user?.accountId,epoch:s.epoch,status:s.status}));
  await editor.load();editor.edit({displayName:'Private old draft'});delayed=true;const saving=editor.save(4);
  session.setUser({accountId:'account-a',parrotId:'P669-BBBB-BBBB-BBBB-BBBB'});
  assert.equal(editor.state.confirmed,null);assert.equal(editor.state.draft,null);
  wait.resolve(new Response(JSON.stringify({success:true,revision:5})));
  assert.equal(await saving,false);assert.equal(editor.state.confirmed,null);assert.equal(editor.state.draft,null);
  assert.equal(session.user.parrotId,'P669-BBBB-BBBB-BBBB-BBBB');
});

test('older/same-revision inconsistent reads and unsafe JSON revisions cannot become writable snapshots',async()=>{
  for(const wrong of [profile({revision:3}),profile({displayName:'Different',revision:4})]){
    const f=fixture();await f.load();f.editor.edit({about:'Kept'});f.reply(()=>wrong);assert.equal(await f.load(),false);
    assert.equal(f.editor.state.confirmed.revision,4);assert.equal(f.editor.state.draft.about,'Kept');
  }
  assert.equal(profileSettings(profile({revision:'4'})),false);assert.equal(profileSettings(profile({revision:2**53})),false);
  const f=fixture(profile({revision:Number.MAX_SAFE_INTEGER}));await f.load();assert.equal(f.editor.state.canWrite,false);
});
