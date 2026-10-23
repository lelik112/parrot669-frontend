const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash}=require('node:crypto'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const boundary='  function t(key)';
const sampleCounts=[0,1,2,4,5,11,12,13,14,21,22,25,99,100,101,111,112];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function tableOf(source){
  const index=source.indexOf(boundary);assert(index>=0,'missing messaging table boundary');
  const window={ParrotCore:{session:{}}};
  vm.runInNewContext(source.slice(0,index)+'  window.table=texts;\n})();',{window,document:{}},{timeout:1000});
  return window.table;
}
function snapshot(table){
  return Reflect.ownKeys(table).map(locale=>{
    const dict=table[locale];
    assert.equal(Object.getPrototypeOf(dict),Object.getPrototypeOf(table),'dictionary prototype changed');
    return [locale,Reflect.ownKeys(dict).map(key=>{
      const d=Object.getOwnPropertyDescriptor(dict,key),value=d.value,type=typeof value;
      assert(!d.get&&!d.set,'dictionary accessors are not admitted');
      return [key,type,type==='function'?Function.prototype.toString.call(value):value,
        [d.writable,d.enumerable,d.configurable],type==='function'?[value.name,value.length]:null];
    })];
  });
}
function unreadValues(table,locale){
  assert.equal(typeof table[locale].unreadCount,'function','unreadCount must remain callable');
  return sampleCounts.map(n=>[n,typeof table[locale].unreadCount(n),table[locale].unreadCount(n)]);
}
const dictionaryContract='1d48bbec86952b9c79dfaf70aea08a611ad0f5e861488d9c84e9fcc443494d05';
const unreadContracts={"en":"a25899268afbd22daef51061665c0f0e388f4fd347fa6a7d999c59ce311c8470","es":"309b26f999a7bbf37da64151a2c4a04fe97e68cbf655b3ff908ff1fa7cfd31d5","ca":"f079341888c4b5bd5c03784f83fca7270a14d56777d5ac0a5b7b92e1fb4e58bb","ru":"5f29601f131d021f512d512b24662e7dffd32e6f5325718bf9e79f190b62a764"};
function assertUnread(table){
  for(const locale of ['en','es','ca','ru'])assert.equal(digest(unreadValues(table,locale)),unreadContracts[locale],
    locale+' unread function-output contract changed');
}
function assertDictionary(table){
  assertUnread(table);
  assert.equal(digest(snapshot(table)),dictionaryContract,'messaging copy/type/order/descriptor/function-source contract changed');
}
// Execute actual full module against real HTML, with inert recorded boundaries.
// No real timers, network, storage mutation, server or provider is available.
function appOf(source,{page='messages',stored='en'}={}){
  const dom=new JSDOM(read('public/'+page+'.html'),{url:'https://example.test/'+page+'.html',runScripts:'outside-only'});
  const w=dom.window,events=[],subscribers=[],values=new Map(stored===null?[]:[['parrot669-language',stored]]);
  const session={user:null,epoch:0,request(p,options){events.push(['request',p,options]);return Promise.resolve({messages:25});},
    refresh(){events.push(['refresh']);return Promise.resolve(session.user);},
    setUser(value,options){events.push(['setUser',value,options]);session.user=value;},
    subscribe(fn){events.push(['subscribe']);subscribers.push(fn);return ()=>{};}};
  const store={getItem(key){events.push(['getItem',key]);return values.get(key)??null;},
    setItem(key,value){events.push(['setItem',key,value]);values.set(key,value);},
    removeItem(key){events.push(['removeItem',key]);values.delete(key);},length:0,key(){return null;}};
  w.ParrotCore={session,auth:{},storage:{local:store,session:store}};
  w.setInterval=(fn,delay)=>{events.push(['interval',delay]);return 1;};
  w.fetch=()=>{throw Error('unexpected real fetch');};
  w.eval(source.replace(boundary,'  window.tableForTest=texts;\n'+boundary));
  const M=w.ParrotMessaging;
  return {dom,w,M,table:w.tableForTest,events,session,subscribers,
    snapshot:()=>JSON.parse(JSON.stringify({
      text:[...w.document.querySelectorAll('[data-msg-i18n]')].map(n=>[n.dataset.msgI18n,n.textContent]),
      placeholders:[...w.document.querySelectorAll('[data-msg-placeholder]')].map(n=>[n.dataset.msgPlaceholder,n.placeholder]),
      badges:[...w.document.querySelectorAll('[data-msg-unread]')].map(n=>[n.textContent,n.hidden,n.closest('.messaging-nav-link')?.getAttribute('aria-label')]),
      events,session:{user:session.user,epoch:session.epoch},storage:[...values]
    }))};
}

if(require.main===module){
  test('all messaging dictionary keys, values, types, order, descriptors and function sources preserve parent128bd247',()=>{
    const table=tableOf(read('public/assets/messaging-common.js'));assertDictionary(table);
    assert.deepEqual(Reflect.ownKeys(table),['en','es','ca','ru']);
  });
  test('unread functions preserve all17 representative counts in every locale',()=>{
    assertUnread(tableOf(read('public/assets/messaging-common.js')));
  });
  for(const locale of ['en','es','ca','ru'])test('negative control: changed '+locale+' authLead fails copy contract',()=>{
    const table=tableOf(read('public/assets/messaging-common.js'));table[locale].authLead+=' CHANGED';
    assert.throws(()=>assertDictionary(table),/copy\/type\/order\/descriptor\/function-source contract changed/);
  });
  test('negative control: boxed same-JSON text fails type contract',()=>{
    const table=tableOf(read('public/assets/messaging-common.js'));table.en.authLead=new String(table.en.authLead);
    assert.throws(()=>assertDictionary(table),/copy\/type\/order/);
  });
  test('negative control: identical values in different insertion order fail contract',()=>{
    const table=tableOf(read('public/assets/messaging-common.js')),value=table.en.messages;
    delete table.en.messages;table.en.messages=value;assert.throws(()=>assertDictionary(table),/order\/descriptor/);
  });
  test('negative control: changed unread function output fails output guard',()=>{
    const table=tableOf(read('public/assets/messaging-common.js'));table.ru.unreadCount=n=>'WRONG '+n;
    assert.throws(()=>assertDictionary(table),/unread function-output contract changed/);
  });
  test('negative control: same-output wrapper fails exact function-source guard',()=>{
    const table=tableOf(read('public/assets/messaging-common.js')),original=table.en.unreadCount;
    table.en.unreadCount=n=>original(n);assertUnread(table);
    assert.throws(()=>assertDictionary(table),/function-source contract changed/);
  });
  test('negative control: descriptor-only change fails dictionary contract',()=>{
    const table=tableOf(read('public/assets/messaging-common.js'));
    Object.defineProperty(table.en,'messages',{writable:false});assert.throws(()=>assertDictionary(table),/descriptor\/function-source/);
  });
  test('unknown locale/key and missing-localized-key fallback keep ordinary translation behavior',()=>{
    const app=appOf(read('public/assets/messaging-common.js'),{stored:'unknown'});
    try{
      assert.equal(app.M.t('messages'),app.table.en.messages);assert.equal(app.M.t('__missing__'),'__missing__');
      app.M.setLanguage('es');const value=app.table.es.retry;delete app.table.es.retry;
      assert.equal(app.M.t('retry'),app.table.en.retry);app.table.es.retry=value;
      app.M.setLanguage('not-supported');assert.equal(app.M.t('messages'),app.table.en.messages);
    }finally{app.dom.window.close();}
  });
  test('language rendering creates no requests, storage writes or session mutations and preserves poll registration',()=>{
    const app=appOf(read('public/assets/messaging-common.js'),{stored:'ru'});
    try{
      const notified=[];app.M.onLanguage(locale=>notified.push(locale));
      for(const locale of ['en','es','ca','ru']){
        app.M.setLanguage(locale);
        for(const n of app.w.document.querySelectorAll('[data-msg-i18n]'))assert.equal(n.textContent,app.M.t(n.dataset.msgI18n));
        for(const n of app.w.document.querySelectorAll('[data-msg-placeholder]'))assert.equal(n.placeholder,app.M.t(n.dataset.msgPlaceholder));
      }
      assert.deepEqual(notified,['en','es','ca','ru']);
      assert(!app.events.some(([name])=>['request','setItem','removeItem','setUser','refresh'].includes(name)));
      assert.deepEqual(app.events.filter(([name])=>name==='interval'),[['interval',30000]]);
      assert.equal(app.subscribers.length,1);
    }finally{app.dom.window.close();}
  });
}
module.exports={tableOf,snapshot,unreadValues,assertUnread,assertDictionary,appOf,sampleCounts,digest};

