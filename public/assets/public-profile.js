(() => {
  "use strict";

  const messages = {
    en:{search:"Search",messages:"Messages",hosting:"Hosting",back:"Back",loading:"Loading public profile",
      errorLabel:"Error",errorTitle:"We couldn't load this profile.",errorText:"Try again or return to the previous page.",
      retry:"Try again",unavailableLabel:"Profile unavailable",unavailableTitle:"This profile isn't public.",
      unavailableText:"It may be hidden or the link may no longer be valid.",publicProfile:"Public profile",about:"About",
      selectedProperty:"Selected property",bedrooms:"Bedrooms",sleeps:"Sleeps",minStay:"Minimum stay",
      nights:n=>`${n} night${n===1?"":"s"}`,contact:"Message host",edit:"Edit my profile",
      contactNote:"Your dates and draft stay with the conversation.",personOnly:"No property was selected. This page shows the public person only.",
      external:"External listing",calendarUnverified:"Calendar control not confirmed",calendarPending:"The host has not finished calendar verification",
      calendarVerified:"Calendar control confirmed ✓",calendarRecheck:"Calendar verification needs to be repeated",
      types:{entire_place:"Entire place",private_room:"Private room",shared_room:"Shared room"}},
    es:{search:"Buscar",messages:"Mensajes",hosting:"Alojar",back:"Volver",loading:"Cargando perfil público",
      errorLabel:"Error",errorTitle:"No pudimos cargar este perfil.",errorText:"Inténtalo de nuevo o vuelve a la página anterior.",
      retry:"Reintentar",unavailableLabel:"Perfil no disponible",unavailableTitle:"Este perfil no es público.",
      unavailableText:"Puede estar oculto o el enlace ya no ser válido.",publicProfile:"Perfil público",about:"Acerca de",
      selectedProperty:"Alojamiento seleccionado",bedrooms:"Dormitorios",sleeps:"Huéspedes",minStay:"Estancia mínima",
      nights:n=>`${n} noche${n===1?"":"s"}`,contact:"Escribir al propietario",edit:"Editar mi perfil",
      contactNote:"Las fechas y el borrador se conservan en la conversación.",personOnly:"No hay alojamiento seleccionado. Esta página muestra solo a la persona.",
      external:"Anuncio externo",calendarUnverified:"Control del calendario sin confirmar",calendarPending:"El propietario aún no ha completado la verificación",
      calendarVerified:"Control del calendario confirmado ✓",calendarRecheck:"Hay que repetir la verificación del calendario",
      types:{entire_place:"Alojamiento entero",private_room:"Habitación privada",shared_room:"Habitación compartida"}},
    ca:{search:"Cercar",messages:"Missatges",hosting:"Allotjar",back:"Tornar",loading:"Carregant perfil públic",
      errorLabel:"Error",errorTitle:"No hem pogut carregar aquest perfil.",errorText:"Torna-ho a provar o torna a la pàgina anterior.",
      retry:"Torna-ho a provar",unavailableLabel:"Perfil no disponible",unavailableTitle:"Aquest perfil no és públic.",
      unavailableText:"Pot estar ocult o l'enllaç pot haver deixat de ser vàlid.",publicProfile:"Perfil públic",about:"Sobre mi",
      selectedProperty:"Allotjament seleccionat",bedrooms:"Dormitoris",sleeps:"Hostes",minStay:"Estada mínima",
      nights:n=>`${n} nit${n===1?"":"s"}`,contact:"Escriure a l'amfitrió",edit:"Editar el meu perfil",
      contactNote:"Les dates i l'esborrany es conserven a la conversa.",personOnly:"No hi ha cap allotjament seleccionat. Aquesta pàgina mostra només la persona.",
      external:"Anunci extern",calendarUnverified:"Control del calendari sense confirmar",calendarPending:"El propietari encara no ha acabat la verificació",
      calendarVerified:"Control del calendari confirmat ✓",calendarRecheck:"Cal repetir la verificació del calendari",
      types:{entire_place:"Allotjament sencer",private_room:"Habitació privada",shared_room:"Habitació compartida"}},
    ru:{search:"Поиск",messages:"Сообщения",hosting:"Хостинг",back:"Назад",loading:"Загружаем публичный профиль",
      errorLabel:"Ошибка",errorTitle:"Не удалось загрузить профиль.",errorText:"Повторите попытку или вернитесь назад.",
      retry:"Повторить",unavailableLabel:"Профиль недоступен",unavailableTitle:"Этот профиль не опубликован.",
      unavailableText:"Возможно, он скрыт или ссылка больше не действует.",publicProfile:"Публичный профиль",about:"О себе",
      selectedProperty:"Выбранный объект",bedrooms:"Спальни",sleeps:"Спальных мест",minStay:"Минимум дней",
      nights:n=>`${n} ${n%10===1&&n%100!==11?"ночь":n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"ночи":"ночей"}`,
      contact:"Написать владельцу",edit:"Редактировать мой профиль",
      contactNote:"Даты и черновик сохранятся в переписке.",personOnly:"Объект не выбран. Здесь показан только публичный профиль человека.",
      external:"Внешнее объявление",calendarUnverified:"Контроль календаря не подтверждён",calendarPending:"Владелец ещё не завершил проверку",
      calendarVerified:"Контроль календаря подтверждён ✓",calendarRecheck:"Требуется повторная проверка",
      types:{entire_place:"Целое жильё",private_room:"Отдельная комната",shared_room:"Общая комната"}}
  };
  const core=window.ParrotCore;
  if(!core)throw new Error("Shared core is unavailable");
const PUBLIC_PROFILE_MAX_BYTES = 64 * 1024;
const PUBLIC_PROFILE_KEYS = new Set(["profile", "property"]);
const PROFILE_KEYS = new Set(["parrotId", "displayName", "about", "instagram"]);
const PROPERTY_KEYS = new Set([
  "id", "title", "city", "cityNative", "accommodationType", "bedrooms", "sleeps", "minStayDays", "listings",
]);
const LISTING_KEYS = new Set(["platform", "url", "calendarControlStatus"]);
const exactKeys = (value, allowed, required = []) =>
  value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).every((key) => allowed.has(key))
  && required.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const boundedText = (value, max, {nullable = false} = {}) =>
  (nullable && value === null)
  || (typeof value === "string" && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value));
const utf8Length = (value) => Array.from(value).reduce((total, character) => {
  const point = character.codePointAt(0);
  return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
}, 0);
const validPublicProfilePayload = (payload, expectedParrotId, expectedPropertyId) => {
  if (!exactKeys(payload, PUBLIC_PROFILE_KEYS, ["profile", "property"])) return false;
  const profile = payload.profile;
  if (!exactKeys(profile, PROFILE_KEYS, ["parrotId", "displayName"])) return false;
  if (!core.isParrotId(profile.parrotId) || profile.parrotId !== expectedParrotId) return false;
  if (!boundedText(profile.displayName, 200) || profile.displayName.trim() === "") return false;
  if (Object.prototype.hasOwnProperty.call(profile, "about")
      && !boundedText(profile.about, 500, {nullable:true})) return false;
  if (Object.prototype.hasOwnProperty.call(profile, "instagram") && profile.instagram !== null
      && !(typeof profile.instagram === "string" && profile.instagram.length > 0 && profile.instagram.length <= 30
        && !/[^A-Za-z0-9._]/.test(profile.instagram))) return false;
  const property = payload.property;
  if (property === null) return !expectedPropertyId;
  if (!expectedPropertyId || !exactKeys(property, PROPERTY_KEYS, [...PROPERTY_KEYS])) return false;
  if (!boundedText(property.id, 120) || property.id !== expectedPropertyId
      || !boundedText(property.title, 300) || property.title.trim() === ""
      || !boundedText(property.city, 200, {nullable:true}) || property.city !== null && property.city.trim() === ""
      || !boundedText(property.cityNative, 200, {nullable:true})
      || !boundedText(property.accommodationType, 80)
      || ![property.bedrooms, property.sleeps, property.minStayDays]
        .every((value) => Number.isSafeInteger(value) && value >= 0)
      || !Array.isArray(property.listings) || property.listings.length > 20) return false;
  return property.listings.every((listing) =>
    exactKeys(listing, LISTING_KEYS, [...LISTING_KEYS])
    && boundedText(listing.platform, 80)
    && boundedText(listing.url, 2048)
    && boundedText(listing.calendarControlStatus, 80));
};

  const $ = id => document.getElementById(id);
  const pathMatch = /^\/p\/([^/]+)$/.exec(location.pathname);
  let parrotId;
  try { parrotId = pathMatch ? decodeURIComponent(pathMatch[1]) : ""; } catch { parrotId = ""; }
  const pageParams = new URLSearchParams(location.search);
  const propertyId = pageParams.get("property") || "";
  let language = "en", revision = 0, controller = null, currentPayload = null, owner = false;
  const pageValid=core.isParrotId(parrotId)
    && encodeURIComponent(parrotId)===pathMatch?.[1]
    && [...pageParams.keys()].every(key=>["property","from","to","returnTo"].includes(key) && pageParams.getAll(key).length===1)
    && (!pageParams.has("property") || boundedText(propertyId,120) && propertyId.trim() && !/[\u0000-\u001f\u007f]/.test(propertyId));
  const updateOwner=()=>{
    owner=core.session.status==="authenticated" && !!currentPayload
      && core.isParrotId(core.session.user?.parrotId)
      && core.session.user.parrotId===currentPayload.profile.parrotId;
    $("profile-contact").hidden=owner || !currentPayload?.property;
    $("profile-edit").hidden=!owner || !currentPayload?.property;
  };

  const text = key => messages[language][key] ?? messages.en[key] ?? key;
  const validReturnPath = value => {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
    try {
      const parsed = new URL(value, location.origin);
      return parsed.origin === location.origin ? parsed.pathname + parsed.search + parsed.hash : null;
    } catch { return null; }
  };
  const backTarget = () => {
    const explicit = validReturnPath(pageParams.get("returnTo"));
    if (explicit) return explicit;
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === location.origin) return referrer.pathname + referrer.search + referrer.hash;
    } catch {}
    return "/search.html";
  };
  const setBackLinks = () => {
    const target = backTarget();
    $("profile-back").href = target;
    document.querySelectorAll(".profile-back-link").forEach(link => { link.href = target; });
  };
  const setLanguage = value => {
    const previous=language;
    language = messages[value] ? value : "en";
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach(node => {
      const value = text(node.dataset.i18n);
      if (typeof value === "string") node.textContent = value;
    });
    document.querySelectorAll("[data-lang]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === language));
    });
    core.storage.local.setItem("parrot669-language",language);
    if (controller && previous!==language) void load();
  };
  const show = name => {
    for (const id of ["profile-loading","profile-error","profile-unavailable","profile-content"])
      $(id).hidden = id !== `profile-${name}`;
  };
  const safeExternalUrl = value => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  };
  const contactHref = property => {
    const params = new URLSearchParams({property:property.id});
    const from = pageParams.get("from"), to = pageParams.get("to");
    const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value))
      && new Date(value).toISOString().slice(0,10)===value;
    if (date(from) && date(to) && to > from) {
      params.set("from", from); params.set("to", to);
    }
    return `/messages.html?${params}`;
  };
  const render = payload => {
    const instagram=payload.profile.instagram,link=$("profile-instagram");
    $("profile-instagram-section").hidden=!instagram;
    link.textContent=instagram?`@${instagram} ↗`:"";
    const href=instagram?new URL(`https://www.instagram.com/${encodeURIComponent(instagram)}/`):null;
    if(href && href.pathname===`/${instagram}/`)link.href=href.href;
    else link.removeAttribute("href");

    currentPayload = payload;
    const profile = payload.profile, property = payload.property;
    $("profile-name").textContent = profile.displayName;
    $("profile-id").textContent = `PARROT ID · ${profile.parrotId}`;
    $("profile-avatar").textContent = Array.from(profile.displayName.trim())[0]?.toLocaleUpperCase(language) || "P";
    const about = typeof profile.about === "string" ? profile.about.trim() : "";
    $("profile-about-section").hidden = !about;
    $("profile-about").textContent = about;
    $("profile-property").hidden = !property;
    $("profile-person-only").hidden = Boolean(property);
    if (property) {
      $("profile-property-title").textContent = [property.title,property.city,property.cityNative && property.cityNative.toLocaleLowerCase(language)!==property.city?.toLocaleLowerCase(language) ? property.cityNative : null].filter(Boolean).join(" · ");
      $("profile-property-meta").textContent = text("types")[property.accommodationType] || property.accommodationType;
      $("profile-bedrooms").textContent = String(property.bedrooms);
      $("profile-sleeps").textContent = String(property.sleeps);
      $("profile-min-stay").textContent = text("nights")(property.minStayDays);
      const listings = $("profile-listings");
      listings.replaceChildren();
      for (const listing of property.listings) {
        const href = safeExternalUrl(listing.url);
        if (!href) continue;
        const group = document.createElement("div");
        group.className = "profile-listing-group";
        const link = document.createElement("a");
        link.className = "profile-listing";
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `${listing.platform || text("external")} ↗`;
        const status = document.createElement("small");
        status.className = "profile-listing-status";
        const statusKey = {verified:"calendarVerified",pending:"calendarPending",recheck_required:"calendarRecheck"}[listing.calendarControlStatus]
          || "calendarUnverified";
        status.textContent = text(statusKey);
        group.append(link, status);
        listings.append(group);
      }
      $("profile-contact").href = contactHref(property);
      $("profile-contact").hidden = owner;
      $("profile-edit").hidden = !owner;
    }
    updateOwner();
    show("content");
    $("profile-name").focus({preventScroll:true});
  };
  const load = async () => {
    const run = ++revision;
    controller?.abort();
    controller = new AbortController();
    owner = false; currentPayload=null;updateOwner();
    show("loading");
    if (!pageValid) {
      show("unavailable");
      return;
    }
    const endpoint = `/api/p/${encodeURIComponent(parrotId)}?${new URLSearchParams({...(propertyId ? {property:propertyId} : {}),language})}`;
    try {
      // Anonymous public reads never pass through session.request or expire a session.
      const payload=await core.http(endpoint,{signal:controller.signal,
        validate:value=>validPublicProfilePayload(value,parrotId,propertyId || null)
          && utf8Length(JSON.stringify(value))<=PUBLIC_PROFILE_MAX_BYTES});
      if(run!==revision)return;
      render(payload);
    } catch (error) {
      if (run !== revision || error.kind === "abort") return;
      show([401,403,404].includes(error.status) ? "unavailable" : "error");
      const target = [401,403,404].includes(error.status) ? $("profile-unavailable") : $("profile-retry");
      target.focus?.();
    }
  };

  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
  $("profile-retry").addEventListener("click", load);
  setBackLinks();
  let preferred = "en";
  preferred=core.storage.local.getItem("parrot669-language") || navigator.language.slice(0,2);
  let unsubscribe=core.session.subscribe(updateOwner);
  window.addEventListener("pagehide",()=>{revision++;controller?.abort();unsubscribe?.();unsubscribe=null;owner=false;
    $("profile-edit").hidden=true;});
  window.addEventListener("pageshow",event=>{if(event.persisted){unsubscribe ||= core.session.subscribe(updateOwner);load();}});
  setLanguage(preferred);
  void core.session.refresh().catch(()=>{});
  load();
})();
