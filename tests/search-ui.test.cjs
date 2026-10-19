const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

const file = name => fs.readFileSync(path.join(__dirname, '../public', name), 'utf8');
const flush = async () => { for (let i=0; i<4; i++) await new Promise(resolve=>setImmediate(resolve)); };
const deferred = () => { let resolve,reject; const promise=new Promise((res,rej)=>{resolve=res;reject=rej}); return {promise,resolve,reject}; };
const response = data => new Response(JSON.stringify(data));
const property = city => ({propertyId:city,propertyTitle:`Home in ${city}`,city,bedrooms:1,sleeps:2,links:[]});

async function harness(t, {handler=()=>undefined, saved=null, messaging=false, sessionUser=null, ownerProfiles={},
  ignoreCityAbort=false, configureStorage=()=>{}}={}) {
  const dom=new JSDOM(file('search.html'),{url:'https://parrot669.com/search',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window, calls=[];
  let activeSessionUser=sessionUser;
  w.localStorage.setItem('parrot669-language','ru');
  if(saved) w.localStorage.setItem('parrot669-search-state',JSON.stringify(saved));
  w.fetch=async (raw,options={})=>{
    const url=new URL(raw,w.location.origin);
    calls.push(url);
    const custom=await handler(url);
    if(custom!==undefined) return custom instanceof Response||typeof custom?.json==='function'?custom:response(custom);
    if(url.pathname==='/api/host/auth/me') return activeSessionUser?response(activeSessionUser):new Response(JSON.stringify({error:'unauthorized'}),{status:401});
    if(url.pathname==='/api/host/auth/logout' && options.method==='POST') return new Response(null,{status:204});
    if(url.pathname.startsWith('/api/messaging/contact-options/')) {
      const id=decodeURIComponent(url.pathname.split('/').at(-1));
      return response({acceptingNewConversations:false,hostProfileId:ownerProfiles[id]||'host'});
    }
    if(url.pathname==='/api/locations/countries') return response([{code:'ES',name:'Spain'},{code:'BY',name:'Belarus'}]);
    if(url.pathname==='/api/locations/cities') return response((url.searchParams.get('country')==='ES'?
      ['Barcelona','Sant Cugat del Vallès']:['Minsk']).map(name=>({name})));
    if(url.pathname==='/api/search') return response([property(url.searchParams.get('city'))]);
    throw Error(`Unexpected request: ${raw}`);
  };
  configureStorage(w);
  require('./helpers/core.cjs').installCore(w);
  const citySignals=[],http=w.ParrotCore.http;
  w.ParrotCore.http=(path,options={})=>{
    if(path.startsWith('/api/locations/cities?')){
      citySignals.push(options.signal);
      if(ignoreCityAbort) options={...options,signal:undefined};
    }
    return http(path,options);
  };
  if(messaging) w.eval(file('assets/messaging-common.js'));
  w.eval(file('assets/search.js'));
  await flush();
  const form=w.document.getElementById('availability-form');
  const change=(control,value,event='change')=>{
    control.value=value;
    control.dispatchEvent(new w.Event(event,{bubbles:true}));
  };
  const submit=async()=>{form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await flush();};
  const h={w,form,calls,citySignals,change,submit,$:id=>w.document.getElementById(id),setSessionUser:value=>{activeSessionUser=value;},
    results:w.document.getElementById('availability-results'),
    searches:()=>calls.filter(url=>url.pathname==='/api/search'),
    language:lang=>w.document.querySelector(`[data-search-lang="${lang}"]`).click()};
  h.barcelona=async()=>{
    change(form.elements.country,'ES');await flush();
    change(form.elements.city,'Barcelona');
    change(form.elements.from,'2026-10-01');change(form.elements.to,'2026-10-08');
    await submit();
  };
  return h;
}

const cityNames = select => [...select.options].filter(option=>option.value).map(option=>option.value);
const pendingJsonResponse = pending => ({ok:true,status:200,json:()=>pending.promise});

test('PM140: generation owns ABA success/error even if transport ignores cancellation',async t=>{
  for(const outcome of ['success','http','network','json'])await t.test(outcome,async t=>{
    const requests=[],parse=deferred();
    const h=await harness(t,{ignoreCityAbort:true,handler:url=>{
      if(url.pathname==='/api/locations/cities'){
        const d=deferred();requests.push(d);return d.promise;
      }
    }});
    h.change(h.form.elements.country,'ES');await flush();
    if(outcome==='json'){requests[0].resolve(pendingJsonResponse(parse));await flush();}
    h.change(h.form.elements.country,'BY');await flush();
    h.change(h.form.elements.country,'ES');await flush();
    assert.equal(h.citySignals[0].aborted,true);assert.equal(h.citySignals[1].aborted,true);
    assert.equal(h.citySignals[2].aborted,false);
    requests[2].resolve([{name:'Current ES'}]);await flush();
    requests[1].resolve([{name:'Stale BY'}]);
    if(outcome==='success')requests[0].resolve([{name:'Stale ES'}]);
    if(outcome==='http')requests[0].resolve(new Response('{}',{status:503}));
    if(outcome==='network')requests[0].reject(new Error('stale network'));
    if(outcome==='json')parse.reject(new Error('stale JSON'));
    await flush();
    assert.deepEqual(cityNames(h.form.elements.city),['Current ES']);
    assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
    assert.equal(h.results.querySelector('.availability-state.error'),null);
  });
});

test('PM140: superseded bootstrap cannot retire a newer explicit search',async t=>{
  const old=deferred(),requests=[];
  const h=await harness(t,{ignoreCityAbort:true,
    saved:{country:'ES',city:'Barcelona',from:'2026-10-01',to:'2026-10-08',searched:true},
    handler:url=>{
      if(url.pathname==='/api/locations/cities'){
        requests.push(url.searchParams.get('country'));
        return requests.length===1?old.promise:[{name:'Minsk'}];
      }
    }});
  h.change(h.form.elements.country,'BY');await flush();await h.submit();
  assert.equal(h.searches().length,1);assert.match(h.results.textContent,/Home in Minsk/);
  old.resolve([{name:'Barcelona'}]);await flush();
  assert.equal(h.searches().length,1);assert.match(h.results.textContent,/Home in Minsk/);
  assert.equal(JSON.parse(h.w.localStorage.getItem('parrot669-search-state')).searched,true);
  h.change(h.$('filter-accommodation-type'),'private_room');await flush();
  assert.equal(h.searches().length,2);assert.equal(h.searches().at(-1).searchParams.get('city'),'Minsk');
});

test('PM140: blocked storage getters or quota failures do not prevent manual search and contact',async t=>{
  for(const failure of ['getters','quota'])await t.test(failure,async t=>{
    const h=await harness(t,{messaging:true,configureStorage:w=>{
      if(failure==='getters')for(const key of ['localStorage','sessionStorage'])
        Object.defineProperty(w,key,{configurable:true,get(){throw new w.DOMException('Synthetic blocked storage','SecurityError');}});
      else w.Storage.prototype.setItem=()=>{throw new w.DOMException('Synthetic quota','QuotaExceededError');};
    }});
    await h.barcelona();
    assert.equal(h.searches().length,1);assert.match(h.results.textContent,/Home in Barcelona/);
    assert.equal(new URL(h.results.querySelector('.message-property-link').href).searchParams.get('property'),'Barcelona');
    assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
  });
});

test('PM-117: only the latest ES to BY location request can commit in either completion order',async t=>{
  for(const reverse of [false,true]) await t.test(reverse?'BY finishes before stale ES':'stale ES finishes before BY',async t=>{
    const requests=[];
    const h=await harness(t,{handler:url=>{
      if(url.pathname==='/api/locations/cities'){
        const pending=deferred();requests.push({country:url.searchParams.get('country'),pending});return pending.promise;
      }
    }});
    h.change(h.form.elements.country,'ES');await flush();
    h.change(h.form.elements.country,'BY');await flush();
    const es=requests.find(request=>request.country==='ES');
    const by=requests.find(request=>request.country==='BY');
    const finishEs=()=>es.pending.resolve(response([{name:'Barcelona'},{name:'Sant Cugat del Vallès'}]));
    const finishBy=()=>by.pending.resolve(response([{name:'Minsk'}]));
    if(reverse){finishBy();await flush();finishEs();}
    else{finishEs();await flush();assert.deepEqual(cityNames(h.form.elements.city),[]);finishBy();}
    await flush();
    assert.equal(h.form.elements.country.value,'BY');
    assert.deepEqual(cityNames(h.form.elements.city),['Minsk']);
    assert.equal(h.form.elements.city.value,'Minsk');
    assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
  });
});

test('PM-117: an ABA country sequence is fenced by generation rather than country equality',async t=>{
  const requests=[];
  const h=await harness(t,{handler:url=>{
    if(url.pathname==='/api/locations/cities'){
      const pending=deferred();requests.push({country:url.searchParams.get('country'),pending});return pending.promise;
    }
  }});
  h.change(h.form.elements.country,'ES');await flush();
  h.change(h.form.elements.country,'BY');await flush();
  h.change(h.form.elements.country,'ES');await flush();
  requests[2].pending.resolve(response([{name:'Current ES'}]));await flush();
  requests[0].pending.resolve(response([{name:'Stale ES'}]));
  requests[1].pending.resolve(response([{name:'Stale BY'}]));await flush();
  assert.equal(h.form.elements.country.value,'ES');
  assert.deepEqual(cityNames(h.form.elements.city),['Current ES']);
  assert.equal(h.form.elements.city.value,'Current ES');
});

test('PM-117: ordinary preferred, single, multiple and empty city outcomes stay deterministic',async t=>{
  const preferred=await harness(t,{saved:{country:'ES',city:'barcelona',searched:false}});
  assert.equal(preferred.form.elements.city.value,'Barcelona','preferred city remains case-insensitive');
  preferred.change(preferred.form.elements.country,'BY');await flush();
  assert.equal(preferred.form.elements.city.value,'Minsk','a single city remains selected');
  preferred.change(preferred.form.elements.country,'ES');await flush();
  assert.equal(preferred.form.elements.city.value,'','multiple cities do not invent a selection');

  const empty=await harness(t,{handler:url=>url.pathname==='/api/locations/cities'?[]:undefined});
  empty.change(empty.form.elements.country,'ES');await flush();
  assert.equal(empty.form.elements.city.disabled,true);
  assert.deepEqual(cityNames(empty.form.elements.city),[]);
  await empty.submit();
  assert.equal(empty.searches().length,0,'an empty current location is not searchable');
});

test('PM-117: clearing country invalidates pending success or failure and rejects programmatic submit',async t=>{
  for(const outcome of ['success','failure']) await t.test(outcome,async t=>{
    const pending=deferred();
    const h=await harness(t,{handler:url=>url.pathname==='/api/locations/cities'?pending.promise:undefined});
    h.change(h.form.elements.from,'2026-10-01');h.change(h.form.elements.to,'2026-10-08');
    h.change(h.form.elements.country,'ES');await flush();
    await h.submit();
    assert.equal(h.searches().length,0,'pending location is not searchable');
    h.change(h.form.elements.country,'');await flush();
    if(outcome==='success') pending.resolve(response([{name:'Barcelona'}]));
    else pending.reject(new Error('stale after clear'));
    await flush();
    assert.deepEqual(cityNames(h.form.elements.city),[]);
    assert.equal(h.form.elements.city.disabled,true);
    assert.equal(h.results.querySelector('.availability-state.error'),null);
    await h.submit();
    assert.equal(h.searches().length,0,'cleared location stays unsearchable');
  });
});

test('PM-117: stale HTTP, network and deferred JSON errors are inert',async t=>{
  for(const failure of ['http','network','json']) await t.test(failure,async t=>{
    const requests=[];
    const h=await harness(t,{handler:url=>{
      if(url.pathname==='/api/locations/cities'){
        const pending=deferred();requests.push({country:url.searchParams.get('country'),pending});return pending.promise;
      }
    }});
    h.change(h.form.elements.country,'ES');await flush();
    h.change(h.form.elements.country,'BY');await flush();
    if(failure==='json'){
      const parse=deferred();requests[0].pending.resolve(pendingJsonResponse(parse));await flush();
      requests[1].pending.resolve(response([{name:'Minsk'}]));await flush();
      parse.reject(new Error('stale parse'));await flush();
    }else{
      requests[1].pending.resolve(response([{name:'Minsk'}]));await flush();
      if(failure==='http') requests[0].pending.resolve(new Response('{}',{status:503}));
      else requests[0].pending.reject(new Error('stale network'));
      await flush();
    }
    assert.deepEqual(cityNames(h.form.elements.city),['Minsk']);
    assert.equal(h.form.elements.city.value,'Minsk');
    assert.equal(h.results.querySelector('.availability-state.error'),null);
  });
});

test('PM-117: current location failure blocks submit and a later current success recovers',async t=>{
  const requests=[];
  const h=await harness(t,{handler:url=>{
    if(url.pathname==='/api/locations/cities'){
      const pending=deferred();requests.push(pending);return pending.promise;
    }
  }});
  h.change(h.form.elements.from,'2026-10-01');h.change(h.form.elements.to,'2026-10-08');
  h.change(h.form.elements.country,'ES');await flush();
  requests[0].resolve(new Response('{}',{status:503}));await flush();
  assert(h.results.querySelector('.availability-state.error'));
  await h.submit();
  assert.equal(h.searches().length,0,'failed location is not searchable');
  h.change(h.form.elements.country,'BY');await flush();
  requests[1].resolve(response([{name:'Minsk'}]));await flush();
  assert.equal(h.results.querySelector('.availability-state.error'),null);
  assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
});

test('PM-117: user edits during saved restore win and prevent stale auto-search',async t=>{
  const saved={country:'ES',city:'Barcelona',from:'2026-10-01',to:'2026-10-08',bedrooms:'1',sleeps:'1',searched:true};
  const requests=[];
  const h=await harness(t,{saved,handler:url=>{
    if(url.pathname==='/api/locations/cities'){
      const pending=deferred();requests.push({country:url.searchParams.get('country'),pending});return pending.promise;
    }
  }});
  assert.equal(requests[0].country,'ES');
  h.change(h.form.elements.country,'BY');
  h.change(h.form.elements.from,'2026-10-02');
  h.change(h.form.elements.bedrooms,'2');await flush();
  requests.find(request=>request.country==='BY').pending.resolve(response([{name:'Minsk'}]));await flush();
  requests.find(request=>request.country==='ES').pending.resolve(response([{name:'Barcelona'}]));await flush();
  assert.equal(h.searches().length,0);
  assert.equal(h.form.elements.country.value,'BY');
  assert.equal(h.form.elements.city.value,'Minsk');
  assert.equal(h.form.elements.from.value,'2026-10-02');
  assert.equal(h.form.elements.bedrooms.value,'2');
  assert.deepEqual(JSON.parse(h.w.localStorage.getItem('parrot669-search-state')),{...saved,country:'BY',city:'Minsk',from:'2026-10-02',bedrooms:'2',accommodationType:'any',pricedOnly:false,minPrice:'',maxPrice:'',searched:false});
});

test('PM-117 correction: every out-of-form filter retires a pending confirmed restore',async t=>{
  const saved={country:'ES',city:'Barcelona',from:'2026-10-01',to:'2026-10-08',bedrooms:'1',sleeps:'1',searched:true};
  const cases=[
    {
      name:'accommodation type change',
      id:'filter-accommodation-type',
      mutate:h=>h.change(h.$('filter-accommodation-type'),'private_room','change'),
      expected:{accommodationType:'private_room'}
    },
    {
      name:'priced-only change',
      id:'filter-priced-only',
      mutate:h=>{
        h.$('filter-priced-only').checked=true;
        h.$('filter-priced-only').dispatchEvent(new h.w.Event('change',{bubbles:true}));
      },
      expected:{pricedOnly:true}
    },
    {
      name:'minimum price input',
      id:'filter-price-from',
      mutate:h=>h.change(h.$('filter-price-from'),'10.01','input'),
      expected:{minPrice:'10.01'}
    },
    {
      name:'maximum price change',
      id:'filter-price-to',
      mutate:h=>h.change(h.$('filter-price-to'),'20.09','change'),
      expected:{maxPrice:'20.09'}
    }
  ];
  for(const scenario of cases) await t.test(scenario.name,async t=>{
    const cities=deferred();
    const h=await harness(t,{saved,handler:url=>url.pathname==='/api/locations/cities'?cities.promise:undefined});
    scenario.mutate(h);
    await flush();
    cities.resolve(response([{name:'Barcelona'},{name:'Sant Cugat del Vallès'}]));
    await flush();
    const stored=JSON.parse(h.w.localStorage.getItem('parrot669-search-state'));
    assert.equal(h.searches().length,0,'late restore must not search after the filter edit');
    assert.equal(stored.searched,false,'the confirmed restore intent is retired');
    assert.equal(h.form.elements.country.value,'ES');
    assert.equal(h.form.elements.city.value,'Barcelona');
    for(const [key,value] of Object.entries(scenario.expected)) assert.equal(stored[key],value);
    if(scenario.id==='filter-priced-only') assert.equal(h.$(scenario.id).checked,true);
    else assert.equal(h.$(scenario.id).value,Object.values(scenario.expected)[0]);
  });
});

test('PM-117: locale change during a pending location request keeps current copy and focus',async t=>{
  const pending=deferred();
  const h=await harness(t,{handler:url=>url.pathname==='/api/locations/cities'?pending.promise:undefined});
  h.form.elements.from.focus();
  h.change(h.form.elements.country,'ES');await flush();
  h.language('es');
  assert.equal(h.w.document.activeElement,h.form.elements.from);
  assert.equal(h.form.elements.city.options[0].textContent,'Elige una ciudad');
  pending.resolve(response([{name:'Barcelona'}]));await flush();
  assert.equal(h.form.elements.city.options[0].textContent,'Elige una ciudad');
  assert.deepEqual(cityNames(h.form.elements.city),['Barcelona']);
  assert.equal(h.w.document.activeElement,h.form.elements.from);
});

test('PM-048: search copy stays concise and the price-only label toggles its checkbox in every language',async t=>{
  const h=await harness(t);
  const document=h.w.document;
  assert.equal(document.getElementById('search-budget-help'),null);
  assert.equal(document.querySelector('.availability-meta'),null);
  assert.equal(h.$('filter-price-from').hasAttribute('aria-describedby'),false);
  assert.equal(h.$('filter-price-to').hasAttribute('aria-describedby'),false);

  const expected={
    en:["Find a place that's available for your dates.",'Only with a price'],
    es:['Encuentra un alojamiento disponible para tus fechas.','Solo con precio'],
    ca:['Troba un allotjament disponible per a les teves dates.','Només amb preu'],
    ru:['Найдите жильё, свободное на ваши даты.','Только с ценой']
  };
  for(const [language,[lead,label]] of Object.entries(expected)){
    h.language(language);
    assert.equal(document.querySelector('[data-search-i18n="lead"]').textContent,lead);
    assert.equal(document.querySelector('.price-filter span').textContent,label);
  }

  const checkbox=h.$('filter-priced-only');
  assert.equal(checkbox.checked,false);
  document.querySelector('label.price-filter').click();
  assert.equal(checkbox.checked,true);
});

test('PM-049: Search logout clears identity and owned-card state without leaving the page',async t=>{
  const h=await harness(t,{messaging:true,sessionUser:{accountId:'account',username:'tester',email:'private@example.test',profile:{id:'owner'}},
    ownerProfiles:{owned:'owner'},handler:url=>url.pathname==='/api/search' ? [{...property('Barcelona'),propertyId:'owned'}] : undefined});
  await h.barcelona();
  assert.equal(h.$('search-account-indicator').textContent,'tester');
  assert.equal(h.w.document.body.textContent.includes('private@example.test'),false);
  assert.equal(h.results.querySelector('.availability-own-property').hidden,false);
  h.$('search-logout').click();await flush();
  assert.equal(h.$('search-account').hidden,true);
  assert.equal(h.$('search-login').hidden,false);
  assert.equal(h.$('search-register').hidden,false);
  assert.equal(h.$('search-login').getAttribute('href'),'/host.html?login=1');
  assert.equal(h.$('search-register').getAttribute('href'),'/host.html?register=1');
  assert.equal(h.results.querySelector('.availability-own-property').hidden,true);
  assert.equal(h.calls.filter(url=>url.pathname==='/api/host/auth/logout').length,1);
});

test('PM-050: anonymous Search exposes localized login and registration deep links',async t=>{
  const h=await harness(t,{messaging:true});
  assert.equal(h.$('search-login').hidden,false);
  assert.equal(h.$('search-register').hidden,false);
  assert.equal(h.$('search-login').getAttribute('href'),'/host.html?login=1');
  assert.equal(h.$('search-register').getAttribute('href'),'/host.html?register=1');
  for(const [language,login,register] of [
    ['en','Log in','Create account'],['es','Entrar','Crear cuenta'],
    ['ca','Entra','Crear compte'],['ru','Войти','Создать аккаунт']
  ]){
    h.language(language);
    assert.equal(h.$('search-login').textContent,login);
    assert.equal(h.$('search-register').textContent,register);
  }
});

test('PM-049: Search clears a BFCache account snapshot before revalidating the session',async t=>{
  const h=await harness(t,{messaging:true,sessionUser:{accountId:'account',username:'tester',profile:{id:'owner'}}});
  assert.equal(h.$('search-account').hidden,false);
  h.setSessionUser(null);
  const event=new h.w.Event('pageshow');
  Object.defineProperty(event,'persisted',{value:true});
  h.w.dispatchEvent(event);
  assert.equal(h.$('search-account').hidden,true);
  assert.equal(h.$('search-account-indicator').textContent,'');
  await flush();
  assert.equal(h.$('search-login').hidden,false);
  assert.equal(h.$('search-register').hidden,false);
  assert.equal(h.calls.filter(url=>url.pathname==='/api/host/auth/me').length,2);
});

test('PM-024: every search card has a working contact link when legacy opt-in is false',async t=>{
  const h=await harness(t,{messaging:true,handler:url=>{
    if(url.pathname==='/api/search') return [
      {...property('Barcelona'),propertyId:'11111111-1111-4111-8111-111111111111',availableFrom:'2026-10-01',availableTo:'2026-10-08'},
      {...property('Barcelona'),propertyId:'22222222-2222-4222-8222-222222222222',availableFrom:'2026-10-01',availableTo:'2026-10-08',links:[{url:'https://www.airbnb.com/rooms/42',externalId:'42',calendarControlStatus:'unverified'}]}
    ];
  }});
  await h.barcelona();
  const links=[...h.results.querySelectorAll('.message-property-link')];
  assert.equal(links.length,2);
  assert(links.every(link=>!link.hidden && new URL(link.href).searchParams.get('from')==='2026-10-01'));
  assert.equal(h.results.querySelectorAll('.availability-verify-nudge:not([hidden])').length,1);
});

test('BUG-019: signed-in username and owned property are clear in every language; other contact and sign-out stay correct',async t=>{
  const ownId='own-property',otherId='other-property';
  const h=await harness(t,{messaging:true,sessionUser:{accountId:'account',username:'fixture-owner',profile:{id:'owner-profile'}},
    ownerProfiles:{[ownId]:'owner-profile',[otherId]:'other-profile'},handler:url=>url.pathname==='/api/search' ? [
      {...property('Barcelona'),propertyId:ownId}, {...property('Barcelona'),propertyId:otherId}
    ]:undefined});
  await h.barcelona();
  const indicator=h.$('search-account-indicator');
  assert.equal(h.$('search-account').hidden,false);
  assert.equal(h.$('search-login').hidden,true);
  assert.equal(indicator.textContent,'fixture-owner');
  const cards=[...h.results.querySelectorAll('.availability-card')];
  assert.equal(cards.length,2);
  const own=cards.find(card=>card.querySelector('.message-property-link').href.includes(ownId));
  const other=cards.find(card=>card.querySelector('.message-property-link').href.includes(otherId));
  assert.equal(own.querySelector('.availability-own-property').hidden,false);
  assert.equal(own.querySelector('.availability-own-property').textContent,'Ваш объект');
  assert.equal(own.querySelector('.message-property-link').hidden,true);
  assert.equal(other.querySelector('.availability-own-property').hidden,true);
  assert.equal(other.querySelector('.message-property-link').hidden,false);

  for(const [language,logout,ownLabel] of [
    ['en','Log out','Your property'],['es','Cerrar sesión','Tu vivienda'],
    ['ca','Tancar sessió','El teu habitatge'],['ru','Выйти','Ваш объект']
  ]){
    h.language(language);
    assert.equal(indicator.textContent,'fixture-owner');
    assert.equal(h.$('search-logout').textContent,logout);
    const updatedOwn=[...h.results.querySelectorAll('.availability-card')].find(card=>card.querySelector('.message-property-link').href.includes(ownId));
    assert.equal(updatedOwn.querySelector('.availability-own-property').textContent,ownLabel);
  }

  h.w.ParrotMessaging.setUser(null);await flush();
  assert.equal(h.$('search-account').hidden,true);
  assert.equal(h.$('search-login').hidden,false);
  assert.equal(indicator.textContent,'');
  const signedOutOwn=[...h.results.querySelectorAll('.availability-card')].find(card=>card.querySelector('.message-property-link').href.includes(ownId));
  assert.equal(signedOutOwn.querySelector('.availability-own-property').hidden,true);
  assert.equal(signedOutOwn.querySelector('.message-property-link').hidden,false);
});

test('GEO-001: changing city hides old cards; filters cannot search the old city',async t=>{
  const h=await harness(t);await h.barcelona();
  assert.match(h.results.textContent,/Home in Barcelona/);
  h.change(h.form.elements.city,'Barcelona');
  assert.equal(h.results.querySelectorAll('article').length,1,'unchanged values keep the results');
  h.change(h.form.elements.city,'Sant Cugat del Vallès');
  assert.equal(h.results.querySelectorAll('article').length,0);
  assert.match(h.results.textContent,/Параметры изменены/);
  assert.equal(JSON.parse(h.w.localStorage.getItem('parrot669-search-state')).searched,false);
  h.change(h.$('filter-accommodation-type'),'private_room');await flush();
  assert.equal(h.searches().length,1,'do not run an old query after a draft edit');
  h.language('es');
  assert.match(h.results.textContent,/Has cambiado los datos/);
  await h.submit();
  assert.match(h.results.textContent,/Home in Sant Cugat del Vallès/);
  assert.equal(h.searches().at(-1).searchParams.get('accommodationType'),'private_room');
  h.change(h.$('filter-accommodation-type'),'entire_place');await flush();
  assert.equal(h.searches().at(-1).searchParams.get('city'),'Sant Cugat del Vallès');
  assert.equal(h.searches().at(-1).searchParams.get('accommodationType'),'entire_place');
});

test('country, stay dates and capacity edits also invalidate previous results',async t=>{
  const h=await harness(t);
  for(const [field,value,event] of [
    ['country','BY','change'],['from','2026-10-02','input'],['to','2026-10-09','change'],
    ['bedrooms','2','change'],['sleeps','3','change']
  ]){
    await h.barcelona();
    assert.equal(h.results.querySelectorAll('article').length,1);
    h.change(h.form.elements[field],value,event);await flush();
    assert.equal(h.results.querySelectorAll('article').length,0,field);
    assert.match(h.results.textContent,/Параметры изменены/);
  }
});

test('a late response cannot restore old-city cards or unlock a newer pending search',async t=>{
  const old=deferred(),fresh=deferred();
  const h=await harness(t,{handler:url=>url.pathname==='/api/search'?
    (url.searchParams.get('city')==='Barcelona'?old.promise:fresh.promise):undefined});
  await h.barcelona();
  assert.match(h.results.textContent,/Ищем свободные даты/);
  h.change(h.form.elements.city,'Sant Cugat del Vallès');
  assert.match(h.results.textContent,/Параметры изменены/);
  assert.equal(h.$('filter-priced-only').disabled,false);
  await h.submit();
  old.resolve([property('Barcelona')]);await flush();
  assert.equal(h.results.querySelectorAll('article').length,0);
  assert.match(h.results.textContent,/Ищем свободные даты/);
  assert.equal(h.$('filter-priced-only').disabled,true);
  assert.equal(h.form.querySelector('[type="submit"]').disabled,true);
  fresh.resolve([property('Sant Cugat del Vallès')]);await flush();
  assert.match(h.results.textContent,/Home in Sant Cugat del Vallès/);
  assert.equal(h.$('filter-priced-only').disabled,false);
  assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
});

test('a late old-city response after editing remains hidden until an explicit search',async t=>{
  const late=deferred();
  const h=await harness(t,{handler:url=>url.pathname==='/api/search'?late.promise:undefined});
  await h.barcelona();
  h.change(h.form.elements.city,'Sant Cugat del Vallès');
  late.resolve([property('Barcelona')]);await flush();
  assert.equal(h.results.querySelectorAll('article').length,0);
  assert.match(h.results.textContent,/Параметры изменены/);
});

test('a filter replacing a pending search releases controls, including invalid price ranges',async t=>{
  const pending=deferred();
  const h=await harness(t,{handler:url=>url.pathname==='/api/search' && url.searchParams.get('accommodationType')==='any'?pending.promise:undefined});
  await h.barcelona();
  h.change(h.$('filter-accommodation-type'),'private_room');await flush();
  assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
  assert.equal(h.$('filter-priced-only').disabled,false);
  h.change(h.$('filter-accommodation-type'),'any');await flush();
  h.change(h.$('filter-price-from'),'100');h.change(h.$('filter-price-to'),'50');await flush();
  assert.match(h.results.textContent,/Цена «от» не может быть больше/);
  assert.equal(h.form.querySelector('[type="submit"]').disabled,false);
  assert.equal(h.$('filter-priced-only').disabled,false);
  pending.resolve([property('Barcelona')]);await flush();
  assert.match(h.results.textContent,/Цена «от» не может быть больше/);
  assert.equal(h.results.querySelectorAll('article').length,0);
});

test('search drafts are preserved without auto-submit; confirmed searches still restore',async t=>{
  const draft={country:'ES',city:'Sant Cugat del Vallès',from:'2026-10-01',to:'2026-10-08',searched:false};
  const h=await harness(t,{saved:draft});
  assert.equal(h.form.elements.city.value,draft.city);
  assert.equal(h.searches().length,0);
  const confirmed=await harness(t,{saved:{...draft,searched:true}});
  assert.equal(confirmed.searches().length,1);
  assert.match(confirmed.results.textContent,/Home in Sant Cugat del Vallès/);
});

test('GEO-002: country and city use their translated native labels in all four languages',async t=>{
  const h=await harness(t);
  for(const [lang,country,city] of [['ru','Страна','Город'],['es','País','Ciudad'],['ca','País','Ciutat'],['en','Country','City']]){
    h.language(lang);
    for(const [control,expected] of [[h.form.elements.country,country],[h.form.elements.city,city]]){
      assert.equal(control.getAttribute('aria-label'),null,'no fixed English name overrides the native label');
      assert.equal(control.labels.length,1);
      assert.equal(control.labels[0].querySelector('span').textContent,expected);
    }
  }
});

test('PM-002: Airbnb stays clickable while calendar status is honest; invalid links are ignored',async t=>{
  const id='910841261983250037';
  const h=await harness(t,{handler:url=>url.pathname==='/api/search' ? [{
    ...property('Barcelona'),propertyId:'11111111-1111-4111-8111-111111111111',
    links:[{platform:'Airbnb',externalId:id,url:`https://www.airbnb.com/rooms/${id}`,calendarControlStatus:'pending'},
      {platform:'Airbnb',externalId:'123',url:'https://evil.example/rooms/123',calendarControlStatus:'verified'}]
  }] : undefined});
  await h.barcelona();
  assert.equal(h.results.querySelectorAll('.availability-link-group').length,1);
  assert.match(h.results.textContent,/Владелец ещё не завершил проверку/);
  assert.equal(h.results.querySelector('.availability-link').href,`https://www.airbnb.com/rooms/${id}`);
});


test('PM-037: 367 nights preserve dates and filters, translate, restore and allow correction to 366',async t=>{
  const h=await harness(t);await h.barcelona();
  h.change(h.form.elements.from,'2028-01-01');
  h.change(h.form.elements.to,'2029-01-02');
  h.change(h.form.elements.bedrooms,'2');
  const count=h.searches().length;
  await h.submit();
  assert.equal(h.searches().length,count);
  assert.match(h.results.textContent,/366 ночей/);
  assert.equal(h.results.querySelectorAll('.availability-card').length,0);
  for(const [language,words] of [['en','366 nights'],['es','366 noches'],['ca','366 nits'],['ru','366 ночей']]){
    h.language(language);
    assert(h.results.textContent.includes(words));
    assert.equal(h.form.elements.from.value,'2028-01-01');
    assert.equal(h.form.elements.to.value,'2029-01-02');
    assert.equal(h.form.elements.bedrooms.value,'2');
  }
  const restored=await harness(t,{saved:JSON.parse(h.w.localStorage.getItem('parrot669-search-state'))});
  assert.equal(restored.searches().length,0);
  assert.match(restored.results.textContent,/366 ночей/);
  assert.equal(restored.form.elements.to.value,'2029-01-02');
  h.change(h.form.elements.to,'2029-01-01');await h.submit();
  assert.equal(h.searches().length,count+1);
  assert.equal(h.searches().at(-1).searchParams.get('to'),'2029-01-01');
  assert.equal(h.searches().at(-1).searchParams.get('bedrooms'),'2');
});

test('PM-037: backend range rejection uses localized message and keeps the form',async t=>{
  const h=await harness(t,{handler:url=>url.pathname==='/api/search'?
    new Response(JSON.stringify({error:'A search request can cover at most 366 nights',code:'SEARCH_RANGE_TOO_LONG'}),{status:400}):undefined});
  await h.barcelona();
  assert.match(h.results.textContent,/366 ночей/);
  assert.equal(h.form.elements.from.value,'2026-10-01');
  assert.equal(h.form.elements.to.value,'2026-10-08');
  assert.equal(h.form.querySelector('button[type="submit"]').disabled,false);
});


test('PM-037: ordinary and leap-year boundary searches keep exact dates through contact links',async t=>{
  const h=await harness(t,{messaging:true,handler:url=>url.pathname==='/api/search'?
    [{...property('Barcelona'),availableFrom:url.searchParams.get('from'),availableTo:url.searchParams.get('to')}]:undefined});
  await h.barcelona();
  for(const [nights,end] of [[1,'2028-01-02'],[7,'2028-01-08'],[30,'2028-01-31'],[90,'2028-03-31'],[366,'2029-01-01']]){
    h.change(h.form.elements.from,'2028-01-01');h.change(h.form.elements.to,end);
    await h.submit();
    const query=h.searches().at(-1).searchParams;
    assert.equal(query.get('from'),'2028-01-01',`${nights} nights`);
    assert.equal(query.get('to'),end);
    const contact=new URL(h.results.querySelector('.message-property-link').href);
    assert.equal(contact.searchParams.get('from'),'2028-01-01');
    assert.equal(contact.searchParams.get('to'),end);
  }
});
