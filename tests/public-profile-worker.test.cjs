// Authored specifications only; no runtime PASS is claimed.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8').replace('export default {','globalThis.worker = {');
const parrotId='P669-AAAA-AAAA-AAAA-AAAA',propertyId='11111111-1111-4111-8111-111111111111';
const validPayload={profile:{parrotId,displayName:'Anna',about:'Clear agreements.'},property:{id:propertyId,title:'Casa',city:'Barcelona',cityNative:null,accommodationType:'entire_place',bedrooms:2,sleeps:4,minStayDays:3,listings:[{platform:'Airbnb',url:'https://www.airbnb.com/rooms/123',calendarControlStatus:'verified'}]}};
const clone=value=>JSON.parse(JSON.stringify(value));
function harness({payload=validPayload,status=200,rawBody=null,headers={}}={}){
  const upstream=[],assets=[];
  const sandbox={URL,URLSearchParams,Request,Headers,Response,console,fetch:async(url,init)=>{upstream.push({url,init});return new Response(status===204?null:rawBody ?? JSON.stringify(payload),{status,headers:{'Content-Type':'application/json',...headers}});}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const env={PUBLIC_ORIGIN:'https://parrot669.com',API_ORIGIN:'https://configured-api.example.test',QA_HOSTNAMES:'qa.example.test',QA_WORKER_SECRET:'test-worker-secret-at-least-thirty-two-characters',ASSETS:{fetch:async request=>{assets.push(request.url);return new Response('PROFILE ASSET',{headers:{'Content-Type':'text/html','Cache-Control':'public'}});}}};
  const request=(route,options={},host='parrot669.com',override={})=>sandbox.worker.fetch(new Request(`https://${host}${route}`,options),{...env,...override});
  return {request,upstream,assets,env};
}
test('canonical page maps only asset request with no auth probe or redirect',async()=>{
  const h=harness();const r=await h.request(`/p/${parrotId}?property=${propertyId}`);
  assert.equal(r.status,200);assert.equal(await r.text(),'PROFILE ASSET');assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(h.assets,['https://parrot669.com/profile.html']);assert.equal(h.upstream.length,0);
  await h.request('/search.html');assert.equal(new URL(h.assets[1]).pathname,'/search.html');
});
for(const host of ['parrot669.com','qa.example.test'])test('configured origin/QA public projection '+host,async()=>{
  const h=harness();const r=await h.request(`/api/p/${parrotId}?property=${propertyId}`,{headers:{Cookie:'other=private; parrot_session=synthetic',Authorization:'private','X-Parrot-QA-Worker':'spoof'}},host);
  assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.deepEqual(await r.json(),validPayload);
  assert.equal(h.upstream.length,1);const call=h.upstream[0];assert.equal(call.url,`https://configured-api.example.test/api/p/${parrotId}?property=${propertyId}`);
  assert.equal(call.init.headers.get('Authorization'),null);assert.equal(call.init.headers.get('Cookie'),'parrot_session=synthetic');
  assert.equal(call.init.headers.get('X-Parrot-QA-Worker'),host==='qa.example.test'?h.env.QA_WORKER_SECRET:null);
});
for(const id of ['PRT +é/part','PRT-669-A7','PAR-OLD','P669-AAAA-AAAA-AAAA-AAAA\n',
  'p669-aaaa-aaaa-aaaa-aaaa',' P669-AAAA-AAAA-AAAA-AAAA','P669-AAAA-AAAA-AAAA-AAAI',propertyId])
test('noncanonical identity is rejected before upstream '+JSON.stringify(id),async()=>{
  const h=harness({payload:{profile:{parrotId:id,displayName:'Anna',about:null},property:null}});
  for(const prefix of ['/api/p/','/p/'])assert.equal((await h.request(prefix+encodeURIComponent(id))).status,404);
  assert.equal(h.upstream.length,0);assert.equal(h.assets.length,0);
});
const mutations=[
 p=>({...p,privateEmail:'private@example.test'}),p=>({...p,profile:{...p.profile,hostProfileId:'internal'}}),
 p=>({...p,profile:{...p.profile,parrotId:'OTHER'}}),p=>({...p,property:{...p.property,id:'foreign'}}),
 p=>({...p,property:[p.property]}),p=>({...p,property:{...p.property,profileId:'private'}}),
 p=>({...p,property:{...p.property,listings:[{...p.property.listings[0],source:'private'}]}}),
 p=>({...p,profile:{...p.profile,about:'x'.repeat(501)}}),p=>({...p,profile:{...p.profile,displayName:''}}),
 p=>({...p,property:{...p.property,bedrooms:-1}}),p=>({...p,property:null}),()=>null
];
mutations.forEach((change,i)=>test('private/mismatched/malformed projection fails closed '+i,async()=>{
  const h=harness({payload:change(clone(validPayload))});const r=await h.request(`/api/p/${parrotId}?property=${propertyId}`);
  assert.equal(r.status,502);const body=await r.json();assert.equal(body.error,'Public profile service unavailable');assert.equal(JSON.stringify(body).includes('private@'),false);
}));
for(const raw of ['not JSON','null','[]',JSON.stringify(validPayload)+' '.repeat(65536)])test('malformed/actual oversized body rejected '+raw.slice(0,20),async()=>{
  const h=harness({rawBody:raw});assert.equal((await h.request(`/api/p/${parrotId}?property=${propertyId}`)).status,502);
});
test('untrusted Content-Length does not replace actual byte measurement',async()=>{
  const h=harness({headers:{'Content-Length':'65537'}});assert.equal((await h.request(`/api/p/${parrotId}?property=${propertyId}`)).status,200);
  // The frozen shared proxy intentionally strips this header; actual over-limit body controls above still reject.
});
for(const about of [null,'','one\nline','<script>alert(1)</script>','x'.repeat(500)])test('person-only About shape '+String(about).slice(0,20),async()=>{
  const h=harness({payload:{profile:{parrotId,displayName:'Anna',about},property:null}});assert.equal((await h.request(`/api/p/${parrotId}`)).status,200);
});
for(const status of [401,403,404,500,204])test('upstream refusal/empty body does not escape '+status,async()=>{
  const h=harness({status});const r=await h.request(`/api/p/${parrotId}`);
  assert.equal(r.status,status===204?502:status<500?404:502);assert.equal((await r.text()).includes('Clear agreements'),false);
});
for(const route of [`/api/p/${parrotId}?debug=1`,`/api/p/${parrotId}?property=`,`/api/p/${parrotId}?property=${propertyId}&property=${propertyId}`,`/api/p/${parrotId}?property=${'x'.repeat(121)}`,'/api/p/%ZZ','/api/p/%41','/api/p/'+ 'a'.repeat(121),'/api/p/a/extra'])test('bad path/query never reaches upstream '+route.slice(0,75),async()=>{
  const h=harness();assert.equal((await h.request(route)).status,404);assert.equal(h.upstream.length,0);
});
for(const method of ['POST','PUT','PATCH','DELETE','HEAD','OPTIONS'])test('API is GET only '+method,async()=>{
  const h=harness();assert.equal((await h.request(`/api/p/${parrotId}`,{method})).status,405);assert.equal(h.upstream.length,0);
});
test('origin/config/QA boundaries refuse without upstream',async()=>{
  const h=harness();
  assert.equal((await h.request(`/api/p/${parrotId}`,{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await h.request(`/api/p/${parrotId}`,{},'qa.example.test',{QA_WORKER_SECRET:''})).status,503);
  assert.equal((await h.request(`/api/p/${parrotId}`,{},'parrot669.com',{API_ORIGIN:''})).status,503);
  for(const host of ['evil.example','qa.example.test.evil'])for(const route of [`/api/p/${parrotId}`,`/p/${parrotId}`])assert.equal((await h.request(route,{},host)).status,403);
  assert.equal(h.upstream.length,0);assert.equal(h.assets.length,0);
});


for(const language of ['en','es','ca','ru'])test('A public projection forwards one validated locale '+language,async()=>{
  const payload=clone(validPayload);payload.property.city=null;payload.property.cityNative='Барселона';
  const h=harness({payload}),r=await h.request(`/api/p/${parrotId}?property=${propertyId}&language=${language}`);
  assert.equal(r.status,200);assert.deepEqual(await r.json(),payload);
  assert.equal(h.upstream[0].url,`https://configured-api.example.test/api/p/${parrotId}?property=${propertyId}&language=${language}`);
});
for(const query of ['language=','language=fr','language=en&language=ru','language=ru&debug=1'])test('A invalid/duplicate/extra public locale query is refused '+query,async()=>{
  const h=harness();assert.equal((await h.request(`/api/p/${parrotId}?${query}`)).status,404);assert.equal(h.upstream.length,0);
});
for(const field of ['address','unit','latitude','placeId'])test('A nullable-city projection still rejects private '+field,async()=>{
  const payload=clone(validPayload);payload.property.city=null;payload.property.cityNative=null;payload.property[field]='private';
  const h=harness({payload});assert.equal((await h.request(`/api/p/${parrotId}?property=${propertyId}`)).status,502);
});
for(const field of ['city','cityNative'])test('A projection rejects missing or non-string nullable field '+field,async()=>{
  for(const value of [undefined,{},3]){
    const payload=clone(validPayload);payload.property[field]=value;
    assert.equal((await harness({payload}).request(`/api/p/${parrotId}?property=${propertyId}`)).status,502);
  }
});

for(const instagram of [null,'Verified.Name_123'])test('public Instagram is optional username only '+instagram,async()=>{
  const payload={profile:{parrotId,displayName:'Anna',about:null,instagram},property:null};
  const r=await harness({payload}).request(`/api/p/${parrotId}`);assert.equal(r.status,200);assert.deepEqual(await r.json(),payload);
});
for(const instagram of [{userName:'private',verified:false},true,'@name','name\n','é','x'.repeat(31)])test('public malformed/private Instagram fails closed '+JSON.stringify(instagram),async()=>{
  const r=await harness({payload:{profile:{parrotId,displayName:'Anna',instagram},property:null}}).request(`/api/p/${parrotId}`);
  assert.equal(r.status,502);assert.equal((await r.text()).includes('private'),false);
});
for(const field of ['verified','waiting','history','instructions','userName'])test('public Instagram never admits owner/process field '+field,async()=>{
  const payload={profile:{parrotId,displayName:'Anna',instagram:null,[field]:'CANARY'},property:null};
  const r=await harness({payload}).request(`/api/p/${parrotId}`);assert.equal(r.status,502);assert.equal((await r.text()).includes('CANARY'),false);
});
for(const payload of [null,{userName:'Name._1',verified:false},{userName:'Name._1',verified:true}])test('owner GET exact shape and isolated transport '+JSON.stringify(payload),async()=>{
  const h=harness({payload});const r=await h.request('/api/instagram',{headers:{Cookie:'other=secret; parrot_session=synthetic',Authorization:'private'}});
  assert.equal(r.status,200);assert.deepEqual(await r.json(),payload);assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.equal(h.upstream[0].url,'https://configured-api.example.test/api/instagram');
  assert.equal(h.upstream[0].init.headers.get('Cookie'),'parrot_session=synthetic');assert.equal(h.upstream[0].init.headers.get('Authorization'),null);
});
for(const payload of [{userName:'name',verified:false,history:['CANARY']},{userName:'name\n',verified:false},{userName:'name',verified:1},{}])test('owner malformed projection not forwarded '+JSON.stringify(payload),async()=>{
  const r=await harness({payload}).request('/api/instagram');assert.equal(r.status,502);assert.equal((await r.text()).includes('CANARY'),false);
});
for(const method of ['PUT','POST','DELETE','PATCH'])test('CORE owner proxy never permits mutation '+method,async()=>{
  const h=harness();assert.equal((await h.request('/api/instagram',{method})).status,405);assert.equal(h.upstream.length,0);
});
test('owner query identity/foreign origin/instructions denied before upstream; auth errors preserved',async()=>{
  const h=harness();assert.equal((await h.request('/api/instagram?parrotId=foreign')).status,400);
  assert.equal((await h.request('/api/instagram',{headers:{Origin:'https://evil.test'}})).status,403);
  assert.equal((await h.request('/api/instagram/publication')).status,404);assert.equal(h.upstream.length,0);
  const denied=harness({payload:{code:'AUTHENTICATION_REQUIRED',error:'Sign in'},status:401});
  assert.equal((await denied.request('/api/instagram')).status,401);
});


const hex64Canonical=['P669-0000-0000-0000-0000','P669-0000-0000-0000-0001','P669-0123-4567-89AB-CDEF',
  'P669-7FFF-FFFF-FFFF-FFFF','P669-8000-0000-0000-0000','P669-8000-0000-0000-0001','P669-FFFF-FFFF-FFFF-FFFF'];
for(const id of hex64Canonical)test('HEX64 shared validator and public Worker preserve exact identity '+id,async()=>{
  const {isParrotId}=require('../public/assets/shared/identity.js');
  assert.equal(isParrotId(id),true);assert.equal(id.length,24);
  const payload={profile:{parrotId:id,displayName:'Boundary',about:null},property:null};
  const h=harness({payload}),r=await h.request('/api/p/'+encodeURIComponent(id));
  assert.equal(r.status,200);assert.deepEqual(await r.json(),payload);
  assert.equal(h.upstream.length,1);assert.equal(h.upstream[0].url,'https://configured-api.example.test/api/p/'+id);
  assert.equal(r.headers.get('Cache-Control'),'no-store');
});
const hex64Invalid=['P669-AAAA-AAAA-AAAA','0123456789ABCDEF','p669-0123-4567-89ab-cdef',
  ' P669-0123-4567-89AB-CDEF','P669-0123-4567-89AB-CDEF\n','P669-0123-4567-89AB-CDEF\r\n',
  'P669-0123-4567-89AB-CDEG','P669-0123-4567-89AB-CDE','P669-0123-4567-89AB-CDEFF',
  'P669-０123-4567-89AB-CDEF','P669-0123-4567-89АB-CDEF','P669-0123-4567-89AB-CDEF\u0000'];
for(const id of hex64Invalid)test('HEX64 shared validator and Worker reject before upstream '+JSON.stringify(id),async()=>{
  const {isParrotId}=require('../public/assets/shared/identity.js');
  assert.equal(isParrotId(id),false);
  const h=harness();
  for(const prefix of ['/p/','/api/p/'])assert.equal((await h.request(prefix+encodeURIComponent(id))).status,404);
  assert.equal(h.upstream.length,0);assert.equal(h.assets.length,0);
});
test('HEX64 Worker does not conflate values separated only by a low bit above Number precision',async()=>{
  const requested='P669-8000-0000-0000-0000',other='P669-8000-0000-0000-0001';
  const h=harness({payload:{profile:{parrotId:other,displayName:'Other',about:null},property:null}});
  const r=await h.request('/api/p/'+requested);
  assert.equal(r.status,502);assert.equal(h.upstream.length,1);
});
for(const identity of [null,1,2**63,{},['P669-0123-4567-89AB-CDEF']])test('HEX64 projection never coerces identity '+JSON.stringify(identity),async()=>{
  const {isParrotId}=require('../public/assets/shared/identity.js');assert.equal(isParrotId(identity),false);
  const h=harness({payload:{profile:{parrotId:identity,displayName:'Invalid',about:null},property:null}});
  assert.equal((await h.request('/api/p/'+parrotId)).status,502);
});
for(const alias of ['%50'+'669-0123-4567-89AB-CDEF','P669%2D0123-4567-89AB-CDEF'])test('HEX64 percent-encoded aliases remain noncanonical '+alias,async()=>{
  const h=harness();assert.equal((await h.request('/api/p/'+alias)).status,404);assert.equal(h.upstream.length,0);
});


const overloadHeaders = {
  'Retry-After':'120', 'X-Request-ID':'trace-184_abc.01',
  'Set-Cookie':'private=CANARY_COOKIE', 'X-Private':'CANARY_HEADER',
  'Cache-Control':'public, max-age=3600', 'Content-Type':'text/html',
  'Location':'https://private.example.test/CANARY_LOCATION'
};
const overloadBody = JSON.stringify({error:'CANARY_PRIVATE_EMAIL@example.test',code:'CANARY_INTERNAL_CODE',
  requestId:'CANARY_BODY_ID',profile:{contact:'CANARY_CONTACT'},stack:'CANARY_STACK'});
async function assertOverload(response,status,expectedHeaders={}) {
  assert.equal(response.status,status);
  assert.deepEqual(await response.json(),{error:'Public profile service unavailable',
    code:status===429?'RATE_LIMITED':'SERVICE_UNAVAILABLE'});
  assert.deepEqual(Object.fromEntries(response.headers),{
    'cache-control':'no-store','content-type':'application/json; charset=utf-8',...expectedHeaders
  });
}
for(const status of [429,503]) {
  for(const host of ['parrot669.com','qa.example.test'])
    test(`KAN184 overload ${status} preserves only safe headers on ${host}`,async()=>{
      const id='P669-8000-0000-0000-0001';
      const h=harness({status,rawBody:overloadBody,headers:overloadHeaders});
      const response=await h.request(`/api/p/${id}?language=ru`,{headers:{
        Cookie:'other=CANARY_REQUEST; parrot_session=synthetic',Authorization:'CANARY_AUTH',
        'X-Parrot-QA-Origin':'qa','X-Parrot-QA-Worker':'CANARY_SPOOF',
        'Retry-After':'999','X-Request-ID':'CANARY_CLIENT_ID'
      }},host);
      await assertOverload(response,status,{'retry-after':'120','x-request-id':'trace-184_abc.01'});
      assert.equal(h.upstream.length,1);assert.equal(h.assets.length,0);
      const call=h.upstream[0];
      assert.equal(call.url,`https://configured-api.example.test/api/p/${id}?language=ru`);
      assert.equal(call.init.method,'GET');
      assert.deepEqual(Object.fromEntries(call.init.headers),{
        accept:'application/json',cookie:'parrot_session=synthetic',
        ...(host==='qa.example.test'?{'x-parrot-qa-origin':'qa','x-parrot-qa-worker':h.env.QA_WORKER_SECRET}:{})
      });
    });
  test(`KAN184 overload ${status} invents neither missing headers nor upstream body`,async()=>{
    for(const rawBody of [overloadBody,'<html>CANARY_HTML</html>','']) {
      const h=harness({status,rawBody});
      await assertOverload(await h.request(`/api/p/${parrotId}`),status);
      assert.equal(h.upstream.length,1);
    }
  });
  test(`KAN184 overload ${status} forwards valid Retry-After exactly without computing a delay`,async()=>{
    for(const retry of ['0','000120','120','9'.repeat(128),'Sun, 06 Nov 1994 08:49:37 GMT',
      'Sunday, 06-Nov-94 08:49:37 GMT','Sun Nov  6 08:49:37 1994','Sun Nov 16 08:49:37 2025',
      'Sat, 31 Dec 2016 23:59:60 GMT']) {
      const h=harness({status,headers:{'Retry-After':retry}});
      await assertOverload(await h.request(`/api/p/${parrotId}`),status,{'retry-after':retry});
      assert.equal(h.upstream.length,1);
    }
  });
  test(`KAN184 overload ${status} omits invalid Retry-After but retains valid request ID`,async()=>{
    for(const retry of ['', ' ', '-1', '+1', '1.5', '1e3', 'NaN', 'Infinity', '1, 2',
      '9'.repeat(129), 'tomorrow', '1994-11-06', 'Sun, 06 Nov 1994 08:49:37 GMT CANARY',
      'Sun, 31 Feb 2030 08:49:37 GMT', 'Sun, 06 Nov 1994 25:49:37 GMT', '1\t2',
      'Tuesday, 31-Feb-26 08:49:37 GMT','Sun Nov 31 08:49:37 1994','Sunday, 06-Nov-94 08:49:37 GMT, 1',
      'Sun, 06 Nov 1994 08:49:61 GMT','Mon, 06 Nov 1994 08:49:37 GMT']) {
      const h=harness({status,headers:{'Retry-After':retry,'X-Request-ID':'request-184'}});
      await assertOverload(await h.request(`/api/p/${parrotId}`),status,{'x-request-id':'request-184'});
    }
  });
  test(`KAN184 overload ${status} omits invalid request IDs without dropping valid Retry-After`,async()=>{
    for(const id of ['', ' ', 'x'.repeat(129), 'private@example.test', 'two ids', 'a,b', 'a/b', 'a\tb', 'é']) {
      const h=harness({status,headers:{'Retry-After':'0','X-Request-ID':id}});
      await assertOverload(await h.request(`/api/p/${parrotId}`),status,{'retry-after':'0'});
    }
    for(const id of ['a','x'.repeat(128),'12345678-1234-4234-8234-123456789abc']) {
      const h=harness({status,headers:{'X-Request-ID':id}});
      await assertOverload(await h.request(`/api/p/${parrotId}`),status,{'x-request-id':id});
    }
  });
  test(`KAN184 overload ${status} rejects combined duplicate header values`,async()=>{
    const h=harness({status,headers:{'Retry-After':'1, 2','X-Request-ID':'first, second'}});
    await assertOverload(await h.request(`/api/p/${parrotId}`),status);
  });
}
for(const status of [400,401,403,404,500,502,504])
  test(`KAN184 other upstream status ${status} retains its existing mapping and no metadata leakage`,async()=>{
    const h=harness({status,rawBody:overloadBody,headers:overloadHeaders});
    const response=await h.request(`/api/p/${parrotId}`);
    const neutral=[401,403,404].includes(status);
    assert.equal(response.status,neutral?404:502);
    assert.deepEqual(await response.json(),{
      error:status===404?'Not found':neutral?'Not available':'Public profile service unavailable',
      code:neutral?'NOT_FOUND':'SERVICE_UNAVAILABLE'
    });
    assert.deepEqual(Object.fromEntries(response.headers),{
      'cache-control':'no-store','content-type':'application/json; charset=utf-8'
    });
    assert.equal(h.upstream.length,1);
  });
test('KAN184 successful and invalid 200 projections retain existing body and header boundaries',async()=>{
  for(const payload of [validPayload,{...validPayload,privateEmail:'CANARY_PRIVATE'},
    {...validPayload,profile:{...validPayload.profile,parrotId:'P669-AAAA-AAAA-AAAA'}}]) {
    const h=harness({payload,headers:overloadHeaders});
    const response=await h.request(`/api/p/${parrotId}?property=${propertyId}`);
    assert.equal(response.status,payload===validPayload?200:502);
    assert.deepEqual(await response.json(),payload===validPayload?payload:
      {error:'Public profile service unavailable',code:'SERVICE_UNAVAILABLE'});
    assert.deepEqual(Object.fromEntries(response.headers),{
      'cache-control':'no-store','content-type':'application/json; charset=utf-8'
    });
    assert.equal(h.upstream.length,1);
  }
});
