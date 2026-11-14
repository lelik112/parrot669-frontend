const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {createCore}=require('../public/assets/shared/core.js');
const {createProfileEditor}=require('../public/assets/profile-editor.js');
const {createInstagramReader,instagramCopy}=require('../public/assets/instagram-profile.js');
const {profileCopy}=require('../public/assets/profile-copy.js');
const {bindProfileNavigation,profileReturnContext}=require('../public/assets/profile-navigation.js');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tick=async()=>{for(let i=0;i<16;i++)await new Promise(resolve=>setImmediate(resolve));};
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:value=>resolve(value)};};
const settings=extra=>({parrotId:'P669-AAAA-AAAA-AAAA',displayName:'Saved member',about:'Saved About',published:false,revision:4,...extra});
const user=accountId=>({accountId,email:'private@example.invalid',username:'synthetic',parrotId:accountId==='owner-a'?'P669-AAAA-AAAA-AAAA':'P669-BBBB-BBBB-BBBB',displayName:'Saved member'});

async function harness(t,{url='/my-profile.html',sessionData={},anonymous=false}={}){
  const dom=new JSDOM(read('public/my-profile.html'),{url:'https://synthetic.test'+url,runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());const w=dom.window,calls=[];let identity=anonymous?null:user('owner-a'),profile=settings(),override;
  w.scrollTo=()=>{};w.fetch=async(p,options={})=>{
    const call={path:String(p),method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined};calls.push(call);
    if(override){const response=await override(call);if(response!==undefined)return response;}
    if(call.path==='/api/host/auth/me')return new Response(JSON.stringify(identity||{error:'signed out'}),{status:identity?200:401});
    if(call.path==='/api/host/auth/login'){
      assert.equal(call.method,'POST');identity=user('owner-a');return new Response(JSON.stringify(identity));
    }
    if(!identity)return new Response('{}',{status:401});
    if(call.path==='/api/instagram')return new Response('null');
    if(call.path==='/api/host/public-profile'&&call.method==='GET')return new Response(JSON.stringify(profile));
    if(call.path==='/api/host/public-profile/preview')return new Response(JSON.stringify({profile,property:null}));
    assert(['PATCH /api/host/profile','POST /api/host/public-profile/publish','DELETE /api/host/public-profile/publish'].includes(call.method+' '+call.path),'unexpected local stub operation');
    if(call.body.expectedRevision!==profile.revision)return new Response('{"code":"PROFILE_STALE"}',{status:412});
    profile={...profile,...(call.method==='PATCH'?{displayName:call.body.displayName,about:call.body.about}:{published:call.method==='POST'}),revision:profile.revision+1};
    return new Response(JSON.stringify({success:true,revision:profile.revision}));
  };
  w.ParrotCore=createCore(w);for(const [key,value]of Object.entries(sessionData))w.ParrotCore.storage.session.setItem(key,value);
  Object.assign(w,{createProfileEditor,profileCopy,profileReturnContext,createInstagramReader,instagramCopy});
  w.eval(read('public/assets/my-profile.js').replace(/^import .*;\n/gm,''));await tick();
  const edit=(id,value)=>{const n=w.document.getElementById(id);n.value=value;n.dispatchEvent(new w.Event('input',{bubbles:true}));};
  return {w,calls,$:id=>w.document.getElementById(id),edit,
    intercept:fn=>{override=fn;},profile:()=>profile,setProfile:value=>{profile=value;},
    setUser:value=>{identity=value;w.ParrotCore.session.setUser(value);}};
}

test('all existing first-level entries reach the same own editor for guest, host and signed-out users, in four locales',()=>{
  for(const page of ['index','host','search','messages']){
    const dom=new JSDOM(read(`public/${page}.html`));const d=dom.window.document;
    const links=[...d.querySelectorAll('a[data-profile-navigation-copy="nav.profile"]')];
    assert(links.length>0,page);assert(links.every(a=>a.getAttribute('href')==='/my-profile.html'));
    assert(links.every(a=>!a.hidden&&!a.hasAttribute('data-profile-id')));
    if(page==='index')assert(links.some(a=>a.closest('.nav'))&&links.some(a=>a.closest('.mobile-menu')));
    else assert(links.some(a=>a.closest('.housing-tabs')));
    const storage={getItem:()=>null};bindProfileNavigation({document:d,storage,navigator:{language:'en'}});
    for(const locale of ['ru','en','es','ca']){
      const button=d.createElement('button');button.dataset.hostLang=locale;d.body.append(button);button.click();
      assert(links.every(a=>a.textContent===profileCopy[locale]['nav.profile']));
    }
    dom.window.close();
  }
});

test('one writer remains; Host is a private read-only account summary and the original return grammar is retained',()=>{
  const host=read('public/assets/host.js'),html=read('public/host.html');
  assert.doesNotMatch(host,/hostProfileForm|api\("\/profile"|session\.updateProfile/);
  assert.doesNotMatch(html,/host-profile-form|host-profile-return/);
  assert.match(html,/id="host-profile-editor" href="\/my-profile.html"/);
  assert.match(html,/id="host-profile-email"/);assert.match(html,/id="host-profile-username"/);
  assert.match(read('public/messages.html'),/href="\/my-profile.html\?fromMessages=1#host-profile"/);
  assert.equal(read('public/assets/my-profile.js').includes('addEventListener("pageshow"'),false,'existing core owns persisted revalidation');
});

test('conversation return keeps exact account, TTL and conversation grammar; profile identifiers are never parsed',()=>{
  const value={accountId:'opaque-owner',conversationId:'22222222-2222-4222-8222-222222222222',savedAt:100000000};
  const context=(overrides={})=>profileReturnContext({accountId:value.accountId,search:'?fromMessages=1',hash:'#host-profile',now:value.savedAt+1,storage:{getItem:()=>JSON.stringify(value)},...overrides});
  assert.deepEqual(context(),value);assert.equal(context({accountId:'another-owner'}),null);assert.equal(context({accountId:null}),null);
  assert.equal(context({now:value.savedAt+86400001}),null);assert.equal(context({search:''}),null);assert.equal(context({hash:'#other'}),null);
  for(const conversationId of ['not-an-id','22222222222242228222222222222222','/messages.html?x=bad'])assert.equal(context({storage:{getItem:()=>JSON.stringify({...value,conversationId})}}),null);
  assert.equal(context({storage:{getItem:()=>'{bad'}}),null);
});

test('actual editor DOM sends full null-clearing command and minimal ACK never becomes a session profile',async t=>{
  const h=await harness(t);h.edit('editor-name',' Exact sent name ');h.edit('editor-about','');h.$('editor-save').click();await tick();
  assert.deepEqual(h.calls.find(c=>c.method==='PATCH').body,{displayName:' Exact sent name ',about:null,expectedRevision:4});
  assert.equal(h.$('editor-save').disabled,true);assert.equal(h.$('editor-name').value,' Exact sent name ');
  assert.equal(h.w.ParrotCore.session.user.parrotId,'P669-AAAA-AAAA-AAAA');assert.equal(h.w.ParrotCore.session.user.displayName,'Saved member');
  assert(!Object.hasOwn(h.w.ParrotCore.session.user,'success'));
  assert.equal(h.calls.filter(c=>['POST','DELETE'].includes(c.method)).length,0);
});

test('actual DOM keeps newer draft after late ACK and saved-only preview clears private account text',async t=>{
  const h=await harness(t),pending=deferred();h.intercept(c=>c.method==='PATCH'?pending.promise:undefined);
  h.edit('editor-name','Submitted');h.$('editor-save').click();await tick();h.edit('editor-name','Newer unsent');
  h.setProfile(settings({displayName:'Submitted',revision:5}));pending.resolve(new Response('{"success":true,"revision":5}'));await tick();
  assert.equal(h.$('editor-name').value,'Newer unsent');assert.equal(h.$('editor-dirty').hidden,false);
  assert.match(h.$('save-status').textContent,/newer changes/);
  h.$('editor-preview').click();await tick();assert.equal(h.$('preview-name').textContent,'Submitted');
  assert(!h.$('preview-card').textContent.includes('Newer unsent'));assert(!h.$('preview-card').textContent.includes('private@example'));
  assert.equal(h.$('editor-email').textContent,'');h.$('preview-return').click();assert.equal(h.$('editor-name').value,'Newer unsent');
});

for(const status of [412,500])test(`actual DOM ${status} retains draft and checks current state without replay`,async t=>{
  const h=await harness(t);h.intercept(c=>c.method==='PATCH'?new Response('{}',{status}):undefined);
  h.edit('editor-about','Unsent draft');h.$('editor-save').click();await tick();assert.equal(h.$('editor-save').disabled,true);
  h.setProfile(settings({about:'Other saved text',revision:5}));h.$('editor-check').click();await tick();
  assert.equal(h.$('editor-about').value,'Unsent draft');assert.equal(h.$('compare-about').textContent,'Other saved text');
  assert.match(h.$('save-status').textContent,/current saved version/);assert.equal(h.calls.filter(c=>c.method==='PATCH').length,1);
});

test('actual DOM requires clean saved review, explicit Publish and independent dirty-preserving Hide',async t=>{
  const h=await harness(t);h.edit('editor-about','Dirty');h.$('visibility-action').click();await tick();
  assert.equal(h.$('editor-preview-view').hidden,true);assert.equal(h.calls.filter(c=>c.method==='POST').length,0);
  h.$('editor-discard').click();h.$('visibility-action').click();await tick();assert.equal(h.$('preview-publish').disabled,false);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,0);h.$('preview-publish').click();await tick();
  assert.deepEqual(h.calls.find(c=>c.method==='POST').body,{expectedRevision:4});assert.equal(h.profile().published,true);
  h.edit('editor-about','Keep newer text');h.$('visibility-action').click();await tick();
  assert.deepEqual(h.calls.find(c=>c.method==='DELETE').body,{expectedRevision:5});assert.equal(h.profile().published,false);
  assert.equal(h.$('editor-about').value,'Keep newer text');assert.equal(h.$('editor-dirty').hidden,false);
});

test('actual DOM return link and all private drafts are fenced across account change and stale ACK',async t=>{
  const conversation='22222222-2222-4222-8222-222222222222';
  const h=await harness(t,{url:'/my-profile.html?fromMessages=1#host-profile',sessionData:{'parrot669-profile-return':JSON.stringify({accountId:'owner-a',conversationId:conversation,savedAt:Date.now()})}});
  assert.equal(h.$('editor-return').hidden,false);assert.equal(h.$('editor-return').getAttribute('href'),`/messages.html?conversation=${conversation}`);
  const pending=deferred();h.intercept(c=>c.method==='PATCH'?pending.promise:undefined);
  h.edit('editor-name','Private old account');h.$('editor-save').click();await tick();
  h.setProfile(settings({parrotId:user('owner-b').parrotId,displayName:'New account'}));h.setUser(user('owner-b'));await tick();
  pending.resolve(new Response('{"success":true,"revision":5}'));await tick();
  assert.equal(h.$('editor-name').value,'New account');assert.equal(h.$('editor-return').hidden,true);
  assert.equal(h.$('editor-return').hasAttribute('href'),false);assert.equal(h.w.ParrotCore.storage.session.getItem('parrot669-profile-return'),null);
  h.setUser(null);await tick();assert.equal(h.$('editor-private').hidden,true);assert.equal(h.$('editor-name').value,'');assert.equal(h.$('editor-email').textContent,'');
});

test('signed-out login reloads the same editor without Save replay; persisted return revalidates once through shared core',async t=>{
  const h=await harness(t,{anonymous:true});assert.equal(h.$('editor-private').hidden,true);
  h.$('gate-signin').click();h.$('editor-login-name').value='synthetic';h.$('editor-login-password').value='synthetic-password';
  h.$('editor-login').dispatchEvent(new h.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(h.$('editor-private').hidden,false);assert.equal(h.$('editor-save').disabled,true);assert.equal(h.$('editor-login-password').value,'');
  assert.equal(h.calls.filter(c=>c.method==='PATCH').length,0);
  const reads=h.calls.filter(c=>c.path==='/api/host/auth/me').length;
  h.w.dispatchEvent(new h.w.PageTransitionEvent('pagehide',{persisted:true}));assert.equal(h.$('editor-name').value,'');
  h.w.dispatchEvent(new h.w.PageTransitionEvent('pageshow',{persisted:true}));await tick();
  assert.equal(h.calls.filter(c=>c.path==='/api/host/auth/me').length,reads+1);assert.equal(h.$('editor-private').hidden,false);
});

// KAN169 CORE: read-only Instagram shares the universal profile, not Host identity or publication writes.
test('Instagram None/read-only card is available without housing and preserves the profile draft',async t=>{
  const h=await harness(t);assert.equal(h.$('instagram-card').hidden,false);assert.equal(h.$('instagram-state').textContent,'No Instagram added');
  assert.equal(h.$('instagram-card').querySelectorAll('input,textarea,form,a').length,0);
  h.edit('editor-name','Keep the private name draft');const revision=h.profile().revision;
  h.intercept(call=>call.path==='/api/instagram'?new Response(JSON.stringify({userName:'Owner.Name',verified:false})):undefined);
  h.$('instagram-refresh').click();await tick();
  assert.equal(h.$('instagram-name').textContent,'@Owner.Name');assert.equal(h.$('instagram-state').textContent,'Instagram not confirmed');
  assert.equal(h.$('editor-name').value,'Keep the private name draft');assert.equal(h.profile().revision,revision);
  assert.equal(h.profile().published,false);assert.equal(h.calls.filter(c=>c.method!=='GET').length,0);
  const reads=h.calls.filter(c=>c.path==='/api/instagram').length;
  h.w.ParrotCore.session.updateProfile({displayName:'Metadata only'});await tick();
  assert.equal(h.calls.filter(c=>c.path==='/api/instagram').length,reads);
});
test('late Instagram read cannot restore prior same-account ParrotId or signed-out private state',async t=>{
  const h=await harness(t),held=deferred();h.intercept(call=>call.path==='/api/instagram'?held.promise:undefined);
  h.$('instagram-refresh').click();await tick();
  h.intercept(call=>call.path==='/api/instagram'?new Response('null'):undefined);
  h.setProfile(settings({parrotId:'P669-BBBB-BBBB-BBBB'}));h.setUser({...user('owner-a'),parrotId:'P669-BBBB-BBBB-BBBB'});await tick();
  held.resolve(new Response(JSON.stringify({userName:'OldPrivate',verified:true})));await tick();
  assert.equal(h.$('instagram-name').textContent,'');assert.equal(h.$('instagram-state').textContent,'No Instagram added');
  h.setUser(null);await tick();assert.equal(h.$('instagram-card').hidden,true);assert.equal(h.$('instagram-name').textContent,'');
  assert.equal(h.w.document.body.textContent.includes('OldPrivate'),false);
});
test('failed owner refresh labels last known status; malformed success cannot replace it or change Publish guards',async t=>{
  const h=await harness(t);h.intercept(call=>call.path==='/api/instagram'?new Response(JSON.stringify({userName:'Own.Name',verified:true})):undefined);
  h.$('instagram-refresh').click();await tick();assert.equal(h.$('instagram-state').textContent,'Instagram confirmed');
  h.intercept(call=>call.path==='/api/instagram'?new Response(JSON.stringify({userName:'CANARY',verified:false,history:[]})):undefined);
  h.$('instagram-refresh').click();await tick();
  assert.equal(h.$('instagram-name').textContent,'@Own.Name');assert.match(h.$('instagram-notice').textContent,/Last received status.*couldn't load/);
  assert.equal(h.w.document.body.textContent.includes('CANARY'),false);assert.equal(h.profile().published,false);
  assert.equal(h.calls.filter(c=>c.method!=='GET').length,0);
});

// F1/S11: actual false -> manual GET -> true output belongs to ONE polite atomic summary.
// Authored DOM specification only; runtime and screen-reader behavior remain NOT_RUN.
test('S11 announces the refreshed Instagram result once without focus or metadata replay',async t=>{
  const h=await harness(t),refresh=h.$('instagram-refresh'),live=h.$('instagram-status');
  // The mock server is published: this exercises S11, not the unreachable exact7bc hidden-profile S12.
  h.setProfile(settings({published:true}));
  h.intercept(call=>call.path==='/api/instagram'?new Response(JSON.stringify({userName:'Own.Name',verified:false})):undefined);
  refresh.click();await tick();assert.equal(h.$('instagram-state').textContent,'Instagram not confirmed');
  assert.equal(live.getAttribute('role'),'status');assert.equal(live.getAttribute('aria-live'),'polite');
  assert.equal(live.getAttribute('aria-atomic'),'true');assert.equal(live.contains(h.$('instagram-state')),true);
  assert.equal(live.contains(h.$('instagram-notice')),true);assert.equal(live.contains(refresh),false);
  assert.equal(h.$('instagram-card').querySelectorAll('[role="status"],[aria-live]').length,1);
  const held=deferred();h.intercept(call=>call.path==='/api/instagram'?held.promise:undefined);
  refresh.focus();refresh.click();await tick();assert.equal(refresh.disabled,true);
  const seen=[];const observer=new h.w.MutationObserver(()=>seen.push(live.textContent));
  observer.observe(live,{subtree:true,childList:true,characterData:true});t.after(()=>observer.disconnect());
  held.resolve(new Response(JSON.stringify({userName:'Own.Name',verified:true})));await tick();
  assert.equal(h.$('instagram-state').textContent,'Instagram confirmed');assert.equal(h.$('instagram-notice').textContent,'');
  assert.equal((live.textContent.match(/Instagram confirmed/g)||[]).length,1);
  assert.equal(seen.filter(text=>text.includes('Instagram confirmed')).length,1);
  assert.equal(h.$('instagram-refresh'),refresh);assert.equal(refresh.disabled,false);assert.equal(h.w.document.activeElement,refresh);
  const notifications=seen.length,reads=h.calls.filter(call=>call.path==='/api/instagram').length;
  h.w.ParrotCore.session.updateProfile({displayName:'Metadata only'});await tick();
  assert.equal(seen.length,notifications);assert.equal(h.calls.filter(call=>call.path==='/api/instagram').length,reads);
  assert.equal(h.w.document.activeElement,refresh);assert.equal(h.calls.filter(call=>call.method!=='GET').length,0);
});
test('failed Instagram refresh announces last-known/error without inventing confirmed or None',async t=>{
  const h=await harness(t),refresh=h.$('instagram-refresh'),live=h.$('instagram-status');
  h.intercept(call=>call.path==='/api/instagram'?new Response(JSON.stringify({userName:'Own.Name',verified:false})):undefined);
  refresh.click();await tick();
  h.intercept(call=>call.path==='/api/instagram'?new Response('{"error":"CANARY"}',{status:503}):undefined);
  refresh.click();await tick();assert.equal(h.$('instagram-state').textContent,'Instagram not confirmed');
  assert.equal(h.$('instagram-name').textContent,'@Own.Name');assert.match(live.textContent,/Last received status.*couldn't load/);
  assert.doesNotMatch(live.textContent,/Instagram confirmed|No Instagram added|CANARY/);
  assert.equal(h.$('instagram-card').querySelectorAll('[role="status"],[aria-live]').length,1);
  assert.equal(h.calls.filter(call=>call.method!=='GET').length,0);
});
