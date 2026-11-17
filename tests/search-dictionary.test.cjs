const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash}=require('node:crypto');
const source=()=>fs.readFileSync(path.join(__dirname,'../public/assets/search.js'),'utf8');
const counts=[0,1,2,4,5,11,12,13,14,21,22,25,99,100,101,111,112];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function tablesOf(code,{stored=null,browser='en-US'}={}){
  const start=code.indexOf('function t(key,...args)'),end=code.indexOf('\n',start);
  assert(start>=0&&end>start,'Search translation boundary missing');
  const events=[],control={},form={elements:{country:{},city:{}},querySelector(selector){events.push(['form.querySelector',selector]);return control;}};
  const document={getElementById(id){events.push(['getElementById',id]);return id==='availability-form'?form:control;},
    querySelectorAll(selector){events.push(['querySelectorAll',selector]);return [];}};
  const context={window:{ParrotCore:{storage:{local:{getItem(key){events.push(['getItem',key]);return stored;}}}}},document,navigator:{language:browser}};
  vm.runInNewContext(code.slice(0,end)+'\nglobalThis.api={copy,housingCopy,t,initialLang:lang,setLang(value){lang=value;},prototype:Object.prototype};',context,{timeout:1000});
  context.api.events=events;return context.api;
}
function snapshot(api){
  return ['copy','housingCopy'].map(namespace=>{
    const table=api[namespace];assert.equal(Object.getPrototypeOf(table),api.prototype,'table prototype changed');
    return [namespace,Reflect.ownKeys(table).map(locale=>{
      const ld=Object.getOwnPropertyDescriptor(table,locale),dict=ld.value;
      assert(!ld.get&&!ld.set,'locale accessor not admitted');
      assert.equal(Object.getPrototypeOf(dict),api.prototype,'dictionary prototype changed');
      return [locale,[ld.writable,ld.enumerable,ld.configurable],Reflect.ownKeys(dict).map(key=>{
        const d=Object.getOwnPropertyDescriptor(dict,key),value=d.value,type=typeof value;
        assert(!d.get&&!d.set,'entry accessor not admitted');
        return [key,type,type==='function'?Function.prototype.toString.call(value):value,
          [d.writable,d.enumerable,d.configurable],type==='function'?[value.name,value.length]:null];
      })];
    })];
  });
}
function functionValues(api){
  const samples=[...counts.map(n=>[n]),...counts.map(n=>[String(n)]),
    ['Host <fixture>'],['12.50',1],['12,50',2],[0,0],[99.99,112],['2028-01-01','2029-01-01']];
  return ['copy','housingCopy'].flatMap(namespace=>Object.entries(api[namespace]).flatMap(([locale,dict])=>
    Object.entries(dict).filter(([,value])=>typeof value==='function').map(([key,fn])=>
      [namespace,locale,key,samples.map(args=>[args,typeof fn(...args),fn(...args)])])));
}
function lookupValues(api){
  const keys=[...new Set([...Object.keys(api.copy.en),...Object.keys(api.housingCopy.en),'__missing_key__'])];
  return ['en','es','ca','ru','__unknown_locale__'].map(locale=>{
    api.setLang(locale);return [locale,keys.map(key=>{const value=api.t(key,'12.50',2);return [key,typeof value,value];})];
  });
}
// Frozen parent d440de98 contracts, not a second copy of the production tables.
const contracts={dictionary:'0e1f495f13fa102787713e92635065c4528204f4117ecb145a4b850f787c6019',functions:'5bff299fea04c403c369309c26aff4c29792143679138d8aef48420db42f3a51',lookup:'d0c80682ee7deab7eb8099bb92bcc352753b4c4a8087e19a96623f285df2b89e'};
function assertDictionary(api){assert.equal(digest(snapshot(api)),contracts.dictionary,'Search dictionary value/type/order/descriptor/function contract changed');}
function assertFunctions(api){assert.equal(digest(functionValues(api)),contracts.functions,'Search function output contract changed');}
function assertLookup(api){assert.equal(digest(lookupValues(api)),contracts.lookup,'Search namespace precedence/fallback contract changed');}

if(require.main===module){
  test('Search preserves both complete ordered four-locale dictionary contracts',()=>{
    const api=tablesOf(source());assertDictionary(api);
    for(const namespace of ['copy','housingCopy'])assert.deepEqual(Reflect.ownKeys(api[namespace]),['en','es','ca','ru']);
  });
  test('Search functions preserve numeric, string, amount, night, owner and date outputs',()=>assertFunctions(tablesOf(source())));
  test('actual Search translator preserves namespace precedence and unknown-locale fallback',()=>assertLookup(tablesOf(source())));
  test('Search missing-localized-key fallback stays within current namespaces and preserves nullish semantics',()=>{
    const api=tablesOf(source());api.setLang('es');
    assert.equal(api.t('priceFrom'),api.housingCopy.es.priceFrom);
    delete api.housingCopy.es.priceFrom;assert.equal(api.t('priceFrom'),api.copy.es.priceFrom);
    delete api.copy.es.priceFrom;assert.equal(api.t('priceFrom'),undefined,'no per-key English fallback for existing locale');
    api.setLang('__unknown_locale__');assert.equal(api.t('priceFrom'),api.housingCopy.en.priceFrom);
    assert.equal(api.t('__missing_key__'),undefined);
    api.setLang('en');
    for(const value of ['',0,false]){api.housingCopy.en.priceFrom=value;assert.equal(api.t('priceFrom'),value);}
    for(const value of [null,undefined]){api.housingCopy.en.priceFrom=value;assert.equal(api.t('priceFrom'),api.copy.en.priceFrom);}
  });
  test('initial language selection keeps saved-language and browser precedence without writes',()=>{
    for(const [stored,browser,expected] of [['ru','es-ES','ru'],['__unknown__','ca-ES','ca'],[null,'es-ES','es'],[null,'zz-ZZ','en'],[null,'','en']]){
      const api=tablesOf(source(),{stored,browser});assert.equal(api.initialLang,expected);
      assert.deepEqual(api.events.filter(([name])=>name==='getItem'),[['getItem','parrot669-language']]);
    }
  });
  for(const namespace of ['copy','housingCopy'])for(const locale of ['en','es','ca','ru'])
    test('negative control: '+namespace+'/'+locale+' string mutation trips contract',()=>{
      const api=tablesOf(source());api[namespace][locale].lead+=' MUTATED';
      assert.throws(()=>assertDictionary(api),/dictionary value\/type\/order/);
    });
  test('negative control: insertion-order-only mutation trips contract',()=>{
    const api=tablesOf(source()),value=api.copy.en.page;delete api.copy.en.page;api.copy.en.page=value;
    assert.throws(()=>assertDictionary(api),/dictionary value\/type\/order/);
  });
  test('negative control: boxed same-JSON string trips type contract',()=>{
    const api=tablesOf(source());api.housingCopy.ru.lead=new String(api.housingCopy.ru.lead);
    assert.throws(()=>assertDictionary(api),/dictionary value\/type\/order/);
  });
  test('negative control: inverted actual t namespace priority trips lookup contract',()=>{
    const code=source(),original='(housingCopy[lang]||housingCopy.en)[key]??(copy[lang]||copy.en)[key]';
    assert(code.includes(original));
    const api=tablesOf(code.replace(original,'(copy[lang]||copy.en)[key]??(housingCopy[lang]||housingCopy.en)[key]'));
    assertDictionary(api);assert.throws(()=>assertLookup(api),/namespace precedence\/fallback/);
  });
  test('negative control: descriptor-only mutation trips contract',()=>{
    const api=tablesOf(source());Object.defineProperty(api.copy.en,'page',{writable:false});
    assert.throws(()=>assertDictionary(api),/descriptor\/function contract/);
  });
  test('negative control: prototype-only mutation trips structural guard',()=>{
    const api=tablesOf(source());Object.setPrototypeOf(api.housingCopy.en,null);
    assert.throws(()=>assertDictionary(api),/dictionary prototype changed/);
  });
  test('negative control: same-output wrapper trips function source/name/arity contract',()=>{
    const api=tablesOf(source()),old=api.copy.ru.bed;api.copy.ru.bed=n=>old(n);assertFunctions(api);
    assert.throws(()=>assertDictionary(api),/descriptor\/function contract/);
  });
}
module.exports={tablesOf,snapshot,functionValues,lookupValues,digest,assertDictionary,assertFunctions,assertLookup,counts};
