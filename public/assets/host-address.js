(function(root){
  const cache = new Map();
  let countriesPromise;
  const TTL = 15 * 60 * 1000;
  function normalize(text){ return text.trim().replace(/\s+/g," ").toLowerCase(); }
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
  function countries(request){
    if (!countriesPromise) countriesPromise=request("/geocode/countries").then(values=>{
      if (!Array.isArray(values) || !values.length) throw new Error("countries unavailable");
      return values;
    }).catch(error=>{countriesPromise=null;throw error;});
    return countriesPromise;
  }
  function create({id,tr,request,initial=null,required=false,location=null,onUnauthorized=()=>{}}){
    const node=document.createElement("div");
    node.className="host-address-field";
    const saved=document.createElement("div");
    saved.className="host-address-saved";
    const savedText=document.createElement("p");
    savedText.textContent=initial?.address || [location?.city,location?.country].filter(Boolean).join(", ");
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
    let active=required, disposed=false, countryValues=[], countriesReady=false;
    let cityValue=null, streetValue=null;

    function validLocation(v){
      return v && v.countryCode===country.value && v.country && v.city && v.placeId &&
        Number.isFinite(v.latitude) && Math.abs(v.latitude)<=90 &&
        Number.isFinite(v.longitude) && Math.abs(v.longitude)<=180;
    }
    function validBounds(b){
      return b && [b.west,b.south,b.east,b.north].every(Number.isFinite) &&
        b.west>=-180 && b.east<=180 && b.south>=-90 && b.north<=90 && b.west<b.east && b.south<b.north;
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
        const params=new URLSearchParams({type:kind,country:country.value,q});
        if(kind==="street") {
          params.set("cityId",cityValue.placeId);params.set("city",cityValue.city);
          const b=cityValue.bounds;params.set("bounds",[b.west,b.south,b.east,b.north].join(","));
        }
        return "/geocode/autocomplete?"+params.toString();
      }
      function complete(v){
        return validLocation(v) && (kind==="city" ? v.resultType==="city" && validBounds(v.bounds) :
          normalize(v.city)===normalize(cityValue.city) && typeof v.street==="string" && v.street.trim() &&
          v.resultType==="street");
      }
      function choose(value){
        cancel();selected=value;input.value=kind==="city"?value.city:value.street;
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
          text.textContent=kind==="city"?value.city:value.street;detail.textContent=value.address;
          option.append(text,detail);option.addEventListener("click",()=>choose(value));list.append(option);
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
          const results=Array.isArray(values)?values:[];
          remember(path,results);render(results);
        }catch(error){
          if(version!==sequence || disposed || error.name==="AbortError") return;
          statusMessage(error.status===401?"addressSignIn":error.status===429?"addressRateLimited":"addressUnavailable",true);
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
          if(!dropdown.hidden && suggestions.length)choose(suggestions[Math.max(current,0)]);
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
        dispose(){cancel();document.removeEventListener("pointerdown",outside);},
        invalid(){input.setAttribute("aria-invalid","true");statusMessage(kind==="city"?"addressChooseCity":"addressChooseStreet",true);input.focus();}
      };
    }
    const city=lookup("city",value=>{
      cityValue=value;streetValue=null;street.reset();house.value="";refreshDisabled();
    },()=>{cityValue=null;streetValue=null;street.reset();house.value="";refreshDisabled();});
    const street=lookup("street",value=>{
      streetValue=value;house.value=value.houseNumber || "";refreshDisabled();
    },()=>{streetValue=null;house.value="";refreshDisabled();});
    fields.append(countryLabel,countryStatus,countryRetry,city.node,street.node,houseLabel,help,attribution);
    node.append(saved,change,fields);
    function refreshDisabled(){
      saved.hidden=active;fields.hidden=!active;
      change.hidden=required;change.textContent=tr(active?"addressCancelChange":"addressChange");
      country.disabled=!active || !countriesReady;country.required=active;
      city.input.disabled=!active || !country.value;city.input.required=active;
      street.input.disabled=!active || !cityValue;street.input.required=active;
      house.disabled=!active || !streetValue;house.required=active;
    }
    function renderCountries(){
      const value=country.value || (!required ? (initial?.countryCode || location?.countryCode || "") : "");
      let names;
      try{names=new Intl.DisplayNames([document.documentElement.lang || "en"],{type:"region"});}catch{}
      const options=countryValues.map(v=>({...v,label:names?.of(v.code)||v.name})).sort((a,b)=>a.label.localeCompare(b.label));
      country.replaceChildren();
      const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent=tr("addressChooseCountry");country.append(placeholder);
      options.forEach(v=>{const option=document.createElement("option");option.value=v.code;option.textContent=v.label;country.append(option);});
      country.value=value;
    }
    async function loadCountries(){
      countryRetry.hidden=true;countryStatus.hidden=false;countryStatus.textContent=tr("addressLoadingCountries");
      try{
        countryValues=await countries(request);if(disposed)return;
        countriesReady=true;renderCountries();countryStatus.hidden=true;refreshDisabled();
      }catch{
        if(disposed)return;countryStatus.textContent=tr("addressCountriesUnavailable");countryRetry.hidden=false;
      }
    }
    country.addEventListener("change",()=>{
      country.removeAttribute("aria-invalid");cityValue=null;streetValue=null;city.reset();street.reset();house.value="";refreshDisabled();
    });
    countryRetry.addEventListener("click",loadCountries);
    change.addEventListener("click",()=>{
      active=!active;cityValue=null;streetValue=null;city.reset();street.reset();house.value="";refreshDisabled();
      if(active)country.focus();
    });
    house.addEventListener("input",()=>house.removeAttribute("aria-invalid"));
    function updateLanguage(){
      countryTitle.textContent=tr("countryLabel");houseTitle.textContent=tr("addressHouseLabel");
      house.placeholder=tr("addressHousePlaceholder");help.textContent=tr("addressStepsHelp");
      change.textContent=tr(active?"addressCancelChange":"addressChange");countryRetry.textContent=tr("addressRetry");
      renderCountries();city.updateLanguage();street.updateLanguage();
    }
    updateLanguage();refreshDisabled();void loadCountries();
    return {
      node,country,city,street,house,change,refreshDisabled,updateLanguage,
      dispose(){disposed=true;city.dispose();street.dispose();},
      getValue(){
        if(!active)return undefined;
        if(!country.value){country.setAttribute("aria-invalid","true");country.focus();throw new Error(tr("addressChooseCountry"));}
        // Autofill can change a visible value without a normal input event.
        // Never submit an old normalized selection behind different field text.
        if(!cityValue || !validLocation(cityValue) || city.input.value!==cityValue.city){city.invalid();throw new Error(tr("addressChooseCity"));}
        if(!streetValue || !validLocation(streetValue) || street.input.value!==streetValue.street){street.invalid();throw new Error(tr("addressChooseStreet"));}
        const number=house.value.trim();
        if(!number || number.length>64){house.setAttribute("aria-invalid","true");house.focus();throw new Error(tr("addressHouseRequired"));}
        const sameBuilding=number===streetValue.houseNumber;
        return {
          address:[streetValue.street+" "+number,cityValue.city,cityValue.country].join(", "),
          countryCode:country.value,country:cityValue.country,city:cityValue.city,
          street:streetValue.street,houseNumber:number,
          latitude:streetValue.latitude,longitude:streetValue.longitude,placeId:streetValue.placeId,
          resultType:sameBuilding?streetValue.resultType:"street"
        };
      },
      reset(){
        cityValue=null;streetValue=null;country.value="";city.reset();street.reset();house.value="";
        country.removeAttribute("aria-invalid");house.removeAttribute("aria-invalid");refreshDisabled();
      }
    };
  }
  root.ParrotAddress={create};
})(window);
