const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8')
  .replace('export default {','globalThis.worker = {');
const id='11111111-1111-4111-8111-111111111111';
const baseEnv={PUBLIC_ORIGIN:'https://parrot669.com',API_ORIGIN:'https://api.example.test'};
const qaEnv={...baseEnv,QA_HOSTNAMES:'preview.example.test',
  QA_WORKER_SECRET:'test-worker-secret-with-at-least-thirty-two-characters'};

test('host profile PATCH reaches the backend route on production and QA origins', async () => {
  const calls=[];
  const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,init,body:await new Response(init.body).json()});
    return new Response(JSON.stringify({displayName:'New host'}),{status:200});
  }};
  vm.createContext(sandbox); vm.runInContext(source,sandbox);
  for (const host of ['parrot669.com','preview.example.test']) {
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host/profile`,{
      method:'PATCH',headers:{Origin:`https://${host}`,Cookie:'parrot_session=test-session','Content-Type':'application/json'},
      body:JSON.stringify({displayName:'New host'})
    }),qaEnv);
    assert.equal(response.status,200);
  }
  for (const {url,init,body} of calls) {
    assert.equal(url,'https://api.example.test/api/host/profile');
    assert.equal(init.method,'PATCH');
    assert.equal(init.headers.get('Cookie'),'parrot_session=test-session');
    assert.deepEqual(body,{displayName:'New host'});
  }
  assert.equal(calls[0].init.headers.get('X-Parrot-QA-Origin'),null);
  assert.equal(calls[1].init.headers.get('X-Parrot-QA-Origin'),'qa');
});

test('address autocomplete proxy preserves encoded query, session and provider error status', async () => {
  let forwarded;
  const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
    forwarded={url,...init};
    return new Response(JSON.stringify({error:'Address autocomplete is temporarily unavailable'}),{status:503});
  }};
  vm.createContext(sandbox); vm.runInContext(source,sandbox);
  const query='?type=street&country=ES&cityId=locationiq%3A323126006243&city=Barcelona&bounds=2.05%2C41.31%2C2.23%2C41.47&q=alfo';
  const response=await sandbox.worker.fetch(new Request('https://parrot669.com/api/host/geocode/autocomplete'+query,{
    headers:{Cookie:'other=secret; parrot_session=test-session'}
  }),baseEnv);
  assert.equal(response.status,503);
  assert.equal(forwarded.url,'https://api.example.test/api/geocode/autocomplete'+query);
  assert.equal(forwarded.headers.get('Cookie'),'parrot_session=test-session');
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.match((await response.json()).error,/unavailable/);
});

for (const [method,route,status] of [
  ['GET','/geocode/countries',200],
  ['GET',`/calendars/${id}/verification`,200],
  ['POST',`/calendars/${id}/verification/start`,429],
  ['POST',`/calendars/${id}/verification/check`,409],
  ['POST',`/calendars/${id}/verification/cancel`,200],
  ['GET',`/properties/${id}/unavailability`,200],
  ['POST',`/properties/${id}/unavailability`,409],
  ['PUT',`/unavailability/${id}`,400],
  ['DELETE',`/unavailability/${id}`,204]
]) {
  test(`manual blocks proxy forwards ${method} and HTTP ${status}`, async () => {
    let forwarded;
    const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
      forwarded={url,...init,body:init.body?await new Response(init.body).json():null};
      return new Response(status===204?null:JSON.stringify({error:'range error'}),{status});
    }};
    vm.createContext(sandbox); vm.runInContext(source,sandbox);
    const body={from:'2030-04-10',to:'2030-04-15'};
    const req=new Request('https://parrot669.com/api/host'+route,{
      method,headers:{Origin:'https://parrot669.com',Cookie:'other=x; parrot_session=test-session','Content-Type':'application/json'},
      ...(['POST','PUT'].includes(method)?{body:JSON.stringify(body)}:{})
    });
    const response=await sandbox.worker.fetch(req,baseEnv);
    assert.equal(response.status,status);
    assert.equal(forwarded.url,'https://api.example.test/api'+route);
    assert.equal(forwarded.method,method);
    assert.equal(forwarded.headers.get('Cookie'),'parrot_session=test-session');
    if (['POST','PUT'].includes(method)) assert.deepEqual(forwarded.body,body);
    if (status!==204) assert.deepEqual(await response.json(),{error:'range error'});
  });
}

for(const action of ['request','confirm'])test(`password recovery ${action} keeps Origin protection and forwards no-store responses`,async()=>{
  const calls=[];const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{calls.push({url,...init});return new Response(null,{status:204,headers:{'Set-Cookie':'parrot_session=; Path=/; HttpOnly; Secure; Max-Age=0'}})}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const path='/api/host/auth/password-reset/'+action;
  const bad=await sandbox.worker.fetch(new Request('https://parrot669.com'+path,{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}),baseEnv);
  assert.equal(bad.status,403);assert.equal(calls.length,0);
  const good=await sandbox.worker.fetch(new Request('https://parrot669.com'+path,{method:'POST',headers:{Origin:'https://parrot669.com','Content-Type':'application/json'},body:'{}'}),baseEnv);
  assert.equal(good.status,204);assert.equal(calls[0].url,'https://api.example.test/api/auth/password-reset/'+action);assert.equal(good.headers.get('Cache-Control'),'no-store');assert.match(good.headers.get('Set-Cookie'),/Max-Age=0/);
  const get=await sandbox.worker.fetch(new Request('https://parrot669.com'+path),baseEnv);assert.equal(get.status,404);
});

for (const [method,route,status] of [
  ['GET',`/properties/${id}/calendars`,200],
  ['POST',`/calendars/${id}/activate`,204]
]) test(`calendar transport forwards only the existing ${method} ${route} operation`,async()=>{
  const calls=[];
  const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,...init,body:init.body?await new Response(init.body).json():null});
    return new Response(status===204?null:JSON.stringify({calendars:[]}),{status,headers:{'X-Request-ID':'calendar-request'}});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const host of ['parrot669.com','preview.example.test']) {
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host${route}`,{
      method,headers:{Origin:`https://${host}`,Cookie:'other=private; parrot_session=synthetic',
        Authorization:'Bearer must-not-forward','X-Parrot-QA-Worker':'spoof','Content-Type':'application/json'},
      ...(method==='POST'?{body:JSON.stringify({expectedRevision:7})}:{})
    }),qaEnv);
    assert.equal(response.status,status);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.equal(response.headers.get('X-Request-ID'),'calendar-request');
  }
  for(const call of calls){
    assert.equal(call.url,'https://api.example.test/api'+route);
    assert.equal(call.method,method);assert.equal(call.headers.get('Cookie'),'parrot_session=synthetic');
    assert.equal(call.headers.get('Authorization'),null);
    assert.deepEqual(call.body,method==='POST'?{expectedRevision:7}:null);
  }
  assert.equal(calls[0].headers.get('X-Parrot-QA-Worker'),null);
  assert.equal(calls[1].headers.get('X-Parrot-QA-Worker'),qaEnv.QA_WORKER_SECRET);
});

test('calendar transport retains exact methods, paths, origin and QA denials',async()=>{
  let calls=0;
  const sandbox={URL,Headers,Response,console,fetch:async()=>{calls++;throw Error('Unexpected upstream');}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const [method,route] of [
    ['PUT',`/properties/${id}/calendars`],['DELETE',`/properties/${id}/calendars`],
    ['GET',`/calendars/${id}/activate`],['PUT',`/calendars/${id}/activate`],
    ['DELETE',`/calendars/${id}/activate`],['POST',`/calendars/${id}/activate/extra`],
    ['GET',`/properties/${id}/calendars/extra`],['POST','/calendars/not-an-id/activate']
  ]) assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method}),qaEnv)).status,404);
  const path=`/api/host/calendars/${id}/activate`;
  assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com'+path,{method:'POST',headers:{Origin:'https://evil.test'}}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://evil.test'+path,{method:'POST'}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://preview.example.test'+path,{method:'POST'}),{...qaEnv,QA_WORKER_SECRET:''})).status,503);
  assert.equal(calls,0);
});

for(const [status,code] of [[401,'AUTHENTICATION_REQUIRED'],[404,'NOT_FOUND'],[409,'CALENDAR_INVALID_TRANSITION'],[412,'CALENDAR_STALE']])
test(`calendar proxy preserves upstream ${status} ${code} without retry`,async()=>{
  let calls=0;
  const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
    calls++;assert.equal(init.headers.get('Cookie'),null);
    return new Response(JSON.stringify({code,error:'synthetic refusal'}),{status});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const response=await sandbox.worker.fetch(new Request(`https://parrot669.com/api/host/calendars/${id}/activate`,{method:'POST',body:'{"expectedRevision":7}'}),baseEnv);
  assert.equal(response.status,status);assert.equal((await response.json()).code,code);assert.equal(calls,1);
});

