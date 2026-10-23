const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const read=file=>fs.readFileSync(path.join(__dirname,'../public',file),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};

function delayedMessages(t,{stored='ru'}={}){
  const dom=new JSDOM(read('messages.html'),{url:'https://example.test/messages.html',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());
  const w=dom.window, modules=deferred(), controller=deferred(), session=deferred(), reachedCommon=deferred(), calls=[], initialLocale=[];
  w.localStorage.setItem('parrot669-language',stored);
  w.setInterval=()=>0;
  w.fetch=async url=>{
    const p=new URL(url,w.location.origin).pathname;calls.push(p);
    if(p==='/api/host/auth/me')return session.promise;
    throw Error('unexpected request '+p);
  };
  const buttons=()=>[...w.document.querySelectorAll('[data-msg-lang]')];
  const ready=()=>w.document.body.dataset.messagesLanguageReady==='true';
  // Delay exactly the actual common/controller source execution, not a UI sleep.
  const boot=(async()=>{
    await modules.promise;
    require('./helpers/core.cjs').installCore(w);
    w.eval(read('assets/messaging-common.js'));
    w.eval(read('assets/messaging-email-settings.js'));
    const setLanguage=w.ParrotMessaging.setLanguage;
    w.ParrotMessaging.setLanguage=value=>{
      setLanguage(value);
      initialLocale.push({lang:w.document.documentElement.lang,host:w.document.getElementById('msg-host-link').textContent,
        disabled:buttons().every(b=>b.disabled),ready:ready()});
    };
    reachedCommon.resolve();
    await controller.promise;
    w.eval(read('assets/messages.js'));
  })();
  const finishSession=async()=>{
    session.resolve(new Response(JSON.stringify({error:'unauthorized'}),{status:401}));
    await flush();
  };
  return {w,modules,controller,boot,reachedCommon,calls,buttons,ready,initialLocale,finishSession};
}

test('Messages language controls are non-actionable through delayed graph and controller bootstrap',async t=>{
  const h=delayedMessages(t);
  assert.match(read('assets/entry-messages.js'),/import "\.\/entry\.js";[\s\S]*import "\.\/messaging-common\.js";[\s\S]*import "\.\/messages\.js";/);
  assert.equal(h.buttons().length,4);
  assert(h.buttons().every(b=>b.disabled),'real HTML must disable controls before any module can execute');
  assert.equal(h.ready(),false);
  h.buttons()[0].click();
  assert.equal(h.w.localStorage.getItem('parrot669-language'),'ru');
  assert.equal(h.w.document.getElementById('msg-host-link').textContent,'For hosts','default static rendering remains');
  h.modules.resolve();await h.reachedCommon.promise;
  assert(h.buttons().every(b=>b.disabled),'common locale loading is not controller readiness');
  assert.equal(h.ready(),false);h.buttons()[0].click();
  assert.equal(h.w.localStorage.getItem('parrot669-language'),'ru');
  h.controller.resolve();await h.boot;
  assert.equal(h.ready(),true);
  assert(h.buttons().every(b=>!b.disabled));
  assert.equal(h.w.document.documentElement.lang,'ru');
  assert.equal(h.w.document.getElementById('msg-host-link').textContent,'Владельцам');
  assert.equal(h.initialLocale.length,1);
  assert.deepEqual(h.initialLocale[0],{lang:'ru',host:'Владельцам',disabled:true,ready:false},
    'locale rendering must complete while controls still gated');
  await h.finishSession();
});

test('Messages choice after controller readiness survives later session bootstrap in all four languages',async t=>{
  const h=delayedMessages(t);h.modules.resolve();await h.reachedCommon.promise;h.controller.resolve();await h.boot;
  assert.equal(h.ready(),true);assert(h.buttons().every(b=>!b.disabled));
  for(const [lang,host,label] of [['en','For hosts','Messages'],['es','Para propietarios','Mensajes'],
    ['ca','Per a propietaris','Missatges'],['ru','Владельцам','Сообщения']]){
    h.w.document.querySelector('[data-msg-lang="'+lang+'"]').click();
    assert.equal(h.w.localStorage.getItem('parrot669-language'),lang);
    assert.equal(h.w.document.documentElement.lang,lang);
    assert.equal(h.w.document.getElementById('msg-host-link').textContent,host);
    assert.equal(h.w.document.querySelector('nav .messaging-nav-link [data-msg-i18n="messages"]').textContent,label);
  }
  h.buttons()[0].click();
  assert.equal(h.w.document.getElementById('messages-app').hidden,true,'session deliberately still pending');
  await h.finishSession();
  assert.equal(h.w.document.documentElement.lang,'en');
  assert.equal(h.w.document.getElementById('msg-host-link').textContent,'For hosts');
  assert.equal(h.w.localStorage.getItem('parrot669-language'),'en');
  assert(h.calls.every(p=>p==='/api/host/auth/me'),'language must not mutate account resources');
});

test('Messages missing or unsupported stored locale falls back before exposing language controls',async t=>{
  for(const stored of ['', 'unknown-locale']){
    const h=delayedMessages(t,{stored});
    h.modules.resolve();await h.reachedCommon.promise;h.controller.resolve();await h.boot;
    assert.equal(h.ready(),true);assert(h.buttons().every(b=>!b.disabled));
    assert.equal(h.w.document.documentElement.lang,'en');
    assert.equal(h.w.document.getElementById('msg-host-link').textContent,'For hosts');
    assert.equal(h.initialLocale[0].disabled,true);assert.equal(h.initialLocale[0].ready,false);
    await h.finishSession();
  }
});
