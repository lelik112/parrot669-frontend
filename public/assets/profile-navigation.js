import {profileCopy} from "./profile-copy.js";

// Retained conversation-return contract, formerly consumed by the Host editor.
// Profile/account identifiers remain opaque; only the existing conversation URL grammar is checked.
export function profileReturnContext({accountId,search,hash,storage,now=Date.now()}){
  if(!accountId||new URLSearchParams(search).get("fromMessages")!=="1"||hash!=="#host-profile")return null;
  try{
    const saved=JSON.parse(storage.getItem("parrot669-profile-return")||"null");
    return saved?.accountId===accountId&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved.conversationId||"")
      &&saved.savedAt>now-86400000?saved:null;
  }catch{return null;}
}

export function bindProfileNavigation({document,storage,navigator}){
  const render=locale=>{
    const language=profileCopy[locale]?locale:"en";
    for(const node of document.querySelectorAll("[data-profile-navigation-copy]")){
      const value=profileCopy[language][node.dataset.profileNavigationCopy];
      if(value)node.textContent=value;
    }
  };
  render(storage.getItem("parrot669-language")||(navigator.language||"en").slice(0,2));
  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-lang],[data-menu-lang],[data-host-lang],[data-search-lang],[data-msg-lang]");
    if(button&&!button.disabled)render(button.dataset.lang||button.dataset.menuLang||button.dataset.hostLang||button.dataset.searchLang||button.dataset.msgLang);
  });
}

if(typeof window!=="undefined"&&window.ParrotCore)bindProfileNavigation({document:window.document,storage:window.ParrotCore.storage.local,navigator:window.navigator});
