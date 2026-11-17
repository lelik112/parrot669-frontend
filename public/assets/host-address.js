(function(root){
  const TTL = 15 * 60 * 1000;
  function normalize(text){ return text.trim().replace(/\s+/g," ").toLowerCase(); }
  function create({id,tr,request,initial=null,required=false,location=null,onUnauthorized=()=>{},onCancel=()=>{}}){
  const cache = new Map();
  const language=()=>document.documentElement.lang || "en";
  function remember(key, values){
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(key,{values,until:Date.now()+TTL});
  }
  function cached(key){
    const entry=cache.get(key);
    if (entry && entry.until>Date.now()) return entry.values;
    cache.delete(key);
    return null;
  }
    const text=value=>typeof value==="string" && value.trim().length>0;
    const uuid=value=>typeof value==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const display=a=>a && a.country && [a.street,a.houseNumber,a.locality,
      text(a.localityNative) && (!text(a.locality) || normalize(a.localityNative)!==normalize(a.locality)) ? a.localityNative : null,
      a.country.name].filter(text).join(", ");
    let savedAddress=initial;
    const node=document.createElement("div");
    node.className="host-address-field";
    const saved=document.createElement("div");
    saved.className="host-address-saved";
    const savedText=document.createElement("p");
    savedText.textContent=display(initial) || [location?.city,location?.country].filter(Boolean).join(", ");
    const change=document.createElement("button");
    change.type="button";change.className="text-button";
    saved.append(savedText);
    const fields=document.createElement("div");
    fields.className="host-address-fields";
    const countryLabel=document.createElement("label"), countryTitle=document.createElement("span");
    const country=document.createElement("select");
    country.id=id+"-country";country.name="addressCountry";
    countryLabel.append(countryTitle,country);
    const countryStatus=document.createElement("p");
    countryStatus.className="host-address-status";countryStatus.setAttribute("role","status");
    const countryRetry=document.createElement("button");
    countryRetry.type="button";countryRetry.className="text-button";countryRetry.hidden=true;
    const help=document.createElement("p");
    help.className="host-address-help";
    const attribution=document.createElement("a");
    attribution.className="host-address-attribution";attribution.href="https://locationiq.com/";
    attribution.target="_blank";attribution.rel="noopener noreferrer";attribution.textContent="Search by LocationIQ.com";
    const houseLabel=document.createElement("label"), houseTitle=document.createElement("span");
    const house=document.createElement("input");
    house.id=id+"-house";house.name="addressHouseNumber";house.type="text";house.maxLength=64;house.autocomplete="off";
    houseLabel.append(houseTitle,house);
    let active=required, disposed=false, countryValues=[], countriesReady=false,countrySequence=0;
    let cityValue=null, streetValue=null, contextLost=false;
    let houseSequence=0,houseController=null,chosen=null,candidates=[],candidatesInput="",houseStarted=0,viewLanguage=language();
    const selected=document.createElement("input");selected.type="hidden";selected.name="addressConfirmation";
    const find=document.createElement("button");find.type="button";find.className="text-button host-house-find";
    const cancelLookup=document.createElement("button");cancelLookup.type="button";cancelLookup.className="text-button";cancelLookup.hidden=true;
    const entered=document.createElement("p");entered.className="host-address-help";
    const outcome=document.createElement("div");outcome.className="host-house-outcome";outcome.setAttribute("role","status");
    const houseStatus=document.createElement("p");houseStatus.className="host-address-status";houseStatus.tabIndex=-1;houseStatus.id=id+"-house-status";house.setAttribute("aria-describedby",houseStatus.id);outcome.append(houseStatus);
    const houseResults=document.createElement("div");houseResults.className="host-house-results";
    const cancelPanel=document.createElement("div");cancelPanel.className="host-house-cancel";cancelPanel.hidden=true;
    const cancelText=document.createElement("p"),keepDraft=document.createElement("button"),discardDraft=document.createElement("button");
    keepDraft.type=discardDraft.type="button";cancelPanel.append(cancelText,keepDraft,discardDraft);
    let houseStatusKey="",loadingHouse=false;
    function houseMessage(key){houseStatusKey=key;houseStatus.textContent=key?tr(key):"";}
    function full(a){return a && a.type==="full" && a.country?.code===country.value && text(a.country.name)
      && text(a.locality) && text(a.street) && text(a.houseNumber)
      && (a.localityNative==null || text(a.localityNative));}
    function focusControl(control){const details=node.closest?.("details");if(details)details.open=true;control.focus();}
    function pendingSave(){return ["saving","unknown"].includes(node.closest?.("form")?.dataset.hostOperation);}
    function notify(){if(root.Event)selected.dispatchEvent?.(new root.Event("input",{bubbles:true}));}
    function invalidateHouse(key="addressHouseChanged"){
      houseSequence++;houseController?.abort();houseController=null;loadingHouse=false;
      chosen=null;candidates=[];candidatesInput="";selected.value="";houseResults.replaceChildren();entered.textContent="";
      houseMessage(key);cancelLookup.hidden=true;
    }
    function forgetSelectionContext(){
      // A definitive 400 can mean the server lost any parent in this chain.
      // Drop this controller's lookup cache, including other query/locale keys.
      // Only explicit lookup actions may acquire fresh city then street context.
      cache.clear();contextLost=true;cityValue=null;streetValue=null;
      city.clearSelection();street.clearSelection();invalidateHouse("addressHouseExpiry");
      refreshDisabled();city.invalid();
    }
    function currentInput(){return JSON.stringify([country.value,cityValue?.selectionId,city.input.value,
      streetValue?.selectionId,street.input.value,house.value]);}
    function validSelection(){return active && cityValue && streetValue && validLocation(cityValue)
      && validLocation(streetValue) && city.input.value===cityValue.address.locality
      && street.input.value===streetValue.address.street && Boolean(house.value.trim()) && house.value.trim().length<=64;}
    function renderHouses(){
      houseResults.replaceChildren();
      candidates.forEach(value=>{
        const row=document.createElement("div"),label=document.createElement("p"),use=document.createElement("button");
        row.className="host-house-candidate";label.textContent=display(value.address);
        use.type="button";use.className="host-house-use";use.textContent=tr("addressHouseUse");
        use.addEventListener("click",()=>{
          if(disposed || !candidates.includes(value) || !houseResults.contains(row))return;
          if(!validSelection() || currentInput()!==candidatesInput || Date.now()-houseStarted>=TTL){invalidateHouse("addressHouseExpiry");refreshDisabled();return;}
          chosen={id:value.confirmationId,address:value.address,input:currentInput(),until:houseStarted+TTL};
          selected.value=chosen.id;house.removeAttribute("aria-invalid");houseMessage("addressHouseSelected");notify();refreshDisabled();houseStatus.focus();
        });
        row.append(label,use);houseResults.append(row);
      });
    }
    async function findHouse(){
      invalidateHouse("");refreshDisabled();
      if(!validSelection()){houseMessage("addressChoose");return;}
      const version=houseSequence,input=currentInput(),locale=language();
      houseController=new AbortController();loadingHouse=true;houseStarted=Date.now();
      const started=houseStarted;houseMessage("addressHouseLoading");cancelLookup.hidden=false;refreshDisabled();
      entered.textContent=[street.input.value,house.value,city.input.value,country.selectedOptions?.[0]?.textContent].filter(Boolean).join(", ");
      try{
        const values=await request("/geocode/houses/confirm?"+new URLSearchParams({language:locale}),{
          method:"POST",body:JSON.stringify({street:streetValue.selectionId,number:house.value.trim().replace(/\s+/g," ")}),signal:houseController.signal});
        if(disposed || version!==houseSequence || input!==currentInput() || locale!==language())return;
        if(!Array.isArray(values) || values.length>10 || !values.every(v=>uuid(v?.confirmationId)&&full(v.address))
          || new Set(values.map(v=>v.confirmationId.toLowerCase())).size!==values.length)throw new Error("Invalid house response");
        houseStarted=started;candidates=values;candidatesInput=input;renderHouses();houseMessage(values.length?"addressHouseReview":"addressHouseNotFound");
      }catch(error){
        if(disposed || version!==houseSequence || input!==currentInput() || locale!==language() || error.kind==="abort" || error.kind==="stale" || error.name==="AbortError")return;
        const key=error.status===401?"addressSignIn":error.status===429?"addressRateLimited":error.status===400?"addressHouseExpiry":"addressHouseUnavailable";
        houseMessage(key);
        if(error.status===400){house.setAttribute("aria-invalid","true");forgetSelectionContext();}
        if(error.status===401)onUnauthorized();
      }finally{if(version===houseSequence){loadingHouse=false;cancelLookup.hidden=true;refreshDisabled();}}
    }
    find.addEventListener("click",findHouse);
    cancelLookup.addEventListener("click",()=>{invalidateHouse();refreshDisabled();});
    house.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();if(!loadingHouse)void findHouse();}});

    function validLocation(v){
      return v && text(v.selectionId) && v.address?.country?.code===country.value
        && text(v.address.country.name) && text(v.address.locality)
        && (v.address.localityNative==null || text(v.address.localityNative));
    }
    function lookup(kind,onSelect,onEdit){
      const box=document.createElement("div");
      box.className="host-address-lookup host-address-"+kind;
      const label=document.createElement("label"), title=document.createElement("span"), input=document.createElement("input");
      // This is a place search, not a contact-address field for browser autofill.
      // Keep native search semantics and explicit search names alongside the combobox.
      input.id=id+"-search-"+kind;input.name="search-"+kind;input.type="search";input.maxLength=256;input.autocomplete="off";
      input.spellcheck=false;input.setAttribute("enterkeyhint","search");
      input.setAttribute("role","combobox");input.setAttribute("aria-autocomplete","list");
      input.setAttribute("aria-controls",input.id+"-options");input.setAttribute("aria-expanded","false");
      input.setAttribute("aria-describedby",input.id+"-status");
      label.append(title,input);
      const dropdown=document.createElement("div");
      dropdown.className="host-address-dropdown";dropdown.hidden=true;
      const list=document.createElement("ul");
      list.id=input.id+"-options";list.className="host-address-options";list.setAttribute("role","listbox");
      dropdown.append(list);
      const status=document.createElement("p");
      status.id=input.id+"-status";status.className="host-address-status";status.hidden=true;
      status.setAttribute("role","status");status.setAttribute("aria-live","polite");
      const retry=document.createElement("button");
      retry.type="button";retry.className="text-button host-address-retry";retry.hidden=true;
      box.append(label,dropdown,status,retry);
      let timer,controller,sequence=0,suggestions=[],current=-1,selected=null,statusKey="",errorState=false,observedValue="";
      function statusMessage(key,error=false){
        statusKey=key;errorState=error;status.textContent=key?tr(key):"";status.hidden=!key;
        status.className="host-address-status"+(error?" host-inline-error":"");
      }
      function cancel(){clearTimeout(timer);controller?.abort();sequence++;input.setAttribute("aria-busy","false");}
      function close(){dropdown.hidden=true;input.setAttribute("aria-expanded","false");input.removeAttribute("aria-activedescendant");current=-1;}
      function reset(){
        cancel();close();input.value="";observedValue="";selected=null;suggestions=[];retry.hidden=true;
        input.removeAttribute("aria-invalid");statusMessage("");
      }
      function scope(){
        if (!active || !country.value || (kind==="street" && !cityValue)) return null;
        const q=normalize(input.value);
        if(q.length<3 || q.length>256) return null;
        const params=new URLSearchParams({q,language:language()});
        if(kind==="street")params.set("city",cityValue.selectionId);
        else params.set("country",country.value);
        return "/geocode/"+(kind==="city"?"cities":"streets")+"?"+params.toString();
      }
      function complete(v){
        return validLocation(v) && (kind==="city" ? v.address.type==="city" : v.address.type==="street" && text(v.address.street));
      }
      function choose(value){
        if(disposed || !suggestions.includes(value) || !complete(value))return;
        cancel();selected=value;input.value=kind==="city"?value.address.locality:value.address.street;
        observedValue=input.value;
        input.removeAttribute("aria-invalid");retry.hidden=true;statusMessage("");close();
        onSelect(value);input.focus();
      }
      function render(values){
        suggestions=values.filter(complete).slice(0,10);list.replaceChildren();
        suggestions.forEach((value,index)=>{
          const option=document.createElement("li");
          option.id=input.id+"-option-"+index;option.className="host-address-option";option.tabIndex=-1;
          option.setAttribute("role","option");option.setAttribute("aria-selected","false");
          const text=document.createElement("span"), detail=document.createElement("small");
          text.textContent=kind==="city"?value.address.locality:value.address.street;
          detail.textContent=[value.address.localityNative,value.address.locality,value.address.country.name].filter(Boolean).join(" · ");
          option.append(text,detail);option.addEventListener("click",()=>{if(list.contains(option))choose(value);});list.append(option);
        });
        current=-1;dropdown.hidden=!suggestions.length;input.setAttribute("aria-expanded",String(suggestions.length>0));
        statusMessage(suggestions.length?"addressChoose"+(kind==="city"?"City":"Street"):"addressNo"+(kind==="city"?"Cities":"Streets"));
      }
      async function search(){
        cancel();close();retry.hidden=true;
        const path=scope();
        if(!path){statusMessage(input.value.trim()?"addressMore":"");return;}
        const existing=cached(path);
        if(existing){render(existing);return;}
        const version=sequence;controller=new AbortController();
        input.setAttribute("aria-busy","true");statusMessage("addressLoading");
        try{
          const values=await request(path,{signal:controller.signal});
          if(version!==sequence || disposed) return;
          if(!Array.isArray(values) || values.length>10 || !values.every(complete)
            || new Set(values.map(v=>v.selectionId)).size!==values.length)throw new Error("Invalid location response");
          const results=values;
          remember(path,results);render(results);
        }catch(error){
          if(version!==sequence || disposed || error.kind==="abort" || error.kind==="stale" || error.name==="AbortError") return;
          if(error.status===400 && kind==="street"){forgetSelectionContext();return;}
          statusMessage(error.status===401?"addressSignIn":error.status===429?"addressRateLimited":error.status===400?"addressHouseExpiry":"addressUnavailable",true);
          retry.hidden=error.status===401;if(error.status===401)onUnauthorized();
        }finally{if(version===sequence)input.setAttribute("aria-busy","false");}
      }
      function edited(){
        if(input.value===observedValue)return;
        observedValue=input.value;
        cancel();close();selected=null;suggestions=[];retry.hidden=true;input.removeAttribute("aria-invalid");onEdit();
        statusMessage(input.value.trim().length<3 && input.value.trim()?"addressMore":"");
        if(scope())timer=setTimeout(search,700);
      }
      input.addEventListener("input",edited);
      input.addEventListener("change",edited);
      input.addEventListener("focus",()=>{
        if(selected)return;
        const path=scope(),values=path?cached(path):null;
        if(values)render(values); // Focusing alone must not spend another provider request.
      });
      input.addEventListener("keydown",event=>{
        if(event.key==="Escape" || event.key==="Tab"){cancel();close();statusMessage("");return;}
        if(event.key==="Enter"){
          event.preventDefault();
          if(!dropdown.hidden && suggestions.length){if(current>=0)choose(suggestions[current]);}
          else if(!selected)void search();
          return;
        }
        if(dropdown.hidden || !suggestions.length)return;
        if(event.key==="ArrowDown" || event.key==="ArrowUp"){
          event.preventDefault();current=(current+(event.key==="ArrowDown"?1:-1)+suggestions.length)%suggestions.length;
          Array.from(list.children).forEach((option,index)=>option.setAttribute("aria-selected",String(index===current)));
          input.setAttribute("aria-activedescendant",list.children[current].id);
          list.children[current].scrollIntoView?.({block:"nearest"});
        }
      });
      function dismiss(){cancel();close();if(statusKey==="addressLoading")statusMessage("");}
      // Safari may blur with a null relatedTarget before the option receives its click.
      box.addEventListener("focusout",event=>{if(event.relatedTarget && !box.contains(event.relatedTarget))dismiss();});
      function outside(event){if(!box.contains(event.target))dismiss();}
      document.addEventListener("pointerdown",outside);
      retry.addEventListener("click",search);
      function updateLanguage(){
        title.textContent=tr(kind==="city"?"addressCitySearch":"addressStreetSearch");
        input.placeholder=tr(kind==="city"?"addressCityPlaceholder":"addressStreetPlaceholder");
        list.setAttribute("aria-label",tr(kind==="city"?"addressChooseCity":"addressChooseStreet"));
        retry.textContent=tr("addressRetry");statusMessage(statusKey,errorState);
      }
      return {node:box,input,reset,search,updateLanguage,
        cancel,
        clearSelection(){cancel();close();selected=null;suggestions=[];retry.hidden=true;statusMessage("");},
        dispose(){cancel();document.removeEventListener("pointerdown",outside);},
        invalid(){input.setAttribute("aria-invalid","true");statusMessage(kind==="city"?"addressChooseCity":"addressChooseStreet",true);focusControl(input);}
      };
    }
    const city=lookup("city",value=>{
      invalidateHouse();cityValue=value;streetValue=null;
      // Recovery keeps raw downstream text, never its previous selection/proof.
      if(contextLost)street.clearSelection();else{street.reset();house.value="";}
      contextLost=false;refreshDisabled();
    },()=>{
      invalidateHouse();cityValue=null;streetValue=null;
      if(contextLost)street.clearSelection();else{street.reset();house.value="";}
      refreshDisabled();
    });
    const street=lookup("street",value=>{
      invalidateHouse();streetValue=value;refreshDisabled();
    },()=>{invalidateHouse();streetValue=null;refreshDisabled();});
    fields.append(countryLabel,countryStatus,countryRetry,city.node,street.node,houseLabel,find,cancelLookup,entered,outcome,houseResults,selected,help,attribution);
    node.append(saved,change,fields,cancelPanel);
    function refreshDisabled(){
      saved.hidden=!savedText.textContent;fields.hidden=!active;
      change.hidden=required;change.disabled=pendingSave();discardDraft.disabled=pendingSave();change.textContent=tr(active?"addressCancelChange":"addressChange");
      country.disabled=!active || !countriesReady;country.required=active;
      city.input.disabled=!active || !country.value;city.input.required=active;
      street.input.disabled=!active || !cityValue;street.input.required=active;
      house.disabled=!active || !streetValue;house.required=active;
      find.disabled=!validSelection() || loadingHouse;outcome.setAttribute("aria-busy",String(loadingHouse));
      const form=node.closest?.("form"),save=form?.querySelector('button[type="submit"]');
      if(save && active)save.disabled=loadingHouse || !chosen || chosen.input!==currentInput() || Date.now()>=chosen.until
        || ["saving","unknown"].includes(form.dataset.hostOperation);
    }
    function renderCountries(){
      const value=country.value || (!active && !required ? (savedAddress?.country?.code || location?.countryCode || "") : "");
      const options=countryValues.map(v=>({...v,label:v.name})).sort((a,b)=>a.label.localeCompare(b.label));
      country.replaceChildren();
      const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent=tr("addressChooseCountry");country.append(placeholder);
      options.forEach(v=>{const option=document.createElement("option");option.value=v.code;option.textContent=v.label;country.append(option);});
      country.value=value;
    }
    async function loadCountries(){
      const version=++countrySequence,locale=language();
      countryRetry.hidden=true;countryStatus.hidden=false;countryStatus.textContent=tr("addressLoadingCountries");
      try{
        const values=await request("/geocode/countries?"+new URLSearchParams({language:locale}));if(disposed || version!==countrySequence || locale!==language())return;
        if(!Array.isArray(values) || !values.length || !values.every(v=>/^[A-Z]{2}$/.test(v?.code)&&text(v.name)))throw new Error("countries unavailable");
        countryValues=values;countriesReady=true;renderCountries();countryStatus.hidden=true;refreshDisabled();
      }catch{
        if(disposed || version!==countrySequence || locale!==language())return;countryStatus.textContent=tr("addressCountriesUnavailable");countryRetry.hidden=false;
      }
    }
    country.addEventListener("change",()=>{
      invalidateHouse();contextLost=false;country.removeAttribute("aria-invalid");cityValue=null;streetValue=null;city.reset();street.reset();house.value="";refreshDisabled();
    });
    countryRetry.addEventListener("click",loadCountries);
    change.addEventListener("click",()=>{
      if(pendingSave())return;
      if(active){cancelPanel.hidden=false;return;}
      active=true;contextLost=false;invalidateHouse("");cityValue=null;streetValue=null;city.reset();street.reset();house.value="";refreshDisabled();
      if(active)country.focus();
    });
    keepDraft.addEventListener("click",()=>{cancelPanel.hidden=true;});
    discardDraft.addEventListener("click",()=>{if(pendingSave())return;active=false;contextLost=false;invalidateHouse("");cityValue=null;streetValue=null;city.reset();street.reset();house.value="";cancelPanel.hidden=true;refreshDisabled();onCancel();change.focus();});
    house.addEventListener("input",()=>{invalidateHouse();house.removeAttribute("aria-invalid");refreshDisabled();});
    house.addEventListener("change",()=>{if(chosen?.input!==currentInput()){invalidateHouse();refreshDisabled();}});
    function updateLanguage(){
      if(viewLanguage!==language()){
        viewLanguage=language();city.cancel();street.cancel();
        if(loadingHouse)invalidateHouse();
        void loadCountries();
      }
      countryTitle.textContent=tr("countryLabel");houseTitle.textContent=tr("addressHouseLabel");
      house.placeholder=tr("addressHousePlaceholder");help.textContent=tr("addressStepsHelp");
      change.textContent=tr(active?"addressCancelChange":"addressChange");countryRetry.textContent=tr("addressRetry");
      find.textContent=tr("addressHouseFind");cancelLookup.textContent=tr("addressHouseCancelLookup");
      help.textContent=tr("addressHouseDisclaimer");houseMessage(houseStatusKey);renderHouses();
      cancelText.textContent=tr("addressHouseCancelQuestion");keepDraft.textContent=tr("addressHouseKeepDraft");discardDraft.textContent=tr("addressCancelChange");
      renderCountries();city.updateLanguage();street.updateLanguage();
    }
    updateLanguage();refreshDisabled();void loadCountries();
    return {
      node,country,city,street,house,change,find,refreshDisabled,updateLanguage,
      setSaved(address){savedAddress=address;savedText.textContent=display(address) || [location?.city,location?.country].filter(Boolean).join(", ");refreshDisabled();},
      acceptSaved(address){savedAddress=address;savedText.textContent=display(address) || "";active=false;invalidateHouse("");refreshDisabled();},
      invalidateConfirmation(){invalidateHouse("addressHouseExpiry");refreshDisabled();},
      dispose(){disposed=true;invalidateHouse("");cache.clear();city.dispose();street.dispose();},
      getValue(){
        if(!active)return undefined;
        if(!country.value){invalidateHouse();country.setAttribute("aria-invalid","true");focusControl(country);throw new Error(tr("addressChooseCountry"));}
        // Autofill can change a visible value without a normal input event.
        // Never submit an old normalized selection behind different field text.
        if(!cityValue || !validLocation(cityValue) || city.input.value!==cityValue.address.locality){invalidateHouse();city.invalid();throw new Error(tr("addressChooseCity"));}
        if(!streetValue || !validLocation(streetValue) || street.input.value!==streetValue.address.street){invalidateHouse();street.invalid();throw new Error(tr("addressChooseStreet"));}
        const number=house.value.trim();
        if(!number || number.length>64){invalidateHouse();house.setAttribute("aria-invalid","true");focusControl(house);throw new Error(tr("addressHouseRequired"));}
        if(!chosen){
          houseMessage(candidates.length?"addressHouseReview":"addressHouseExpiry");refreshDisabled();throw new Error(tr("addressHouseExpiry"));
        }
        if(chosen.input!==currentInput() || Date.now()>=chosen.until){
          invalidateHouse("addressHouseExpiry");refreshDisabled();throw new Error(tr("addressHouseExpiry"));
        }
        return chosen.id;
      },
      reset(){
        invalidateHouse("");cache.clear();contextLost=false;active=required;cancelPanel.hidden=true;
        cityValue=null;streetValue=null;country.value="";city.reset();street.reset();house.value="";
        country.removeAttribute("aria-invalid");house.removeAttribute("aria-invalid");refreshDisabled();
      }
    };
  }
  root.ParrotAddress={create};
})(window);
