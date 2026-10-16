const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8').replace('export default {','globalThis.worker = {');
const id='11111111-1111-4111-8111-111111111111';
const env={PUBLIC_ORIGIN:'https://parrot669.com',API_ORIGIN:'https://api.example.test'};
for(const [method,route] of [['GET',`/contact-options/${id}`],['GET','/settings'],['PUT','/settings'],['GET','/notification-settings'],['PUT','/notification-settings'],['GET','/unread'],
  ['GET','/conversations?limit=20&cursor=opaque%2Bcursor'],['POST','/conversations'],['GET',`/conversations/for-property/${id}`],
  ['GET',`/conversations/${id}`],['GET',`/conversations/${id}/messages?afterSequence=20`],['POST',`/conversations/${id}/messages`],
  ['PUT',`/conversations/${id}/read`],['PUT',`/conversations/${id}/block`]]) {
  test(`messaging proxy preserves ${method} ${route}, session cookie and API errors`,async()=>{
    let forwarded;
    const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
      forwarded={url,...init,body:init.body?await new Response(init.body).json():null};
      return new Response(JSON.stringify({error:'participant restriction'}),{status:409});
    }};vm.createContext(sandbox);vm.runInContext(source,sandbox);
    const mutation=method!=='GET',body={blocked:true};
    const result=await sandbox.worker.fetch(new Request('https://parrot669.com/api/messaging'+route,{method,
      headers:{Origin:'https://parrot669.com',Cookie:'unrelated=secret; parrot_session=session-value','Content-Type':'application/json'},
      ...(mutation?{body:JSON.stringify(body)}:{})}),env);
    assert.equal(forwarded.url,'https://api.example.test/api/messaging'+route);
    assert.equal(forwarded.headers.get('Cookie'),'parrot_session=session-value');
    if(mutation)assert.deepEqual(forwarded.body,body);
    assert.equal(result.status,409);assert.equal(result.headers.get('Cache-Control'),'no-store');
    assert.deepEqual(await result.json(),{error:'participant restriction'});
  });
}
test('messaging rejects cross-origin mutations and routes outside its allowlist before fetching',async()=>{
  let calls=0;const sandbox={URL,Headers,Response,console,fetch:async()=>{calls++;throw Error('must not fetch');}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const [route,method,origin,status] of [['/settings','PUT','https://evil.test',403],['/settings','DELETE','https://parrot669.com',404],
    ['/admin','GET','https://parrot669.com',404],[`/conversations/${id}/block`,'POST','https://parrot669.com',404]]) {
    const result=await sandbox.worker.fetch(new Request('https://parrot669.com/api/messaging'+route,{method,headers:{Origin:origin}}),env);
    assert.equal(result.status,status);
  }
  assert.equal(calls,0);
});
