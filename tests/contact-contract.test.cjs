const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8').replace('export default {','globalThis.worker = {');
const valid=()=>({name:'Alex',contact:'alex@example.test',service:'other',message:'Need help'});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};};
function clock(){
  const tasks=new Map();let id=0;
  return {tasks,setTimeout(fn,delay){tasks.set(++id,{fn,delay});return id},clearTimeout(id){tasks.delete(id)},
    expire(){assert.equal(tasks.size,1);const [id,task]=[...tasks][0];assert.equal(task.delay,15000);tasks.delete(id);task.fn();}};
}
function fixture(provider=async()=>new Response('{"id":"synthetic"}',{status:200})){
  const timer=clock(),calls=[],logs=[];
  const context={Request,Response,Headers,URL,AbortController,setTimeout:timer.setTimeout,clearTimeout:timer.clearTimeout,
    console:{error(...args){logs.push(args)}},fetch:async(url,options)=>{
      assert.equal(url,'https://api.resend.com/emails');
      calls.push({email:JSON.parse(options.body),signal:options.signal});
      return provider(url,options);
    }};
  vm.createContext(context);vm.runInContext(source,context);
  const env={PUBLIC_ORIGIN:'https://parrot669.com',NOTIFY_TO:'destination@example.test',
    RESEND_API_KEY:'synthetic-not-a-key',RESEND_FROM:'Fixture <sender@example.test>'};
  return {timer,calls,logs,request:body=>context.worker.fetch(new Request('https://parrot669.com/api/contact',
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env)};
}
for(const [field,limit] of [['name',120],['contact',200],['message',5000]])for(const delta of [-1,0,1]){
  test(`producer ${field} ${limit+delta}: no truncation and no provider call on overflow`,async()=>{
    const h=fixture(),value='x'.repeat(limit+delta),response=await h.request({...valid(),[field]:value});
    assert.equal(response.status,delta>0?400:200);assert.equal(h.calls.length,delta>0?0:1);
    if(delta<=0)assert.ok(h.calls[0].email.text.includes(value));
    assert.equal(h.timer.tasks.size,0);
  });
}
for(const length of [79,80,81])test(`unknown service ${length} is rejected before provider`,async()=>{
  const h=fixture();assert.equal((await h.request({...valid(),service:'x'.repeat(length)})).status,400);assert.equal(h.calls.length,0);
});
const malformed=[null,[],false,123,'text',{},...['name','contact','message'].flatMap(field=>
  ['   ',{},null].map(value=>({...valid(),[field]:value})))];
malformed.forEach((body,index)=>test(`malformed body/field ${index} is rejected before provider`,async()=>{
  const h=fixture();assert.equal((await h.request(body)).status,400);assert.equal(h.calls.length,0);assert.equal(h.timer.tasks.size,0);
}));
test('producer uses trim only, UTF-16 limits, escaped HTML and exact acknowledged text',async()=>{
  const h=fixture(),message='😀'.repeat(2499)+'e\u0301';assert.equal(message.length,5000);
  const response=await h.request({name:'  <Alex>  ',contact:'  alex@example.test  ',service:' other ',message:' \n'+message+' \n'});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
  const email=h.calls[0].email;
  assert.ok(email.text.endsWith(message));assert.match(email.text,/Name: <Alex>\nContact: alex@example.test\nService: other\n/);
  assert.match(email.html,/&lt;Alex&gt;/);assert.equal(email.reply_to,'alex@example.test');assert.equal(h.timer.tasks.size,0);
});
test('provider deadline aborts once, returns unknown and ignores late acceptance without resend',async()=>{
  const wait=deferred(),h=fixture(()=>wait.promise),pending=h.request(valid());await new Promise(setImmediate);
  assert.equal(h.calls.length,1);assert.equal(h.timer.tasks.size,1);h.timer.expire();
  const response=await pending;assert.equal(response.status,504);assert.equal((await response.json()).ok,false);
  assert.equal(h.calls[0].signal.aborted,true);assert.equal(h.timer.tasks.size,0);
  wait.resolve(new Response('{}',{status:200}));await new Promise(setImmediate);assert.equal(h.calls.length,1);
});
test('provider network error is unknown, safe-logged and never retried',async()=>{
  const h=fixture(async()=>{throw new Error('PRIVATE_SUBMITTED_CONTENT')});const response=await h.request(valid());
  assert.equal(response.status,502);assert.equal((await response.json()).ok,false);assert.equal(h.calls.length,1);
  assert.equal(h.timer.tasks.size,0);assert.ok(!JSON.stringify(h.logs).includes('PRIVATE_SUBMITTED_CONTENT'));
});
test('provider rejection is not acceptance and does not expose provider body',async()=>{
  const h=fixture(async()=>new Response('PRIVATE_PROVIDER_BODY',{status:429})),response=await h.request(valid());
  assert.equal(response.status,502);assert.equal((await response.json()).ok,false);assert.equal(h.calls.length,1);
  assert.equal(h.timer.tasks.size,0);assert.ok(!JSON.stringify(h.logs).includes('PRIVATE_PROVIDER_BODY'));
});
test('existing honeypot acceptance never calls provider or starts deadline',async()=>{
  const h=fixture(),response=await h.request({website:'bot'});assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ok:true});assert.equal(h.calls.length,0);assert.equal(h.timer.tasks.size,0);
});
