import "./entry.js";
import {createInstagramReader,instagramCopy} from "./instagram-profile.js";
import {createProfileEditor} from "./profile-editor.js";
import {profileCopy} from "./profile-copy.js";
import {profileReturnContext} from "./profile-navigation.js";

const core=window.ParrotCore;
const $=id=>document.getElementById(id);
const languageKey="parrot669-language";
let language=core.storage.local.getItem(languageKey)||(navigator.language||"en").slice(0,2);
if(!profileCopy[language])language="en";
let renderedRevision=null,lastState,returnFocus=null,returnScroll=0,loginBusy=false,leaveTarget=null,leaving=false;
const t=key=>profileCopy[language][key]||"";
const value=(id,text)=>{if($(id).value!==text)$(id).value=text;};
function status(id,key,bodyKey){
  const node=$(id);node.replaceChildren();
  if(!key)return;
  const title=document.createElement("strong");title.textContent=t(key);node.append(title);
  if(bodyKey){const body=document.createElement("p");body.textContent=t(bodyKey);node.append(body);}
}
const bodyFor={
  "form.saving":"form.saving.body","form.newer.title":"form.newer.body",
  "form.unknown.title":"form.unknown.body","form.refused.title":"form.refused.body",
  "form.readback.title":"form.readback.body","form.concurrent.title":"form.concurrent.body",
  "visibility.dirty.title":"visibility.dirty.body","load.error.title":"load.error.body",
  "visibility.unknown":"visibility.unknown.help","visibility.publishing":"visibility.busy.body","visibility.hiding":"visibility.busy.body"
};
function clearPrivateDOM(){
  for(const id of ["editor-name","editor-about"])value(id,"");
  for(const id of ["editor-parrot-id","editor-email","editor-username","compare-name","compare-about","compare-draft-name","compare-draft-about",
    "preview-name","preview-id","preview-about","editor-visibility"])$(id).textContent="";
  status("save-status","");status("visibility-status","");renderedRevision=null;
  $("editor-return").hidden=true;$("editor-return").removeAttribute("href");$("editor-return").textContent="";
}
function render(state){
  lastState=state;
  const ready=Boolean(state.confirmed)&&state.phase==="ready";
  $("editor-private").hidden=!ready;$("editor-gate").hidden=ready;
  if(!ready){
    clearPrivateDOM();
    const signedOut=state.phase==="anonymous",failed=state.phase==="load-error";
    $("gate-title").textContent=t(signedOut?state.notice==="auth.expired"?"auth.expired":"auth.title":failed?"load.error.title":"loading.title");
    $("gate-body").textContent=t(signedOut?state.notice==="auth.expired"?"auth.no_replay":"auth.body":failed?"load.error.body":"loading.body");
    $("gate-retry").hidden=!failed;$("gate-signin").hidden=!signedOut;$("gate-back").hidden=!signedOut;
    if(!signedOut){$("editor-login").hidden=true;value("editor-login-password","");}
    return;
  }
  $("editor-login").hidden=true;value("editor-login-password","");
  const showingPreview=state.preview.phase!=="closed";
  $("editor-heading").hidden=showingPreview;$("editor-grid").hidden=showingPreview;$("editor-preview-view").hidden=!showingPreview;
  $("editor-parrot-id").textContent=state.confirmed.parrotId;
  const conversation=profileReturnContext({accountId:core.session.user?.accountId,search:location.search,hash:location.hash,storage:core.storage.session});
  $("editor-return").hidden=!conversation;
  if(conversation){$("editor-return").href=`/messages.html?conversation=${encodeURIComponent(conversation.conversationId)}`;$("editor-return").textContent="← "+t("nav.messages");}
  else {$("editor-return").removeAttribute("href");$("editor-return").textContent="";}
  const pendingVisibility=state.sent&&state.sent.kind!=="save";
  $("editor-visibility").textContent=t(state.uncertain||pendingVisibility
    ?state.confirmed.published?"visibility.last.public":"visibility.last.hidden"
    :state.confirmed.published?"status.public":"status.hidden");
  $("editor-preview").disabled=Boolean(state.sent||state.uncertain||state.conflict||state.readBusy);
  value("editor-name",state.draft.displayName);value("editor-about",state.draft.about);
  $("editor-about").style.height="auto";
  $("editor-about").style.height=Math.max(148,$("editor-about").scrollHeight+2)+"px";
  $("about-counter").textContent=t("form.about.counter").replace("{count}",String(state.draft.about.length));
  $("editor-dirty").hidden=!state.dirty;
  for(const [field,input,error] of [["displayName","editor-name","name-error"],["about","editor-about","about-error"]]){
    $(input).setAttribute("aria-invalid",String(Boolean(state.errors[field])));
    $(error).textContent=t(state.errors[field]);
  }
  const visibilityNotice=state.notice.startsWith("visibility.")||["preview.changed","status.public","status.hidden"].includes(state.notice);
  status("save-status",visibilityNotice?"":state.notice,bodyFor[state.notice]);
  status("visibility-status",visibilityNotice?state.notice:"",visibilityNotice?bodyFor[state.notice]:"");
  $("profile-editor-form").setAttribute("aria-busy",String(state.sent?.kind==="save"));
  $("editor-save").disabled=!state.canWrite||!state.dirty;
  $("editor-save").textContent=t(state.sent?.kind==="save"?"form.saving":state.confirmed.published?"form.save.public":"form.save.hidden");
  $("editor-save-help").textContent=t(state.confirmed.published?"form.save.help.public":"form.save.help.hidden");
  $("editor-discard").hidden=!state.dirty;$("editor-discard").disabled=Boolean(state.sent);
  const needsRead=Boolean(state.uncertain||state.conflict||state.notice==="load.error.title");
  $("editor-check").hidden=!needsRead;$("editor-check-help").hidden=!needsRead;
  $("editor-check").disabled=Boolean(state.sent||state.readBusy);
  $("visibility-body").textContent=t(state.confirmed.published?"visibility.public.body":"visibility.hidden.body");
  $("visibility-help").textContent=t(state.confirmed.published?"visibility.hide.help":"visibility.listings.help");
  $("visibility-action").textContent=t(needsRead?"visibility.check":pendingVisibility?state.sent.kind==="hide"?"visibility.hiding":"visibility.publishing":state.confirmed.published?"visibility.hide":"visibility.prepare");
  $("visibility-action").disabled=Boolean(state.sent||state.readBusy)||!needsRead&&!state.canWrite;
  $("visibility-action").classList.toggle("editor-secondary",state.confirmed.published||needsRead);
  $("editor-email").textContent=showingPreview?"":typeof core.session.user?.email==="string"?core.session.user.email:"";
  $("editor-username").textContent=showingPreview?"":typeof core.session.user?.username==="string"?core.session.user.username:"";
  $("editor-comparison").hidden=state.notice!=="form.readback.title";
  $("compare-name").textContent=state.confirmed.displayName;$("compare-about").textContent=state.confirmed.about||"";
  $("compare-draft-name").textContent=state.draft.displayName;$("compare-draft-about").textContent=state.draft.about;
  if(showingPreview){
    const review=state.preview.review,profile=state.preview.profile;
    $("preview-title").textContent=t(review?"visibility.review.title":"preview.title");
    $("preview-description").textContent=t(review?"visibility.review.body":"preview.help");
    $("preview-warning").textContent=t(review?"visibility.review.search":state.dirty?"preview.dirty":"");
    $("preview-privacy").hidden=!review;
    $("preview-card").hidden=state.preview.phase!=="ready";
    $("preview-name").textContent=profile?.displayName||"";$("preview-id").textContent=profile?.parrotId||"";
    $("preview-about").textContent=profile?.about||"";$("preview-about-section").hidden=!profile?.about;
    $("preview-status").textContent=t(state.preview.phase==="loading"?"preview.loading":state.preview.phase==="error"?"preview.error.body":state.notice==="preview.changed"?"preview.changed":"");
    $("preview-refresh").hidden=state.preview.phase!=="error";
    $("preview-publish").hidden=!review;
    $("preview-publish").disabled=!state.canWrite||state.preview.phase!=="ready"||state.dirty||profile?.revision!==state.confirmed.revision||state.confirmed.published;
    $("preview-return").textContent=t(review?"button.cancel":"preview.return");
  }else{
    for(const id of ["preview-name","preview-id","preview-about"])$(id).textContent="";
  }
  renderedRevision=state.confirmed.revision;
}

function renderInstagram(state){
  const copy=instagramCopy[language]||instagramCopy.en,known=state.value!==undefined;
  $("instagram-card").hidden=state.phase==="anonymous";
  $("instagram-private").textContent=copy.private;
  $("instagram-state").textContent=!known?state.phase==="error"?"":copy.loading
    :state.value===null?copy.empty:state.value.verified?copy.verified:copy.unverified;
  $("instagram-name").textContent=state.value?`@${state.value.userName}`:"";
  $("instagram-description").textContent=state.value&&!state.value.verified?copy.unverifiedBody:"";
  $("instagram-notice").textContent=state.phase==="error"?(known?copy.last+". ":"")+copy.error
    :state.busy?(known?copy.last+". ":"")+copy.refreshing:"";
  $("instagram-refresh").textContent=copy.refresh;$("instagram-refresh").disabled=state.busy;
  $("instagram-card").setAttribute("aria-busy",String(state.busy));
  $("instagram-read-help").textContent=copy.read;$("instagram-privacy").textContent=copy.privacy;
}
const instagram=createInstagramReader({request:(...args)=>core.session.request(...args),onChange:renderInstagram});
$("instagram-refresh").addEventListener("click",()=>void instagram.load());

const editor=createProfileEditor({request:(...args)=>core.session.request(...args),onChange:render});
function setLanguage(locale){
  language=profileCopy[locale]?locale:"en";document.documentElement.lang=language;
  document.title="PARROT 669 — "+t("page.title");$("editor-language").value=language;
  for(const node of document.querySelectorAll("[data-profile-copy]"))node.textContent=t(node.dataset.profileCopy);
  $("editor-menu").textContent=t($("editor-menu").getAttribute("aria-expanded")==="true"?"nav.close":"nav.menu");
  $("editor-about").placeholder=t("form.about.placeholder");
  $("password-label").textContent={en:"Password",es:"Contraseña",ca:"Contrasenya",ru:"Пароль"}[language];
  core.storage.local.setItem(languageKey,language);
  if(lastState)render(lastState);
  renderInstagram(instagram.state);
}
setLanguage(language);
$("editor-language").addEventListener("change",event=>setLanguage(event.target.value));
function closeMenu({restore=false}={}){
  $("editor-nav").classList.remove("open");$("editor-menu").setAttribute("aria-expanded","false");
  $("editor-menu").textContent=t("nav.menu");if(restore)$("editor-menu").focus();
}
$("editor-menu").addEventListener("click",()=>{
  const open=$("editor-menu").getAttribute("aria-expanded")!=="true";
  $("editor-nav").classList.toggle("open",open);$("editor-menu").setAttribute("aria-expanded",String(open));
  $("editor-menu").textContent=t(open?"nav.close":"nav.menu");
  if(open)$("editor-nav").querySelector("a").focus();
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("editor-nav").classList.contains("open")){event.preventDefault();closeMenu({restore:true});}});
window.addEventListener("resize",()=>{if(window.innerWidth>980)closeMenu();});
$("editor-name").addEventListener("input",event=>editor.edit({displayName:event.target.value}));
$("editor-about").addEventListener("input",event=>editor.edit({about:event.target.value}));
$("profile-editor-form").addEventListener("submit",async event=>{
  event.preventDefault();await editor.save(renderedRevision);
  const errors=editor.state.errors;
  if(errors.displayName)$("editor-name").focus();else if(errors.about)$("editor-about").focus();
  else if(editor.state.phase==="ready"&&document.activeElement===document.body)$("editor-name").focus({preventScroll:true});
});
$("editor-discard").addEventListener("click",()=>{editor.discard();$("editor-name").focus({preventScroll:true});});
$("editor-check").addEventListener("click",async()=>{
  await editor.load();
  if(editor.state.phase==="ready"&&document.activeElement===document.body)$("editor-name").focus({preventScroll:true});
});
async function preview(review,trigger){
  returnFocus=trigger;returnScroll=window.scrollY;
  const operation=editor.openPreview({review});
  if(editor.state.preview.phase!=="closed"){$("preview-title").focus();window.scrollTo({top:0,behavior:"instant"});}
  await operation;
}
$("editor-preview").addEventListener("click",event=>void preview(false,event.currentTarget));
$("visibility-action").addEventListener("click",async event=>{
  const state=editor.state;
  if(state.uncertain||state.conflict||state.notice==="load.error.title")await editor.load();
  else if(state.confirmed?.published)await editor.hide(renderedRevision);
  else {void preview(true,event.currentTarget);return;}
  if(editor.state.phase==="ready"&&document.activeElement===document.body)$("visibility-action").focus({preventScroll:true});
});
$("preview-refresh").addEventListener("click",()=>void editor.openPreview({review:editor.state.preview.review}));
$("preview-publish").addEventListener("click",async()=>{
  await editor.publish(renderedRevision);
  if(editor.state.phase==="ready"&&editor.state.preview.phase==="closed"){
    window.scrollTo({top:returnScroll,behavior:"instant"});
    $("visibility-action").focus({preventScroll:true});returnFocus=null;
  }
});
$("preview-return").addEventListener("click",()=>{
  editor.closePreview();window.scrollTo({top:returnScroll,behavior:"instant"});
  returnFocus?.focus({preventScroll:true});returnFocus=null;
});
$("gate-retry").addEventListener("click",()=>{
  if(core.session.status==="authenticated")void editor.load();
  else void core.session.refresh().catch(()=>{});
});
$("gate-signin").addEventListener("click",()=>{$("editor-login").hidden=false;$("editor-login-name").focus();});
$("login-cancel").addEventListener("click",()=>{$("editor-login").hidden=true;value("editor-login-password","");$("gate-signin").focus();});
$("editor-login").addEventListener("submit",async event=>{
  event.preventDefault();if(loginBusy||core.session.status==="authenticated")return;
  loginBusy=true;$("login-error").textContent="";
  for(const node of $("editor-login").querySelectorAll("button"))node.disabled=true;
  try{
    await core.auth("/login",{method:"POST",body:JSON.stringify({login:$("editor-login-name").value.trim(),password:$("editor-login-password").value})});
    $("editor-login").hidden=true;
  }catch(error){$("login-error").textContent=error.message;}
  finally{
    value("editor-login-password","");loginBusy=false;
    for(const node of $("editor-login").querySelectorAll("button"))node.disabled=false;
  }
});

const needsLeave=()=>editor.state.dirty||editor.state.sent?.kind==="save"||editor.state.uncertain?.kind==="save";
document.addEventListener("click",event=>{
  const anchor=event.target.closest?.("a[href]");
  if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!needsLeave())return;
  const target=new URL(anchor.href,location.href);
  if(target.origin!==location.origin)return;
  event.preventDefault();leaveTarget={url:target.href,trigger:anchor};$("editor-leave").showModal();$("leave-stay").focus();
});
$("leave-stay").addEventListener("click",()=>{$("editor-leave").close();leaveTarget?.trigger.focus();leaveTarget=null;});
$("leave-go").addEventListener("click",()=>{const url=leaveTarget?.url;if(url){leaving=true;leaveTarget=null;location.assign(url);}});
$("editor-leave").addEventListener("cancel",()=>{leaveTarget=null;});
window.addEventListener("beforeunload",event=>{if(needsLeave()&&!leaving){event.preventDefault();event.returnValue="";}});
window.addEventListener("pagehide",()=>{instagram.setSession({status:"checking",epoch:null});editor.setSession({status:"checking",epoch:null});value("editor-login-password","");});

core.session.subscribe(state=>{
  const instagramChanged=instagram.setSession({accountId:state.user?.accountId,epoch:state.epoch,status:state.status});
  if(instagramChanged&&state.status==="authenticated")void instagram.load();
  const changed=editor.setSession({accountId:state.user?.accountId,epoch:state.epoch,status:state.status});
  if(changed&&state.status==="authenticated")void editor.load();
});
render(editor.state);
void core.session.refresh().catch(()=>{});
