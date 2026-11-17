// Diagnostic-only passive event observer. No actions, waits or application mutations.
const {test:base,expect}=require('./isolated-fixture.cjs');
const fs=require('fs');
const test=base.extend({context:async({context},use)=>{
 const requests=[],errors=[];
 context.on('request',r=>{if(requests.length<2000){const u=new URL(r.url());requests.push({method:r.method(),path:u.pathname,time:Date.now()});}});
 context.on('page',p=>p.on('pageerror',e=>{if(errors.length<100)errors.push(e.message);}));
 await context.addInitScript(()=>{
  const entries=[],ids=new WeakMap();let next=1;
  const id=n=>{if(!n||!n.nodeType)return null;if(!ids.has(n))ids.set(n,next++);return ids.get(n);};
  const describe=n=>n&&n.nodeType===1?{node:id(n),tag:n.tagName,id:n.id,cls:typeof n.className==='string'?n.className:null,name:n.getAttribute('name'),connected:n.isConnected,state:n.getAttribute('data-state'),disabled:n.disabled,open:n.open}:null;
  const record=x=>{if(entries.length<2500)entries.push({t:performance.now(),...x});};
  Object.defineProperty(window,'__pr12diagnostic',{value:entries});
  for(const type of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','input','change','focus','blur','submit','toggle'])for(const capture of [true,false]){
   document.addEventListener(type,e=>record({kind:'event',type,phase:capture?'capture':'bubble',target:describe(e.target),active:describe(document.activeElement),prevented:e.defaultPrevented,detail:e.detail,x:e.clientX,y:e.clientY}),{capture,passive:true});
  }
  new MutationObserver(records=>{for(const r of records){
    if(r.type==='attributes')record({kind:'attribute',attribute:r.attributeName,target:describe(r.target)});
    else if(r.addedNodes.length||r.removedNodes.length)record({kind:'children',target:describe(r.target),added:[...r.addedNodes].slice(0,8).map(describe),removed:[...r.removedNodes].slice(0,8).map(describe)});
  }}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-state','open','disabled','hidden','data-phase','data-status']});
 });
 try{await use(context);}finally{
  const pages=[];for(const page of context.pages()){
   try{pages.push(await page.evaluate(()=>({url:location.pathname,events:window.__pr12diagnostic||[],states:[...document.querySelectorAll('[data-state],#msg-dates,.calendar-verification,.host-source-form')].slice(0,50).map(n=>({tag:n.tagName,id:n.id,state:n.dataset.state,open:n.open,phase:n.dataset.phase,status:n.dataset.status}))})));}catch(e){pages.push({error:String(e)});}
  }
  fs.writeFileSync(process.env.DIAG_EVENTS,JSON.stringify({requests,errors,pages},null,2));
 }
}});
module.exports={...require('./isolated-fixture.cjs'),test,expect};
