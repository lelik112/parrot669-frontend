// Synthetic current-contract fixture. Browser entry-host.js installs the real
// Core; JSDOM uses installCore. No production ACK is normalized by this fixture.
const propertyId='11111111-1111-4111-8111-111111111111';
const periodId='22222222-2222-4222-8222-222222222222';
const secondPeriodId='33333333-3333-4333-8333-333333333333';
const otherPropertyId='44444444-4444-4444-8444-444444444444';
const accountId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const profileId='P669-BBBB-BBBB-BBBB-BBBB';
const copy=value=>JSON.parse(JSON.stringify(value));
const user={accountId,username:'fixture-owner',email:'owner@example.test',
  parrotId:profileId,displayName:'Synthetic host'};
const createdAt='2026-10-01T00:00:00Z';
function createPeriodFixture(){
  const periods=[{id:periodId,propertyId,from:'2030-11-20',to:'2030-11-26',nightlyPriceCents:8000,createdAt},
    {id:secondPeriodId,propertyId,from:'2031-01-01',to:'2031-01-02',nightlyPriceCents:null,createdAt}];
  const property={id:propertyId,title:'Synthetic apartment — long internal name for compact layout',
    city:'Barcelona',cityNative:null,country:'Spain',countryCode:'ES',createdAt,address:null,
    bedrooms:1,sleeps:2,accommodationType:'entire_place',minStayDays:1,cleaningFeeCents:null,
    availability:periods,unavailability:[],listings:[]};
  const otherProperty={...copy(property),id:otherPropertyId,title:'Other property',availability:[]};
  const fixture={propertyId,periodId,secondPeriodId,otherPropertyId,user:copy(user),property,periods,
    properties:[property,otherProperty],seen:[],hooks:new Map(),
    json:(body,status=200)=>({body:copy(body),status}),
    ack:period=>({id:period.id,propertyId:period.propertyId,
      period:{from:period.from,to:period.to},nightlyPriceCents:period.nightlyPriceCents,createdAt:period.createdAt}),
    wire:rows=>rows.map(row=>fixture.ack(row)),
    snapshot:()=>copy({profile:{id:fixture.user.parrotId,displayName:fixture.user.displayName},properties:fixture.properties.map(value=>({...value,availability:fixture.wire(value.availability)}))}),
    async respond(path,method='GET',payload=null){
      path=path.split('?')[0];
      fixture.seen.push({path,method,payload:copy(payload)});
      const hook=fixture.hooks.get(method+' '+path);
      if(hook)return hook({path,method,payload,json:fixture.json,fixture});
      if(path==='/api/host/auth/me')return fixture.json(fixture.user);
      if(path==='/api/host/auth/logout')return fixture.json(null,204);
      if(path==='/api/host/dashboard')return fixture.json(fixture.snapshot());
      if(path==='/api/host/geocode/countries')return fixture.json([{code:'ES',name:'Spain'}]);
      if(path.startsWith('/api/host/geocode/'))return fixture.json([]);
      if(path==='/api/messaging/unread')return fixture.json({messages:0,conversations:0});
      if(path==='/api/messaging/notification-settings')return fixture.json({enabled:false,language:'en'});
      for(const current of fixture.properties){
        const base='/api/host/properties/'+current.id;
        if(path===base+'/calendars' && method==='GET')return fixture.json({calendars:[]});
        if(path===base+'/availability' && method==='GET')return fixture.json(fixture.wire(current.availability));
        if(path===base && method==='PATCH'){
          Object.assign(current,payload);return fixture.json(null,204);
        }
        if(path===base && method==='DELETE'){
          fixture.properties=fixture.properties.filter(value=>value!==current);return fixture.json(null,204);
        }
        for(const period of current.availability){
          if(path!=='/api/host/availability/'+period.id)continue;
          if(method==='PUT'){
            Object.assign(period,payload.period,{nightlyPriceCents:payload.nightlyPriceCents});return fixture.json(null,204);
          }
          if(method==='DELETE'){
            current.availability=current.availability.filter(value=>value!==period);return fixture.json(null,204);
          }
        }
      }
      return fixture.json({error:'Unexpected isolated request: '+method+' '+path},501);
    },
    async install(page,language='en',{reducedMotion='reduce'}={}){
      // Ordinary animation assertions MUST opt into no-preference explicitly.
      await page.emulateMedia({reducedMotion});
      await page.addInitScript(language=>localStorage.setItem('parrot669-language',language),language);
      await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
      await page.route('https://fonts.gstatic.com/**',route=>route.abort());
      await page.route('**/api/**',async route=>{
        const request=route.request();
        try{
          const result=await fixture.respond(new URL(request.url()).pathname,request.method(),request.postDataJSON());
          await route.fulfill(result.status===204 ? {status:204,body:''} : {status:result.status,json:result.body});
        }catch{await route.abort('failed');}
      });
    }
  };
  return fixture;
}
module.exports={createPeriodFixture,propertyId,periodId,secondPeriodId,otherPropertyId,accountId,profileId};
