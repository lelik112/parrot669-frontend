import {HttpError, record} from "./shared/http.js";
import {isParrotId} from "./shared/identity.js";

const settingsPath="/api/host/public-profile";
const keys=(value,names)=>record(value)&&Object.keys(value).length===names.length&&names.every(name=>Object.hasOwn(value,name));
const revision=value=>Number.isSafeInteger(value)&&value>=0;
const displayText=(value,max)=>typeof value==="string"&&value.length<=max&&/[^\x00-\x20]/.test(value)&&!/[\x00-\x1f\x7f-\x9f]/.test(value);
export const profileSettings=value=>keys(value,["parrotId","displayName","about","published","revision"])
  &&isParrotId(value.parrotId)
  &&displayText(value.displayName,120)&&(value.about===null||displayText(value.about,500))
  &&typeof value.published==="boolean"&&revision(value.revision);
const snapshot=value=>Object.freeze({parrotId:value.parrotId,displayName:value.displayName,about:value.about,published:value.published,revision:value.revision});
const fields=value=>Object.freeze({displayName:value.displayName,about:value.about??""});
const equalFields=(left,right)=>left?.displayName===right?.displayName&&(left?.about??"")===(right?.about??"");
const equalSnapshot=(left,right)=>left?.revision===right?.revision&&left?.parrotId===right?.parrotId&&left?.published===right?.published&&equalFields(left,right);
export function profileValidation(draft){
  const errors={};
  if(!draft||!/[^\x00-\x20]/.test(draft.displayName))errors.displayName="form.name.required";
  else if(draft.displayName.length>120)errors.displayName="form.name.max";
  if(draft?.about.length>500)errors.about="form.about.max";
  return errors;
}

/** Own editor state only. Transport/session fencing stays in the existing shared core. */
export function createProfileEditor({request,onChange=()=>{}}){
  let identity=null,generation=0,readSequence=0,previewSequence=0;
  let phase="checking",confirmed=null,draft=null,sent=null,uncertain=null,conflict=false;
  let notice="",errors={},readBusy=false,preview={phase:"closed",profile:null,review:false};
  const dirty=()=>Boolean(confirmed&&draft&&!equalFields(draft,confirmed));
  const current=token=>token===generation&&identity!==null;
  const writable=()=>phase==="ready"&&confirmed.revision<Number.MAX_SAFE_INTEGER&&!readBusy&&!sent&&!uncertain&&!conflict;
  const emit=()=>onChange(api.state);
  function clear(status){
    generation++;readSequence++;previewSequence++;phase=status;confirmed=null;draft=null;sent=null;
    uncertain=null;conflict=false;notice="";errors={};readBusy=false;preview={phase:"closed",profile:null,review:false};
  }
  function adoptRead(value,{preserveDraft=false}={}){
    if(confirmed&&(value.revision<confirmed.revision||value.revision===confirmed.revision&&!equalSnapshot(value,confirmed)))
      throw new HttpError("protocol");
    const keep=preserveDraft||dirty();
    confirmed=snapshot(value);
    if(!draft||!keep)draft=fields(value);
    // A newer revision is a CAS barrier: the old expectedRevision can no longer write.
    // It does not identify which request produced the snapshot and is never a Save ACK.
    if(uncertain&&value.revision>uncertain.expectedRevision)uncertain=null;
    conflict=false;phase="ready";
  }
  function expired(error){
    if(error.status!==401&&error.kind!=="stale")return false;
    identity=null;clear("anonymous");notice="auth.expired";emit();return true;
  }
  async function load(){
    if(!identity||sent||readBusy)return false;
    const token=generation,sequence=++readSequence;
    const preserve=Boolean(draft&&(dirty()||uncertain||conflict));
    readBusy=true;if(!confirmed)phase="loading";emit();
    try{
      const value=await request(settingsPath,{authenticated:true,validate:profileSettings});
      if(!current(token)||sequence!==readSequence)return false;
      if(!profileSettings(value))throw new HttpError("protocol");
      adoptRead(value,{preserveDraft:preserve});
      notice=preserve?"form.readback.title":"";
      return true;
    }catch(error){
      if(!current(token)||sequence!==readSequence)return false;
      if(!expired(error)){if(!confirmed)phase="load-error";notice="load.error.title";}
      return false;
    }finally{if(current(token)&&sequence===readSequence){readBusy=false;emit();}}
  }
  async function openPreview({review=false}={}){
    if(!confirmed||sent||uncertain||conflict)return false;
    if(review&&dirty()){notice="visibility.dirty.title";emit();return false;}
    const token=generation,sequence=++previewSequence,wasDirty=dirty(),original=draft;
    preview={phase:"loading",profile:null,review};emit();
    try{
      const value=await request(settingsPath+"/preview",{authenticated:true,
        validate:body=>keys(body,["profile","property"])&&profileSettings(body.profile)&&body.property===null});
      if(!current(token)||sequence!==previewSequence)return false;
      if(!keys(value,["profile","property"])||!profileSettings(value.profile)||value.property!==null)throw new HttpError("protocol");
      adoptRead(value.profile,{preserveDraft:wasDirty||draft!==original});
      preview={phase:"ready",profile:snapshot(value.profile),review};notice="";emit();return true;
    }catch(error){
      if(!current(token)||sequence!==previewSequence)return false;
      if(!expired(error)){preview={phase:"error",profile:null,review};notice="preview.error";emit();}
      return false;
    }
  }
  async function mutate(kind,renderedRevision){
    if(!writable()||renderedRevision!==confirmed.revision)return false;
    if(kind==="save"){
      if(!dirty())return false;
      errors=profileValidation(draft);
      if(Object.keys(errors).length){notice="";emit();return false;}
    }else if(kind==="publish"){
      if(dirty()||preview.phase!=="ready"||!preview.review||!equalSnapshot(preview.profile,confirmed)||confirmed.published){
        notice=dirty()?"visibility.dirty.title":"preview.changed";emit();return false;
      }
    }else if(kind!=="hide"||!confirmed.published)return false;
    const token=generation,base=confirmed,submitted=draft;
    const body=kind==="save"
      ?{displayName:submitted.displayName,about:submitted.about===""?null:submitted.about,expectedRevision:base.revision}
      :{expectedRevision:base.revision};
    const operation=Object.freeze({kind,expectedRevision:base.revision,snapshot:submitted});
    sent=operation;notice=kind==="save"?"form.saving":kind==="hide"?"visibility.hiding":"visibility.publishing";
    previewSequence++;errors={};emit();
    try{
      const valid=value=>keys(value,["success","revision"])&&value.success===true&&revision(value.revision)&&value.revision===base.revision+1;
      const result=await request(kind==="save"?"/api/host/profile":settingsPath+"/publish",{
        authenticated:true,method:kind==="save"?"PATCH":kind==="hide"?"DELETE":"POST",
        body:JSON.stringify(body),validate:valid});
      if(!current(token)||sent!==operation)return false;
      if(!valid(result))throw new HttpError("protocol");
      confirmed=snapshot({...base,...(kind==="save"?{displayName:body.displayName,about:body.about}:{published:kind==="publish"}),revision:result.revision});
      // Only the submitted fields become confirmed; edits made during the request remain draft.
      if(kind==="save"&&draft===submitted)draft=fields(confirmed);
      sent=null;uncertain=null;conflict=false;
      preview={phase:"closed",profile:null,review:false};
      notice=kind==="save"?(dirty()?"form.newer.title":"form.saved"):kind==="hide"?"status.hidden":"status.public";
      emit();return true;
    }catch(error){
      if(!current(token)||sent!==operation)return false;
      sent=null;
      if(expired(error))return false;
      preview={phase:"closed",profile:null,review:false};
      if(error.kind==="http"&&error.status===412){conflict=true;notice=kind==="publish"?"preview.changed":"form.concurrent.title";}
      else if(error.kind==="http"&&[400,403,404].includes(error.status)){
        notice=kind==="save"?"form.refused.title":kind==="hide"?"visibility.refused.hide":"visibility.refused.publish";
      }else{
        uncertain=operation;notice=kind==="save"?"form.unknown.title":"visibility.unknown";
      }
      emit();return false;
    }
  }
  const api={
    get state(){return Object.freeze({phase,confirmed,draft,sent,uncertain,conflict,notice,errors:Object.freeze({...errors}),
      readBusy,preview:Object.freeze({...preview}),dirty:dirty(),canWrite:writable()});},
    setSession({accountId=null,epoch,status}){
      const next=status==="authenticated"&&typeof accountId==="string"&&accountId?{accountId,epoch}:null;
      if(next&&identity&&next.accountId===identity.accountId&&next.epoch===identity.epoch)return false;
      identity=next;clear(next?"loading":status==="unavailable"?"load-error":status==="unknown"||status==="checking"?"checking":"anonymous");emit();return true;
    },
    edit(values){
      if(!draft)return;
      draft=Object.freeze({displayName:typeof values.displayName==="string"?values.displayName:draft.displayName,
        about:typeof values.about==="string"?values.about:draft.about});errors={};emit();
    },
    discard(){if(!confirmed||sent)return;draft=fields(confirmed);errors={};notice="";emit();},
    load,openPreview,
    closePreview(){previewSequence++;preview={phase:"closed",profile:null,review:false};notice="";emit();},
    save:renderedRevision=>mutate("save",renderedRevision),
    publish:renderedRevision=>mutate("publish",renderedRevision),
    hide:renderedRevision=>mutate("hide",renderedRevision)
  };
  return api;
}
