const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../src/index.js'),'utf8')
  .replace('export default {','globalThis.worker = {');
const secret='fixture-secret-with-at-least-thirty-two-characters';
const propertyId='11111111-1111-4111-8111-111111111111';
const publicOrigin='https://frontend.example.test';
const apiOrigin='https://api.example.test';
const qaHosts=['qa-a.example.test','qa-b.example.test'];

test('Wrangler config is generic and has no embedded environment or secret values',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../wrangler.jsonc'),'utf8'));
  assert.equal(config.name,'parrot669-frontend');
  assert.equal(config.main,'src/index.js');
  assert.equal(config.env,undefined);
  assert.ok(config.assets.run_worker_first.includes('/api/*'));
  assert.equal(JSON.stringify(config).includes('workers.dev'),false);
  assert.equal(JSON.stringify(config).includes('QA_WORKER_SECRET'),false);
});

function harness() {
  const calls=[];
  const sandbox={URL,Headers,Response,console,fetch:async(url,init)=>{
    calls.push({url,init});
    return new Response(JSON.stringify({ok:true}),{status:200,
      headers:{'Set-Cookie':'parrot_session=second-session; Path=/; HttpOnly; Secure; SameSite=Lax'}});
  }};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const env={PUBLIC_ORIGIN:publicOrigin,API_ORIGIN:apiOrigin,QA_HOSTNAMES:qaHosts.join(','),
    QA_WORKER_SECRET:secret,ASSETS:{fetch:async()=>new Response('HTML',{status:200})}};
  return {worker:sandbox.worker,calls,env};
}

test('configured QA hosts forward only the session cookie and generated attestation',async()=>{
  const {worker,calls,env}=harness();
  const routes=['/api/host/auth/login','/api/host/auth/me','/api/host/dashboard',
    '/api/locations/countries','/api/search?country=ES','/api/messaging/conversations',
    `/api/messaging/contact-options/${propertyId}`];
  for(const host of qaHosts) for(const route of routes) {
    const login=route.endsWith('/login');
    const response=await worker.fetch(new Request('https://'+host+route,{
      method:login?'POST':'GET',
      headers:{Origin:'https://'+host,Cookie:'other=x; parrot_session=qa-session',
        'X-Parrot-QA-Origin':'forged','X-Parrot-QA-Worker':'forged'},
      ...(login?{body:'{}'}:{})
    }),env);
    assert.equal(response.status,200);
  }
  assert.equal(calls.length,routes.length*qaHosts.length);
  for(const {url,init} of calls){
    assert.ok(url.startsWith(apiOrigin+'/'));
    assert.equal(init.headers.get('Cookie'),'parrot_session=qa-session');
    assert.equal(init.headers.get('X-Parrot-QA-Origin'),'qa');
    assert.equal(init.headers.get('X-Parrot-QA-Worker'),secret);
  }
});

test('runtime configuration fails closed and rejects unknown origins',async()=>{
  const {worker,calls,env}=harness();
  const qaBase='https://'+qaHosts[0];
  assert.equal((await worker.fetch(new Request(qaBase+'/host.html'),{...env,QA_WORKER_SECRET:undefined})).status,503);
  assert.equal((await worker.fetch(new Request(qaBase+'/api/search'),{...env,QA_WORKER_SECRET:'short'})).status,503);
  assert.equal((await worker.fetch(new Request(publicOrigin+'/api/search'),{...env,API_ORIGIN:undefined})).status,503);
  assert.equal((await worker.fetch(new Request(publicOrigin+'/api/search'),{...env,PUBLIC_ORIGIN:'http://public.example.test'})).status,503);
  assert.equal((await worker.fetch(new Request('https://unknown.example.test/api/search'),env)).status,403);
  assert.equal((await worker.fetch(new Request(qaBase+'/api/contact',{method:'POST',body:'{}'}),env)).status,403);
  assert.equal((await worker.fetch(new Request(qaBase+'/api/private'),env)).status,404);
  assert.equal(calls.length,0);
});

test('QA recovery redirects to configured public origin while ordinary static fetch remains available',async()=>{
  const {worker,calls,env}=harness();
  for(const host of qaHosts) for(const page of ['/recover','/recover.html']){
    const response=await worker.fetch(new Request(`https://${host}${page}?lang=ru`),env);
    assert.equal(response.status,302);
    assert.equal(response.headers.get('Location'),publicOrigin+'/recover.html?lang=ru');
  }
  const main=await worker.fetch(new Request(publicOrigin+'/recover.html'),env);
  assert.equal(main.status,200);
  assert.equal(calls.length,0);
});

test('ordinary origin never forwards forged QA headers',async()=>{
  const {worker,calls,env}=harness();
  const response=await worker.fetch(new Request(publicOrigin+'/api/host/auth/me',{
    headers:{Cookie:'parrot_session=main-session','X-Parrot-QA-Origin':'qa','X-Parrot-QA-Worker':secret}
  }),env);
  assert.equal(response.status,200);
  assert.equal(calls[0].init.headers.get('Cookie'),'parrot_session=main-session');
  assert.equal(calls[0].init.headers.get('X-Parrot-QA-Origin'),null);
  assert.equal(calls[0].init.headers.get('X-Parrot-QA-Worker'),null);
});
