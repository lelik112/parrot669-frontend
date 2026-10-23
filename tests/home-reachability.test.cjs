const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
  .map(match=>[match[1],match[2]??match[3]]));
const tags=html=>[...html.matchAll(/<[a-z][^>]*>/gi)].map(match=>attributes(match[0]));

function production(){
  const files=new Map();
  function walk(dir){
    for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
      const file=path.posix.join(dir,item.name);
      if(item.isDirectory())walk(file);
      else if(/\.(?:js|html)$/.test(file))files.set(file,read(file));
    }
  }
  walk('public');walk('src');
  return files;
}

function auditGraph(files){
  const edges=new Map(),pages=[];
  for(const [file,source] of files){
    const imports=[];
    if(file.endsWith('.html')){
      pages.push(file);
      for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
        assert.equal(match[2].trim(),'','inline script needs reachability review');
        const src=attributes(match[1]).src;
        assert(src?.startsWith('/assets/'),'unexpected script source');
        imports.push('public/'+src.split('?')[0].slice(1));
      }
    }else{
      assert.doesNotMatch(source,/\bimport\s*\(|\beval\s*\(|new\s+Function|document\.write|createElement\(["']script/,
        'dynamic loader needs reachability review');
      for(const match of source.matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["']([^"']+)["']/g)){
        assert(match[1].startsWith('.'),'unexpected external module');
        imports.push(path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])));
      }
    }
    for(const target of imports)assert(files.has(target),'unresolved module: '+target);
    edges.set(file,imports);
  }
  function reachable(start){
    const seen=new Set(),pending=[start];
    while(pending.length){
      const file=pending.pop();
      if(seen.has(file))continue;
      seen.add(file);pending.push(...(edges.get(file)||[]));
    }
    seen.delete(start);return [...seen].sort();
  }
  const reach=Object.fromEntries(pages.sort().map(page=>[page,reachable(page)]));
  const owners=pages.filter(page=>reach[page].includes('public/assets/script.js'));
  assert.deepEqual(owners,['public/index.html'],'Home controller must be Home-only');
  for(const attrs of tags(files.get('public/index.html'))){
    assert(!['availability-form','availability-results'].includes(attrs.id),'Home availability DOM needs a new review');
  }
  for(const page of pages)for(const attrs of tags(files.get(page))){
    for(const key of [attrs['data-i18n'],attrs['data-i18n-html']]){
      assert(!/^availability[A-Z]/.test(key||''),'obsolete translation acquired a DOM consumer');
    }
  }
  return {pages,reach,edges};
}

// Startup/language facade only. It does not model layout, native input or focus.
function runHome(source,html,language='en',saved=null){
  const nodes=tags(html).map(attrs=>{
    const classes=new Set((attrs.class||'').split(/\s+/));
    return {attrs,textContent:'',innerHTML:'',dataset:Object.fromEntries(Object.entries(attrs)
      .filter(([name])=>name.startsWith('data-')).map(([name,value])=>[
        name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value])),
    classList:{toggle(name,on){on?classes.add(name):classes.delete(name)},contains:name=>classes.has(name)},
    getAttribute:name=>attrs[name]??null,setAttribute(name,value){attrs[name]=String(value)},
    addEventListener(){},querySelectorAll(){return []}};
  });
  const listeners=new Map(),queries=[],writes=[],events=[],requests=[];
  const document={documentElement:{lang:''},body:{classList:{contains:()=>true}},
    querySelectorAll(selector){
      if(selector==='[data-i18n]')return nodes.filter(n=>n.dataset.i18n);
      if(selector==='[data-i18n-html]')return nodes.filter(n=>n.dataset.i18nHtml);
      if(selector==='[data-lang],[data-menu-lang]')return nodes.filter(n=>n.dataset.lang||n.dataset.menuLang);
      throw new Error('unexpected selector '+selector);
    },
    querySelector(selector){assert.equal(selector,'.menu-toggle');return nodes.find(n=>n.attrs.class==='menu-toggle')||null},
    getElementById(id){queries.push(id);return nodes.find(n=>n.attrs.id===id)||null},
    addEventListener(name,listener){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(listener)},
    dispatchEvent(event){events.push([event.type,event.detail]);for(const listener of listeners.get(event.type)||[])listener(event)}
  };
  const window={addEventListener(){},ParrotCore:{
    storage:{local:{getItem:()=>saved,setItem:(key,value)=>writes.push([key,value])}},
    http(...args){requests.push(args);throw new Error('unexpected Home search request')}
  }};
  const context=vm.createContext({document,window,navigator:{language},console,
    CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail}}});
  vm.runInContext(source,context,{filename:'public/assets/script.js',timeout:1000});
  return {context,nodes,queries,writes,events,requests,
    language:lang=>context.setLanguage(lang),
    value:key=>nodes.filter(n=>n.dataset.i18n===key||n.dataset.i18nHtml===key).map(n=>n.textContent||n.innerHTML),
    snapshot:()=>JSON.parse(JSON.stringify({lang:document.documentElement.lang,
      copy:nodes.filter(n=>n.dataset.i18n||n.dataset.i18nHtml).map(n=>[
        n.dataset.i18n||n.dataset.i18nHtml,n.textContent,n.innerHTML]),
      buttons:nodes.filter(n=>n.dataset.lang||n.dataset.menuLang).map(n=>[
        n.dataset.lang||n.dataset.menuLang,n.classList.contains('active')]),
      menuLabel:nodes.find(n=>n.attrs.class==='menu-toggle')?.attrs['aria-label'],writes,events,requests}))};
}

function noLegacyReads(app){
  assert.deepEqual(app.queries.filter(id=>['availability-form','availability-results'].includes(id)),[],
    'Home must not probe the retired availability UI');
  assert.equal(app.requests.length,0);
}

// Exact effective dictionary at parent17a38f6b, including own-key insertion order
// and value types. Deliberate copy changes require an explicit contract update.
const dictionaryContract='104758a5d8c62f7cfe86b714be5b9d8ba55dcaa3258b76027f6c93d0f5c95473';
function dictionarySnapshot(app){
  return JSON.parse(vm.runInContext('JSON.stringify(Reflect.ownKeys(translations).map(locale=>[locale,Reflect.ownKeys(translations[locale]).map(key=>[key,typeof translations[locale][key],translations[locale][key]])]))',app.context));
}
function assertDictionaryUnchanged(app){
  const snapshot=dictionarySnapshot(app);
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),dictionaryContract,
    'Home dictionary key/value/type/insertion-order contract changed');
  return snapshot;
}

const titles={en:'Local help we stand behind.',es:'Ayuda de la que nos hacemos responsables.',
  ca:'Ajuda de la qual ens fem responsables.',ru:'Помощь, за которую мы отвечаем.'};
const guarantees={en:'If we make a mistake in our work, we’ll refund you and take the next step free of charge.',
  es:'Si cometemos un error en nuestro trabajo, te devolveremos el dinero y realizaremos gratis el siguiente paso.',
  ca:'Si ens equivoquem en la nostra feina, et retornarem els diners i farem el següent pas de franc.',
  ru:'Если мы ошиблись в своей работе, вернём деньги и следующий шаг сделаем бесплатно.'};

if(require.main===module){
  test('all five page entry graphs keep Home private and actual Search availability reachable',()=>{
    const files=production(),audit=auditGraph(files);
    assert.equal(audit.pages.length,5);
    assert(audit.reach['public/search.html'].includes('public/assets/search.js'));
    const ids=tags(files.get('public/search.html')).map(attrs=>attrs.id);
    assert(ids.includes('availability-form'));assert(ids.includes('availability-results'));
  });
  test('Home startup and all locale changes never probe availability UI or issue search requests',()=>{
    const app=runHome(read('public/assets/script.js'),read('public/index.html'));
    for(const lang of ['en','es','ca','ru'])app.language(lang);
    noLegacyReads(app);
    assert(app.writes.every(([key])=>key==='parrot669-language'));
    assert(app.events.every(([name])=>name==='parrot:language'));
  });
  for(const lang of Object.keys(titles))test(`Home ${lang} preserves accepted hero and both guarantee copies`,()=>{
    const app=runHome(read('public/assets/script.js'),read('public/index.html'),lang);
    assert.deepEqual(app.value('heroTitle'),[titles[lang]]);
    assert.deepEqual(app.value('guaranteePromise'),[guarantees[lang],guarantees[lang]]);
    assert.equal(app.snapshot().lang,lang);noLegacyReads(app);
  });
  test('all four effective Home dictionaries preserve every key, value, type and insertion order',()=>{
    const app=runHome(read('public/assets/script.js'),read('public/index.html'));
    const snapshot=assertDictionaryUnchanged(app);
    assert.deepEqual(snapshot.map(([locale])=>locale),['en','es','ca','ru']);
    for(const [,entries] of snapshot){
      assert.equal(entries.length,104);
      assert(entries.every(([,type])=>type==='string'));
    }
  });
  for(const locale of ['en','es','ca','ru'])for(const key of ['heroTitle','guaranteePromise']){
    test(`negative control: changed ${locale} ${key} fails the complete dictionary contract`,()=>{
      const app=runHome(read('public/assets/script.js'),read('public/index.html'));
      vm.runInContext(`translations[${JSON.stringify(locale)}][${JSON.stringify(key)}] += " CHANGED";`,app.context);
      assert.throws(()=>assertDictionaryUnchanged(app),/dictionary key\/value\/type\/insertion-order contract changed/);
    });
  }
  test('negative control: identical values with reordered keys fail the dictionary contract',()=>{
    const app=runHome(read('public/assets/script.js'),read('public/index.html'));
    vm.runInContext('{const value=translations.en.brandTag;delete translations.en.brandTag;translations.en.brandTag=value;}',app.context);
    assert.throws(()=>assertDictionaryUnchanged(app),/insertion-order contract changed/);
  });
  test('negative control: boxed text with the same JSON value fails the value-type contract',()=>{
    const app=runHome(read('public/assets/script.js'),read('public/index.html'));
    vm.runInContext('translations.en.heroTitle=new String(translations.en.heroTitle);',app.context);
    assert.throws(()=>assertDictionaryUnchanged(app),/type\/insertion-order contract changed/);
  });
  test('unknown browser locale falls back and stored locale retains priority',()=>{
    assert.equal(runHome(read('public/assets/script.js'),read('public/index.html'),'zz').snapshot().lang,'en');
    assert.equal(runHome(read('public/assets/script.js'),read('public/index.html'),'en','ca').snapshot().lang,'ca');
  });
  test('negative control: a Home availability node invalidates the dead-code premise',()=>{
    const files=production();files.set('public/index.html',files.get('public/index.html')+'<form id="availability-form"></form>');
    assert.throws(()=>auditGraph(files),/Home availability DOM/);
  });
  test('negative control: Search importing the Home controller invalidates exclusive ownership',()=>{
    const files=production();files.set('public/assets/entry-search.js',files.get('public/assets/entry-search.js')+'\nimport "./script.js";');
    assert.throws(()=>auditGraph(files),/Home controller must be Home-only/);
  });
  test('negative control: a computed loader requires another reachability review',()=>{
    const files=production();files.set('public/assets/entry-home.js',files.get('public/assets/entry-home.js')+'\nimport(nextAsset);');
    assert.throws(()=>auditGraph(files),/dynamic loader/);
  });
  test('negative control: restored Home availability lookup is observed',()=>{
    const app=runHome(read('public/assets/script.js')+'\ndocument.getElementById("availability-form");',read('public/index.html'));
    assert.throws(()=>noLegacyReads(app),/retired availability UI/);
  });
  test('negative control: a live translation consumer invalidates deletion of obsolete copy',()=>{
    const files=production();files.set('public/index.html',files.get('public/index.html')+'<p data-i18n="availabilityTitle"></p>');
    assert.throws(()=>auditGraph(files),/translation acquired a DOM consumer/);
  });
  test('negative control: changed visible hero text fails the accepted copy contract',()=>{
    const original=read('public/assets/script.js'),changed=original.replace(titles.en,'CHANGED HERO');
    assert.notEqual(changed,original);
    const app=runHome(changed,read('public/index.html'));
    assert.throws(()=>assert.deepEqual(app.value('heroTitle'),[titles.en]),{code:'ERR_ASSERTION'});
  });
}

module.exports={production,auditGraph,runHome,noLegacyReads,dictionarySnapshot,assertDictionaryUnchanged};
