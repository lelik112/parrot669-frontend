const {test:base,expect}=require('@playwright/test');
const audits=new WeakMap();

async function installNetworkGuards(context,baseURL='http://127.0.0.1:4173'){
  if(audits.has(context))return audits.get(context);
  const origin=new URL(baseURL);
  if(origin.protocol!=='http:'||origin.hostname!=='127.0.0.1')throw new Error('Fixture requires its own loopback server');
  const audit={unexpected:[],blockedRequests:[],blockedFonts:0,expectedProbes:new Set()};
  const record=(kind,url)=>{
    audit.blockedRequests.push({kind,url});
    if(!audit.expectedProbes.has(url))audit.unexpected.push({kind,url});
  };
  // Installed on the context before any page or popup is navigated.
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===origin.origin){
      if(url.pathname.startsWith('/api/')){
        record('unhandled synthetic API',url.origin+url.pathname);
        return route.fulfill({status:501,json:{error:'No synthetic fixture for request'}});
      }
      if(request.isNavigationRequest()&&request.resourceType()==='document'){
        const response=await route.fetch({maxRedirects:0});
        if(response.status()!==200)throw new Error('Unexpected document response from owned fixture server');
        // Preconnect hints can create connections before a resource route fires.
        const body=(await response.text()).replace(/<link\b[^>]*(?:rel=["']preconnect["']|href=["']https:\/\/fonts\.)[^>]*>/gi,'');
        const headers={...response.headers(),'content-security-policy':"worker-src 'none'; font-src 'none'"};
        delete headers['content-length'];delete headers['transfer-encoding'];
        return route.fulfill({response,body,headers});
      }
      return route.continue();
    }
    if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
      audit.blockedFonts+=1;
      // Empty local responses: no external font request leaves the browser.
      return route.fulfill({status:200,contentType:'text/css',body:''});
    }
    record('blocked HTTP',request.url());
    return route.abort('blockedbyclient');
  });
  await context.routeWebSocket('**/*',socket=>{
    record('blocked WebSocket',socket.url());
    socket.close({code:1008,reason:'Synthetic offline fixture'});
  });
  audits.set(context,audit);
  return audit;
}

const test=base.extend({
  context:async({context,baseURL},use,testInfo)=>{
    const audit=await installNetworkGuards(context,baseURL);
    await use(context);
    await testInfo.attach('network-audit',{body:Buffer.from(JSON.stringify({unexpected:audit.unexpected,blockedFonts:audit.blockedFonts,serviceWorkers:'block',externalNetwork:'blocked before navigation'})),contentType:'application/json'});
    expect(audit.unexpected,'unexpected network requests were blocked').toEqual([]);
  }
});
module.exports={test,expect,installNetworkGuards,getNetworkAudit:context=>audits.get(context)};
