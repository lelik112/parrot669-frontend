const searchCore = window.ParrotCore;
const LANG_KEY = "parrot669-language";
const SEARCH_STATE_KEY = "parrot669-search-state";

const copy = {
  en:{page:"PARROT 669 — Availability search",label:"AVAILABILITY",back:"← Back to site",tabSearch:"Find availability",tabHost:"For hosts",owner:n=>`Host: ${n}`,eyebrow:"LIVE AVAILABILITY",title:"Find a property that is<br><span>actually free.</span>",lead:"Find a place that's available for your dates.",country:"Country",chooseCountry:"Choose country",city:"City",chooseCity:"Choose city",locationError:"Locations are temporarily unavailable.",from:"Check-in",to:"Check-out",bedrooms:"Bedrooms",sleeps:"Sleeping places",search:"Search availability",filters:"Filters",pricedOnly:"Only with a price",priceFrom:"Price from, €",priceTo:"Price to, €",priceRangeError:"Price from must not be greater than price to",priceUnknown:"Price: ask the host",priceNote:"Indicative price. Confirm final terms and any other charges with the host.",priceEstimate:(amount,nights)=>`≈ €${amount} for ${nights} night${nights===1?"":"s"}`,cleaning:n=>`including €${n} cleaning`,loading:"Searching live availability…",empty:"No matching availability yet.",error:"Availability search is temporarily unavailable.",bed:n=>n===1?"1 bedroom":`${n} bedrooms`,sleep:n=>n===1?"1 sleeping place":`${n} sleeping places`,min:n=>`minimum stay ${n} day${n===1?"":"s"}`,period:(a,b)=>`Available ${a} → ${b}`,view:"View on Airbnb",login:"Log in",register:"Create account",logout:"Log out",account:"Account",logoutError:"Could not log out. Try again.",yourProperty:"Your property"},
  es:{page:"PARROT 669 — Buscar disponibilidad",label:"DISPONIBILIDAD",back:"← Volver al sitio",tabSearch:"Buscar disponibilidad",tabHost:"Para propietarios",owner:n=>`Propietario: ${n}`,eyebrow:"DISPONIBILIDAD EN DIRECTO",title:"Encuentra una vivienda que esté<br><span>realmente libre.</span>",lead:"Encuentra un alojamiento disponible para tus fechas.",country:"País",chooseCountry:"Elige un país",city:"Ciudad",chooseCity:"Elige una ciudad",locationError:"Las ubicaciones no están disponibles temporalmente.",from:"Entrada",to:"Salida",bedrooms:"Dormitorios",sleeps:"Plazas para dormir",search:"Buscar disponibilidad",filters:"Filtros",pricedOnly:"Solo con precio",priceFrom:"Precio desde, €",priceTo:"Precio hasta, €",priceRangeError:"El precio mínimo no puede superar el máximo",priceUnknown:"Precio: consulta al propietario",priceNote:"Precio orientativo. Confirma las condiciones finales y otros cargos con el propietario.",priceEstimate:(amount,nights)=>`≈ €${amount} por ${nights} noche${nights===1?"":"s"}`,cleaning:n=>`incluye €${n} de limpieza`,loading:"Buscando disponibilidad…",empty:"Todavía no hay resultados.",error:"La búsqueda no está disponible temporalmente.",bed:n=>n===1?"1 dormitorio":`${n} dormitorios`,sleep:n=>n===1?"1 plaza":`${n} plazas`,min:n=>`estancia mínima ${n} día${n===1?"":"s"}`,period:(a,b)=>`Disponible ${a} → ${b}`,view:"Ver en Airbnb",login:"Entrar",register:"Crear cuenta",logout:"Cerrar sesión",account:"Cuenta",logoutError:"No se pudo cerrar sesión. Inténtalo de nuevo.",yourProperty:"Tu vivienda"},
  ca:{page:"PARROT 669 — Cercar disponibilitat",label:"DISPONIBILITAT",back:"← Tornar al web",tabSearch:"Cercar disponibilitat",tabHost:"Per a propietaris",owner:n=>`Propietari: ${n}`,eyebrow:"DISPONIBILITAT EN DIRECTE",title:"Troba un habitatge que estigui<br><span>realment lliure.</span>",lead:"Troba un allotjament disponible per a les teves dates.",country:"País",chooseCountry:"Tria un país",city:"Ciutat",chooseCity:"Tria una ciutat",locationError:"Les ubicacions no estan disponibles temporalment.",from:"Entrada",to:"Sortida",bedrooms:"Dormitoris",sleeps:"Places per dormir",search:"Cercar disponibilitat",filters:"Filtres",pricedOnly:"Només amb preu",priceFrom:"Preu des de, €",priceTo:"Preu fins a, €",priceRangeError:"El preu mínim no pot superar el màxim",priceUnknown:"Preu: consulta el propietari",priceNote:"Preu orientatiu. Confirma les condicions finals i altres càrrecs amb el propietari.",priceEstimate:(amount,nights)=>`≈ €${amount} per ${nights} nit${nights===1?"":"s"}`,cleaning:n=>`inclou €${n} de neteja`,loading:"Cercant disponibilitat…",empty:"Encara no hi ha resultats.",error:"La cerca no està disponible temporalment.",bed:n=>n===1?"1 dormitori":`${n} dormitoris`,sleep:n=>n===1?"1 plaça":`${n} places`,min:n=>`estada mínima ${n} dia${n===1?"":"s"}`,period:(a,b)=>`Disponible ${a} → ${b}`,view:"Veure a Airbnb",login:"Entra",register:"Crear compte",logout:"Tancar sessió",account:"Compte",logoutError:"No s'ha pogut tancar la sessió. Torna-ho a provar.",yourProperty:"El teu habitatge"},
  ru:{page:"PARROT 669 — Поиск свободного жилья",label:"СВОБОДНЫЕ ДАТЫ",back:"← Назад на сайт",tabSearch:"Найти жильё",tabHost:"Владельцам",owner:n=>`Владелец: ${n}`,eyebrow:"АКТУАЛЬНАЯ ДОСТУПНОСТЬ",title:"Найдите жильё, которое<br><span>реально свободно.</span>",lead:"Найдите жильё, свободное на ваши даты.",country:"Страна",chooseCountry:"Выберите страну",city:"Город",chooseCity:"Выберите город",locationError:"Список стран и городов временно недоступен.",from:"Заезд",to:"Выезд",bedrooms:"Спальни",sleeps:"Спальных мест",search:"Найти свободное",filters:"Фильтры",pricedOnly:"Только с ценой",priceFrom:"Цена от, €",priceTo:"Цена до, €",priceRangeError:"Цена «от» не может быть больше цены «до»",priceUnknown:"Цену уточняйте у владельца",priceNote:"Цена ориентировочная. Финальные условия и дополнительные платежи уточняйте у владельца.",priceEstimate:(amount,nights)=>`≈ €${amount} за ${nights} ноч.`,cleaning:n=>`включая €${n} уборки`,loading:"Ищем свободные даты…",empty:"Подходящих вариантов пока нет.",error:"Поиск временно недоступен.",bed:n=>n===1?"1 спальня":n<5?`${n} спальни`:`${n} спален`,sleep:n=>`${n} спальных мест`,min:n=>`минимум ${n} дн.`,period:(a,b)=>`Свободно ${a} → ${b}`,view:"Открыть на Airbnb",login:"Войти",register:"Создать аккаунт",logout:"Выйти",account:"Аккаунт",logoutError:"Не удалось выйти. Повторите попытку.",yourProperty:"Ваш объект"}
};

const housingCopy = {
  en:{accommodationType:"Accommodation type",anyType:"Any type",entirePlace:"Entire place",privateRoom:"Private room",noExternalLink:"No external link available",lead:"Find a place that's available for your dates.",searchChanged:"Search details changed. Search again to see matching properties.",calendarUnverified:"Calendar control not confirmed",calendarPending:"The host has not finished calendar verification",calendarVerified:"Calendar control confirmed ✓",calendarRecheck:"Calendar verification needs to be repeated",priceFrom:"Stay total from, €",priceTo:"Stay total to, €",priceNegative:"Price cannot be negative.",priceInvalid:"Enter a valid price with up to two decimal places.",searchRangeTooLong:"One search can cover up to 366 nights. Choose a shorter period and ask the host about a longer stay."},
  es:{accommodationType:"Tipo de alojamiento",anyType:"Cualquier tipo",entirePlace:"Alojamiento entero",privateRoom:"Habitación privada",noExternalLink:"No hay enlace externo disponible",lead:"Encuentra un alojamiento disponible para tus fechas.",searchChanged:"Has cambiado los datos de búsqueda. Vuelve a buscar para ver los alojamientos disponibles.",calendarUnverified:"Control del calendario sin confirmar",calendarPending:"El propietario aún no ha completado la verificación",calendarVerified:"Control del calendario confirmado ✓",calendarRecheck:"Hay que repetir la verificación del calendario",priceFrom:"Total de la estancia desde, €",priceTo:"Total de la estancia hasta, €",priceNegative:"El precio no puede ser negativo.",priceInvalid:"Introduce un precio válido con un máximo de dos decimales.",searchRangeTooLong:"Cada búsqueda puede abarcar hasta 366 noches. Elige un periodo más corto y consulta al propietario sobre una estancia más larga."},
  ca:{accommodationType:"Tipus d'allotjament",anyType:"Qualsevol tipus",entirePlace:"Allotjament sencer",privateRoom:"Habitació privada",noExternalLink:"No hi ha cap enllaç extern disponible",lead:"Troba un allotjament disponible per a les teves dates.",searchChanged:"Has canviat les dades de cerca. Torna a cercar per veure els allotjaments disponibles.",calendarUnverified:"Control del calendari sense confirmar",calendarPending:"El propietari encara no ha acabat la verificació",calendarVerified:"Control del calendari confirmat ✓",calendarRecheck:"Cal repetir la verificació del calendari",priceFrom:"Total de l’estada des de, €",priceTo:"Total de l’estada fins a, €",priceNegative:"El preu no pot ser negatiu.",priceInvalid:"Introdueix un preu vàlid amb un màxim de dos decimals.",searchRangeTooLong:"Cada cerca pot abastar fins a 366 nits. Tria un període més curt i consulta al propietari sobre una estada més llarga."},
  ru:{accommodationType:"Тип жилья",anyType:"Любой тип",entirePlace:"Жильё целиком",privateRoom:"Отдельная комната",noExternalLink:"Переход на внешнюю площадку недоступен",lead:"Найдите жильё, свободное на ваши даты.",searchChanged:"Параметры изменены. Нажмите «Найти свободное», чтобы увидеть подходящие варианты.",calendarUnverified:"Контроль календаря не подтверждён",calendarPending:"Владелец ещё не завершил проверку",calendarVerified:"Контроль календаря подтверждён ✓",calendarRecheck:"Требуется повторная проверка",priceFrom:"За весь период от, €",priceTo:"За весь период до, €",priceNegative:"Цена не может быть отрицательной.",priceInvalid:"Введите корректную цену: не более двух знаков после запятой.",searchRangeTooLong:"За один раз можно искать жильё максимум на 366 ночей. Выберите более короткий период и уточните более долгий срок у хозяина."}
};

let lang=(()=>{const saved=searchCore.storage.local.getItem(LANG_KEY);if(saved&&copy[saved])return saved;const b=(navigator.language||"en").slice(0,2);return copy[b]?b:"en"})();
const form=document.getElementById("availability-form");
const results=document.getElementById("availability-results");
const countrySelect=form.elements.country;
const citySelect=form.elements.city;
const submitButton=form.querySelector('button[type="submit"]');
const accommodationTypeFilter=document.getElementById("filter-accommodation-type");
const pricedOnlyFilter=document.getElementById("filter-priced-only");
const minPriceFilter=document.getElementById("filter-price-from");
const maxPriceFilter=document.getElementById("filter-price-to");
const buttons=document.querySelectorAll("[data-search-lang]");
const accountIndicator=document.getElementById("search-account-indicator");
const accountSession=document.getElementById("search-account");
const accountLogin=document.getElementById("search-login");
const accountRegister=document.getElementById("search-register");
const accountLogout=document.getElementById("search-logout");
const accountFeedback=document.getElementById("search-account-feedback");
let lastSearchParams=null;
let searchSequence=0;
let hasSearched=false;
let renderedItems=null;
let resultState=null;
let locationGeneration=0;
let locationController=null;
let locationPending=true;
let locationFailed=false;
let locationCountry="";
let formRevision=0;
let restoreIntentPending=false;

function ruPlural(n,one,few,many){return `${n} ${n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many}`}

copy.ru.bed=n=>ruPlural(n,"спальня","спальни","спален");
copy.ru.sleep=n=>ruPlural(n,"спальное место","спальных места","спальных мест");

function t(key,...args){const v=(housingCopy[lang]||housingCopy.en)[key]??(copy[lang]||copy.en)[key];return typeof v==="function"?v(...args):v}
function renderAccountIndicator(user=searchCore.session.user){
  const username=String(user?.username||"").trim();
  accountSession.hidden=!user;
  accountLogin.hidden=Boolean(user) || user===undefined;
  accountRegister.hidden=Boolean(user) || user===undefined;
  accountIndicator.textContent=user ? (username || t("account")) : "";
}
accountLogout.addEventListener("click",async()=>{
  accountLogout.disabled=true;
  accountFeedback.textContent="";
  try {
    await searchCore.auth("/logout",{method:"POST"});
  } catch(error) {
    if(error.status===401) searchCore.session.setUser(null,{reason:"logout"});
    else accountFeedback.textContent=t("logoutError");
  } finally { accountLogout.disabled=false; }
});
function applyLanguage(next){
  lang=copy[next]?next:"en";
  searchCore.storage.local.setItem(LANG_KEY,lang);
  document.documentElement.lang=lang;
  document.title=t("page");
  document.querySelectorAll("[data-search-i18n]").forEach(n=>n.textContent=t(n.dataset.searchI18n));
  document.querySelectorAll("[data-search-i18n-html]").forEach(n=>n.innerHTML=t(n.dataset.searchI18nHtml));
  buttons.forEach(b=>b.classList.toggle("active",b.dataset.searchLang===lang));
  refreshLocationLabels();
  window.ParrotMessaging?.setLanguage(lang);
  renderAccountIndicator();
  if(renderedItems) render(renderedItems);
  else if(resultState) state(resultState.key,resultState.kind);
}
function state(key,kind=""){
  renderedItems=null;resultState={key,kind};results.replaceChildren();
  const n=document.createElement("div");n.className=`availability-state ${kind}`.trim();n.textContent=t(key);results.append(n);
}
function validatePriceFilters(){
  let invalid=null;
  for(const field of [minPriceFilter,maxPriceFilter]){
    if(!field) continue;
    const value=field.value.trim();
    const amount=Number(value);
    const key=value&&amount<0?"priceNegative":
      !field.validity.valid||(value&&(!Number.isFinite(amount)||!Number.isSafeInteger(Math.round(amount*100))))?"priceInvalid":null;
    field.setAttribute("aria-invalid",String(Boolean(key)));
    if(key&&!invalid) invalid={field,key};
  }
  if(invalid){state(invalid.key,"error");return false}
  return true;
}
function eurosToCents(value){
  const raw=String(value??"").trim().replace(",",".");
  if(!raw) return null;
  const amount=Number(raw);
  return Number.isFinite(amount) && amount>=0 ? Math.round(amount*100) : null;
}
function saveSearchState(){
  const fd=new FormData(form);
  searchCore.storage.local.setItem(SEARCH_STATE_KEY,JSON.stringify({
    country:String(fd.get("country")||""),
    city:String(fd.get("city")||""),
    accommodationType:String(accommodationTypeFilter?.value||"any"),
    from:String(fd.get("from")||""),
    to:String(fd.get("to")||""),
    bedrooms:String(fd.get("bedrooms")||"1"),
    sleeps:String(fd.get("sleeps")||"1"),
    pricedOnly:Boolean(pricedOnlyFilter?.checked),
    minPrice:String(minPriceFilter?.value||""),
    maxPrice:String(maxPriceFilter?.value||""),
    searched:hasSearched
  }));
}
function restoreSearchState(){
  try{
    const saved=JSON.parse(searchCore.storage.local.getItem(SEARCH_STATE_KEY)||"null");
    if(!saved||typeof saved!=="object") return null;
    if(saved.accommodationType&&accommodationTypeFilter) accommodationTypeFilter.value=saved.accommodationType;
    if(saved.from) form.elements.from.value=saved.from;
    if(saved.to) form.elements.to.value=saved.to;
    if(saved.bedrooms) form.elements.bedrooms.value=saved.bedrooms;
    if(saved.sleeps) form.elements.sleeps.value=saved.sleeps;
    if(pricedOnlyFilter) pricedOnlyFilter.checked=Boolean(saved.pricedOnly);
    if(minPriceFilter) minPriceFilter.value=saved.minPrice||"";
    if(maxPriceFilter) maxPriceFilter.value=saved.maxPrice||"";
    hasSearched=Boolean(saved.searched);
    const minCheckout=plusDays(form.elements.from.value,1);
    if(minCheckout) form.elements.to.min=minCheckout;
    return saved;
  }catch{
    return null;
  }
}
function updateSearchSubmitState(){
  submitButton.disabled=!locationIsReady();
}
function locationIsReady(country=countrySelect.value,city=citySelect.value){
  return !locationPending&&!locationFailed&&Boolean(country&&city)&&locationCountry===country;
}
function clearLocationError(){
  if(resultState?.key!=="locationError") return;
  resultState=null;
  renderedItems=null;
  results.replaceChildren();
}
function countryDisplayName(code,fallback){
  try{
    return new Intl.DisplayNames([lang],{type:"region"}).of(code)||fallback;
  }catch{
    return fallback;
  }
}
function resetLocationSelect(select,placeholderKey){
  select.replaceChildren();
  const option=document.createElement("option");
  option.value="";
  option.textContent=t(placeholderKey);
  select.append(option);
}
function refreshLocationLabels(){
  if(!countrySelect||!citySelect) return;
  const countryPlaceholder=countrySelect.querySelector('option[value=""]');
  const cityPlaceholder=citySelect.querySelector('option[value=""]');
  if(countryPlaceholder) countryPlaceholder.textContent=t("chooseCountry");
  if(cityPlaceholder) cityPlaceholder.textContent=t("chooseCity");
  countrySelect.querySelectorAll("option[data-country-name]").forEach(option=>{
    option.textContent=countryDisplayName(option.value,option.dataset.countryName);
  });
}
async function loadCities(countryCode,preferredCity=""){
  const operation={generation:++locationGeneration,country:String(countryCode||"")};
  locationController?.abort();
  const controller=new AbortController();
  locationController=controller;
  locationPending=Boolean(operation.country);
  locationFailed=false;
  locationCountry="";
  resetLocationSelect(citySelect,"chooseCity");
  citySelect.disabled=true;
  updateSearchSubmitState();
  if(!operation.country) return {status:"empty",operation};
  const ownsOperation=()=>operation.generation===locationGeneration&&countrySelect.value===operation.country;
  try{
    const cities=await searchCore.http("/api/locations/cities?country="+encodeURIComponent(operation.country),
      {validate:Array.isArray,signal:controller.signal});
    if(!ownsOperation()) return {status:"stale",operation};
    cities.forEach(item=>{
      const option=document.createElement("option");
      option.value=String(item.name||"");
      option.textContent=String(item.name||"");
      citySelect.append(option);
    });
    const preferred=[...citySelect.options].find(option=>option.value&&option.value.toLowerCase()===String(preferredCity||"").toLowerCase());
    if(preferred) citySelect.value=preferred.value;
    else if(cities.length===1) citySelect.value=String(cities[0].name||"");
    locationPending=false;
    locationCountry=operation.country;
    citySelect.disabled=cities.length===0;
    clearLocationError();
    updateSearchSubmitState();
    return {status:"committed",operation};
  }catch(error){
    if(!ownsOperation()) return {status:"stale",operation};
    locationPending=false;
    locationFailed=true;
    updateSearchSubmitState();
    console.error(error);
    state("locationError","error");
    return {status:"failed",operation};
  }finally{
    if(locationController===controller) locationController=null;
  }
}
async function loadLocations(saved){
  const bootstrapGeneration=++locationGeneration;
  locationPending=true;
  locationFailed=false;
  locationCountry="";
  countrySelect.disabled=true;
  citySelect.disabled=true;
  resetLocationSelect(countrySelect,"chooseCountry");
  resetLocationSelect(citySelect,"chooseCity");

  try{
    const countries=await searchCore.http("/api/locations/countries",{validate:Array.isArray});
    if(bootstrapGeneration!==locationGeneration) return {status:"stale"};

    countries.forEach(item=>{
      const option=document.createElement("option");
      option.value=String(item.code||"");
      option.dataset.countryName=String(item.name||item.code||"");
      option.textContent=countryDisplayName(option.value,option.dataset.countryName);
      countrySelect.append(option);
    });
    countrySelect.disabled=countries.length===0;

    const requestedCountry=String(saved&&saved.country||"").toUpperCase();
    const preferred=[...countrySelect.options].find(option=>option.value===requestedCountry);
    if(preferred) countrySelect.value=preferred.value;
    else if(countries.length===1) countrySelect.value=String(countries[0].code||"");

    const result=await loadCities(countrySelect.value,String(saved&&saved.city||""));
    if(result.operation.generation!==locationGeneration) return {status:"stale"};
    if(result.status!=="stale") saveSearchState();
    return result;
  }catch(error){
    if(bootstrapGeneration!==locationGeneration) return {status:"stale"};
    locationPending=false;
    locationFailed=true;
    updateSearchSubmitState();
    console.error(error);
    state("locationError","error");
    return {status:"failed"};
  }
}
function render(items){
  renderedItems=items;resultState=null;
  results.replaceChildren();
  if(!items.length){state("empty","empty");return}
  items.forEach(item=>{
    const card=document.createElement("article");
    card.className="availability-card";

    const head=document.createElement("div");
    head.className="availability-card-heading";
    const titleGroup=document.createElement("div");
    titleGroup.className="availability-title-group";
    const title=document.createElement("strong");
    title.textContent=item.propertyTitle||"Property";
    const city=document.createElement("span");
    city.className="availability-card-city";
    city.textContent=item.city||"—";
    titleGroup.append(title,city);
    head.append(titleGroup);

    const facts=document.createElement("div");
    facts.className="availability-facts";
    [
      item.accommodationType==="private_room"?t("privateRoom"):t("entirePlace"),
      t("bed",Number(item.bedrooms)),
      t("sleep",Number(item.sleeps))
    ].forEach(value=>{
      const fact=document.createElement("span");
      fact.className="availability-fact";
      fact.textContent=value;
      facts.append(fact);
    });

    const priceBlock=document.createElement("div");
    priceBlock.className="availability-price-block";
    const price=document.createElement("div");
    price.className="availability-price";
    let priceNote=null;
    if(item.price){
      const amount=(Number(item.price.estimatedAmountCents||0)/100).toLocaleString(document.documentElement.lang,{minimumFractionDigits:0,maximumFractionDigits:2});
      price.textContent=t("priceEstimate",amount,Number(item.price.nights||0));
      if(item.price.cleaningFeeCents != null){
        const cleaning=(Number(item.price.cleaningFeeCents)/100).toLocaleString(document.documentElement.lang,{minimumFractionDigits:0,maximumFractionDigits:2});
        const small=document.createElement("small");
        small.textContent=t("cleaning",cleaning);
        price.append(" · ",small);
      }
      priceNote=document.createElement("div");
      priceNote.className="availability-price-note";
      priceNote.textContent=t("priceNote");
    } else {
      price.classList.add("unknown");
      price.textContent=t("priceUnknown");
    }
    priceBlock.append(price);
    if(priceNote) priceBlock.append(priceNote);

    const footer=document.createElement("div");
    footer.className="availability-card-footer";
    const owner=document.createElement("div");
    owner.className="availability-owner";
    owner.textContent=t("owner",item.ownerDisplayName||"PARROT host");
    const ownProperty=document.createElement("span");
    ownProperty.className="availability-own-property";
    ownProperty.hidden=true;
    ownProperty.textContent=t("yourProperty");

    const links=document.createElement("div");
    links.className="availability-links";
    (item.links||[]).forEach(link=>{
      try{
        const u=new URL(link.url);
        if(u.protocol!=="https:" || u.hostname!=="www.airbnb.com" ||
          u.pathname!==`/rooms/${link.externalId}` || !/^[0-9]{1,32}$/.test(link.externalId||"")) return;
        const group=document.createElement("div");
        group.className="availability-link-group";
        const a=document.createElement("a");
        a.className="availability-link";
        a.href=u.toString();
        a.target="_blank";
        a.rel="noopener noreferrer";
        a.textContent=t("view");
        group.append(a);
        const status=document.createElement("small");
        status.className="availability-verification-status";
        status.textContent=t({verified:"calendarVerified",pending:"calendarPending",recheck_required:"calendarRecheck"}[link.calendarControlStatus]||"calendarUnverified");
        group.append(status);
        links.append(group);
      }catch{}
    });
    if(!links.childElementCount){
      const missing=document.createElement("span");
      missing.className="availability-link-missing";
      missing.textContent=t("noExternalLink");
      links.append(missing);
    }

    const contactState=window.ParrotMessaging?.attachContact(links,item);
    contactState?.then?.(isOwn=>{ownProperty.hidden=!isOwn});
    footer.append(owner,ownProperty,links);
    card.append(head,facts,priceBlock,footer);
    results.append(card);
  });
}
function plusDays(iso, days){
  if(!iso) return "";
  const [year,month,day]=iso.split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}
form.elements.from.addEventListener("change",()=>{
  const minCheckout=plusDays(form.elements.from.value,1);
  form.elements.to.min=minCheckout;
  if(!form.elements.to.value||form.elements.to.value<=form.elements.from.value) form.elements.to.value=minCheckout;
});
function currentSearchParams(){
  const fd=new FormData(form);
  return new URLSearchParams({
    country:String(fd.get("country")||""),
    city:String(fd.get("city")||""),
    from:String(fd.get("from")||""),
    to:String(fd.get("to")||""),
    bedrooms:String(fd.get("bedrooms")||"1"),
    sleeps:String(fd.get("sleeps")||"1")
  });
}
async function runSearch(baseParams,{disableSubmit=false}={}){
  const requestId=++searchSequence;
  if(!validatePriceFilters()){
    updateSearchSubmitState();
    if(pricedOnlyFilter) pricedOnlyFilter.disabled=false;
    return;
  }
  const params=new URLSearchParams(baseParams);
  // UTC midnight avoids DST changing the count of checkout-exclusive nights.
  const nights=(Date.parse(`${params.get("to")}T00:00:00Z`)-Date.parse(`${params.get("from")}T00:00:00Z`))/86400000;
  if(nights>366){
    state("searchRangeTooLong","error");
    updateSearchSubmitState();
    if(pricedOnlyFilter) pricedOnlyFilter.disabled=false;
    return;
  }
  const minPriceCents=eurosToCents(minPriceFilter?.value);
  const maxPriceCents=eurosToCents(maxPriceFilter?.value);
  params.set("accommodationType",String(accommodationTypeFilter?.value||"any"));
  if(minPriceCents!=null&&maxPriceCents!=null&&minPriceCents>maxPriceCents){
    state("priceRangeError","error");
    updateSearchSubmitState();
    if(pricedOnlyFilter) pricedOnlyFilter.disabled=false;
    return;
  }
  params.set("pricedOnly",pricedOnlyFilter?.checked?"true":"false");
  if(minPriceCents!=null) params.set("minPriceCents",String(minPriceCents));
  if(maxPriceCents!=null) params.set("maxPriceCents",String(maxPriceCents));
  if(disableSubmit) submitButton.disabled=true;
  if(pricedOnlyFilter) pricedOnlyFilter.disabled=true;
  state("loading","loading");
  try{
    const items=await searchCore.http(`/api/search?${params}`,{validate:Array.isArray});
    if(requestId===searchSequence) render(items);
  }catch(error){
    console.error(error);
    if(requestId===searchSequence) state(error.code==="SEARCH_RANGE_TOO_LONG" ? "searchRangeTooLong" : "error","error");
  }finally{
    if(requestId===searchSequence){
      updateSearchSubmitState();
      if(pricedOnlyFilter) pricedOnlyFilter.disabled=false;
    }
  }
}
form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!locationIsReady()) return;
  if(!form.reportValidity()) return;
  hasSearched=true;
  lastSearchParams=currentSearchParams();
  saveSearchState();
  await runSearch(lastSearchParams,{disableSubmit:true});
});
function markSearchIntentChanged(){
  formRevision++;
  if(restoreIntentPending){
    restoreIntentPending=false;
    hasSearched=false;
    lastSearchParams=null;
    saveSearchState();
  }
}
function searchDetailsChanged(){
  markSearchIntentChanged();
  if(lastSearchParams && lastSearchParams.toString()!==currentSearchParams().toString()){
    // Ignore responses for the old city/dates, including requests still in flight.
    searchSequence++;
    lastSearchParams=null;
    hasSearched=false;
    updateSearchSubmitState();
    if(pricedOnlyFilter) pricedOnlyFilter.disabled=false;
    state("searchChanged","empty");
  }
  saveSearchState();
}
form.addEventListener("change",searchDetailsChanged);
form.addEventListener("input",searchDetailsChanged);
[accommodationTypeFilter,pricedOnlyFilter,minPriceFilter,maxPriceFilter].forEach(filter=>{
  filter?.addEventListener("input",markSearchIntentChanged);
  filter?.addEventListener("change",()=>{
    markSearchIntentChanged();
    saveSearchState();
    if(lastSearchParams) runSearch(lastSearchParams);
  });
});
citySelect.addEventListener("change",()=>{
  updateSearchSubmitState();
  saveSearchState();
});
countrySelect.addEventListener("change",async()=>{
  const result=await loadCities(countrySelect.value,"");
  if(result.operation.generation===locationGeneration&&result.status!=="stale") saveSearchState();
});
buttons.forEach(b=>b.addEventListener("click",()=>applyLanguage(b.dataset.searchLang)));
searchCore.session.subscribe(({user})=>{
  renderAccountIndicator(user);
  if(renderedItems) render(renderedItems);
});
void searchCore.session.refresh().catch(()=>{accountFeedback.textContent=t("logoutError");});
applyLanguage(lang);
const savedSearchState=restoreSearchState();
const restoreRevision=formRevision;
restoreIntentPending=hasSearched;
loadLocations(savedSearchState).then(locationResult=>{
  restoreIntentPending=false;
  if(formRevision!==restoreRevision||locationResult?.status==="stale"||locationResult?.status==="failed"){
    if(formRevision===restoreRevision&&hasSearched){
      hasSearched=false;
      lastSearchParams=null;
      saveSearchState();
    }
    return;
  }
  if(hasSearched&&form.reportValidity()){
    lastSearchParams=currentSearchParams();
    runSearch(lastSearchParams);
  }
});
