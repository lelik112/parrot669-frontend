const {test,expect}=require('./isolated-fixture.cjs');
const {cases,createCssFixture,runCssRegression}=require('./css-regression.cjs');

for(const c of cases)test(`CSS regression ${c.id}`,async({page},testInfo)=>{
  const respond=createCssFixture(c.page);
  await page.route('**/api/**',async route=>{
    const request=route.request(),result=await respond(new URL(request.url()).pathname,request.method());
    await route.fulfill(result.status===204?{status:204,body:''}:{status:result.status,json:result.body});
  });
  await runCssRegression(page,expect,c,{capture:async state=>{
    await testInfo.attach(`${c.id}-${state}`,{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
  }});
});
