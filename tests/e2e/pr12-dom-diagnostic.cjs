// Diagnostic branch only. Passive observations; no application or action wrappers.
const {writeFile}=require('node:fs/promises');
const {installNetworkGuards,getNetworkAudit}=require('./isolated-fixture.cjs');
const titles=new Set([
  'workspace disclosure/editor geometry 320/en',
  'ordinary spinner uses no-preference and valid ACK plus GET before Saved',
  'Host previews token-free source, keeps damaged save unknown, then resolves with GET only'
]);

function observeDom(){
  if(location.origin!=='http://127.0.0.1:4173')return;
  const selector='.host-period-editor,.host-source-form';
  const kinds=['pointerdown','pointerup','mousedown','mouseup','input','change',
    'focus','blur','focusin','focusout','click','submit','invalid'];
  const entries=[],ids=new WeakMap(),encoder=new TextEncoder();
  let nextId=0,bytes=0,dropped=0,oversized=0,sequence=0,stopped=false;
  const limit=512*1024,maxEntries=1024;
  const id=node=>{if(!node)return null;if(!ids.has(node))ids.set(node,++nextId);return ids.get(node);};
  const element=node=>node?.nodeType===1?node:node?.parentElement;
  const scope=node=>element(node)?.closest?.(selector);
  const short=value=>String(value||'').slice(0,80);
  // Fingerprints identify equal label replacements without storing label/input text.
  const textMark=value=>{
    const text=String(value||'');let hash=2166136261;
    for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
    return {length:text.length,hash:(hash>>>0).toString(16)};
  };
  const describe=node=>{
    if(!node)return null;
    if(node.nodeType===3)return {uid:id(node),kind:'text',connected:node.isConnected,text:textMark(node.nodeValue)};
    if(node.nodeType!==1)return {uid:id(node),kind:node.nodeType===9?'document':'window'};
    return {uid:id(node),tag:node.tagName,id:short(node.id),class:short(node.className),
      name:short(node.getAttribute('name')),type:short(node.getAttribute('type')),
      key:short(node.dataset?.hostKey),connected:node.isConnected,hidden:node.hidden,
      disabled:!!node.disabled,readOnly:!!node.readOnly,
      valid:node.validity?.valid,text:node.tagName==='BUTTON'||node.tagName==='SPAN'?textMark(node.textContent):undefined};
  };
  const formState=node=>{
    const form=scope(node);
    return form?{uid:id(form),connected:form.isConnected,state:form.dataset.state||null,
      operation:form.dataset.hostOperation||null,busy:form.getAttribute('aria-busy')}:null;
  };
  function record(data){
    if(stopped)return;
    const entry={seq:++sequence,t:performance.now(),...data};
    const size=encoder.encode(JSON.stringify(entry)).byteLength;
    if(size>8192){oversized++;return;}
    while(entries.length&&(bytes+size>limit||entries.length>=maxEntries)){
      bytes-=entries.shift().size;dropped++;
    }
    entries.push({entry,size});bytes+=size;
  }
  const relevant=mutation=>scope(mutation.target)||mutation.type==='childList'&&
    [...mutation.addedNodes,...mutation.removedNodes].some(node=>
      element(node)?.matches?.(selector)||element(node)?.querySelector?.(selector));
  function mutations(records,boundary){
    for(const mutation of records){
      if(!relevant(mutation))continue;
      record({kind:'mutation',boundary,mutation:mutation.type,target:describe(mutation.target),
        form:formState(mutation.target),active:describe(document.activeElement),
        attribute:mutation.attributeName||undefined,
        old:mutation.type==='characterData'?textMark(mutation.oldValue):mutation.oldValue,
        current:mutation.type==='attributes'?mutation.target.getAttribute(mutation.attributeName):undefined,
        added:Array.from(mutation.addedNodes).slice(0,8).map(describe),
        removed:Array.from(mutation.removedNodes).slice(0,8).map(describe),
        addedCount:mutation.addedNodes.length,removedCount:mutation.removedNodes.length});
    }
  }
  const observer=new MutationObserver(records=>mutations(records,'observer'));
  observer.observe(document,{subtree:true,childList:true,characterData:true,characterDataOldValue:true,
    attributes:true,attributeOldValue:true,
    attributeFilter:['disabled','hidden','readonly','type','class','data-state','data-host-operation','aria-busy']});
  function eventRecord(event,phase){
    mutations(observer.takeRecords(),'before-'+event.type+'-'+phase);
    if(!scope(event.target)&&!scope(document.activeElement)&&!scope(event.relatedTarget))return;
    record({kind:'event',event:event.type,phase,eventTime:event.timeStamp,trusted:event.isTrusted,
      defaultPrevented:event.defaultPrevented,target:describe(event.target),related:describe(event.relatedTarget),
      path:event.composedPath().slice(0,10).map(describe),active:describe(document.activeElement),
      form:formState(event.target)||formState(document.activeElement),
      button:event.button,pointerType:event.pointerType});
  }
  const capture=event=>eventRecord(event,'capture'),bubble=event=>eventRecord(event,'bubble');
  for(const kind of kinds){
    document.addEventListener(kind,capture,{capture:true,passive:true});
    document.addEventListener(kind,bubble,{capture:false,passive:true});
  }
  Object.defineProperty(window,'__PR12_DOM_DIAGNOSTIC__',{value:{drain(){
    mutations(observer.takeRecords(),'afterEach');observer.disconnect();
    for(const kind of kinds){document.removeEventListener(kind,capture,true);document.removeEventListener(kind,bubble,false);}
    stopped=true;
    return {schema:1,clock:'performance.now; milliseconds since document time origin',
      timeOrigin:performance.timeOrigin,limitBytes:limit,maxEntries,dropped,oversized,
      events:entries.map(item=>item.entry)};
  }}});
}

function installDomDiagnostic(test){
  if(process.env.PR12_DOM_DIAGNOSTIC!=='1')return;
  test.beforeEach(async({page,context,baseURL},testInfo)=>{
    if(testInfo.project.name!=='webkit-desktop'||!titles.has(testInfo.title))
      throw new Error('PR12 diagnostic selection must contain only the three approved WebKit cases');
    await installNetworkGuards(context,baseURL);
    await page.addInitScript(observeDom);
  });
  test.afterEach(async({page,context},testInfo)=>{
    let dom;
    try{dom=await page.evaluate(()=>window.__PR12_DOM_DIAGNOSTIC__?.drain()||null);}
    catch{dom={unavailable:'page unavailable during afterEach; inspect retained Playwright trace'};}
    const audit=getNetworkAudit(context);
    const result={schema:1,title:testInfo.title,project:testInfo.project.name,status:testInfo.status,
      dom:dom||{unavailable:'diagnostic init script did not reach the fixture document'},
      network:{unexpected:audit?.unexpected.length??null,blocked:audit?.blockedRequests.length??null,
        blockedFonts:audit?.blockedFonts??null},
      privacy:'No input values, URLs, headers, request bodies or raw label text recorded'};
    const body=JSON.stringify(result);
    if(Buffer.byteLength(body)>1024*1024)throw new Error('PR12 diagnostic exceeded its 1MiB per-test log bound');
    await writeFile(testInfo.outputPath('pr12-dom-diagnostic.json'),body+'\n');
    if(!dom||dom.unavailable)throw new Error('PR12 DOM diagnostic unavailable; original test status retained in JSON');
    if(audit?.unexpected.length)throw new Error('PR12 diagnostic blocked unexpected network requests');
  });
}
module.exports={installDomDiagnostic};
