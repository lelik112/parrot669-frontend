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

test('PM144 paired property PATCH forwards exact sparse/null body; obsolete PUT and wrong origins never reach upstream',async()=>{
  const calls=[],sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,method:init.method,headers:init.headers,body:await new Response(init.body).json()});
    return new Response(null,{status:204});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const host of ['parrot669.com','preview.example.test']){
    const body={title:'  unchanged whitespace  ',cleaningFeeCents:null};
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host/properties/${id}`,{
      method:'PATCH',headers:{Origin:`https://${host}`,Cookie:'other=private; parrot_session=synthetic'},body:JSON.stringify(body)}),qaEnv);
    assert.equal(response.status,204);assert.equal(await response.text(),'');assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.deepEqual(calls.at(-1).body,body);assert.equal(calls.at(-1).method,'PATCH');
    assert.equal(calls.at(-1).url,`https://api.example.test/api/properties/${id}`);
    assert.equal(calls.at(-1).headers.get('Cookie'),'parrot_session=synthetic');
  }
  const count=calls.length;
  for(const [method,origin,status] of [['PUT','https://parrot669.com',404],['PATCH','https://evil.test',403]]){
    const response=await sandbox.worker.fetch(new Request(`https://parrot669.com/api/host/properties/${id}`,{
      method,headers:{Origin:origin},body:'{}'}),baseEnv);
    assert.equal(response.status,status);
  }
  assert.equal(calls.length,count);
});

test('atomic profile PATCH forwards complete null/revision body and minimal ACK on ordinary and QA origins', async () => {
  const calls=[];
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,init,body:await new Response(init.body).json()});
    return new Response(JSON.stringify({success:true,revision:8}),{status:200});
  }};
  vm.createContext(sandbox); vm.runInContext(source,sandbox);
  for (const host of ['parrot669.com','preview.example.test']) {
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host/profile`,{
      method:'PATCH',headers:{Origin:`https://${host}`,Cookie:'parrot_session=test-session','Content-Type':'application/json'},
      body:JSON.stringify({displayName:' New host ',about:null,expectedRevision:7})
    }),qaEnv);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{success:true,revision:8});
  }
  for (const {url,init,body} of calls) {
    assert.equal(url,'https://api.example.test/api/host/profile');
    assert.equal(init.method,'PATCH');
    assert.equal(init.headers.get('Cookie'),'parrot_session=test-session');
    assert.deepEqual(body,{displayName:' New host ',about:null,expectedRevision:7});
  }
  assert.equal(calls[0].init.headers.get('X-Parrot-QA-Origin'),null);
  assert.equal(calls[1].init.headers.get('X-Parrot-QA-Origin'),'qa');
});

test('address autocomplete proxy preserves encoded query, session and provider error status', async () => {
  let forwarded;
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
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
    const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
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
  const calls=[];const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{calls.push({url,...init});return new Response(null,{status:204,headers:{'Set-Cookie':'parrot_session=; Path=/; HttpOnly; Secure; Max-Age=0'}})}};
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
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
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
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;throw Error('Unexpected upstream');}};
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

test('calendar connect forwards exact PUT with session-only headers on production and QA',async()=>{
  const calls=[];
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,...init,body:await new Response(init.body).json()});
    return new Response(null,{status:204,headers:{'X-Request-ID':'connect-request'}});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const body={provider:'Airbnb',icalUrl:'https://www.airbnb.com/calendar/ical/123.ics?s=SyntheticOnly123'};
  for(const host of ['parrot669.com','preview.example.test']) {
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host/properties/${id}/public-links`,{
      method:'PUT',headers:{Origin:`https://${host}`,Cookie:'other=private; parrot_session=synthetic',
        Authorization:'Bearer untrusted','X-Parrot-QA-Origin':'spoof','X-Parrot-QA-Worker':'spoof','Content-Type':'application/json'},
      body:JSON.stringify(body)
    }),qaEnv);
    assert.equal(response.status,204);assert.equal(await response.text(),'');
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.equal(response.headers.get('X-Request-ID'),'connect-request');
  }
  assert.equal(calls.length,2);
  for(const call of calls){
    assert.equal(call.url,`https://api.example.test/api/properties/${id}/public-links`);
    assert.equal(call.method,'PUT');assert.deepEqual(call.body,body);
    assert.equal(call.headers.get('Cookie'),'parrot_session=synthetic');
    assert.equal(call.headers.get('Authorization'),null);
  }
  assert.equal(calls[0].headers.get('X-Parrot-QA-Worker'),null);
  assert.equal(calls[0].headers.get('X-Parrot-QA-Origin'),null);
  assert.equal(calls[1].headers.get('X-Parrot-QA-Worker'),qaEnv.QA_WORKER_SECRET);
  assert.equal(calls[1].headers.get('X-Parrot-QA-Origin'),'qa');
});

test('calendar source denies wrong methods/paths and origins before upstream',async()=>{
  let calls=0;
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;throw Error('Unexpected upstream');}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const [method,route] of [
    ...['GET','PATCH','DELETE','HEAD','OPTIONS'].map(method=>[method,`/properties/${id}/public-links`]),
    ['POST',`/properties/${id}/calendars`],['PUT','/properties/not-an-id/public-links'],
    ['PUT',`/properties/${id}/public-links/extra`],['PUT',`/properties/${id}/public-links/`],
    ['PUT',`/properties/${id}/public-links-preview`],['PUT',`/properties/${id.replaceAll('-','')}/public-links`]
  ])assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method}),qaEnv)).status,404);
  const path=`/api/host/properties/${id}/public-links`;
  assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com'+path,{method:'PUT',headers:{Origin:'https://evil.test'}}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://evil.test'+path,{method:'PUT'}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://preview.example.test'+path,{method:'PUT'}),{...qaEnv,QA_WORKER_SECRET:''})).status,503);
  assert.equal(calls,0);
});

for(const status of [401,403,404,429])test(`calendar connect preserves backend ${status} without fabricated auth or retry`,async()=>{
  let calls=0;
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls++;assert.equal(init.headers.get('Cookie'),null);
    assert.equal(init.headers.get('Authorization'),null);
    return new Response(JSON.stringify({code:'SYNTHETIC_REFUSAL',error:'Unavailable'}),{status,headers:{'Retry-After':'10'}});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const response=await sandbox.worker.fetch(new Request(`https://parrot669.com/api/host/properties/${id}/public-links`,{method:'PUT',body:'{}'}),baseEnv);
  assert.equal(response.status,status);assert.equal((await response.json()).code,'SYNTHETIC_REFUSAL');
  assert.equal(response.headers.get('Retry-After'),'10');assert.equal(calls,1);
});

for(const [status,code] of [[401,'AUTHENTICATION_REQUIRED'],[404,'NOT_FOUND'],[409,'CALENDAR_INVALID_TRANSITION'],[412,'CALENDAR_STALE']])
test(`calendar proxy preserves upstream ${status} ${code} without retry`,async()=>{
  let calls=0;
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls++;assert.equal(init.headers.get('Cookie'),null);
    return new Response(JSON.stringify({code,error:'synthetic refusal'}),{status});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const response=await sandbox.worker.fetch(new Request(`https://parrot669.com/api/host/calendars/${id}/activate`,{method:'POST',body:'{"expectedRevision":7}'}),baseEnv);
  assert.equal(response.status,status);assert.equal((await response.json()).code,code);assert.equal(calls,1);
});


// S5 preview is JSON-only and never an invented new endpoint.
test('Host source preview forwards only exact UUID POST with current origin/cookie/QA boundaries',async()=>{
  const calls=[];
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{calls.push({url,method:init.method,headers:init.headers,body:await new Response(init.body).json()});return new Response(JSON.stringify({listingId:'123',publicUrl:'https://www.airbnb.com/rooms/123'}),{status:200});}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const host of ['parrot669.com','preview.example.test']){
    const result=await sandbox.worker.fetch(new Request(`https://${host}/api/host/properties/${id}/public-links`,{method:'POST',headers:{Origin:`https://${host}`,Cookie:'other=x; parrot_session=synthetic',Authorization:'private','X-Parrot-QA-Worker':'spoof'},body:JSON.stringify({provider:'Airbnb',icalUrl:'https://www.airbnb.com/calendar/ical/123.ics?s=TestOnly123'})}),qaEnv);
    assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'no-store');assert.deepEqual(await result.json(),{listingId:'123',publicUrl:'https://www.airbnb.com/rooms/123'});
  }
  assert.equal(calls.length,2);
  for(const call of calls){assert.equal(call.url,`https://api.example.test/api/properties/${id}/public-links`);assert.equal(call.method,'POST');assert.equal(call.headers.get('Cookie'),'parrot_session=synthetic');assert.equal(call.headers.get('Authorization'),null);assert.deepEqual(call.body,{provider:'Airbnb',icalUrl:'https://www.airbnb.com/calendar/ical/123.ics?s=TestOnly123'});}
  assert.equal(calls[0].headers.get('X-Parrot-QA-Worker'),null);assert.equal(calls[1].headers.get('X-Parrot-QA-Worker'),qaEnv.QA_WORKER_SECRET);
});
test('Host preview rejects malformed UUID, suffix, evil origin, unknown QA host and missing QA secret without upstream',async()=>{
  let calls=0;const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;throw Error('upstream forbidden');}};vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const route of ['/properties/not-a-uuid/public-links',`/properties/${id.replaceAll('-','')}/public-links`,`/properties/${id}/public-links/`,`/properties/${id}/public-links/extra`,`/properties/${id}/public-links-preview`])assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method:'POST'}),qaEnv)).status,404);
  const url=`/api/host/properties/${id}/public-links`;
  assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com'+url,{method:'POST',headers:{Origin:'https://evil.test'}}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://evil.test'+url,{method:'POST'}),qaEnv)).status,403);
  assert.equal((await sandbox.worker.fetch(new Request('https://preview.example.test'+url,{method:'POST'}),{...qaEnv,QA_WORKER_SECRET:''})).status,503);assert.equal(calls,0);
});


for(const [method,route,body] of [
  ['GET','/geocode/cities?country=ES&q=Bar&language=ca',null],
  ['GET','/geocode/streets?city=selection-id&q=Major&language=ru',null],
  ['POST','/geocode/houses/confirm?language=es',{street:'selection-id',number:'12'}],
])test('A typed geocode transport preserves exact path/method/query/body '+route,async()=>{
  const calls=[],sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,init,body:init.body?await new Response(init.body).json():null});return new Response('{"error":"synthetic"}',{status:500});
  }};vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const result=await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method,
    headers:{Origin:'https://parrot669.com',Cookie:'parrot_session=synthetic; other=private',Authorization:'private'},
    ...(body?{body:JSON.stringify(body)}:{})}),baseEnv);
  assert.equal(result.status,500);assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.example.test/api'+route);
  assert.equal(calls[0].init.method,method);assert.deepEqual(calls[0].body,body);
  assert.equal(calls[0].init.headers.get('Cookie'),'parrot_session=synthetic');assert.equal(calls[0].init.headers.get('Authorization'),null);
  const before=calls.length;
  for(const wrong of [route.replace('/geocode/','/geocode/private/'),route.split('?')[0]+'/extra'])
    assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+wrong,{method}),baseEnv)).status,404);
  assert.equal(calls.length,before);
});
test('A obsolete unused add-listing POST remains denied while existing autocomplete stays available',async()=>{
  let calls=0;const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;return new Response('[]');}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  assert.equal((await sandbox.worker.fetch(new Request(`https://parrot669.com/api/host/properties/${id}/listings`,{method:'POST'}),baseEnv)).status,404);
  assert.equal(calls,0);
  assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host/geocode/autocomplete?type=city&country=ES&q=bar'),baseEnv)).status,200);
  assert.equal(calls,1);
});

for(const [method,route,body]of [
  ['GET','/public-profile',null],
  ['PUT','/public-profile',' {"displayName":" Exact ","about":null,"expectedRevision":7} '],
  ['GET','/public-profile/preview?language=ca',null],
  ['POST','/public-profile/publish','{"expectedRevision":7}'],
  ['DELETE','/public-profile/publish','{"expectedRevision":7}']
])test(`current profile transport preserves exact ${method} ${route} bytes, cookie and QA provenance`,async()=>{
  const calls=[],sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,...init,body:init.body?await new Response(init.body).text():null});
    return new Response('{"synthetic":"unchanged"}',{status:200,headers:{'X-Request-ID':'profile-request','Retry-After':'9'}});
  }};vm.createContext(sandbox);vm.runInContext(source,sandbox);
  for(const host of ['parrot669.com','preview.example.test']){
    const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host${route}`,{method,
      headers:{Origin:`https://${host}`,Cookie:'other=private; parrot_session=synthetic',Authorization:'not-forwarded',
        'Content-Type':'application/json','X-Parrot-QA-Origin':'spoof','X-Parrot-QA-Worker':'spoof'},...(body?{body}:{})}),qaEnv);
    assert.equal(response.status,200);assert.equal(await response.text(),'{"synthetic":"unchanged"}');
    assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('X-Request-ID'),'profile-request');assert.equal(response.headers.get('Retry-After'),'9');
  }
  assert.equal(calls.length,2);
  for(const call of calls){
    assert.equal(call.url,'https://api.example.test/api/host'+route);assert.equal(call.method,method);assert.equal(call.body,body);
    assert.equal(call.headers.get('Cookie'),'parrot_session=synthetic');assert.equal(call.headers.get('Authorization'),null);
    assert.equal(call.headers.get('Content-Type'),'application/json');
  }
  assert.equal(calls[0].headers.get('X-Parrot-QA-Origin'),null);assert.equal(calls[0].headers.get('X-Parrot-QA-Worker'),null);
  assert.equal(calls[1].headers.get('X-Parrot-QA-Origin'),'qa');assert.equal(calls[1].headers.get('X-Parrot-QA-Worker'),qaEnv.QA_WORKER_SECRET);
});

test('profile transport rejects every unsupported method/suffix and wrong origin before any upstream call',async()=>{
  let calls=0;const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;throw Error('unexpected upstream');}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const supported={'/profile':['PATCH'],'/public-profile':['GET','PUT'],'/public-profile/preview':['GET'],'/public-profile/publish':['POST','DELETE']};
  for(const [route,methods]of Object.entries(supported)){
    for(const method of ['GET','HEAD','OPTIONS','PATCH','PUT','POST','DELETE'].filter(m=>!methods.includes(m)))
      assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method}),qaEnv)).status,404);
    for(const suffix of ['/','/extra','-other'])assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route+suffix,{method:methods[0]}),qaEnv)).status,404);
    const method=methods.find(m=>m!=='GET')||'GET';
    if(method!=='GET')assert.equal((await sandbox.worker.fetch(new Request('https://parrot669.com/api/host'+route,{method,headers:{Origin:'https://evil.test'}}),qaEnv)).status,403);
    assert.equal((await sandbox.worker.fetch(new Request('https://unknown.test/api/host'+route,{method}),qaEnv)).status,403);
    assert.equal((await sandbox.worker.fetch(new Request('https://preview.example.test/api/host'+route,{method}),{...qaEnv,QA_WORKER_SECRET:''})).status,503);
  }
  assert.equal(calls,0);
});

for(const status of [400,401,403,404,412,415,429,500])test(`profile proxy preserves backend ${status} and request ID without retry or fake success`,async()=>{
  let calls=0;const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async()=>{calls++;return new Response('{"code":"SYNTHETIC_REFUSAL","error":"unchanged"}',{status,headers:{'X-Request-ID':'profile-refusal','Retry-After':'12'}});}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const response=await sandbox.worker.fetch(new Request('https://parrot669.com/api/host/public-profile/publish',{method:'DELETE',body:'{"expectedRevision":7}'}),baseEnv);
  assert.equal(response.status,status);assert.deepEqual(await response.json(),{code:'SYNTHETIC_REFUSAL',error:'unchanged'});
  assert.equal(response.headers.get('X-Request-ID'),'profile-refusal');assert.equal(response.headers.get('Retry-After'),'12');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(calls,1);
});

for (const host of ['parrot669.com','preview.example.test']) {
  for (const [method,route] of [['GET','/auth/me'],['POST','/auth/logout']]) {
    for (const values of [['valid','other'],['other','valid'],['valid',''],['','valid'],['valid','invalid!'],['invalid!','valid'],['valid','valid']]) {
      test(`session cookie occurrences survive ${host} ${route} ${JSON.stringify(values)}`,async()=>{
        const expected=values.map(v=>`parrot_session=${v}`).join('; ');
        let observed;
        const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
          observed=init.headers;
          // Synthetic transport response only; this does not implement or prove backend logout policy.
          const unique=new Set(init.headers.get('Cookie').split(';').map(v=>v.trim().slice('parrot_session='.length)));
          return new Response(null,{status:unique.size===1?204:401});
        }};
        vm.runInNewContext(source,sandbox);
        const response=await sandbox.worker.fetch(new Request(`https://${host}/api/host${route}`,{
          method,headers:{Origin:`https://${host}`,Cookie:`foreign=secret; ${expected}; another=private`}
        }),qaEnv);
        assert.equal(observed.get('Cookie'),expected);
        assert.equal(observed.get('X-Parrot-QA-Origin'),host==='preview.example.test'?'qa':null);
        assert.equal(response.status,values[0]===values[1]?204:401);
        assert.equal(response.headers.get('Cache-Control'),'no-store');
      });
    }
  }
}

for(const host of ['parrot669.com','preview.example.test'])
for(const values of [['valid','other'],['other','valid'],['valid',''],['','valid'],['valid','invalid!'],['invalid!','valid'],['valid','valid']])
test(`PM094 logout preserves ambiguous cookies and upstream empty ACK/expiry: ${host} ${JSON.stringify(values)}`,async()=>{
  const expected=values.map(value=>`parrot_session=${value}`).join('; ');
  const expired='parrot_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
  const calls=[];
  const sandbox={URL,URLSearchParams,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,init});return new Response(null,{status:204,headers:{'Set-Cookie':expired}});
  }};
  vm.runInNewContext(source,sandbox);
  const result=await sandbox.worker.fetch(new Request(`https://${host}/api/host/auth/logout`,{
    method:'POST',headers:{Origin:`https://${host}`,Cookie:`foreign=private; ${expected}; other=secret`}
  }),qaEnv);
  assert.equal(calls.length,1);assert.equal(calls[0].init.headers.get('Cookie'),expected);
  assert.equal(calls[0].init.headers.get('X-Parrot-QA-Origin'),host==='preview.example.test'?'qa':null);
  assert.equal(result.status,204);assert.equal(await result.text(),'');
  assert.equal(result.headers.get('Set-Cookie'),expired);assert.equal(result.headers.get('Cache-Control'),'no-store');
});
