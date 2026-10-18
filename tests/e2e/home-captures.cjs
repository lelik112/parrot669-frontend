const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {getNetworkAudit}=require('./isolated-fixture.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

async function captureEvidence(page,testInfo,details){
  const stem=[details.screen,details.state,details.locale,details.cssViewportWidth].join('-').replace(/[^a-zA-Z0-9_-]/g,'_');
  const files=[];
  const views=details.views||(details.state==='menu-open-focus'?['full']:['full','hero','contact']);
  for(const [view,selector] of [['full',null],['hero','.hero'],['contact','#contact']].filter(([view])=>views.includes(view))){
    const file=testInfo.outputPath(`${stem}-${view}.png`);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const bytes=selector?await page.locator(selector).screenshot({path:file,animations:'disabled'}):await page.screenshot({path:file,fullPage:true,animations:'disabled'});
    files.push({file:path.basename(file),bytes:bytes.length,sha256:hash(bytes)});
  }
  let tree='UNKNOWN';
  try{tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();}catch{}
  const audit=getNetworkAudit(page.context());
  const metadata={
    ...details,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree,
    browser:testInfo.project.name,browserVersion:page.context().browser().version(),
    playwright:require('@playwright/test/package.json').version,platform:process.platform,nodeVersion:process.version,
    viewport:page.viewportSize(),files,
    source:['public/index.html','public/assets/script.js','public/assets/styles.css','public/assets/lead-form.js'].map(file=>({file,sha256:hash(fs.readFileSync(file))})),
    fonts:{remoteFontsLoaded:false,limitation:'Inter and Space Grotesk are declared but external font links and preconnects are removed by the fixture; captures use installed browser fallback fonts. These are not production-font pixel comparisons.',faces:await page.evaluate(()=>[...document.fonts].map(face=>({family:face.family,status:face.status})))},
    network:{unexpected:audit?.unexpected||[],blockedFonts:audit?.blockedFonts||0,serviceWorkers:'block',webSockets:'blocked'}
  };
  fs.writeFileSync(testInfo.outputPath(`${stem}.json`),JSON.stringify(metadata,null,2)+'\n');
  return metadata;
}
module.exports={captureEvidence};
