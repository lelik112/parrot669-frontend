const hostCore = window.ParrotCore;
const LANG_KEY = "parrot669-language";

const copy = {
  en: {
    usernameLabel:"Username", loginLabel:"Email or username", usernameHelp:"Unique, case-insensitive. No @ symbol.",
    title:"PARROT 669 — Host console", consoleLabel:"HOST CONSOLE", backToSite:"← Back to site", tabSearch:"Find availability", tabHost:"For hosts", deleteProperty:"Delete property", deleteListing:"Remove external listing", showListingInSearch:"Show external link in search results", listingVisibilitySaved:"External link visibility updated.",
    toolsEyebrow:"HOST TOOLS", heroTitle:"Publish availability.<br><span>Keep the deal elsewhere.</span>",
    heroLead:"Add a property, link the original Airbnb listing and maintain only the dates when the property is physically free.",
    identityTitle:"Host account", identityHelp:"Sign in to manage your properties securely from this browser.",
    nameLabel:"Name / host label", loginTitle:"Log in", registerTitle:"Create account", emailLabel:"Email", passwordLabel:"Password", passwordHelp:"At least 10 characters.", loginButton:"Log in →", registerButton:"Create account →", accountLabel:"ACCOUNT", logoutButton:"Log out",
    loggingIn:"Logging in…", registering:"Creating account…", loggedIn:"Logged in.", registered:"Account created. Check your email to verify it.", verifyingEmail:"Verifying email…", emailVerified:"Email verified. You are logged in.", loggedOut:"Logged out.",
    propertiesTitle:"Properties",
    propertiesHelp:"No photos or copied descriptions. Only enough data to search availability.",
    internalLabel:"Property name", propertyPlaceholder:"Poblenou apartment", cityLabel:"City", accommodationTypeLabel:"Accommodation type", entirePlace:"Entire place", privateRoom:"Private room", bedroomsLabel:"Bedrooms", sleepsLabel:"Sleeping places", minStayLabel:"Minimum stay, days", propertySettings:"Property characteristics", savePropertySettings:"Save characteristics", saveStaySettings:"Save conditions", propertySettingsSaved:"Property settings saved.", enableCalendar:"Enable", disableCalendar:"Disable", calendarEnabled:"Airbnb calendar enabled.", calendarDisabled:"Airbnb calendar disabled.", calendarDisabledStatus:"Disabled", calendarConnectedStatus:"Connected", calendarNotConnectedUnverified:"Calendar not connected · control not verified", listingVisibleCalendarUnverified:"The Airbnb link is visible to guests, but the calendar is not verified yet", expandProperty:"Expand", collapseProperty:"Collapse", addProperty:"Add property →",
    addingProperty:"Adding property…", propertyAdded:"Property added.",
    savingListing:"Saving external listing…", listingSaved:"Airbnb link saved.",
    addingAvailability:"Adding availability…", availabilityAdded:"Availability added.", updatingAvailability:"Updating availability…",
    availabilityUpdated:"Availability updated.", deletingAvailability:"Deleting availability…", availabilityDeleted:"Availability deleted.",
    deleteConfirm:(a,b)=>`Delete ${a} → ${b}?`, deletePropertyConfirm:n=>`Delete property “${n}” and all its PARROT availability data?`, deleteListingConfirm:"Remove the external Airbnb listing from this property?", propertyDeleted:"Property deleted.", listingDeleted:"External listing removed.", noProperties:"No properties yet.", externalListing:"External listing",
    saveAirbnb:"Save Airbnb ID", cleaningFee:"Cleaning fee, € (optional)", saveCleaning:"Save cleaning fee", nightlyPrice:"€/night (optional)", calendarSync:"Airbnb calendar sync", calendarHelp:"Paste Airbnb's iCal export link. PARROT uses only events marked Reserved to block dates; Airbnb (Not available) events are stored but ignored for physical availability.", calendarUrl:"Airbnb iCal export URL", connectCalendar:"Connect calendar", syncNow:"Sync now", disconnectCalendar:"Delete", disconnectCalendarConfirm:"Delete the Airbnb calendar connection?", calendarConnected:"Airbnb calendar connected.", calendarDisconnected:"Airbnb calendar deleted.", calendarSynced:"Airbnb calendar synced.", reservationsImported:n=>`${n} reservation block${n===1?"":"s"} imported`, ignoredBlocks:n=>`${n} Airbnb availability block${n===1?"":"s"} ignored`, lastSync:v=>`Last sync: ${v}`, neverSynced:"Not synced yet", calendarError:"Calendar sync error", airbnbIdHelp:"Open the public Airbnb listing and copy the number after /rooms/. Example: 910841261983250037", airbnbIdPlaceholder:"Airbnb listing ID", availability:"PARROT availability", addDates:"Add dates", loading:"Loading…",
    noPeriods:"No availability periods.", save:"Save", remove:"Delete", bedroom:n=>n===1?"1 bedroom":`${n} bedrooms`, sleepSummary:n=>n===1?"1 sleeping place":`${n} sleeping places`, minSummary:n=>`minimum ${n} day${n===1?"":"s"}`
  },
  es: {
    usernameLabel:"Nombre de usuario", loginLabel:"Email o nombre de usuario", usernameHelp:"Único, sin distinguir mayúsculas. Sin el símbolo @.",
    title:"PARROT 669 — Panel de propietarios", consoleLabel:"PANEL DE PROPIETARIOS", backToSite:"← Volver al sitio", tabSearch:"Buscar disponibilidad", tabHost:"Para propietarios", deleteProperty:"Eliminar vivienda", deleteListing:"Eliminar anuncio externo", showListingInSearch:"Mostrar enlace externo en los resultados", listingVisibilitySaved:"Visibilidad del enlace actualizada.",
    toolsEyebrow:"HERRAMIENTAS PARA PROPIETARIOS", heroTitle:"Publica la disponibilidad.<br><span>La operación ocurre fuera.</span>",
    heroLead:"Añade una vivienda, enlaza el anuncio original de Airbnb y mantén únicamente las fechas en las que está físicamente libre.",
    identityTitle:"Cuenta del propietario", identityHelp:"Inicia sesión para gestionar tus viviendas de forma segura desde este navegador.",
    nameLabel:"Nombre / etiqueta", loginTitle:"Iniciar sesión", registerTitle:"Crear cuenta", emailLabel:"Email", passwordLabel:"Contraseña", passwordHelp:"Al menos 10 caracteres.", loginButton:"Entrar →", registerButton:"Crear cuenta →", accountLabel:"CUENTA", logoutButton:"Cerrar sesión",
    loggingIn:"Iniciando sesión…", registering:"Creando cuenta…", loggedIn:"Sesión iniciada.", registered:"Cuenta creada. Revisa tu correo para verificarla.", verifyingEmail:"Verificando correo…", emailVerified:"Correo verificado. Has iniciado sesión.", loggedOut:"Sesión cerrada.",
    propertiesTitle:"Viviendas",
    propertiesHelp:"Sin fotos ni descripciones copiadas. Solo los datos mínimos para buscar disponibilidad.",
    internalLabel:"Nombre de la vivienda", propertyPlaceholder:"Apartamento Poblenou", cityLabel:"Ciudad", accommodationTypeLabel:"Tipo de alojamiento", entirePlace:"Alojamiento entero", privateRoom:"Habitación privada", bedroomsLabel:"Dormitorios", sleepsLabel:"Plazas para dormir", minStayLabel:"Estancia mínima, días", propertySettings:"Características de la vivienda", savePropertySettings:"Guardar características", saveStaySettings:"Guardar condiciones", propertySettingsSaved:"Ajustes guardados.", enableCalendar:"Activar", disableCalendar:"Desactivar", calendarEnabled:"Calendario de Airbnb activado.", calendarDisabled:"Calendario de Airbnb desactivado.", calendarDisabledStatus:"Desactivado", calendarConnectedStatus:"Conectado", calendarNotConnectedUnverified:"Calendario no conectado · control no verificado", listingVisibleCalendarUnverified:"El enlace de Airbnb es visible para los huéspedes, pero el calendario aún no está verificado", expandProperty:"Expandir", collapseProperty:"Contraer", addProperty:"Añadir vivienda →",
    addingProperty:"Añadiendo vivienda…", propertyAdded:"Vivienda añadida.",
    savingListing:"Guardando anuncio externo…", listingSaved:"Enlace de Airbnb guardado.",
    addingAvailability:"Añadiendo disponibilidad…", availabilityAdded:"Disponibilidad añadida.", updatingAvailability:"Actualizando disponibilidad…",
    availabilityUpdated:"Disponibilidad actualizada.", deletingAvailability:"Eliminando disponibilidad…", availabilityDeleted:"Disponibilidad eliminada.",
    deleteConfirm:(a,b)=>`¿Eliminar ${a} → ${b}?`, deletePropertyConfirm:n=>`¿Eliminar “${n}” y todos sus datos de disponibilidad en PARROT?`, deleteListingConfirm:"¿Eliminar el anuncio externo de Airbnb de esta vivienda?", propertyDeleted:"Vivienda eliminada.", listingDeleted:"Anuncio externo eliminado.", noProperties:"Todavía no hay viviendas.", externalListing:"Anuncio externo",
    saveAirbnb:"Guardar ID de Airbnb", cleaningFee:"Limpieza, € (opcional)", saveCleaning:"Guardar limpieza", nightlyPrice:"€/noche (opcional)", calendarSync:"Sincronización del calendario Airbnb", calendarHelp:"Pega el enlace de exportación iCal de Airbnb. PARROT solo usa los eventos marcados Reserved para bloquear fechas; los eventos Airbnb (Not available) se guardan pero se ignoran para la disponibilidad física.", calendarUrl:"URL de exportación iCal de Airbnb", connectCalendar:"Conectar calendario", syncNow:"Sincronizar ahora", disconnectCalendar:"Eliminar", disconnectCalendarConfirm:"¿Eliminar la conexión del calendario de Airbnb?", calendarConnected:"Calendario de Airbnb conectado.", calendarDisconnected:"Calendario de Airbnb eliminado.", calendarSynced:"Calendario de Airbnb sincronizado.", reservationsImported:n=>`${n} bloqueo${n===1?"":"s"} de reserva importado${n===1?"":"s"}`, ignoredBlocks:n=>`${n} bloqueo${n===1?"":"s"} de disponibilidad de Airbnb ignorado${n===1?"":"s"}`, lastSync:v=>`Última sincronización: ${v}`, neverSynced:"Aún no sincronizado", calendarError:"Error de sincronización", airbnbIdHelp:"Abre el anuncio público de Airbnb y copia el número que aparece después de /rooms/. Ejemplo: 910841261983250037", airbnbIdPlaceholder:"ID del anuncio de Airbnb", availability:"Disponibilidad en PARROT", addDates:"Añadir fechas", loading:"Cargando…",
    noPeriods:"No hay periodos de disponibilidad.", save:"Guardar", remove:"Eliminar", bedroom:n=>n===1?"1 dormitorio":`${n} dormitorios`, sleepSummary:n=>n===1?"1 plaza":`${n} plazas`, minSummary:n=>`mínimo ${n} día${n===1?"":"s"}`
  },
  ca: {
    usernameLabel:"Nom d’usuari", loginLabel:"Email o nom d’usuari", usernameHelp:"Únic, sense distingir majúscules. Sense el símbol @.",
    title:"PARROT 669 — Panell de propietaris", consoleLabel:"PANELL DE PROPIETARIS", backToSite:"← Tornar al web", tabSearch:"Cercar disponibilitat", tabHost:"Per a propietaris", deleteProperty:"Eliminar habitatge", deleteListing:"Eliminar anunci extern", showListingInSearch:"Mostrar l'enllaç extern als resultats", listingVisibilitySaved:"Visibilitat de l'enllaç actualitzada.",
    toolsEyebrow:"EINES PER A PROPIETARIS", heroTitle:"Publica la disponibilitat.<br><span>L'operació passa fora.</span>",
    heroLead:"Afegeix un habitatge, enllaça l'anunci original d'Airbnb i mantén només les dates en què està físicament lliure.",
    identityTitle:"Compte del propietari", identityHelp:"Inicia sessió per gestionar els habitatges de manera segura des d'aquest navegador.",
    nameLabel:"Nom / etiqueta", loginTitle:"Iniciar sessió", registerTitle:"Crear compte", emailLabel:"Email", passwordLabel:"Contrasenya", passwordHelp:"Com a mínim 10 caràcters.", loginButton:"Entrar →", registerButton:"Crear compte →", accountLabel:"COMPTE", logoutButton:"Tancar sessió",
    loggingIn:"Iniciant sessió…", registering:"Creant compte…", loggedIn:"Sessió iniciada.", registered:"Compte creat. Revisa el correu per verificar-lo.", verifyingEmail:"Verificant el correu…", emailVerified:"Correu verificat. Has iniciat sessió.", loggedOut:"Sessió tancada.",
    propertiesTitle:"Habitatges",
    propertiesHelp:"Sense fotos ni descripcions copiades. Només les dades mínimes per cercar disponibilitat.",
    internalLabel:"Nom de l'habitatge", propertyPlaceholder:"Apartament Poblenou", cityLabel:"Ciutat", accommodationTypeLabel:"Tipus d'allotjament", entirePlace:"Allotjament sencer", privateRoom:"Habitació privada", bedroomsLabel:"Dormitoris", sleepsLabel:"Places per dormir", minStayLabel:"Estada mínima, dies", propertySettings:"Característiques de l'habitatge", savePropertySettings:"Desar característiques", saveStaySettings:"Desar condicions", propertySettingsSaved:"Configuració desada.", enableCalendar:"Activar", disableCalendar:"Desactivar", calendarEnabled:"Calendari d'Airbnb activat.", calendarDisabled:"Calendari d'Airbnb desactivat.", calendarDisabledStatus:"Desactivat", calendarConnectedStatus:"Connectat", calendarNotConnectedUnverified:"Calendari no connectat · control no verificat", listingVisibleCalendarUnverified:"L’enllaç d’Airbnb és visible per als hostes, però el calendari encara no està verificat", expandProperty:"Desplegar", collapseProperty:"Plegar", addProperty:"Afegir habitatge →",
    addingProperty:"Afegint habitatge…", propertyAdded:"Habitatge afegit.",
    savingListing:"Desant l'anunci extern…", listingSaved:"Enllaç d'Airbnb desat.",
    addingAvailability:"Afegint disponibilitat…", availabilityAdded:"Disponibilitat afegida.", updatingAvailability:"Actualitzant disponibilitat…",
    availabilityUpdated:"Disponibilitat actualitzada.", deletingAvailability:"Eliminant disponibilitat…", availabilityDeleted:"Disponibilitat eliminada.",
    deleteConfirm:(a,b)=>`Eliminar ${a} → ${b}?`, deletePropertyConfirm:n=>`Eliminar “${n}” i totes les seves dades de disponibilitat de PARROT?`, deleteListingConfirm:"Eliminar l'anunci extern d'Airbnb d'aquest habitatge?", propertyDeleted:"Habitatge eliminat.", listingDeleted:"Anunci extern eliminat.", noProperties:"Encara no hi ha habitatges.", externalListing:"Anunci extern",
    saveAirbnb:"Desar ID d'Airbnb", cleaningFee:"Neteja, € (opcional)", saveCleaning:"Desar neteja", nightlyPrice:"€/nit (opcional)", calendarSync:"Sincronització del calendari Airbnb", calendarHelp:"Enganxa l'enllaç d'exportació iCal d'Airbnb. PARROT només utilitza els esdeveniments marcats Reserved per bloquejar dates; els esdeveniments Airbnb (Not available) es desen però s'ignoren per a la disponibilitat física.", calendarUrl:"URL d'exportació iCal d'Airbnb", connectCalendar:"Connectar calendari", syncNow:"Sincronitzar ara", disconnectCalendar:"Eliminar", disconnectCalendarConfirm:"Eliminar la connexió del calendari d'Airbnb?", calendarConnected:"Calendari d'Airbnb connectat.", calendarDisconnected:"Calendari d'Airbnb eliminat.", calendarSynced:"Calendari d'Airbnb sincronitzat.", reservationsImported:n=>`${n} bloqueig${n===1?"":"s"} de reserva importat${n===1?"":"s"}`, ignoredBlocks:n=>`${n} bloqueig${n===1?"":"s"} de disponibilitat d'Airbnb ignorat${n===1?"":"s"}`, lastSync:v=>`Última sincronització: ${v}`, neverSynced:"Encara no sincronitzat", calendarError:"Error de sincronització", airbnbIdHelp:"Obre l'anunci públic d'Airbnb i copia el número que hi ha després de /rooms/. Exemple: 910841261983250037", airbnbIdPlaceholder:"ID de l'anunci d'Airbnb", availability:"Disponibilitat a PARROT", addDates:"Afegir dates", loading:"Carregant…",
    noPeriods:"No hi ha períodes de disponibilitat.", save:"Desar", remove:"Eliminar", bedroom:n=>n===1?"1 dormitori":`${n} dormitoris`, sleepSummary:n=>n===1?"1 plaça":`${n} places`, minSummary:n=>`mínim ${n} dia${n===1?"":"s"}`
  },
  ru: {
    usernameLabel:"Логин", loginLabel:"Email или логин", usernameHelp:"Уникальный, без учёта регистра. Без символа @.",
    title:"PARROT 669 — Кабинет владельца", consoleLabel:"КАБИНЕТ ВЛАДЕЛЬЦА", backToSite:"← Назад на сайт", tabSearch:"Найти жильё", tabHost:"Владельцам", deleteProperty:"Удалить объект", deleteListing:"Удалить внешнее объявление", showListingInSearch:"Показывать внешнюю ссылку в поиске", listingVisibilitySaved:"Видимость внешней ссылки обновлена.",
    toolsEyebrow:"ИНСТРУМЕНТЫ ВЛАДЕЛЬЦА", heroTitle:"Публикуйте свободные даты.<br><span>Сделка остаётся снаружи.</span>",
    heroLead:"Добавьте объект, укажите исходное объявление Airbnb и поддерживайте только даты, когда жильё физически свободно.",
    identityTitle:"Аккаунт владельца", identityHelp:"Войдите, чтобы безопасно управлять своими объектами с этого браузера.",
    nameLabel:"Имя / название", loginTitle:"Войти", registerTitle:"Создать аккаунт", emailLabel:"Email", passwordLabel:"Пароль", passwordHelp:"Не менее 10 символов.", loginButton:"Войти →", registerButton:"Создать аккаунт →", accountLabel:"АККАУНТ", logoutButton:"Выйти",
    loggingIn:"Входим…", registering:"Создаём аккаунт…", loggedIn:"Вы вошли.", registered:"Аккаунт создан. Проверьте почту и подтвердите email.", verifyingEmail:"Подтверждаем email…", emailVerified:"Email подтверждён. Вы вошли.", loggedOut:"Вы вышли.",
    propertiesTitle:"Объекты",
    propertiesHelp:"Без фотографий и скопированных описаний. Только минимум данных для поиска свободных дат.",
    internalLabel:"Название объекта", propertyPlaceholder:"Квартира в Poblenou", cityLabel:"Город", accommodationTypeLabel:"Тип жилья", entirePlace:"Жильё целиком", privateRoom:"Отдельная комната", bedroomsLabel:"Спальни", sleepsLabel:"Спальных мест", minStayLabel:"Минимум дней", propertySettings:"Характеристики объекта", savePropertySettings:"Сохранить характеристики", saveStaySettings:"Сохранить условия", propertySettingsSaved:"Настройки объекта сохранены.", enableCalendar:"Включить", disableCalendar:"Выключить", calendarEnabled:"Календарь Airbnb включён.", calendarDisabled:"Календарь Airbnb выключен.", calendarDisabledStatus:"Выключен", calendarConnectedStatus:"Подключён", calendarNotConnectedUnverified:"Календарь не подключён · контроль не подтверждён", listingVisibleCalendarUnverified:"Ссылка на Airbnb видна гостям, но календарь ещё не подтверждён", expandProperty:"Развернуть", collapseProperty:"Свернуть", addProperty:"Добавить объект →",
    addingProperty:"Добавляем объект…", propertyAdded:"Объект добавлен.",
    savingListing:"Сохраняем внешнее объявление…", listingSaved:"Ссылка Airbnb сохранена.",
    addingAvailability:"Добавляем свободные даты…", availabilityAdded:"Свободные даты добавлены.", updatingAvailability:"Обновляем даты…",
    availabilityUpdated:"Даты обновлены.", deletingAvailability:"Удаляем даты…", availabilityDeleted:"Даты удалены.",
    deleteConfirm:(a,b)=>`Удалить период ${a} → ${b}?`, deletePropertyConfirm:n=>`Удалить объект «${n}» и все его данные о свободных датах из PARROT?`, deleteListingConfirm:"Удалить внешнее объявление Airbnb у этого объекта?", propertyDeleted:"Объект удалён.", listingDeleted:"Внешнее объявление удалено.", noProperties:"Объектов пока нет.", externalListing:"Внешнее объявление",
    saveAirbnb:"Сохранить ID Airbnb", cleaningFee:"Уборка, € (необязательно)", saveCleaning:"Сохранить уборку", nightlyPrice:"€/ночь (необязательно)", calendarSync:"Синхронизация календаря Airbnb", calendarHelp:"Вставьте экспортную iCal-ссылку Airbnb. PARROT блокирует даты только по событиям Reserved; Airbnb (Not available) сохраняются, но не считаются физической занятостью.", calendarUrl:"Экспортная iCal-ссылка Airbnb", connectCalendar:"Подключить календарь", syncNow:"Обновить сейчас", disconnectCalendar:"Удалить", disconnectCalendarConfirm:"Удалить календарь Airbnb?", calendarConnected:"Календарь Airbnb подключён.", calendarDisconnected:"Календарь Airbnb удалён.", calendarSynced:"Календарь Airbnb обновлён.", reservationsImported:n=>`Импортировано броней: ${n}`, ignoredBlocks:n=>`Игнорируемых блокировок Airbnb: ${n}`, lastSync:v=>`Последняя синхронизация: ${v}`, neverSynced:"Ещё не синхронизировался", calendarError:"Ошибка синхронизации", airbnbIdHelp:"Откройте публичную страницу объявления Airbnb и скопируйте число после /rooms/. Например: 910841261983250037", airbnbIdPlaceholder:"ID объявления Airbnb", availability:"Свободные даты в PARROT", addDates:"Добавить даты", loading:"Загрузка…",
    noPeriods:"Свободных периодов пока нет.", save:"Сохранить", remove:"Удалить", bedroom:n=>n===1?"1 спальня":n<5?`${n} спальни`:`${n} спален`, sleepSummary:n=>`${n} спальных мест`, minSummary:n=>`минимум ${n} дн.`
  }
};

const emptyState = () => ({authenticated:false, accountEmail:"", username:"", properties:[]});
Object.assign(copy.en, {overlapError:"These dates overlap an existing availability period. Change the dates or edit that period.", dismissError:"Dismiss error"});
Object.assign(copy.es, {overlapError:"Estas fechas se solapan con un período disponible existente. Cambia las fechas o edita ese período.", dismissError:"Cerrar error"});
Object.assign(copy.ca, {overlapError:"Aquestes dates se solapen amb un període disponible existent. Canvia les dates o edita aquell període.", dismissError:"Tancar error"});
Object.assign(copy.ru, {overlapError:"Эти даты пересекаются с уже добавленным свободным периодом. Измените даты или отредактируйте тот период.", dismissError:"Закрыть ошибку"});
let state = emptyState();
let lang = loadLanguage();
let authMode = "login";
let sessionLoading = true;
let authBusy = false;
const expandedPropertyIds = new Set();
let accountId = null;
let presentedSessionEpoch = null;
let dashboardLoad = Promise.resolve();
let unsavedHostChanges = false;
let confirmedExit = false;
const returnKey = id => `parrot669-host-return:${id}`;
const propertyNavigationParams = new URLSearchParams(window.location.search);
const propertyNavigationUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let propertyNavigationId = propertyNavigationUuid.test(propertyNavigationParams.get("property") || "") ? propertyNavigationParams.get("property") : null;
let propertyConversationId = propertyNavigationId && propertyNavigationUuid.test(propertyNavigationParams.get("conversation") || "") ? propertyNavigationParams.get("conversation") : null;
let propertyNavigationPending = Boolean(propertyNavigationId);
const navCopy = {
  en:{navProperties:"My properties",navTools:"Host tools",discardChanges:"Discard unsaved changes and leave this page?"},
  es:{navProperties:"Mis viviendas",navTools:"Herramientas del propietario",discardChanges:"¿Descartar los cambios sin guardar y salir de esta página?"},
  ca:{navProperties:"Els meus habitatges",navTools:"Eines del propietari",discardChanges:"Vols descartar els canvis sense desar i sortir d'aquesta pàgina?"},
  ru:{navProperties:"Мои объекты",navTools:"Инструменты владельца",discardChanges:"Сбросить несохранённые изменения и уйти с этой страницы?"}
};
Object.entries(navCopy).forEach(([language,values])=>Object.assign(copy[language],values));
Object.assign(copy.en,{propertyFromConversation:"This is the property from your conversation.",propertyUnavailableHere:"This property is no longer available in this account.",backToConversation:"← Back to conversation"});
Object.assign(copy.es,{propertyFromConversation:"Esta es la vivienda de tu conversación.",propertyUnavailableHere:"Esta vivienda ya no está disponible en esta cuenta.",backToConversation:"← Volver a la conversación"});
Object.assign(copy.ca,{propertyFromConversation:"Aquest és l'habitatge de la teva conversa.",propertyUnavailableHere:"Aquest habitatge ja no està disponible en aquest compte.",backToConversation:"← Tornar a la conversa"});
Object.assign(copy.ru,{propertyFromConversation:"Это объект из вашего диалога.",propertyUnavailableHere:"Этот объект больше недоступен в данном аккаунте.",backToConversation:"← Вернуться в диалог"});
document.getElementById("property-panel").addEventListener("input", event=>{
  if(event.target.closest("form"))unsavedHostChanges=true;
});
document.getElementById("property-panel").addEventListener("change", event=>{
  if(event.target.closest("form"))unsavedHostChanges=true;
});
document.addEventListener("click",event=>{
  const link=event.target.closest("a[href]");
  if(!link || !link.isConnected || link.origin!==window.location.origin || link.pathname===window.location.pathname)return;
  if(unsavedHostChanges && !confirm(tr("discardChanges"))){event.preventDefault();return;}
  confirmedExit=true;
  if(link.pathname==="/messages.html" && state.authenticated && accountId){
    try{hostCore.storage.session.setItem(returnKey(accountId),JSON.stringify({ids:[...expandedPropertyIds],scrollY:window.scrollY}));}catch{}
  }
});
window.addEventListener("beforeunload",event=>{
  if(unsavedHostChanges && !confirmedExit){event.preventDefault();event.returnValue="";}
});
function restoreHostContext(){
  if(!accountId)return;
  try{
    const key=returnKey(accountId),saved=JSON.parse(hostCore.storage.session.getItem(key)||"null");
    hostCore.storage.session.removeItem(key);
    if(!saved || !Array.isArray(saved.ids))return;
    const owned=new Set(state.properties.map(property=>property.id));
    saved.ids.filter(id=>typeof id==="string" && owned.has(id)).forEach(id=>expandedPropertyIds.add(id));
    return Number.isFinite(saved.scrollY) && saved.scrollY>=0 ? saved.scrollY : null;
  }catch{}
}

function restoreHostScroll(scrollY){
  const target=Number(scrollY);
  if(!Number.isFinite(target) || target<0)return;
  let retryTimer=null,deadlineTimer=null,stopped=false;
  const cancelEvents=["wheel","touchstart","pointerdown","keydown"];
  const cleanup=()=>{
    if(stopped)return;
    stopped=true;
    clearTimeout(retryTimer);
    clearTimeout(deadlineTimer);
    cancelEvents.forEach(type=>window.removeEventListener?.(type,cleanup));
  };
  const attempt=()=>{
    if(stopped)return;
    const viewport=Number(window.innerHeight)||0;
    const height=Number(document.documentElement?.scrollHeight)||0;
    const reachable=height && viewport ? Math.min(target,Math.max(0,height-viewport)) : target;
    window.scrollTo({top:reachable,behavior:"instant"});
    if(Math.abs(window.scrollY-target)<=1){cleanup();return;}
    retryTimer=setTimeout(()=>requestAnimationFrame(attempt),50);
  };
  cancelEvents.forEach(type=>window.addEventListener(type,cleanup,{passive:true}));
  deadlineTimer=setTimeout(cleanup,3000);
  requestAnimationFrame(attempt);
}

const blockCopy = {
  en: {availability:"Available", availabilityHelp:"Dates offered in search. Manual blocks and imported reservations take priority.", unavailable:"Closed dates", unavailableHelp:"Block dates for your own use or other bookings. No price. Existing availability and prices are kept; blocked nights are excluded from search.", blockFrom:"Unavailable from", blockTo:"Available again on", addBlock:"Close dates", noBlocks:"No closed dates yet.", blockSaved:"Dates closed for search.", blockDeleted:"Dates reopened. Existing availability and reservation rules apply.", blockOverlap:"These dates overlap an existing manual block. Edit that block instead.", deleteBlockConfirm:(from,to)=>`Remove the block ${from} → ${to}? These dates may appear in search again.`, blockDateError:"The end date must be after the start date. The end date is not blocked."},
  es: {availability:"Disponible", availabilityHelp:"Fechas ofrecidas en la búsqueda. Los bloqueos manuales y las reservas importadas tienen prioridad.", unavailable:"Fechas cerradas", unavailableHelp:"Bloquea fechas para uso propio u otras reservas. Sin precio. Se conservan la disponibilidad y los precios; las noches bloqueadas se excluyen de la búsqueda.", blockFrom:"No disponible desde", blockTo:"Disponible de nuevo el", addBlock:"Cerrar fechas", noBlocks:"Todavía no hay fechas cerradas.", blockSaved:"Fechas cerradas para la búsqueda.", blockDeleted:"Fechas reabiertas. Se aplican las reglas de disponibilidad y reservas existentes.", blockOverlap:"Estas fechas se solapan con un bloqueo manual. Edita ese bloqueo.", deleteBlockConfirm:(from,to)=>`¿Eliminar el bloqueo ${from} → ${to}? Estas fechas podrían volver a aparecer en la búsqueda.`, blockDateError:"La fecha final debe ser posterior a la inicial. La fecha final no está bloqueada."},
  ca: {availability:"Disponible", availabilityHelp:"Dates ofertes a la cerca. Els bloquejos manuals i les reserves importades tenen prioritat.", unavailable:"Dates tancades", unavailableHelp:"Bloqueja dates per a ús propi o altres reserves. Sense preu. Es conserven la disponibilitat i els preus; les nits bloquejades s'exclouen de la cerca.", blockFrom:"No disponible des de", blockTo:"Disponible de nou el", addBlock:"Tancar dates", noBlocks:"Encara no hi ha dates tancades.", blockSaved:"Dates tancades per a la cerca.", blockDeleted:"Dates reobertes. S’apliquen les regles de disponibilitat i reserves existents.", blockOverlap:"Aquestes dates se solapen amb un bloqueig manual. Edita aquell bloqueig.", deleteBlockConfirm:(from,to)=>`Eliminar el bloqueig ${from} → ${to}? Aquestes dates podrien tornar a aparèixer a la cerca.`, blockDateError:"La data final ha de ser posterior a la inicial. La data final no està bloquejada."},
  ru: {availability:"Доступно", availabilityHelp:"Даты для поиска. Ручные блокировки и брони из календаря имеют приоритет.", unavailable:"Закрытые даты", unavailableHelp:"Закройте даты для себя или других бронирований. Без цены. Свободные периоды и их цены сохраняются, но заблокированные ночи исключаются из поиска.", blockFrom:"Недоступно с", blockTo:"Снова доступно с", addBlock:"Закрыть даты", noBlocks:"Закрытых дат пока нет.", blockSaved:"Даты закрыты для поиска.", blockDeleted:"Закрытие снято. Снова учитываются свободные периоды и брони.", blockOverlap:"Эти даты пересекаются с уже добавленной ручной блокировкой. Отредактируйте её.", deleteBlockConfirm:(from,to)=>`Удалить блокировку ${from} → ${to}? Эти даты снова смогут появиться в поиске.`, blockDateError:"Дата окончания должна быть позже начала. Дата окончания не блокируется."}
};
Object.entries(blockCopy).forEach(([language, values]) => Object.assign(copy[language], values));

const hostDateCopy = {
  en: {firstNight:"First night", lastNight:"Last night (included)", availabilityHelp:"Both dates are included. The price applies to every selected night, including the last one. Manual blocks and imported reservations take priority.", unavailableHelp:"Select nights when the property is unavailable to guests, including the last night. They will be excluded from search; available periods and prices will be kept.", blockTo:"Unavailable through (included)", blockDateError:"The last date cannot be before the first date."},
  es: {firstNight:"Primera noche", lastNight:"Última noche (incluida)", availabilityHelp:"Ambas fechas están incluidas. El precio se aplica a cada noche seleccionada, incluida la última. Los bloqueos manuales y las reservas importadas tienen prioridad.", unavailableHelp:"Indica las noches en las que la vivienda no estará disponible, incluida la última. No aparecerán en la búsqueda; se conservarán los períodos disponibles y los precios.", blockTo:"No disponible hasta (incluido)", blockDateError:"La fecha final no puede ser anterior a la inicial."},
  ca: {firstNight:"Primera nit", lastNight:"Última nit (inclosa)", availabilityHelp:"Ambdues dates estan incloses. El preu s'aplica a cada nit seleccionada, inclosa l'última. Els bloquejos manuals i les reserves importades tenen prioritat.", unavailableHelp:"Indica les nits en què l’habitatge no estarà disponible, inclosa l’última. No apareixeran a la cerca; es conservaran els períodes disponibles i els preus.", blockTo:"No disponible fins al (inclòs)", blockDateError:"La data final no pot ser anterior a la inicial."},
  ru: {firstNight:"Первая ночь", lastNight:"Последняя ночь (включительно)", availabilityHelp:"Обе даты включены. Цена действует на каждую выбранную ночь, включая последнюю. Ручные блокировки и брони из календаря имеют приоритет.", unavailableHelp:"Укажите ночи, когда жильё недоступно гостям, включая последнюю ночь. Они не попадут в поиск; свободные периоды и цены сохранятся.", blockTo:"Недоступно по (включительно)", blockDateError:"Последняя дата не может быть раньше первой."}
};
Object.entries(hostDateCopy).forEach(([language, values]) => Object.assign(copy[language], values));

const periodUiCopy = {
  en:{chooseDate:"Select date",priceLabel:"Price per night, €",priceOptional:"Optional",newPeriod:"Add available dates",savedPeriod:"Available period",savedBlock:"Closed for search",newBlock:"Close another period",addressCitySearch:"Search city",addressStreetSearch:"Search street"},
  es:{chooseDate:"Elegir fecha",priceLabel:"Precio por noche, €",priceOptional:"Opcional",newPeriod:"Añadir fechas disponibles",savedPeriod:"Período disponible",savedBlock:"Cerrado para la búsqueda",newBlock:"Cerrar otro período",addressCitySearch:"Buscar ciudad",addressStreetSearch:"Buscar calle"},
  ca:{chooseDate:"Tria una data",priceLabel:"Preu per nit, €",priceOptional:"Opcional",newPeriod:"Afegir dates disponibles",savedPeriod:"Període disponible",savedBlock:"Tancat per a la cerca",newBlock:"Tancar un altre període",addressCitySearch:"Cercar ciutat",addressStreetSearch:"Cercar carrer"},
  ru:{chooseDate:"Выберите дату",priceLabel:"Цена за ночь, €",priceOptional:"Необязательно",newPeriod:"Добавить свободные даты",savedPeriod:"Доступный период",savedBlock:"Закрыто для поиска",newBlock:"Закрыть ещё период",addressCitySearch:"Поиск города",addressStreetSearch:"Поиск улицы"}
};
Object.entries(periodUiCopy).forEach(([language, values]) => Object.assign(copy[language], values));

Object.assign(copy.en,{selectProperty:"Selected property",workspaceActions:"Workspace actions",manageProfile:"My profile",sourcePanelTitle:"External listing",workingTitle:"For hosts",editPeriodGroup:"Edit period",conditionsGroup:"Property-wide conditions",conditionsHelp:"These conditions apply to every available period.",conditionsSaved:"Conditions saved.",conditionsSaving:"Saving conditions…",conditionsUnknown:"The save result is unconfirmed. Check the current values before saving again.",conditionsCheck:"Check result",unsavedLabel:"Unsaved",calendarSettings:"Calendar settings",closedDates:"Closed dates",propertyDetails:"Property details",viewCalendarStatus:"View calendar status",calendarProblemTitle:"Calendar sync failed",calendarProblemBody:"Your last confirmed dates remain available. Review the calendar status before updating it again."});
Object.assign(copy.es,{selectProperty:"Vivienda seleccionada",workspaceActions:"Acciones",manageProfile:"Mi perfil",sourcePanelTitle:"Anuncio externo",workingTitle:"Para propietarios",editPeriodGroup:"Editar período",conditionsGroup:"Condiciones de toda la vivienda",conditionsHelp:"Estas condiciones se aplican a todos los períodos disponibles.",conditionsSaved:"Condiciones guardadas.",conditionsSaving:"Guardando condiciones…",conditionsUnknown:"El resultado no está confirmado. Comprueba los valores actuales antes de volver a guardar.",conditionsCheck:"Comprobar resultado",unsavedLabel:"Sin guardar",calendarSettings:"Ajustes del calendario",closedDates:"Fechas cerradas",propertyDetails:"Detalles de la vivienda",viewCalendarStatus:"Ver estado del calendario",calendarProblemTitle:"Falló la sincronización del calendario",calendarProblemBody:"Las últimas fechas confirmadas siguen disponibles. Revisa el estado antes de volver a actualizar.",});
Object.assign(copy.ca,{selectProperty:"Habitatge seleccionat",workspaceActions:"Accions",manageProfile:"El meu perfil",sourcePanelTitle:"Anunci extern",workingTitle:"Per a propietaris",editPeriodGroup:"Edita el període",conditionsGroup:"Condicions de tot l'habitatge",conditionsHelp:"Aquestes condicions s'apliquen a tots els períodes disponibles.",conditionsSaved:"Condicions desades.",conditionsSaving:"Desant les condicions…",conditionsUnknown:"El resultat no està confirmat. Comprova els valors actuals abans de tornar a desar.",conditionsCheck:"Comprova el resultat",unsavedLabel:"Sense desar",calendarSettings:"Configuració del calendari",closedDates:"Dates tancades",propertyDetails:"Detalls de l'habitatge",viewCalendarStatus:"Mostra l'estat del calendari",calendarProblemTitle:"Ha fallat la sincronització del calendari",calendarProblemBody:"Les últimes dates confirmades continuen disponibles. Revisa l'estat abans de tornar a actualitzar."});
Object.assign(copy.ru,{selectProperty:"Выбранный объект",workspaceActions:"Действия",manageProfile:"Мой профиль",sourcePanelTitle:"Внешнее объявление",workingTitle:"Владельцам",editPeriodGroup:"Изменить период",conditionsGroup:"Условия всего объекта",conditionsHelp:"Эти условия действуют для всех свободных периодов.",conditionsSaved:"Условия сохранены.",conditionsSaving:"Сохраняем условия…",conditionsUnknown:"Результат сохранения не подтверждён. Проверьте текущие значения перед повторной записью.",conditionsCheck:"Проверить результат",unsavedLabel:"Не сохранено",calendarSettings:"Настройки календаря",closedDates:"Закрытые даты",propertyDetails:"Данные объекта",viewCalendarStatus:"Статус календаря",calendarProblemTitle:"Не удалось обновить календарь",calendarProblemBody:"Последние подтверждённые даты остаются доступными. Проверьте состояние календаря перед новым обновлением."});
Object.assign(copy.en,{conditionsMismatch:"The saved values differ from this draft. Review the current values before choosing to save again.",calendarProblemBody:"Review the confirmed calendar status before updating it again.",calendarUnknownTitle:"Calendar status is unknown",calendarUnknownBody:"The calendar could not be read. No saved dates or successful sync are confirmed by this result."});
Object.assign(copy.es,{conditionsMismatch:"Los valores guardados no coinciden con este borrador. Revisa los valores actuales antes de volver a guardar.",calendarProblemBody:"Revisa el estado confirmado del calendario antes de volver a actualizar.",calendarUnknownTitle:"Se desconoce el estado del calendario",calendarUnknownBody:"No se pudo leer el calendario. Este resultado no confirma fechas guardadas ni una sincronización correcta."});
Object.assign(copy.ca,{conditionsMismatch:"Els valors desats no coincideixen amb aquest esborrany. Revisa els valors actuals abans de tornar a desar.",calendarProblemBody:"Revisa l'estat confirmat del calendari abans de tornar-lo a actualitzar.",calendarUnknownTitle:"Es desconeix l'estat del calendari",calendarUnknownBody:"No s'ha pogut llegir el calendari. Aquest resultat no confirma dates desades ni una sincronització correcta."});
Object.assign(copy.ru,{conditionsMismatch:"Сохранённые значения отличаются от черновика. Проверьте текущие значения перед новой записью.",calendarProblemBody:"Проверьте подтверждённый статус календаря перед новым обновлением.",calendarUnknownTitle:"Статус календаря неизвестен",calendarUnknownBody:"Календарь не удалось прочитать. Этот результат не подтверждает сохранённые даты или успешную синхронизацию."});
Object.assign(copy.en,{nightCount:n=>`${n} night${n===1?"":"s"}`});
Object.assign(copy.es,{nightCount:n=>`${n} noche${n===1?"":"s"}`});
Object.assign(copy.ca,{nightCount:n=>`${n} nit${n===1?"":"s"}`});
Object.assign(copy.ru,{nightCount:n=>`${n} ноч.`});
const periodEditorCopy = {
  en:{periodEditing:"Edit period",periodSaving:"Saving changes",periodSaved:"Changes saved",periodError:"Could not confirm saving",periodEdit:"Edit",periodSave:"Save changes",periodSavingAction:"Saving…",periodRetry:"Retry saving",periodCheck:"Check result",periodCancel:"Cancel",periodDraftKept:"Your entered values remain in the form.",periodUnknown:"The result is unconfirmed. Check the result before saving again. Cancel reloads the saved period; it does not undo server changes.",periodUnconfirmed:"The saved period differs from your changes. Check again or cancel to reload it.",periodEditHelp:v=>`Saved: ${v}. The last night is included.`},
  es:{periodEditing:"Editar período",periodSaving:"Guardando cambios",periodSaved:"Cambios guardados",periodError:"No se pudo confirmar el guardado",periodEdit:"Editar",periodSave:"Guardar cambios",periodSavingAction:"Guardando…",periodRetry:"Reintentar guardar",periodCheck:"Comprobar resultado",periodCancel:"Cancelar",periodDraftKept:"Los valores introducidos siguen en el formulario.",periodUnknown:"El resultado no está confirmado. Compruébalo antes de guardar otra vez. Cancelar recarga el período guardado; no deshace cambios en el servidor.",periodUnconfirmed:"El período guardado difiere de tus cambios. Comprueba otra vez o cancela para recargarlo.",periodEditHelp:v=>`Guardado: ${v}. La última noche está incluida.`},
  ca:{periodEditing:"Editar període",periodSaving:"Desant els canvis",periodSaved:"Canvis desats",periodError:"No s’ha pogut confirmar el desat",periodEdit:"Editar",periodSave:"Desar els canvis",periodSavingAction:"Desant…",periodRetry:"Tornar a desar",periodCheck:"Comprovar resultat",periodCancel:"Cancel·lar",periodDraftKept:"Els valors introduïts continuen al formulari.",periodUnknown:"El resultat no està confirmat. Comprova’l abans de tornar a desar. Cancel·lar recarrega el període desat; no desfà canvis al servidor.",periodUnconfirmed:"El període desat difereix dels teus canvis. Comprova’l de nou o cancel·la per recarregar-lo.",periodEditHelp:v=>`Desat: ${v}. L’última nit està inclosa.`},
  ru:{periodEditing:"Изменить период",periodSaving:"Сохранение изменений",periodSaved:"Изменения сохранены",periodError:"Не удалось подтвердить сохранение",periodEdit:"Изменить",periodSave:"Сохранить изменения",periodSavingAction:"Сохраняем…",periodRetry:"Повторить сохранение",periodCheck:"Проверить результат",periodCancel:"Отмена",periodDraftKept:"Введённые данные остались в форме.",periodUnknown:"Результат не подтверждён. Проверьте его перед новой записью. Отмена загрузит сохранённый период, но не отменит изменения на сервере.",periodUnconfirmed:"Сохранённый период отличается от введённых данных. Проверьте снова или отмените редактирование, чтобы загрузить его.",periodEditHelp:v=>`Сохранено: ${v}. Последняя ночь включена.`}
};
Object.entries(periodEditorCopy).forEach(([language, values]) => Object.assign(copy[language], values));

const addressCopy = {
  en:{addressRateLimited:"Too many address searches. Wait a moment, then try again.",addressChooseCountry:"Select a country",addressLoadingCountries:"Loading countries…",addressCountriesUnavailable:"Could not load countries. Try again.",addressCityPlaceholder:"Start typing the city",addressStreetLabel:"Street",addressStreetPlaceholder:"Start typing the street",addressHouseLabel:"House number",addressHousePlaceholder:"e.g. 40 or 40 bis",addressHouseRequired:"Enter the house number.",addressChooseCity:"Select a city from the suggestions.",addressChooseStreet:"Select a street from the suggestions.",addressNoCities:"No cities found in this country. Try a longer name.",addressNoStreets:"No streets found in this city. Try a longer name or its local spelling.",addressStepsHelp:"Choose country, city and street, then enter the house number. Only you can see the full address.",addressChange:"Change address",addressCancelChange:"Keep saved address",addressLabel:"Property address",addressPlaceholder:"Street, house number, city",addressHelp:"Start typing and select a suggestion. Country and city fill automatically. Only you can see the exact address.",countryLabel:"Country",addressSuggestions:"Address suggestions",addressLoading:"Looking for addresses…",addressChoose:"Select an address with a street and house number from the suggestions.",addressMore:"Enter at least 3 characters.",addressNoResults:"No complete address found. Enter the street, house number and city.",addressUnavailable:"Address suggestions are unavailable. Your input is saved — try again.",addressSignIn:"Sign in again to look up addresses.",addressSelected:"Address selected. Country and city filled automatically.",addressRetry:"Try again",addressTooLong:"Use a shorter search, up to 256 characters."},
  es:{addressRateLimited:"Demasiadas búsquedas. Espera un momento y vuelve a intentarlo.",addressChooseCountry:"Selecciona un país",addressLoadingCountries:"Cargando países…",addressCountriesUnavailable:"No se pudieron cargar los países. Vuelve a intentarlo.",addressCityPlaceholder:"Empieza a escribir la ciudad",addressStreetLabel:"Calle",addressStreetPlaceholder:"Empieza a escribir la calle",addressHouseLabel:"Número",addressHousePlaceholder:"p. ej. 40 o 40 bis",addressHouseRequired:"Introduce el número de la vivienda.",addressChooseCity:"Selecciona una ciudad de las sugerencias.",addressChooseStreet:"Selecciona una calle de las sugerencias.",addressNoCities:"No se encontraron ciudades en este país. Completa el nombre.",addressNoStreets:"No se encontraron calles en esta ciudad. Completa el nombre o usa su nombre local.",addressStepsHelp:"Selecciona país, ciudad y calle; después introduce el número. Solo tú puedes ver la dirección completa.",addressChange:"Cambiar dirección",addressCancelChange:"Conservar dirección",addressLabel:"Dirección de la vivienda",addressPlaceholder:"Calle, número, ciudad",addressHelp:"Empieza a escribir y selecciona una sugerencia. País y ciudad se rellenan automáticamente. Solo tú puedes ver la dirección exacta.",countryLabel:"País",addressSuggestions:"Sugerencias de direcciones",addressLoading:"Buscando direcciones…",addressChoose:"Selecciona una dirección con calle y número de las sugerencias.",addressMore:"Introduce al menos 3 caracteres.",addressNoResults:"No se encontró una dirección completa. Introduce calle, número y ciudad.",addressUnavailable:"Las sugerencias no están disponibles. Conservamos el texto; vuelve a intentarlo.",addressSignIn:"Vuelve a iniciar sesión para buscar direcciones.",addressSelected:"Dirección seleccionada. País y ciudad completados automáticamente.",addressRetry:"Reintentar",addressTooLong:"Acorta la búsqueda a un máximo de 256 caracteres."},
  ca:{addressRateLimited:"Massa cerques. Espera un moment i torna-ho a provar.",addressChooseCountry:"Selecciona un país",addressLoadingCountries:"Carregant països…",addressCountriesUnavailable:"No s’han pogut carregar els països. Torna-ho a provar.",addressCityPlaceholder:"Comença a escriure la ciutat",addressStreetLabel:"Carrer",addressStreetPlaceholder:"Comença a escriure el carrer",addressHouseLabel:"Número",addressHousePlaceholder:"p. ex. 40 o 40 bis",addressHouseRequired:"Introdueix el número de l’habitatge.",addressChooseCity:"Selecciona una ciutat dels suggeriments.",addressChooseStreet:"Selecciona un carrer dels suggeriments.",addressNoCities:"No s’han trobat ciutats en aquest país. Completa el nom.",addressNoStreets:"No s’han trobat carrers en aquesta ciutat. Completa el nom o usa el nom local.",addressStepsHelp:"Selecciona país, ciutat i carrer; després introdueix el número. Només tu pots veure l’adreça completa.",addressChange:"Canviar adreça",addressCancelChange:"Conservar adreça",addressLabel:"Adreça de l’habitatge",addressPlaceholder:"Carrer, número, ciutat",addressHelp:"Comença a escriure i selecciona un suggeriment. El país i la ciutat s’emplenen automàticament. Només tu pots veure l’adreça exacta.",countryLabel:"País",addressSuggestions:"Suggeriments d’adreces",addressLoading:"Cercant adreces…",addressChoose:"Selecciona una adreça amb carrer i número dels suggeriments.",addressMore:"Introdueix almenys 3 caràcters.",addressNoResults:"No s’ha trobat cap adreça completa. Introdueix carrer, número i ciutat.",addressUnavailable:"Els suggeriments no estan disponibles. Conservem el text; torna-ho a provar.",addressSignIn:"Torna a iniciar sessió per cercar adreces.",addressSelected:"Adreça seleccionada. País i ciutat emplenats automàticament.",addressRetry:"Torna-ho a provar",addressTooLong:"Escurça la cerca a un màxim de 256 caràcters."},
  ru:{addressRateLimited:"Слишком много запросов адреса. Подождите немного и повторите поиск.",addressChooseCountry:"Выберите страну",addressLoadingCountries:"Загружаем страны…",addressCountriesUnavailable:"Не удалось загрузить страны. Попробуйте ещё раз.",addressCityPlaceholder:"Начните вводить город",addressStreetLabel:"Улица",addressStreetPlaceholder:"Начните вводить улицу",addressHouseLabel:"Номер дома",addressHousePlaceholder:"Например, 40 или 40 bis",addressHouseRequired:"Укажите номер дома.",addressChooseCity:"Выберите город из подсказок.",addressChooseStreet:"Выберите улицу из подсказок.",addressNoCities:"Города в этой стране не найдены. Уточните название.",addressNoStreets:"Улицы в этом городе не найдены. Уточните название или введите его на местном языке.",addressStepsHelp:"Выберите страну, город и улицу, затем укажите номер дома. Полный адрес видите только вы.",addressChange:"Изменить адрес",addressCancelChange:"Оставить прежний адрес",addressLabel:"Адрес объекта",addressPlaceholder:"Улица, номер дома, город",addressHelp:"Начните вводить адрес и выберите подсказку. Страна и город заполнятся автоматически. Точный адрес видите только вы.",countryLabel:"Страна",addressSuggestions:"Подсказки адресов",addressLoading:"Ищем адреса…",addressChoose:"Выберите адрес с улицей и номером дома из списка подсказок.",addressMore:"Введите хотя бы 3 символа.",addressNoResults:"Полный адрес не найден. Укажите улицу, номер дома и город.",addressUnavailable:"Подсказки адресов сейчас недоступны. Введённый текст сохранён — попробуйте ещё раз.",addressSignIn:"Войдите снова, чтобы найти адрес.",addressSelected:"Адрес выбран. Страна и город заполнены автоматически.",addressRetry:"Повторить поиск",addressTooLong:"Сократите поисковый запрос до 256 символов."}
};
Object.entries(addressCopy).forEach(([language, values]) => Object.assign(copy[language], values));
// Exact accepted house-only copy; no unit wire/UI until its published contract exists.
const houseCopy={
  "ru": {
    "addressHouseFind": "Найти дом",
    "addressHouseUse": "Использовать этот адрес",
    "addressHouseChanged": "Адрес изменён. Найдите дом заново.",
    "addressHouseNotFound": "Дом не найден. Проверьте улицу и номер.",
    "addressHouseUnavailable": "Сервис поиска не ответил. Это не означает, что дома нет.",
    "addressHouseExpiry": "Подтвердите дом ещё раз. Введённый адрес остался в форме.",
    "addressHouseDisclaimer": "Поиск адреса не подтверждает право сдавать жильё.",
    "addressHouseSelected": "Адрес выбран для сохранения",
    "addressHouseLoading": "Ищем дом…",
    "addressCancelChange": "Отменить изменения адреса",
    "addressSaveUnknown": "Ответ не получен. Адрес мог сохраниться. Не отправляйте изменения повторно.",
    "addressHouseReview": "Проверьте найденные адреса и выберите один. Изменения ещё не сохранены.",
    "addressHouseCancelLookup": "Отменить поиск",
    "addressHouseCancelQuestion": "Отменить только черновик адреса? Остальные правки останутся.",
    "addressHouseKeepDraft": "Продолжить редактирование",
    "addressCurrentReview": "Посмотреть текущее состояние на сервере",
    "addressCurrentState": "Загружено текущее состояние сервера. Это не доказывает исход сохранения с потерянным ответом."
  },
  "en": {
    "addressHouseFind": "Find house",
    "addressHouseUse": "Use this address",
    "addressHouseChanged": "The address has changed. Find the house again.",
    "addressHouseNotFound": "House not found. Check the street and number.",
    "addressHouseUnavailable": "The address service did not respond. This does not mean the house does not exist.",
    "addressHouseExpiry": "Confirm the house again. Your entered address is still in the form.",
    "addressHouseDisclaimer": "Address lookup does not confirm the right to let this property.",
    "addressHouseSelected": "Address selected for saving",
    "addressHouseLoading": "Finding house…",
    "addressCancelChange": "Cancel address changes",
    "addressSaveUnknown": "No response received. The address may have been saved. Do not submit the changes again.",
    "addressHouseReview": "Review the returned addresses, then choose one. Nothing has been saved.",
    "addressHouseCancelLookup": "Cancel lookup",
    "addressHouseCancelQuestion": "Discard only the address draft? Other edits will stay.",
    "addressHouseKeepDraft": "Keep editing",
    "addressCurrentReview": "Review current server state",
    "addressCurrentState": "Current server state loaded. This does not establish the outcome of a lost save."
  },
  "es": {
    "addressHouseFind": "Buscar edificio",
    "addressHouseUse": "Usar esta dirección",
    "addressHouseChanged": "La dirección ha cambiado. Vuelve a buscar el edificio.",
    "addressHouseNotFound": "No se ha encontrado el edificio. Revisa la calle y el número.",
    "addressHouseUnavailable": "El servicio de direcciones no ha respondido. Esto no significa que el edificio no exista.",
    "addressHouseExpiry": "Confirma el edificio de nuevo. La dirección introducida sigue en el formulario.",
    "addressHouseDisclaimer": "La búsqueda de la dirección no confirma el derecho a alquilar este alojamiento.",
    "addressHouseSelected": "Dirección seleccionada para guardar",
    "addressHouseLoading": "Buscando el edificio…",
    "addressCancelChange": "Cancelar cambios de dirección",
    "addressSaveUnknown": "No se ha recibido respuesta. La dirección puede haberse guardado. No vuelvas a enviar los cambios.",
    "addressHouseReview": "Revisa las direcciones y elige una. No se ha guardado nada.",
    "addressHouseCancelLookup": "Cancelar búsqueda",
    "addressHouseCancelQuestion": "¿Descartar solo el borrador de dirección? Los demás cambios se conservan.",
    "addressHouseKeepDraft": "Seguir editando",
    "addressCurrentReview": "Consultar el estado actual del servidor",
    "addressCurrentState": "Estado actual cargado. No confirma el resultado de un guardado sin respuesta."
  },
  "ca": {
    "addressHouseFind": "Cercar l’edifici",
    "addressHouseUse": "Utilitzar aquesta adreça",
    "addressHouseChanged": "L’adreça ha canviat. Torna a cercar l’edifici.",
    "addressHouseNotFound": "No s’ha trobat l’edifici. Revisa el carrer i el número.",
    "addressHouseUnavailable": "El servei d’adreces no ha respost. Això no vol dir que l’edifici no existeixi.",
    "addressHouseExpiry": "Confirma l’edifici de nou. L’adreça introduïda continua al formulari.",
    "addressHouseDisclaimer": "La cerca de l’adreça no confirma el dret a llogar aquest allotjament.",
    "addressHouseSelected": "Adreça seleccionada per desar",
    "addressHouseLoading": "Cercant l’edifici…",
    "addressCancelChange": "Cancel·lar els canvis d’adreça",
    "addressSaveUnknown": "No s’ha rebut cap resposta. L’adreça pot haver-se desat. No tornis a enviar els canvis.",
    "addressHouseReview": "Revisa les adreces i tria’n una. No s’ha desat res.",
    "addressHouseCancelLookup": "Cancel·lar la cerca",
    "addressHouseCancelQuestion": "Vols descartar només l’esborrany de l’adreça? La resta de canvis es conserva.",
    "addressHouseKeepDraft": "Continuar editant",
    "addressCurrentReview": "Consultar l’estat actual del servidor",
    "addressCurrentState": "Estat actual carregat. No confirma el resultat d’un desament sense resposta."
  }
};
Object.entries(houseCopy).forEach(([language,values])=>Object.assign(copy[language],values));

const qaCopy={
  en:{heroLead:"Add a property and keep its physically available dates up to date. An Airbnb listing and calendar are optional.",verifyFirst:"Confirm your email using the link in the message, then log in. Check your spam folder too.",forgotPassword:"Forgot password?",titleRequired:"Enter a property name.",titleTooLong:"Use up to 160 characters for the property name."},
  es:{heroLead:"Añade una vivienda y mantén actualizadas las fechas en las que está físicamente libre. El anuncio y el calendario de Airbnb son opcionales.",verifyFirst:"Confirma tu email con el enlace del mensaje y vuelve a iniciar sesión. Revisa también la carpeta de spam.",forgotPassword:"¿Has olvidado la contraseña?",titleRequired:"Introduce el nombre de la vivienda.",titleTooLong:"Usa un máximo de 160 caracteres para el nombre."},
  ca:{heroLead:"Afegeix un habitatge i mantén al dia les dates en què està físicament lliure. L’anunci i el calendari d’Airbnb són opcionals.",verifyFirst:"Confirma el correu amb l’enllaç del missatge i torna a iniciar sessió. Revisa també la carpeta de correu brossa.",forgotPassword:"Has oblidat la contrasenya?",titleRequired:"Introdueix el nom de l’habitatge.",titleTooLong:"Fes servir un màxim de 160 caràcters per al nom."},
  ru:{heroLead:"Добавьте объект и укажите даты, когда он физически свободен. Объявление Airbnb и подключение календаря необязательны.",verifyFirst:"Подтвердите email по ссылке в письме, затем войдите. Проверьте также папку «Спам».",forgotPassword:"Забыли пароль?",titleRequired:"Укажите название объекта.",titleTooLong:"Название объекта — не более 160 символов."}
};
const listingConflictCopy={
  en:{listingConflictThisProperty:"This Airbnb listing is already connected to this property.",listingConflictYourAccount:"This Airbnb listing is already connected to one of your properties. Check your properties in Host.",listingConflictOtherAccount:"This Airbnb listing is already connected to another PARROT account. If you think this is a mistake, contact us and we'll look into it.",listingConflictNeutral:"This Airbnb listing is already connected. Try again or contact us.",listingConflictContact:"Contact us"},
  es:{listingConflictThisProperty:"Este anuncio de Airbnb ya está conectado a esta vivienda.",listingConflictYourAccount:"Este anuncio de Airbnb ya está conectado a una de tus viviendas. Revisa tus viviendas en el panel.",listingConflictOtherAccount:"Este anuncio de Airbnb ya está conectado a otra cuenta de PARROT. Si crees que es un error, escríbenos y lo revisaremos.",listingConflictNeutral:"Este anuncio de Airbnb ya está conectado. Inténtalo de nuevo o escríbenos.",listingConflictContact:"Escríbenos"},
  ca:{listingConflictThisProperty:"Aquest anunci d'Airbnb ja està connectat a aquest habitatge.",listingConflictYourAccount:"Aquest anunci d'Airbnb ja està connectat a un dels teus habitatges. Revisa els teus habitatges al panell.",listingConflictOtherAccount:"Aquest anunci d'Airbnb ja està connectat a un altre compte de PARROT. Si creus que és un error, escriu-nos i ho revisarem.",listingConflictNeutral:"Aquest anunci d'Airbnb ja està connectat. Torna-ho a provar o escriu-nos.",listingConflictContact:"Escriu-nos"},
  ru:{listingConflictThisProperty:"Это объявление Airbnb уже подключено к этому объекту.",listingConflictYourAccount:"Это объявление Airbnb уже добавлено к одному из ваших объектов. Проверьте свои объекты в кабинете.",listingConflictOtherAccount:"Это объявление Airbnb уже привязано к другому аккаунту PARROT. Если считаете это ошибкой, напишите нам — разберёмся.",listingConflictNeutral:"Объявление Airbnb уже подключено. Повторите попытку или напишите нам.",listingConflictContact:"Написать нам"}
};
const profileCopy={
  en:{profileAccount:"Account"},es:{profileAccount:"Cuenta"},ca:{profileAccount:"Compte"},ru:{profileAccount:"Учётная запись"}
};
Object.entries(profileCopy).forEach(([language,values])=>Object.assign(copy[language],values));
Object.entries(qaCopy).forEach(([language,values])=>Object.assign(copy[language],values));
Object.entries(listingConflictCopy).forEach(([language,values])=>Object.assign(copy[language],values));
function ruPlural(n,one,few,many){return `${n} ${n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many}`}
copy.ru.bedroom=n=>ruPlural(n,"спальня","спальни","спален");
copy.ru.sleepSummary=n=>ruPlural(n,"спальное место","спальных места","спальных мест");

const statusNode = document.getElementById("host-status");
const authDialog = document.getElementById("auth-dialog");
const authDialogTitle = document.getElementById("auth-dialog-title");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const openLoginButton = document.getElementById("open-login");
const openRegisterButton = document.getElementById("open-register");
const hostAuthLinks = document.getElementById("host-auth-links");
const hostAccountSession = document.getElementById("host-account-session");
const hostHero = document.getElementById("host-hero");
const propertyPanel = document.getElementById("property-panel");
const propertyNavigationNode = document.getElementById("host-property-context");
const hostProfilePanel = document.getElementById("host-profile");
const profileReturnKey = "parrot669-profile-return";
const propertyForm = document.getElementById("property-form");
const hostAccountEmail = document.getElementById("host-account-email");
const propertiesNode = document.getElementById("host-properties");
const resetButton = document.getElementById("reset-host");
const langButtons = document.querySelectorAll("[data-host-lang]");
const authModeButtons = document.querySelectorAll("[data-auth-mode]");
const propertyAddressEditors = new Map();
const calendarVerificationPanels = [];
// Only Host owns these private, in-memory drafts. Identity changes discard them.
const hostDrafts = new Map();
// Calendar-command observation only. Host keeps requests, drafts, leases and rendering.
const hostCalendarViews = (()=>{
  const views=new Map(), tickets=new WeakMap();
  const current=view=>!!view && state.authenticated && view.owner===accountId
    && view.epoch===hostCore.session.epoch && state.properties.includes(view.property)
    && views.get(view.property.id)===view;
  const ticketFor=view=>{
    const ticket=Object.freeze({property:view.property,epoch:view.epoch,command:view.command});
    tickets.set(ticket,view);return ticket;
  };
  const freezeDisplay=value=>{
    if(value && typeof value==="object"){
      for(const child of Object.values(value))freezeDisplay(child);
      Object.freeze(value);
    }
    return value;
  };
  const project=view=>view ? Object.freeze({command:view.command,phase:view.phase,
    calendarId:view.calendarId,lastConfirmed:view.lastConfirmed,transportPending:view.transport.pending,
    checking:!!view.checking,stopped:!!view.stopped}) : undefined;
  return Object.freeze({
    get size(){return views.size;},
    // The ID observer also serves existing read-only diagnostic consumers.
    get(id){return project(views.get(id));},
    read(property){return project(views.get(property.id));},
    begin(property,calendar,command){
      if(!state.authenticated || !state.properties.includes(property)
        || views.has(property.id) || hostPropertyWrites.has(property.id))return null;
      const view={property,owner:accountId,epoch:hostCore.session.epoch,calendarId:calendar?.id || null,
        command,phase:"pending",lastConfirmed:calendar ? freezeDisplay(JSON.parse(JSON.stringify(calendar))) : null,
        transport:{pending:true}};
      views.set(property.id,view);return ticketFor(view);
    },
    isCurrent(ticket){return current(tickets.get(ticket));},
    transportSettled(ticket){
      // Stop retires the UI ticket, but its replacement still observes this transport.
      // A reset/forget leaves only an orphan record; settling it never recreates a view.
      const view=tickets.get(ticket);if(view)view.transport.pending=false;
    },
    markUnknown(ticket){const view=tickets.get(ticket);if(current(view))view.phase="unknown";},
    close(ticket){const view=tickets.get(ticket);if(current(view))views.delete(view.property.id);},
    beginCheck(property){
      const view=views.get(property.id);
      if(!view)return null; // Preserve Host's GET-only check without an observation view.
      if(!current(view) || view.property!==property || view.transport.pending || view.checking)return undefined;
      view.checking=true;return ticketFor(view);
    },
    finishCheck(ticket,converged){
      const view=tickets.get(ticket);if(!current(view))return;
      if(converged)views.delete(view.property.id);
      else view.checking=false;
    },
    stop(property){
      const view=views.get(property.id);if(!current(view) || view.property!==property)return false;
      views.set(property.id,{...view,phase:"unknown",stopped:true,checking:false});return true;
    },
    forgetProperty(id){views.delete(id);},
    reset(){views.clear();},
    pruneInvalid(){for(const [id,view] of views)if(!current(view))views.delete(id);}
  });
})();
const hostViews = new Map();
const hostPropertyWrites = new Map();
const hostAddressViews = new Map();
const hostVerificationViews = new Map();
const hostResourceVersions = new WeakMap();
const hostAvailabilityLoads = new WeakMap();

function hostFields(form){
  return Object.fromEntries([...form.querySelectorAll("input,select,textarea")]
    .filter(node => node.name && !node.closest?.("[data-host-island]"))
    .map(node => [node.name, node.type === "checkbox" ? node.checked : node.value]));
}

function hostDraft(form){
  const key = `${accountId}:${form.dataset.hostDraftKey || form.id}`;
  if (!hostDrafts.has(key)) {
    const values = hostFields(form);
    hostDrafts.set(key, {server:{...values}, values:{...values}, dirty:new Set(), versions:{}, operation:null});
  }
  return hostDrafts.get(key);
}

function hostAddressSnapshot(form){
  return JSON.stringify([...form.querySelectorAll("input,select,textarea")]
    .filter(node=>node.closest?.("[data-host-island]"))
    .map(node=>[node.id,node.name,node.value]));
}

function captureHostDraft(form){
  const draft = hostDraft(form);
  for (const [name, value] of Object.entries(hostFields(form))) {
    if (draft.values[name] !== value) draft.versions[name] = (draft.versions[name] || 0) + 1;
    draft.values[name] = value;
    if (value === draft.server[name]) draft.dirty.delete(name);
    else draft.dirty.add(name);
  }
  return draft;
}

function hostDirtyState(){
  unsavedHostChanges = [...hostDrafts.values()].some(draft => draft.addressDirty
    || (draft.editor ? draft.editor.verifyOnly || hostEditorDirty(draft) : draft.dirty.size)) || hostCalendarViews.size>0;
}

function syncHostForm(form, server){
  const draft = captureHostDraft(form);
  draft.server = {...server};
  for (const node of form.querySelectorAll("input,select,textarea")) {
    if (!node.name || node.closest?.("[data-host-island]")) continue;
    if (!draft.dirty.has(node.name)) draft.values[node.name] = server[node.name] ?? "";
    const value = draft.values[node.name];
    if (node.type === "checkbox") { if (node.checked !== value) node.checked = value; }
    else if (node.value !== String(value ?? "")) node.value = value ?? "";
    if (value === server[node.name]) draft.dirty.delete(node.name);
    node.refreshDateHint?.();
  }
  form.hostRefresh?.();
  hostDirtyState();
}

function beginHostSave(form, property = null){
  const draft = captureHostDraft(form);
  if (draft.operation || (property && hostPropertyWrites.has(property.id))) return null;
  const operation = {form, draft, values:{...draft.values}, versions:{...draft.versions},
    dirty:new Set(draft.dirty), addressDirty:!!draft.addressDirty,
    addressVersion:draft.addressVersion || 0, addressValues:hostAddressSnapshot(form),
    epoch:hostCore.session.epoch, account:accountId, property,
    key:`${accountId}:${form.dataset.hostDraftKey || form.id}`};
  draft.operation = operation;
  form.dataset.hostOperation = "saving";
  if (property) hostPropertyWrites.set(property.id, operation);
  return operation;
}

function currentHostSave(operation){
  return operation && operation.epoch === hostCore.session.epoch && operation.account === accountId
    && hostDrafts.get(operation.key || operation.account+":"+(operation.form.dataset.hostDraftKey || operation.form.id))===operation.draft
    && (!operation.property || state.properties.includes(operation.property));
}

function finishHostSave(operation, server){
  if (!currentHostSave(operation)) return;
  const draft = captureHostDraft(operation.form);
  operation.form.dataset.hostOperation = "saved";
  draft.addressDirty=(draft.addressVersion || 0)!==operation.addressVersion
    || hostAddressSnapshot(operation.form)!==operation.addressValues;
  for (const [name, value] of Object.entries(server)) {
    draft.server[name] = value;
    if (draft.versions[name] === operation.versions[name] && draft.values[name] === operation.values[name]) {
      draft.dirty.delete(name);
      draft.values[name] = value;
    }
  }
  // Apply without treating an acknowledged value as another user edit.
  for (const node of operation.form.querySelectorAll("input,select,textarea")) {
    if (node.name && !node.closest?.("[data-host-island]") && !draft.dirty.has(node.name)) {
      if (node.type === "checkbox") node.checked = draft.values[node.name];
      else if (node.value !== String(draft.values[node.name] ?? "")) node.value = draft.values[node.name] ?? "";
      node.refreshDateHint?.();
    }
  }
  hostDirtyState();
}

function releaseHostSave(operation){
  if (!operation) return;
  if (operation.draft.operation === operation) operation.draft.operation = null;
  if (operation.property && hostPropertyWrites.get(operation.property.id) === operation)
    hostPropertyWrites.delete(operation.property.id);
}

function hostInput(event){
  const form = event.target.closest?.("form");
  if (!form || (!form.dataset.hostDraftKey && form !== propertyForm)) return;
  const draft = captureHostDraft(form);
  if (event.target.closest?.("[data-host-island]")) {draft.addressDirty = true; draft.addressVersion=(draft.addressVersion || 0)+1;}
  hostDirtyState();
}
propertyPanel.addEventListener("input", hostInput);
propertyPanel.addEventListener("change", hostInput);

function hostMergeRows(previous, rows){
  return rows.map(row => {
    const current = previous?.find(item => item.id === row.id);
    if (!current) return row;
    Object.assign(current, row);
    return current;
  });
}

function hostMergeProperties(properties, baseline=hostConfirmationRevision){
  const incoming=new Map(properties.filter(property=>!hostDeletedProperties.has(property.id)).map(property=>[property.id,property]));
  // A read begun before a peer confirmation cannot remove that confirmed owner.
  for (const previous of state.properties) {
    const facts=hostConfirmations.get(previous.id);
    if (!incoming.has(previous.id) && !hostDeletedProperties.has(previous.id) && facts
      && (facts.conditions?.revision>baseline || [...facts.periods.values()].some(fact=>fact.revision>baseline)))
      incoming.set(previous.id,previous);
  }
  return [...incoming.values()].map(property => {
    const previous = state.properties.find(item => item.id === property.id);
    const facts=hostConfirmations.get(property.id);
    if (facts?.conditions?.revision>baseline) property={...property,...facts.conditions.value};
    property={...property,availability:hostConfirmedRows(previous || property,property.availability || [],baseline)};
    if (!previous) return property;
    const availability = hostMergeRows(previous.availability, property.availability);
    const unavailability = hostMergeRows(previous.unavailability, property.unavailability);
    const calendars = property.calendars;
    return Object.assign(previous, property, {availability, unavailability, calendars});
  });
}

// Reconcile only the existing Host card template. Address/verification controllers
// are opaque islands; their input nodes, listeners and async lifecycle stay owned there.
function hostNodeKey(node){
  return node.dataset?.hostKey || `${node.tagName}:${node.name || node.className || ""}`;
}

function patchHostView(current, next){
  if (current.dataset?.hostIsland) return current;
  const server = current.tagName === "FORM" ? hostFields(next) : null;
  if (server) captureHostDraft(current);
  const protectedControl = current.closest?.("form") && /^(INPUT|SELECT|TEXTAREA)$/.test(current.tagName);
  const busy = current.closest?.("form") && hostDraft(current.closest("form")).operation;
  const retainedAttribute = name => (protectedControl && name === "value")
    || (busy && name === "disabled") || (current.tagName==="DETAILS" && name==="open")
    || (server && ["aria-busy","data-host-operation"].includes(name));
  for (const name of current.getAttributeNames()) {
    if (!retainedAttribute(name) && !next.hasAttribute(name)) current.removeAttribute(name);
  }
  for (const name of next.getAttributeNames()) {
    if (!retainedAttribute(name) && current.getAttribute(name) !== next.getAttribute(name))
      current.setAttribute(name, next.getAttribute(name));
  }
  if (!next.children.length) {
    if (!protectedControl && current.textContent !== next.textContent) current.textContent = next.textContent;
    if(current.tagName === "INPUT" && current.type === "checkbox" && !current.closest?.("form"))
      current.checked=next.checked;
  } else {
    const children = [...current.children], used = new Set();
    let position = 0;
    for (const child of [...next.children]) {
      const existing = children.find(node => !used.has(node) && hostNodeKey(node) === hostNodeKey(child));
      const node = existing ? patchHostView(existing, child) : child;
      used.add(node);
      if (current.children[position] !== node) current.insertBefore(node, current.children[position] || null);
      position++;
    }
    for (const child of children) if (!used.has(child) && !child.classList.contains("host-form-error")) child.remove();
  }
  if (server) syncHostForm(current, server);
  return current;
}

function disposeHostProperty(id){
  hostViews.get(id)?.node.remove();
  hostViews.delete(id);
  hostCalendarViews.forgetProperty(id);
  const address = hostAddressViews.get(id);
  if (address) {address.editor.dispose(); propertyAddressEditors.delete(address.form); hostAddressViews.delete(id);}
  for (const [key, panel] of hostVerificationViews) if (panel.propertyId === id) {
    panel.dispose(); hostVerificationViews.delete(key);
    const index = calendarVerificationPanels.indexOf(panel);
    if (index >= 0) calendarVerificationPanels.splice(index, 1);
  }
  for (const key of hostDrafts.keys()) if (key.startsWith(`${accountId}:property:${id}:`)) hostRetireDraft(key);
}

function commitHostCard(property, card, expanded){
  const previous = hostViews.get(property.id);
  const node = previous ? patchHostView(previous.node, card) : card;
  node.hidden=!expanded;
  if (!previous) {
    propertiesNode.append(node);
    for (const form of node.querySelectorAll("form")) captureHostDraft(form);
  }
  const position=state.properties.indexOf(property);
  if(propertiesNode.children[position]!==node){
    const active=document.activeElement;
    const selection=active && node.contains(active) ? {node:active,from:active.selectionStart,to:active.selectionEnd} : null;
    propertiesNode.insertBefore(node,propertiesNode.children[position] || null);
    if(selection && selection.node.isConnected){
      selection.node.focus({preventScroll:true});
      if(selection.from!=null && selection.to!=null)selection.node.setSelectionRange(selection.from,selection.to);
    }
  }
  for (const child of node.children) if (!child.classList.contains("host-property-head")) child.hidden = !expanded;
  hostViews.set(property.id, {node, expandedOnce:expanded || previous?.expandedOnce});
  const address = hostAddressViews.get(property.id);
  if (address) {
    address.editor.setSaved(property.address);
    if(address.editor.node.querySelector(".host-address-fields")?.hidden && property.countryCode)
      address.editor.country.value=property.countryCode;
    address.editor.updateLanguage();
  }
  for (const panel of hostVerificationViews.values()) if(panel.propertyId===property.id){
    panel.updateLanguage?.(lang);
    const title=node.querySelector(".host-calendar-sync")?.querySelector("h3");
    if(title)title.textContent=panel.name;
  }
  for (const form of node.querySelectorAll("form")) {
    const draft=captureHostDraft(form);form.hostRefresh?.();
    if(draft.pendingSave?.addressCommand)hostHouseReview(draft.pendingSave);
  }
  hostDirtyState();
}
const newPropertyAddress = window.ParrotAddress.create({
  id:"new-property-address", tr, request:api, required:true, onUnauthorized:addressSessionExpired
});
newPropertyAddress.node.dataset.hostIsland="new-address";
document.getElementById("property-address").append(newPropertyAddress.node);
newPropertyAddress.refreshDisabled();

function addressSessionExpired(){
  state = {...state, authenticated:false};
  renderAuthState();
  openAuth("login");
}

function loadLanguage(){
  const saved = hostCore.storage.local.getItem(LANG_KEY);
  if (saved && copy[saved]) return saved;
  const browser = (navigator.language || "en").slice(0,2);
  return copy[browser] ? browser : "en";
}

function tr(key, ...args){
  const value = (copy[lang] || copy.en)[key] ?? copy.en[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function applyLanguage(next){
  const previous=lang;
  lang = copy[next] ? next : "en";
  hostCore.storage.local.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.title = tr("title");

  document.querySelectorAll("[data-host-i18n]").forEach(node => {
    node.textContent = tr(node.dataset.hostI18n);
  });
  document.querySelectorAll("[data-host-i18n-html]").forEach(node => {
    node.innerHTML = tr(node.dataset.hostI18nHtml);
  });
  document.querySelectorAll("[data-host-placeholder]").forEach(node => {
    node.placeholder = tr(node.dataset.hostPlaceholder);
  });
  langButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.hostLang === lang));
  updateAuthDialog();
  newPropertyAddress.updateLanguage();
  renderProperties();
  window.ParrotMessaging?.setLanguage(lang);
  if(previous!==lang && state.authenticated)void syncDashboard();
}

function saveState(){
  // Auth credentials are server-side sessions in HttpOnly cookies.
  // Keep this no-op because property mutations still call saveState after local rerenders.
}

function message(text, kind = ""){
  statusNode.textContent = text || "";
  statusNode.className = `host-status ${kind}`.trim();
  statusNode.setAttribute("role", kind === "error" ? "alert" : "status");
  statusNode.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
  if (kind === "error" && text) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "host-status-close";
    close.textContent = "×";
    close.setAttribute("aria-label", tr("dismissError"));
    close.addEventListener("click", () => message(""));
    statusNode.append(close);
  }
}

async function api(path, options = {}){
  const {hostOperation, ...requestOptions}=options;
  options=requestOptions;
  let ownedWrite, resource, epoch, currentResource=()=>true;
  try {
    if (path === "/auth/me") {
      const user = await hostCore.session.refresh();
      if (!user) throw Object.assign(new Error(tr("signIn")), {status:401, code:"AUTHENTICATION_REQUIRED"});
      return user;
    }
    if (path.startsWith("/auth/")) return await hostCore.auth(path.slice(5), options);
    // Explicit producer contracts; a 204 from any other operation is a protocol error.
    const method = options.method || "GET";
    const command204=method === "PATCH" && /^\/properties\/[^/]+$/.test(path);
    const createProperty=method === "POST" && path==="/properties";
    const empty = createProperty || command204 || method === "PUT" && /^\/(listings|availability)\/[^/]+$/.test(path)
      || method === "DELETE" && /^\/(properties|listings|calendars|availability|unavailability)\/[^/]+$/.test(path)
      || method === "PUT" && /^\/calendars\/[^/]+$/.test(path)
      || method === "PUT" && /^\/properties\/[^/]+\/public-links$/.test(path)
      || method === "POST" && /^\/calendars\/[^/]+\/(sync|activate)$/.test(path);
    epoch = hostCore.session.epoch;
    resource = state.properties.find(property => path === `/properties/${property.id}` || path.startsWith(`/properties/${property.id}/`)
      || path === `/listings/${property.listing?.id}`
      || property.availability?.some(period => path === `/availability/${period.id}`)
      || property.unavailability?.some(period => path === `/unavailability/${period.id}`)
      || property.calendars?.some(calendar => path.startsWith(`/calendars/${calendar.id}`)));
    if (resource && method !== "GET") {
      const active=hostPropertyWrites.get(resource.id);
      if (active && active !== hostOperation) throw Object.assign(new Error(tr("loading")),{kind:"busy"});
      if (!active) {
        ownedWrite={propertyId:resource.id};
        hostPropertyWrites.set(resource.id,ownedWrite);
      }
      hostResourceVersions.set(resource,(hostResourceVersions.get(resource) || 0)+1);
    }
    const resourceVersion=hostResourceVersions.get(resource) || 0;
    const period=resource?.availability?.find(value=>path===`/availability/${value.id}`)
      || resource?.unavailability?.find(value=>path===`/unavailability/${value.id}`);
    const listingId=resource && path===`/listings/${resource.listing?.id}` ? resource.listing.id : null;
    const calendarId=resource?.calendars?.find(calendar=>path===`/calendars/${calendar.id}` || path.startsWith(`/calendars/${calendar.id}/`))?.id;
    currentResource=()=>!resource || (epoch===hostCore.session.epoch && state.properties.includes(resource)
      && (method!=="GET" || resourceVersion===(hostResourceVersions.get(resource) || 0))
      && (!period || [...(resource.availability || []),...(resource.unavailability || [])].includes(period))
      && (!listingId || resource.listing?.id===listingId)
      && (!calendarId || resource.calendars?.some(calendar=>calendar.id===calendarId)));
    const jsonSuccess=method==="POST" && /^\/properties\/[^/]+\/(availability|unavailability)$/.test(path) ? 201 : 200;
    const requestPath=path === "/dashboard" ? `${path}?language=${encodeURIComponent(lang)}` : path;
    const value = await hostCore.session.request(`/api/host${requestPath}`, {...options, authenticated:true,
      ...(empty ? {expected:"empty",successStatus:createProperty?201:204} : {successStatus:jsonSuccess}),
      ...(path === "/dashboard" ? {validate:value => value && typeof value === "object" && Array.isArray(value.properties)} : {})});
    if (!currentResource()) throw Object.assign(new Error("Stale Host resource"), {kind:"stale"});
    if (method !== "GET") dashboardVersion++;
    return value;
  } catch (error) {
    if (!currentResource())
      throw Object.assign(new Error("Stale Host resource"), {kind:"stale"});
    const keys = {EMAIL_VERIFICATION_REQUIRED:"verifyFirst", TITLE_REQUIRED:"titleRequired", TITLE_TOO_LONG:"titleTooLong",
      ADDRESS_REQUIRED:"addressChoose", FULL_ADDRESS_REQUIRED:"addressChoose", AVAILABILITY_OVERLAP:"overlapError",
      UNAVAILABILITY_OVERLAP:"blockOverlap"};
    if(keys[error.code]) error.message = tr(keys[error.code]);
    // INVALID_REQUEST is contextual in PM120; retain these two existing date
    // explanations until the backend has a field-specific validation contract.
    if(error.code === "INVALID_REQUEST" && ["to must be after from; checkout date is exclusive",
      "to must be after from; end date is exclusive"].includes(error.message)) error.message=tr("blockDateError");
    throw error;
  } finally {
    if (ownedWrite && hostPropertyWrites.get(ownedWrite.propertyId) === ownedWrite)
      hostPropertyWrites.delete(ownedWrite.propertyId);
  }
}

function setBusy(form, busy){
  form?.querySelectorAll("button").forEach(node => node.disabled = busy);
  if (!busy) {
    if (form === propertyForm) newPropertyAddress.refreshDisabled();
    propertyAddressEditors.get(form)?.refreshDisabled();
    const draft=hostDrafts.get(`${accountId}:${form.dataset.hostDraftKey || form.id}`);
    if(draft?.pendingCreate || draft?.pendingSave?.addressCommand){
      const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    }
  }
}

function setFormError(form, text = ""){
  let node = form?.querySelector(".host-form-error");
  if (!node && text) {
    node = document.createElement("p");
    node.className = "host-inline-error host-form-error";
    node.setAttribute("role", "alert");
    form.append(node);
  }
  if (node) {
    node.textContent = text;
    node.hidden = !text;
  }
}

const listingConflictKeys={
  AIRBNB_LISTING_ALREADY_CONNECTED_TO_THIS_PROPERTY:"listingConflictThisProperty",
  AIRBNB_LISTING_ALREADY_CONNECTED_TO_YOUR_ACCOUNT:"listingConflictYourAccount",
  AIRBNB_LISTING_CONNECTED_TO_ANOTHER_ACCOUNT:"listingConflictOtherAccount",
  AIRBNB_LISTING_ALREADY_CONNECTED:"listingConflictNeutral"
};

function setListingFormError(form,error){
  const key=listingConflictKeys[error?.code];
  if(!key){setFormError(form,error.message);return error.message;}
  const text=tr(key);
  setFormError(form,text);
  if(error.code==="AIRBNB_LISTING_CONNECTED_TO_ANOTHER_ACCOUNT"||error.code==="AIRBNB_LISTING_ALREADY_CONNECTED"){
    const node=form.querySelector(".host-form-error");
    const link=document.createElement("a");
    link.className="host-form-support-link";
    link.href="https://parrot669.com/?contact=airbnb-listing-conflict#contact";
    link.textContent=tr("listingConflictContact");
    node.append(link);
  }
  return text;
}

function setAuthenticated(user){
  hostCore.session.setUser(user);
}

function clearPrivatePresentation(){
  langButtons.forEach(button=>{button.hostFocus=null;});
  for (const id of [...hostViews.keys()]) disposeHostProperty(id);
  calendarVerificationPanels.splice(0).forEach(panel=>panel.dispose());
  propertyAddressEditors.forEach(editor=>editor.dispose());
  propertyAddressEditors.clear();
  hostDrafts.clear();
  hostPropertyWrites.clear();
  hostCalendarViews.reset();
  hostConfirmations.clear(); hostDeletedProperties.clear(); hostConfirmationRevision=0;
  setBusy(propertyForm,false);
  delete propertyForm.dataset.hostOperation;
  state = emptyState();
  renderAuthState();
  renderProperties(); // Disposes property address/verification controllers and detached closures.
  expandedPropertyIds.clear();
  unsavedHostChanges = false;
  propertyForm.reset?.();
  newPropertyAddress.reset();
  loginForm.elements.password.value = "";
  registerForm.elements.password.value = "";
  setFormError(propertyForm);
  message("");
}

function renderAuthState(){
  const ready = Boolean(state.authenticated);
  hostAuthLinks.hidden = sessionLoading || ready;
  hostAccountSession.hidden = !ready;
  hostHero.hidden = !ready;
  authDialog.hidden = sessionLoading || ready;
  propertyPanel.hidden = !ready;
  hostProfilePanel.hidden = !ready;
  hostAccountEmail.textContent = ready ? (state.username || tr("accountLabel")) : "";
  hostAccountEmail.removeAttribute("title");
  document.getElementById("host-profile-email").textContent = ready ? state.accountEmail : "";
  document.getElementById("host-profile-username").textContent = ready ? state.username : "";
}

function updateAuthDialog(){
  const login = authMode === "login";
  authDialogTitle.textContent = tr(login ? "loginTitle" : "registerTitle");
  loginForm.hidden = !login;
  registerForm.hidden = login;
  authModeButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.authMode === authMode)));
}

function openAuth(mode){
  if (sessionLoading || state.authenticated || authBusy) return;
  authMode = mode === "register" ? "register" : "login";
  setFormError(loginForm);
  setFormError(registerForm);
  updateAuthDialog();
  authDialog.hidden = false;
  authDialog.scrollIntoView?.({block:"center"});
  (authMode === "login" ? loginForm : registerForm).querySelector("input").focus();
}

function setAuthBusy(form, busy){
  authBusy = busy;
  setBusy(form, busy);
  authModeButtons.forEach(button => button.disabled = busy);
  authDialog.setAttribute("aria-busy", String(busy));
}

Object.assign(copy.ru, {"calendar": "Календарь Airbnb", "first_title": "Не удалось получить данные", "first_body": "Успешного обновления ещё не было. Блокировки из источника пока неизвестны.", "stale_title": "Не удалось обновить календарь", "stale_body": "Последние сохранённые данные остаются. Новые изменения не получены; сообщение исчезнет после успешного обновления.", "pending_title": "Обновляем календарь…", "pending_body": "Последние данные остаются на экране. Повторная команда пока недоступна.", "recovered_title": "Календарь обновлён", "recovered_body": "Показаны данные последнего успешного обновления.", "last_success": "Последнее успешное обновление", "never": "Ещё не было", "check": "Проверить состояние", "sync": "Обновить сейчас", "disable": "Выключить", "close_wait": "Прекратить ожидание", "close_note": "Это закроет ожидание на экране, но не отменит уже отправленную команду.", "empty": "Источник успешно прочитан. Внешних блокировок нет.", "initial_read_pending_title": "Проверяем источник перед добавлением", "initial_read_pending_body": "Календарь ещё не подтверждён созданным. Ожидание не означает сохранение или успех.", "create_unknown_title": "Не удалось подтвердить, добавлен ли календарь", "create_unknown_body": "Ответ на сохранение не получен. Календарь мог быть создан — не добавляйте его повторно.", "initial_empty_title": "Календарь добавлен", "initial_empty_body": "Источник успешно прочитан. Внешних заблокированных дат нет. Ручные блокировки и другие ограничения могут оставаться.", "mode_current": "Текущий режим", "mode_active": "Активный", "mode_active_effect": "Календарь обновляется. Подтверждённые внешние блокировки участвуют в доступности.", "mode_frozen": "Заморожен", "mode_frozen_effect": "Календарь не обновляется. Последние подтверждённые внешние блокировки продолжают участвовать.", "mode_disabled": "Отключён", "mode_disabled_effect": "Внешние блокировки этого календаря не участвуют в доступности.", "data_age": "Последние подтверждённые данные", "mode_change_pending_title": "Меняем режим…", "mode_change_pending_body": "Показан прежний подтверждённый режим. Новый режим ещё не подтверждён.", "mode_change_unknown_title": "Не удалось подтвердить новый режим", "mode_change_unknown_body": "Результат команды неизвестен. Не повторяйте изменение, пока проверка не установит состояние.", "availability_effect": "Влияние на доступность", "source_verification_separate": "Проверка источника — отдельный статус.", "mode_no_delete": "Режим не удаляет календарь и не превращает даты в ручные.", "effect_external_current": "ДА · внешние блокировки", "effect_external_retained": "ДА · сохранённые блокировки", "effect_external_none": "НЕТ · внешние блокировки", "freeze": "Заморозить", "activate": "Активировать", "historical_mode": "Последний подтверждённый режим", "historical_error": "Историческая ошибка синхронизации", "command_rejected": "Команда не принята. Проверьте текущее состояние.", "read_unknown": "Не удалось подтвердить текущее состояние календаря."});
Object.assign(copy.en, {"calendar": "Airbnb calendar", "first_title": "Could not retrieve calendar data", "first_body": "No update has succeeded yet. Blocks from the source are still unknown.", "stale_title": "Could not update the calendar", "stale_body": "The last saved data remains. New changes were not retrieved; this message clears after a successful update.", "pending_title": "Updating the calendar…", "pending_body": "The last data remains on screen. Another update is unavailable for now.", "recovered_title": "Calendar updated", "recovered_body": "Showing data from the latest successful update.", "last_success": "Last successful update", "never": "None yet", "check": "Check state", "sync": "Update now", "disable": "Disable", "close_wait": "Stop waiting", "close_note": "This closes the waiting view but does not cancel a command already sent.", "empty": "The source was read successfully. There are no external blocks.", "initial_read_pending_title": "Checking source before adding", "initial_read_pending_body": "The calendar is not confirmed as created yet. Waiting does not mean saved or successful.", "create_unknown_title": "Could not confirm whether the calendar was added", "create_unknown_body": "No save response was received. The calendar may exist—do not add it again.", "initial_empty_title": "Calendar added", "initial_empty_body": "The source was read successfully. There are no external blocked dates. Manual blocks and other restrictions may remain.", "mode_current": "Current mode", "mode_active": "Active", "mode_active_effect": "The calendar refreshes. Confirmed external blocks affect availability.", "mode_frozen": "Frozen", "mode_frozen_effect": "The calendar does not refresh. The last confirmed external blocks still affect availability.", "mode_disabled": "Disabled", "mode_disabled_effect": "External blocks from this calendar do not affect availability.", "data_age": "Last confirmed data", "mode_change_pending_title": "Changing mode…", "mode_change_pending_body": "The previous confirmed mode remains shown. The new mode is not confirmed yet.", "mode_change_unknown_title": "Could not confirm the new mode", "mode_change_unknown_body": "The command outcome is unknown. Do not repeat the change until a check establishes the state.", "availability_effect": "Availability effect", "source_verification_separate": "Source verification is a separate status.", "mode_no_delete": "A mode does not delete the calendar or convert dates to manual blocks.", "effect_external_current": "YES · external blocks", "effect_external_retained": "YES · retained blocks", "effect_external_none": "NO · external blocks", "freeze": "Freeze", "activate": "Activate", "historical_mode": "Last confirmed mode", "historical_error": "Historical sync error", "command_rejected": "The command was not accepted. Check the current state.", "read_unknown": "Could not confirm the current calendar state."});
Object.assign(copy.es, {"calendar": "Calendario de Airbnb", "first_title": "No se pudieron obtener los datos", "first_body": "Aún no se ha completado ninguna actualización. Se desconocen los bloqueos del origen.", "stale_title": "No se pudo actualizar el calendario", "stale_body": "Se conservan los últimos datos. No se obtuvieron cambios nuevos; el aviso desaparece tras una actualización correcta.", "pending_title": "Actualizando el calendario…", "pending_body": "Los últimos datos siguen en pantalla. Por ahora no se puede iniciar otra actualización.", "recovered_title": "Calendario actualizado", "recovered_body": "Se muestran los datos de la última actualización correcta.", "last_success": "Última actualización correcta", "never": "Todavía ninguna", "check": "Comprobar estado", "sync": "Actualizar ahora", "disable": "Desactivar", "close_wait": "Dejar de esperar", "close_note": "Se cierra la espera en pantalla, pero no se cancela una orden ya enviada.", "empty": "El origen se ha leído correctamente. No hay bloqueos externos.", "initial_read_pending_title": "Comprobando el origen antes de añadir", "initial_read_pending_body": "Aún no se ha confirmado que el calendario se haya creado. Esperar no significa guardado ni éxito.", "create_unknown_title": "No se pudo confirmar si se añadió el calendario", "create_unknown_body": "No se recibió respuesta al guardar. Puede que el calendario exista; no lo añadas de nuevo.", "initial_empty_title": "Calendario añadido", "initial_empty_body": "El origen se leyó correctamente. No hay fechas externas bloqueadas. Pueden quedar bloqueos manuales y otras restricciones.", "mode_current": "Modo actual", "mode_active": "Activo", "mode_active_effect": "El calendario se actualiza. Los bloqueos externos confirmados afectan a la disponibilidad.", "mode_frozen": "Congelado", "mode_frozen_effect": "El calendario no se actualiza. Los últimos bloqueos externos confirmados siguen afectando a la disponibilidad.", "mode_disabled": "Desactivado", "mode_disabled_effect": "Los bloqueos externos de este calendario no afectan a la disponibilidad.", "data_age": "Últimos datos confirmados", "mode_change_pending_title": "Cambiando el modo…", "mode_change_pending_body": "Se mantiene el modo confirmado anterior. El nuevo modo aún no está confirmado.", "mode_change_unknown_title": "No se pudo confirmar el nuevo modo", "mode_change_unknown_body": "El resultado del comando es desconocido. No repitas el cambio hasta comprobar el estado.", "availability_effect": "Efecto en la disponibilidad", "source_verification_separate": "La verificación del origen es un estado separado.", "mode_no_delete": "Un modo no elimina el calendario ni convierte las fechas en bloqueos manuales.", "effect_external_current": "SÍ · bloqueos externos", "effect_external_retained": "SÍ · bloqueos conservados", "effect_external_none": "NO · bloqueos externos", "freeze": "Congelar", "activate": "Activar", "historical_mode": "Último modo confirmado", "historical_error": "Error histórico de sincronización", "command_rejected": "El comando no se aceptó. Comprueba el estado actual.", "read_unknown": "No se pudo confirmar el estado actual del calendario."});
Object.assign(copy.ca, {"calendar": "Calendari d’Airbnb", "first_title": "No s’han pogut obtenir les dades", "first_body": "Encara no hi ha cap actualització correcta. Es desconeixen els bloquejos de l’origen.", "stale_title": "No s’ha pogut actualitzar el calendari", "stale_body": "Es conserven les últimes dades. No s’han obtingut canvis nous; l’avís desapareix després d’una actualització correcta.", "pending_title": "S’està actualitzant el calendari…", "pending_body": "Les últimes dades continuen en pantalla. De moment no es pot iniciar una altra actualització.", "recovered_title": "Calendari actualitzat", "recovered_body": "Es mostren les dades de l’última actualització correcta.", "last_success": "Última actualització correcta", "never": "Encara cap", "check": "Comprovar l’estat", "sync": "Actualitzar ara", "disable": "Desactivar", "close_wait": "Deixar d’esperar", "close_note": "Es tanca l’espera a la pantalla, però no es cancel·la una ordre ja enviada.", "empty": "L’origen s’ha llegit correctament. No hi ha bloquejos externs.", "initial_read_pending_title": "Comprovant l’origen abans d’afegir", "initial_read_pending_body": "Encara no s’ha confirmat que el calendari s’hagi creat. Esperar no vol dir desat ni èxit.", "create_unknown_title": "No s’ha pogut confirmar si s’ha afegit el calendari", "create_unknown_body": "No s’ha rebut resposta en desar. El calendari pot existir; no el tornis a afegir.", "initial_empty_title": "Calendari afegit", "initial_empty_body": "L’origen s’ha llegit correctament. No hi ha dates externes bloquejades. Poden quedar bloquejos manuals i altres restriccions.", "mode_current": "Mode actual", "mode_active": "Actiu", "mode_active_effect": "El calendari s’actualitza. Els bloquejos externs confirmats afecten la disponibilitat.", "mode_frozen": "Congelat", "mode_frozen_effect": "El calendari no s’actualitza. Els últims bloquejos externs confirmats continuen afectant la disponibilitat.", "mode_disabled": "Desactivat", "mode_disabled_effect": "Els bloquejos externs d’aquest calendari no afecten la disponibilitat.", "data_age": "Últimes dades confirmades", "mode_change_pending_title": "Canviant el mode…", "mode_change_pending_body": "Es manté el mode confirmat anterior. El mode nou encara no està confirmat.", "mode_change_unknown_title": "No s’ha pogut confirmar el mode nou", "mode_change_unknown_body": "El resultat de l’ordre és desconegut. No repeteixis el canvi fins que una comprovació estableixi l’estat.", "availability_effect": "Efecte en la disponibilitat", "source_verification_separate": "La verificació de l’origen és un estat separat.", "mode_no_delete": "Un mode no elimina el calendari ni converteix les dates en bloquejos manuals.", "effect_external_current": "SÍ · bloquejos externs", "effect_external_retained": "SÍ · bloquejos conservats", "effect_external_none": "NO · bloquejos externs", "freeze": "Congela", "activate": "Activa", "historical_mode": "Últim mode confirmat", "historical_error": "Error històric de sincronització", "command_rejected": "L’ordre no s’ha acceptat. Comprova l’estat actual.", "read_unknown": "No s’ha pogut confirmar l’estat actual del calendari."});
Object.assign(copy.en, {sourceSingleInputHelp:"Paste the private Airbnb iCal export link. PARROT derives the listing ID and public URL; the token is never displayed.",previewSource:"Preview link",saveSource:"Save source",replaceSource:"Replace source",previewRequired:"Preview this exact link before saving.",cancelPendingSource:"A verification is pending. Cancel it before replacing the calendar token?"});
Object.assign(copy.es, {sourceSingleInputHelp:"Pega el enlace privado de exportación iCal de Airbnb. PARROT obtiene el ID y la URL pública; el token nunca se muestra.",previewSource:"Previsualizar enlace",saveSource:"Guardar origen",replaceSource:"Reemplazar origen",previewRequired:"Previsualiza este enlace exacto antes de guardarlo.",cancelPendingSource:"Hay una verificación pendiente. ¿Cancelarla antes de reemplazar el token?"});
Object.assign(copy.ca, {sourceSingleInputHelp:"Enganxa l'enllaç privat d'exportació iCal d'Airbnb. PARROT n'obté l'ID i l'URL pública; el token no es mostra mai.",previewSource:"Previsualitzar enllaç",saveSource:"Desar origen",replaceSource:"Substituir origen",previewRequired:"Previsualitza aquest enllaç exacte abans de desar-lo.",cancelPendingSource:"Hi ha una verificació pendent. Vols cancel·lar-la abans de substituir el token?"});
Object.assign(copy.ru, {sourceSingleInputHelp:"Вставьте приватную экспортную iCal-ссылку Airbnb. PARROT сам определит ID и публичную ссылку; токен нигде не показывается.",previewSource:"Проверить ссылку",saveSource:"Сохранить источник",replaceSource:"Заменить источник",previewRequired:"Перед сохранением проверьте именно эту ссылку.",cancelPendingSource:"Идёт проверка контроля. Отменить её перед заменой токена календаря?"});

const calendarSnapshots = new WeakMap();
let dashboardVersion = 0;
function calendarSnapshot(value){
  if(!value || !Array.isArray(value.calendars)) return false;
  const ids = new Set();
  return value.calendars.every(calendar => {
    if(!calendar || typeof calendar.id !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(calendar.id)
      || ids.has(calendar.id.toLowerCase()) || typeof calendar.provider !== "string"
      || typeof calendar.enabled !== "boolean" || !["Active","Frozen","Disabled"].includes(calendar.mode)
      || !Number.isSafeInteger(calendar.revision) || calendar.revision < 0
      || calendar.provider!=="Airbnb" || !["Pending","Connected","Error"].includes(calendar.status)
      || calendar.enabled!==(calendar.mode!=="Disabled")
      || calendar.reservationBlocks!=null && (!Array.isArray(calendar.reservationBlocks)
        || !calendar.reservationBlocks.every(block=>block && typeof block.from==="string" && typeof block.to==="string"))) return false;
    ids.add(calendar.id.toLowerCase());
    return true;
  });
}

function calendarRevision(calendar){
  const snapshot = calendar && calendarSnapshots.get(calendar);
  if(!snapshot || snapshot.epoch !== hostCore.session.epoch || !state.authenticated
    || !state.properties.some(property => property.id === snapshot.propertyId && !property.calendarReadError && property.calendars.includes(calendar))
    || snapshot.revision!==calendar.revision || snapshot.mode!==calendar.mode)
    throw new Error("Invalid server response");
  return snapshot.revision;
}

async function syncDashboard(target=null){
  const epoch = hostCore.session.epoch, locale=lang, version = ++dashboardVersion, confirmationBaseline=hostConfirmationRevision;
  message(tr("loading"));
  try {
    const dashboard = await api("/dashboard");
    if(epoch !== hostCore.session.epoch || version !== dashboardVersion || locale!==lang) return;
    let calendarError;
    const properties = await Promise.all(dashboard.properties.map(async property => {
      let calendars = [], calendarReadError=false;
      try {
        // Dashboard does not contain calendar mode/revision. Only the
        // authenticated property snapshot is a command source.
        const snapshot = await api(`/properties/${property.id}/calendars`, {validate:calendarSnapshot});
        calendars = snapshot.calendars.map(calendar => {
          const previous=state.properties.find(item=>item.id===property.id)?.calendars.find(item=>item.id===calendar.id);
          if(previous && previous.revision>calendar.revision) throw housingAckError();
          // Keep producer casing/mode intact. Only view comparisons may normalize.
          const view = {...calendar};
          calendarSnapshots.set(view, {propertyId:property.id, epoch, revision:calendar.revision,mode:calendar.mode});
          return view;
        });
      } catch(error) {
        if(error.kind === "stale" || error.status === 401) throw error;
        calendarError ||= error; calendarReadError=true;
        calendars = state.properties.find(item=>item.id===property.id)?.calendars || [];
      }
      const previous=state.properties.find(item=>item.id===property.id);
      const previousProblems=previous?.calendarSyncProblems || (previous?.calendars || []).filter(calendar=>calendar.status==="Error");
      const calendarSyncProblems=calendarReadError ? previousProblems : calendars.flatMap(calendar=>
        calendar.status==="Error" ? [calendar] : calendar.status==="Pending" ? previousProblems.filter(problem=>problem.id===calendar.id) : []);
      return {...property,
        listing:Array.isArray(property.listings) ? (property.listings[0] || null) : null,
        availability:hostReadPeriods(property.availability,property.id),
        unavailability:hostReadPeriods(property.unavailability,property.id,false),
        calendars, calendarReadError, calendarSyncProblems};
    }));
    if(epoch !== hostCore.session.epoch || version !== dashboardVersion || locale!==lang) return;
    if (dashboard.profile) {
      state.profile = dashboard.profile;
    }
    state.properties = hostMergeProperties(properties,confirmationBaseline);
    const navigateToProperty = propertyNavigationPending;
    let previousScroll = null;
    if(navigateToProperty){
      propertyNavigationPending = false;
      expandedPropertyIds.clear();
      if(state.properties.some(property=>property.id===propertyNavigationId)) expandedPropertyIds.add(propertyNavigationId);
      try { hostCore.storage.session.removeItem(returnKey(accountId)); } catch {}
    }else previousScroll=restoreHostContext();
    renderProperties(null,{noAutoSelect:!!target?.currentStateOnly});
    if(navigateToProperty) requestAnimationFrame(()=>{
      const card=Array.from(propertiesNode.children).find(node=>node.dataset.propertyId===propertyNavigationId);
      (card || propertyNavigationNode).scrollIntoView?.({block:"start",behavior:"auto"});
      card?.focus?.({preventScroll:true});
    });
    else if(previousScroll!==null && previousScroll!==undefined)
      restoreHostScroll(previousScroll);
    message(calendarError?.message || "", calendarError ? "error" : "");
    const current=target && state.properties.find(property=>property.id===target.propertyId);
    return {applied:true,epoch,version,property:current,read:current && !current.calendarReadError ? "confirmed" : "unknown"};
  } catch (error) {
    if(error.kind === "stale" || epoch !== hostCore.session.epoch || version !== dashboardVersion || locale!==lang) return;
    if (error.status === 401) {
      state = emptyState();
      state.properties = [];
      renderAuthState();
    }
    message(error.message, "error");
    if (error.status === 401) state.properties = [];
    renderProperties();
  }
}

async function boot(){
  renderAuthState();
  try {
    await restoreSession();
  } finally {
    sessionLoading = false;
    renderAuthState();
    const params = new URLSearchParams(window.location.search);
    authMode = params.get("register") === "1" ? "register" : "login";
    updateAuthDialog();
  }
}

async function revalidateRestoredPage(){
  // BFCache restores the previous DOM verbatim. Clear every auth-sensitive
  // value synchronously, then rebuild it only from a fresh server session.
  sessionLoading = true;
  hostDrafts.clear();
  hostPropertyWrites.clear();
  hostCalendarViews.reset();
  hostConfirmations.clear(); hostDeletedProperties.clear(); hostConfirmationRevision=0;
  state = emptyState();
  accountId = null;
  expandedPropertyIds.clear();
  unsavedHostChanges = false;
  renderAuthState();
  renderProperties();
  message("");
  try {
    await restoreSession();
  } finally {
    sessionLoading = false;
    renderAuthState();
  }
}

window.addEventListener("pageshow", event => {
  if (event.persisted) void revalidateRestoredPage();
});

async function restoreSession(){
  const params = new URLSearchParams(window.location.search);
  const verificationToken = params.get("verifyEmail");

  if (verificationToken) {
    message(tr("verifyingEmail"));
    try {
      const user = await api("/auth/verify-email", {
        method:"POST",
        body:JSON.stringify({token:verificationToken})
      });
      setAuthenticated(user);
      renderAuthState();
      await dashboardLoad;
      params.delete("verifyEmail");
      const query = params.toString();
      history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : "") + window.location.hash);
      message(tr("emailVerified"), "success");
      window.ParrotMessaging?.resumeAfterVerification();
      return;
    } catch (error) {
      params.delete("verifyEmail");
      const query = params.toString();
      history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : "") + window.location.hash);
      state = emptyState();
      renderAuthState();
      renderProperties();
      message(error.message, "error");
      return;
    }
  }

  try {
    const user = await api("/auth/me");
    setAuthenticated(user);
    renderAuthState();
    await dashboardLoad;
  } catch (error) {
    state = emptyState();
    renderAuthState();
    renderProperties();
    if (error.status !== 401) message(error.message, "error");
    else message("");
  }
}

openLoginButton.addEventListener("click", () => openAuth("login"));
openRegisterButton.addEventListener("click", () => openAuth("register"));
authModeButtons.forEach(button => button.addEventListener("click", () => openAuth(button.dataset.authMode)));

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (sessionLoading || state.authenticated || authBusy) return;
  const form = new FormData(loginForm);
  setAuthBusy(loginForm, true);
  setFormError(loginForm);
  message(tr("loggingIn"));

  try {
    const user = await api("/auth/login", {
      method:"POST",
      body:JSON.stringify({
        login:String(form.get("login") || "").trim(),
        password:String(form.get("password") || "")
      })
    });
    setAuthenticated(user);
    renderAuthState();
    await dashboardLoad;
    loginForm.elements.password.value = "";
    message(tr("loggedIn"), "success");
  } catch (error) {
    setFormError(loginForm, error.message);
    message(error.message, "error");
  } finally {
    setAuthBusy(loginForm, false);
  }
});

registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (sessionLoading || state.authenticated || authBusy) return;
  const form = new FormData(registerForm);
  setAuthBusy(registerForm, true);
  setFormError(registerForm);
  message(tr("registering"));

  try {
    await api("/auth/register", {
      method:"POST",
      body:JSON.stringify({
        username:String(form.get("username") || "").trim(),
        displayName:String(form.get("displayName") || "").trim(),
        email:String(form.get("email") || "").trim(),
        password:String(form.get("password") || "")
      })
    });
    registerForm.elements.password.value = "";
    authMode = "login";
    state = emptyState();
    renderAuthState();
    updateAuthDialog();
    renderProperties();
    message(tr("registered"), "success");
  } catch (error) {
    setFormError(registerForm, error.message);
    message(error.message, "error");
  } finally {
    setAuthBusy(registerForm, false);
  }
});

function hostHouseReview(operation){
  if(!currentHostSave(operation))return;
  const {form,draft}=operation;
  let button=form.querySelector(".host-house-review");
  if(!button){
    button=document.createElement("button");button.type="button";button.className="text-button host-house-review";
    form.append(button);
  }
  button.textContent=tr("addressCurrentReview");
  button.onclick=async()=>{
    if(!currentHostSave(operation) || draft.operation || operation.checking)return;
    if(operation.property){await verifyPropertySettings(operation);return;}
    operation.checking=true;button.disabled=true;
    try{
      const result=await syncDashboard({currentStateOnly:true});
      if(!currentHostSave(operation) || !result?.applied)return;
      if(!operation.receivedAck){form.dataset.hostOperation="unknown";setFormError(form,tr("addressSaveUnknown"));}
      message(tr("addressCurrentState"));
    }finally{operation.checking=false;if(currentHostSave(operation))button.disabled=false;}
  };
}

propertyForm.addEventListener("submit", async event => {
  event.preventDefault();
  const draft=hostDraft(propertyForm);
  if(draft.pendingCreate){hostHouseReview(draft.pendingCreate);return;}
  const operation=beginHostSave(propertyForm);
  if (!operation) return;
  propertyForm.querySelector(".host-house-review")?.remove();

  const form = new FormData(propertyForm);
  setFormError(propertyForm);

  try {
    let address;
    try{address=newPropertyAddress.getValue();}catch(error){throw Object.assign(error,{kind:"validation",status:400});}
    setBusy(propertyForm, true);
    message(tr("addingProperty"));
    operation.addressCommand=true;draft.pendingCreate=operation;
    await api("/properties", {
      method:"POST",
      body:JSON.stringify({
        title:String(form.get("title") || "").trim(),
        address,
        accommodationType:String(form.get("accommodationType") || "entire_place"),
        bedrooms:Number(form.get("bedrooms")),
        sleeps:Number(form.get("sleeps"))
      })
    });

    if (!currentHostSave(operation)) return;
    finishHostSave(operation,{title:""});
    operation.receivedAck=true;draft.pendingCreate=null;
    if (!operation.draft.addressDirty) newPropertyAddress.reset();
    message(tr("propertyAdded"), "success");
    hostHouseReview(operation);
  } catch (error) {
    if (!currentHostSave(operation) || error.kind === "stale") return;
    const definite=error.kind==="validation" || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
    if(definite)draft.pendingCreate=null;
    propertyForm.dataset.hostOperation=definite ? "failed" : "unknown";
    setFormError(propertyForm, definite ? error.message : tr("addressSaveUnknown"));
    if(!definite)hostHouseReview(operation);
    if(error.status===400 && error.message==="confirm the house again")newPropertyAddress.invalidateConfirmation();
    message(definite ? error.message : tr("addressSaveUnknown"), "error");
  } finally {
    releaseHostSave(operation);
    if(currentHostSave(operation))setBusy(propertyForm, false);
  }
});

resetButton.addEventListener("click", async () => {
  if (resetButton.disabled) return;
  if (unsavedHostChanges && !confirm(tr("discardChanges"))) return;
  resetButton.disabled = true;
  try {
    await api("/auth/logout", {method:"POST"});
  } catch (error) {
    if (error.status !== 401) {
      message(error.message, "error");
      resetButton.disabled = false;
      return;
    }
  }
  state = emptyState();
  if(accountId){try{hostCore.storage.session.removeItem(returnKey(accountId));}catch{}}
  try{hostCore.storage.session.removeItem(profileReturnKey);}catch{}
  accountId=null;
    newPropertyAddress.reset();
    unsavedHostChanges=false;
  expandedPropertyIds.clear();
  renderAuthState();
  renderProperties();
  message(tr("loggedOut"), "success");
  resetButton.disabled = false;
});

function eurosToCents(value){
  const raw=String(value??"").trim().replace(",",".");
  if(!raw) return null;
  const amount=Number(raw);
  return Number.isFinite(amount) ? Math.round(amount*100) : null;
}
function centsToEuros(value){
  if(value==null) return "";
  return (Number(value)/100).toFixed(2).replace(/\.00$/,"");
}

function housingAckError(){
  return Object.assign(new Error("Invalid housing acknowledgement"), {kind:"protocol"});
}

function propertyAck(value, id){
  const integer=(field,min,max)=>Number.isInteger(value?.[field]) && value[field]>=min && value[field]<=max;
  const optionalText=v=>v===null || typeof v==="string";
  const address=a=>a===null || a && a.type==="full" && a.country
    && typeof a.country.code==="string" && typeof a.country.name==="string"
    && ["locality","street","houseNumber"].every(key=>typeof a[key]==="string")
    && optionalText(a.localityNative);
  if (!value || value.id!==id || !["title","country","countryCode","createdAt"].every(key=>typeof value[key]==="string")
    || !optionalText(value.city) || !optionalText(value.cityNative)
    || !["entire_place","private_room"].includes(value.accommodationType)
    || !integer("bedrooms",1,20) || !integer("sleeps",1,40) || !integer("minStayDays",1,365)
    || !(value.cleaningFeeCents===null || Number.isSafeInteger(value.cleaningFeeCents) && value.cleaningFeeCents>=0 && value.cleaningFeeCents<=10000000)
    || !Object.hasOwn(value,"address") || !address(value.address)
    || !Number.isFinite(Date.parse(value.createdAt))) throw housingAckError();
  return value;
}

// S4 editor metadata lives on hostDrafts: no second map owns form values.
// The confirmation ledger owns only server facts, scoped to this session.
let hostConfirmationRevision = 0;
let hostSelectionGeneration = 0;
const hostConfirmations = new Map();
const hostDeletedProperties = new Set();

function hostConfirmation(property){
  if (!hostConfirmations.has(property.id)) hostConfirmations.set(property.id, {periods:new Map(), conditions:null});
  return hostConfirmations.get(property.id);
}
function hostConfirmedRows(property, rows, baseline){
  const merged = new Map(rows.map(row => [row.id, row]));
  for (const [id, fact] of hostConfirmation(property).periods) if (fact.revision > baseline) {
    if (fact.value === null) merged.delete(id);
    else merged.set(id, {...fact.value});
  }
  // List reads cannot silently discard an unresolved or locally edited owner.
  // Explicit confirmed absence, Cancel verification and DELETE can retire it.
  for (const previous of property.availability || []) {
    const draft=hostDrafts.get(hostPeriodKey(property,previous.id));
    const fact=hostConfirmation(property).periods.get(previous.id);
    if (!merged.has(previous.id) && !(fact?.revision>baseline && fact.value===null) && draft?.editor
      && (draft.operation || draft.editor.phase==="saving" || draft.editor.verifyOnly || hostEditorDirty(draft)))
      merged.set(previous.id,previous);
  }
  return [...merged.values()];
}
function hostConfirmPeriod(property, id, value){
  hostConfirmation(property).periods.set(id, {revision:++hostConfirmationRevision, value:value && {...value}});
}
function hostConfirmConditions(property, value){
  hostConfirmation(property).conditions = {revision:++hostConfirmationRevision,
    value:{minStayDays:value.minStayDays, cleaningFeeCents:value.cleaningFeeCents}};
}
function hostRetireDraft(key){
  const draft=hostDrafts.get(key);
  if (draft?.editor) draft.editor.generation++;
  hostDrafts.delete(key);
}
function hostPeriodKey(property, id){ return `${accountId}:property:${property.id}:availability:${id}`; }
function hostEditor(form, kind, id){
  const draft=hostDraft(form);
  draft.editor ||= {kind, id, phase:"idle", verifyOnly:false, error:"", generation:0, submitted:null};
  return draft.editor;
}
function hostEditorOwner(property, form){
  const draft=captureHostDraft(form), editor=draft.editor;
  return {property, form, draft, editor, generation:++editor.generation,
    selection:hostSelectionGeneration, key:`${accountId}:${form.dataset.hostDraftKey}`, epoch:hostCore.session.epoch, account:accountId};
}
function currentHostEditor(owner){
  return owner.epoch===hostCore.session.epoch && owner.account===accountId
    && state.properties.includes(owner.property) && hostDrafts.get(owner.key)===owner.draft
    && owner.editor.generation===owner.generation;
}
function hostEditorValues(kind, value){
  return kind==="period" ? {from:value.from, to:plusDays(value.to,-1), nightlyPrice:centsToEuros(value.nightlyPriceCents)}
    : {minStayDays:String(value.minStayDays), cleaningFee:centsToEuros(value.cleaningFeeCents)};
}
function hostEditorMoney(value, minimum){
  const text=String(value ?? "").trim();
  if (!text) return null;
  const cents=eurosToCents(text);
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text) || !Number.isSafeInteger(cents) || cents<minimum || cents>10000000)
    throw Object.assign(new Error(tr("periodDraftKept")), {kind:"validation", status:400});
  return cents;
}
function hostIsoDate(value){
  return typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value+"T00:00:00Z")) && new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
function hostEditorPayload(kind, values){
  if (kind==="conditions") {
    const minStayDays=Number(values.minStayDays);
    if (!/^\d+$/.test(String(values.minStayDays)) || !Number.isInteger(minStayDays) || minStayDays<1 || minStayDays>365)
      throw Object.assign(new Error(tr("conditionsMismatch")), {kind:"validation", status:400});
    return {minStayDays, cleaningFeeCents:hostEditorMoney(values.cleaningFee,0)};
  }
  if (!hostIsoDate(values.from) || !hostIsoDate(values.to) || values.to<values.from || values.to>="9999-12-31")
    throw Object.assign(new Error(tr("blockDateError")), {kind:"validation", status:400});
  // Form nights are inclusive. This is the single write boundary conversion.
  return {...hostPeriodDates({get:name=>values[name]}), nightlyPriceCents:hostEditorMoney(values.nightlyPrice,1)};
}
function sameHostEditorValue(kind, a, b){
  const fields=kind==="period" ? ["from","to","nightlyPriceCents"] : ["minStayDays","cleaningFeeCents"];
  return fields.every(name=>a[name]===b[name]);
}
function hostEditorDirty(draft){
  try {return !sameHostEditorValue(draft.editor.kind, hostEditorPayload(draft.editor.kind,draft.values),
    hostEditorPayload(draft.editor.kind,draft.server));} catch {return true;}
}
function hostReadPeriods(rows, propertyId, priced=true){
  if (!Array.isArray(rows)) throw housingAckError();
  const ids=new Set();
  return rows.map(row=>{
    if(!row || typeof row.id!=="string" || !row.id || ids.has(row.id)
      || row.propertyId!==propertyId || !hostIsoDate(row.period?.from) || !hostIsoDate(row.period?.to)
      || row.period.to<=row.period.from || typeof row.createdAt!=="string" || !Number.isFinite(Date.parse(row.createdAt))
      || priced && !(row.nightlyPriceCents===null || Number.isSafeInteger(row.nightlyPriceCents)
        && row.nightlyPriceCents>=1 && row.nightlyPriceCents<=10000000))throw housingAckError();
    ids.add(row.id);
    return {...row,from:row.period.from,to:row.period.to};
  });
}
function hostEditorSnapshot(owner){
  return {form:owner.form, draft:owner.draft, property:owner.property, epoch:owner.epoch, account:owner.account,
    values:{...owner.draft.values}, versions:{...owner.draft.versions}, addressVersion:owner.draft.addressVersion || 0,
    addressValues:hostAddressSnapshot(owner.form)};
}
function hostEditorRefresh(owner){
  if (!currentHostEditor(owner)) return;
  owner.form.hostRefresh?.(); hostDirtyState();
}
function focusHostEditorResult(owner){
  const activeForm=document.activeElement?.closest?.("form");
  if (!currentHostEditor(owner) || owner.editor.kind!=="period" || owner.selection!==hostSelectionGeneration
    || !expandedPropertyIds.has(owner.property.id) || activeForm && activeForm!==owner.form) return;
  const control=["idle","saved"].includes(owner.editor.phase) ? ".host-period-edit"
    : owner.editor.phase==="error" ? ".host-period-save" : null;
  if(control)owner.form.querySelector(control)?.focus({preventScroll:true});
}
function hostEditorFailure(owner, error, ambiguous){
  if (!currentHostEditor(owner)) return;
  owner.editor.phase="error";
  owner.editor.verifyOnly=ambiguous;
  owner.editor.error=error.message;
  owner.form.dataset.hostOperation=ambiguous ? "unknown" : "failed";
  hostEditorRefresh(owner);
  message(error.message,"error");
  focusHostEditorResult(owner);
}

async function verifyHostEditor(owner, cancel=false){
  if (!currentHostEditor(owner)) return;
  const {property, editor, draft, form}=owner;
  // Cancel snapshots the CURRENT generation, never the original submitted generation.
  const snapshot=cancel ? hostEditorSnapshot(owner) : editor.submitted;
  const baseline=hostConfirmationRevision;
  editor.phase="saving"; editor.verifyOnly=true; editor.error="";
  hostEditorRefresh(owner);
  try {
    let saved;
    if (editor.kind==="period") {
      const rows=hostReadPeriods(await api(`/properties/${property.id}/availability`),property.id);
      if (!currentHostEditor(owner)) return;
      saved=rows.find(value=>value.id===editor.id);
      if (!saved && !cancel) throw new Error(tr("periodUnconfirmed"));
      if (saved && !cancel && !sameHostEditorValue("period",saved,editor.wanted)) throw new Error(tr("periodUnconfirmed"));
      hostConfirmPeriod(property,editor.id,saved || null);
      property.availability=hostMergeRows(property.availability,hostConfirmedRows(property,rows,baseline));
      if (!saved) {
        hostRetireDraft(owner.key);
        saveState(); renderProperties(); hostDirtyState();
        return;
      }
    } else {
      // Conditions merge only their own fields; a peer period write cannot roll them back.
      saved=await readCurrentProperty(property,{checkVersion:false});
      if (!currentHostEditor(owner)) return;
      if (!cancel && !sameHostEditorValue("conditions",saved,editor.wanted)) throw new Error(tr("conditionsMismatch"));
      hostConfirmConditions(property,saved);
      // A property-wide ACK/read must not replace a peer period or detail draft.
      property.minStayDays=saved.minStayDays; property.cleaningFeeCents=saved.cleaningFeeCents;
    }
    finishHostSave(snapshot,hostEditorValues(editor.kind,saved));
    editor.verifyOnly=false; editor.error="";
    editor.phase=hostEditorDirty(draft) ? "editing" : cancel ? "idle" : "saved";
    editor.submitted=null; editor.wanted=null;
    form.dataset.hostOperation=cancel ? "idle" : "saved";
    saveState(); renderProperties(); hostEditorRefresh(owner);
    focusHostEditorResult(owner);
    if (!cancel) message(tr(editor.kind==="period" ? "periodSaved" : "conditionsSaved"),"success");
  } catch (error) {
    // Resource-version invalidation is a failed read, not loss of this editor owner.
    // The owner/epoch/retirement guard decides whether there is still UI to update.
    hostEditorFailure(owner,error,true);
  }
}

async function saveHostEditor(property, form){
  const draft=captureHostDraft(form), editor=draft.editor;
  if (!editor || editor.phase==="saving") return;
  if (editor.verifyOnly) return verifyHostEditor(hostEditorOwner(property,form));
  if (!hostEditorDirty(draft)) {form.hostRefresh?.(); return;}
  let wanted, payload;
  try {
    wanted=hostEditorPayload(editor.kind,draft.values);
    payload={...wanted};
    if (editor.kind==="conditions") {
      const baseline=hostEditorPayload(editor.kind,draft.server);
      for (const name of Object.keys(payload)) if (payload[name]===baseline[name]) delete payload[name];
    }
  } catch (error) {return hostEditorFailure(hostEditorOwner(property,form),error,false);}
  const operation=beginHostSave(form,property);
  // A busy peer did not attempt a write. Keep the draft and known commit state.
  if (!operation) {setFormError(form,tr("loading")); return;}
  const owner=hostEditorOwner(property,form);
  editor.submitted=operation; editor.wanted=wanted;
  editor.phase="saving"; editor.error=""; form.dataset.hostOperation="saving";
  hostEditorRefresh(owner);
  let acknowledged=false;
  try {
    await api(editor.kind==="period" ? `/availability/${editor.id}` : `/properties/${property.id}`, {
      hostOperation:operation, method:editor.kind==="period" ? "PUT" : "PATCH",
      body:JSON.stringify(editor.kind==="period" ? {period:{from:payload.from,to:payload.to},nightlyPriceCents:payload.nightlyPriceCents} : payload)});
    if (!currentHostEditor(owner)) return;
    acknowledged=true;
  } catch (error) {
    const definite=error.kind==="busy" || error.kind==="validation"
      || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
    hostEditorFailure(owner,error,!definite);
  } finally {
    releaseHostSave(operation);
  }
  // The sole property mutation lease ends before any GET-only verification.
  if (acknowledged && currentHostEditor(owner)) await verifyHostEditor(owner);
}

async function cancelHostEditor(property, form){
  const draft=captureHostDraft(form), editor=draft.editor;
  if (editor.phase==="saving") return;
  const owner=hostEditorOwner(property,form);
  if (editor.verifyOnly) return verifyHostEditor(owner,true);
  finishHostSave(hostEditorSnapshot(owner),{...draft.server});
  editor.phase="idle"; editor.error=""; editor.submitted=null; editor.wanted=null;
  form.dataset.hostOperation="idle"; hostEditorRefresh(owner);
  focusHostEditorResult(owner);
}

function setHostText(node, text){
  if (node.textContent!==text) node.textContent=text;
}

function attachHostEditor(property, form, kind, id){
  const editor=hostEditor(form,kind,id);
  const heading=form.querySelector("h4") || document.createElement("h4");
  if (!heading.parentElement) {heading.className="host-condition-heading"; form.insertBefore(heading,form.children[0] || null);}
  const summary=document.createElement("p");
  summary.className="host-inline-muted host-period-summary"; summary.dataset.hostKey="editor-summary";
  const status=document.createElement("p");
  status.className="host-editor-status"; status.dataset.hostKey="editor-status"; status.setAttribute("role","status");
  const actions=form.querySelector(".host-period-actions") || document.createElement("div");
  actions.className="host-period-actions";
  const save=form.querySelector("button[type=submit]") || form.querySelector("button");
  save.className="button button-small host-period-save";
  const spinner=document.createElement("span"); spinner.className="host-period-spinner"; spinner.setAttribute("aria-hidden","true");
  const saveText=document.createElement("span"); saveText.dataset.hostKey="save-label";
  save.textContent=""; save.append(spinner,saveText);
  const edit=document.createElement("button"); edit.type="button"; edit.className="button button-small host-period-edit";
  const cancel=document.createElement("button"); cancel.type="button"; cancel.className="button button-small host-period-cancel";
  edit.addEventListener("click",()=>{editor.phase="editing"; editor.error=""; form.hostRefresh(); form.querySelector("input")?.focus();});
  cancel.addEventListener("click",()=>cancelHostEditor(property,form));
  actions.append(edit,save,cancel);
  form.append(summary,status,actions);
  const error=document.createElement("p"); error.className="host-inline-error host-form-error"; error.setAttribute("role","alert"); error.hidden=true; form.append(error);
  form.hostRefresh=()=>{
    const draft=captureHostDraft(form), dirty=hostEditorDirty(draft), busy=editor.phase==="saving";
    if (editor.phase==="saved" && dirty) editor.phase="editing";
    const expanded=kind==="conditions" || !["idle","saved"].includes(editor.phase);
    form.dataset.state=editor.phase; form.setAttribute("aria-busy",String(busy));
    setHostText(heading,tr(kind==="conditions" ? "conditionsGroup" : expanded ? "periodEditing" : "savedPeriod")
      + (dirty || editor.verifyOnly ? ` · ${tr("unsavedLabel")}` : ""));
    for (const label of form.querySelectorAll("label")) label.hidden=!expanded;
    for (const input of form.querySelectorAll("input")) input.readOnly=busy || editor.verifyOnly;
    for (const button of form.querySelectorAll("button")) button.disabled=busy;
    edit.hidden=kind==="conditions" || expanded;
    setHostText(edit,tr("periodEdit"));
    save.hidden=kind==="period" && !expanded;
    save.disabled=busy || !editor.verifyOnly && !dirty;
    spinner.hidden=!busy;
    setHostText(saveText,tr(busy ? "periodSavingAction" : editor.verifyOnly ? "periodCheck" : editor.phase==="error" ? "periodRetry" : kind==="conditions" ? "saveStaySettings" : "periodSave"));
    cancel.hidden=!expanded || kind==="conditions" && !dirty && !editor.verifyOnly && !busy;
    setHostText(cancel,tr("periodCancel"));
    status.textContent=tr(busy ? "periodSaving" : editor.phase==="saved" ? "periodSaved" : editor.verifyOnly ? (kind==="conditions" ? "conditionsUnknown" : "periodUnknown") : editor.phase==="error" ? "periodDraftKept" : kind==="conditions" ? "conditionsHelp" : "");
    status.hidden=!status.textContent;
    const server=draft.server;
    const nights=(Date.parse(server.to)-Date.parse(server.from))/86400000+1;
    summary.textContent=kind==="period" ? `${server.from} – ${server.to} · ${tr("nightCount",nights)} · ${server.nightlyPrice ? `€${server.nightlyPrice}` : tr("priceOptional")}` : "";
    summary.hidden=kind==="conditions";
    setFormError(form,editor.error);
    hostDirtyState();
  };
  const changed=()=>{
    captureHostDraft(form);
    if (editor.phase!=="saving" && !editor.verifyOnly) {editor.phase="editing"; editor.error="";}
    form.hostRefresh();
  };
  form.addEventListener("input",changed); form.addEventListener("change",changed);
  form.addEventListener("submit",event=>{event.preventDefault(); return saveHostEditor(property,form);});
  // Reconciliation calls hostRefresh on the live form, never this throwaway template.
}
function renderHostPeriod(property, period){
  const row=document.createElement("form"); row.className="host-period host-period-editor";
  row.dataset.hostKey=`availability:${period.id}`; row.dataset.hostDraftKey=`property:${property.id}:availability:${period.id}`;
  periodHeading(row,"savedPeriod");
  const from=document.createElement("input"); from.type="date"; from.name="from"; from.required=true; from.value=period.from;
  const to=document.createElement("input"); to.type="date"; to.name="to"; to.required=true; to.value=plusDays(period.to,-1); to.min=period.from;
  from.addEventListener("change",()=>{to.min=from.value; if(!to.value || to.value<from.value)to.value=from.value;to.refreshDateHint();});
  const price=document.createElement("input"); price.type="number"; price.name="nightlyPrice"; price.min="0.01"; price.step="0.01"; price.value=centsToEuros(period.nightlyPriceCents);
  const save=document.createElement("button"); save.type="submit";
  const remove=document.createElement("button"); remove.type="button"; remove.className="text-button danger"; remove.textContent=tr("remove");
  remove.addEventListener("click",()=>{const current=property.availability.find(value=>value.id===period.id); if(current)deleteAvailability(property,current);});
  const actions=document.createElement("div"); actions.className="host-period-actions"; actions.append(save,remove);
  row.append(hostDateLabel(from,"firstNight"),hostDateLabel(to,"lastNight"),hostPriceLabel(price),actions);
  attachHostEditor(property,row,"period",period.id);
  return row;
}

function hostDisclosure(property, key, title, content){
  const details=document.createElement("details"); details.className="host-workspace-disclosure"; details.dataset.hostKey=`disclosure:${key}`;
  details.id=`host-${key}-${property.id}`;
  const summary=document.createElement("summary"); summary.textContent=tr(title);
  details.append(summary,content); return details;
}
function renderHostSelector(selected){
  const root=document.getElementById("host-property-selector");
  if (!root) return;
  root.hidden=!state.authenticated || !state.properties.length;
  if (root.hidden) {root.replaceChildren(); return;}
  const next=document.createElement("aside"); next.id=root.id; next.className=root.className;
  const label=document.createElement("label"), caption=document.createElement("span"), select=document.createElement("select");
  caption.textContent=tr("selectProperty"); select.id="host-property-select";
  for (const property of state.properties) {
    const option=document.createElement("option"); option.value=property.id; option.textContent=property.title; select.append(option);
  }
  select.value=selected;
  const choose=id=>{
    hostSelectionGeneration++;
    expandedPropertyIds.clear(); expandedPropertyIds.add(id); renderProperties();
    hostViews.get(id)?.node.querySelector(".host-property-heading")?.focus({preventScroll:true});
  };
  select.addEventListener("change",()=>choose(select.value)); label.append(caption,select);
  const notices=document.createElement("div"); notices.className="host-property-calendar-notices";
  for (const property of state.properties) {
    const failed=property.calendarSyncProblems?.length || property.calendars?.some(calendar=>calendar.lastError || ["error","failed"].includes(String(calendar.status).toLowerCase()));
    const unknown=property.calendarReadError;
    if (!failed && !unknown) continue;
    const item=document.createElement("div"); item.className="host-property-calendar-notice";
    item.dataset.hostKey=`notice:${property.id}`;
    const title=document.createElement("strong"); title.textContent=property.title;
    const text=document.createElement("p"); text.className=unknown ? "host-property-calendar-unknown" : "host-property-sync-problem";
    text.textContent=tr(unknown ? "calendarUnknownTitle" : "calendarProblemTitle");
    const button=document.createElement("button"); button.type="button"; button.className="text-button host-property-open";
    button.textContent=tr("viewCalendarStatus"); button.addEventListener("click",()=>{choose(property.id); const details=document.getElementById(`host-calendar-${property.id}`);if(details)details.open=true;});
    item.append(title,text,button); notices.append(item);
  }
  const actions=document.createElement("nav"); actions.className="host-property-selector-actions"; actions.setAttribute("aria-label",tr("workspaceActions"));
  for (const [target,key] of [["/my-profile.html","manageProfile"],["host-add-property","addProperty"]]) {
    const link=document.createElement("a"); link.className="text-button"; link.href=target.startsWith("/")?target:`#${target}`; link.textContent=tr(key);
    link.addEventListener("click",()=>{const node=document.getElementById(target);if(node?.tagName==="DETAILS")node.open=true;}); actions.append(link);
  }
  next.append(label,notices,actions);
  patchHostView(root,next);
  root.querySelector("select").value=selected || "";
}

async function readCurrentProperty(property,{checkVersion=true}={}){
  const epoch=hostCore.session.epoch,locale=lang,version=hostResourceVersions.get(property) || 0;
  const dashboard=await api("/dashboard");
  if(epoch!==hostCore.session.epoch || locale!==lang || !state.properties.includes(property)
    || checkVersion && version!==(hostResourceVersions.get(property) || 0))throw housingAckError();
  const matches=dashboard.properties.filter(value=>value.id===property.id);
  if(matches.length!==1)throw housingAckError();
  return propertyAck(matches[0],property.id);
}

async function verifyPropertySettings(operation){
  if(!currentHostSave(operation) || operation.draft.operation===operation)return;
  const {form,property,draft}=operation;
  if(operation.checking)return;
  operation.checking=true;
  setBusy(form,true);
  try{
    const updated=await readCurrentProperty(property);
    if(!currentHostSave(operation) || draft.pendingSave!==operation)return;
    if(operation.addressCommand && !operation.receivedAck){
      property.address=updated.address;
      propertyAddressEditors.get(form)?.setSaved(updated.address);
      form.dataset.hostOperation="unknown";
      setFormError(form,tr("addressSaveUnknown"));
      hostHouseReview(operation);message(tr("addressCurrentState"));return;
    }
    // A GET establishes current submitted values, never historical command attribution.
    for(const [field,value] of Object.entries(operation.payload))
      if(field!=="address" && updated[field]!==value)throw housingAckError();
    if(operation.addressCommand){
      if(!updated.address || updated.address.type!=="full")throw housingAckError();
      property.address=updated.address;
    }
    const acknowledged={};
    for(const name of Object.keys(operation.values)){
      const field=operation.fields[name];
      if(field && Object.hasOwn(operation.payload,field)){
        acknowledged[name]=name==="cleaningFee" ? centsToEuros(updated[field]) : String(updated[field]);
        property[field]=updated[field];
      }
    }
    finishHostSave(operation,acknowledged);
    if(operation.addressCommand){
      const view=propertyAddressEditors.get(form);
      view?.setSaved(updated.address);
      if(!draft.addressDirty)view?.acceptSaved(updated.address);
      draft.addressAcknowledgedValues=hostAddressSnapshot(form);
    }
    draft.pendingSave=null;
    form.querySelector(".host-house-review")?.remove();
    message(tr("propertySettingsSaved"),"success");renderProperties();
  }catch(error){
    if(currentHostSave(operation)){
      form.dataset.hostOperation="unknown";setFormError(form,error.message);
      if(operation.addressCommand)hostHouseReview(operation);
      message(tr("conditionsUnknown"),"error");
    }
  }finally{operation.checking=false;if(currentHostSave(operation))setBusy(form,false);}
}

async function updatePropertySettings(property, form){
  const draft=hostDraft(form);
  if(draft.pendingSave)return verifyPropertySettings(draft.pendingSave);
  const operation=beginHostSave(form,property);
  if(!operation)return;
  const fields={title:"title",accommodationType:"accommodationType",bedrooms:"bedrooms",sleeps:"sleeps",
    minStayDays:"minStayDays",cleaningFee:"cleaningFeeCents"},payload={};
  for(const name of operation.dirty){
    const field=fields[name];if(!field)continue;
    const value=operation.values[name];
    payload[field]=name==="cleaningFee" ? eurosToCents(value)
      : ["bedrooms","sleeps","minStayDays"].includes(name) ? Number(value) : String(value??"");
  }
  setFormError(form);
  let acknowledged=false;
  try{
    let address;
    try{
      address=operation.addressDirty || draft.addressAcknowledgedValues!==operation.addressValues
        ? propertyAddressEditors.get(form)?.getValue() : undefined;
    }catch(error){throw Object.assign(error,{kind:"validation",status:400});}
    if(address!==undefined){payload.address=address;operation.addressCommand=true;}
    operation.payload=payload;operation.fields=fields;draft.pendingSave=operation;
    setBusy(form,true);
    await api(`/properties/${property.id}`,{hostOperation:operation,method:"PATCH",body:JSON.stringify(payload)});
    operation.receivedAck=true;
    acknowledged=true;
  }catch(error){
    if(currentHostSave(operation) && error.kind!=="stale"){
      const definite=error.kind==="validation" || error.kind==="busy"
        || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
      if(definite)draft.pendingSave=null;
      form.dataset.hostOperation=definite ? "failed" : "unknown";
      setFormError(form,error.message);message(error.message,"error");
      if(operation.addressCommand && !definite)hostHouseReview(operation);
      if(error.status===400 && error.message==="confirm the house again")propertyAddressEditors.get(form)?.invalidateConfirmation();
    }
  }finally{releaseHostSave(operation);if(currentHostSave(operation))setBusy(form,false);}
  if(acknowledged && currentHostSave(operation))await verifyPropertySettings(operation);
}

function plusDays(iso, days){
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// The owner selects nights inclusively; state and API keep [from, to).
// Convert only at the form boundary so existing periods never gain a night.
function hostPeriodDates(data){
  return {from:data.get("from"), to:plusDays(data.get("to"), 1)};
}

function hostDateLabel(input, key){
  const label = document.createElement("label");
  label.className = "host-date-label";
  const caption = document.createElement("span");
  caption.textContent = tr(key);
  const control = document.createElement("span");
  control.className = "host-date-control";
  const hint = document.createElement("span");
  hint.className = "host-date-hint";
  hint.textContent = tr("chooseDate");
  hint.setAttribute("aria-hidden", "true");
  input.refreshDateHint = () => {
    hint.hidden = Boolean(input.value);
    input.dataset.empty = String(!input.value);
  };
  input.addEventListener("input", input.refreshDateHint);
  input.addEventListener("change", input.refreshDateHint);
  input.refreshDateHint();
  control.append(input, hint);
  label.append(caption, control);
  return label;
}

function hostPriceLabel(input){
  const label = document.createElement("label");
  label.className = "host-date-label host-price-label";
  const caption = document.createElement("span");
  caption.textContent = tr("priceLabel");
  input.placeholder = tr("priceOptional");
  input.inputMode = "decimal";
  label.append(caption, input);
  return label;
}

function periodHeading(form, key){
  const heading = document.createElement("h4");
  heading.className = "host-period-heading";
  heading.textContent = tr(key);
  form.append(heading);
}

async function verifyManualPeriodWrite(property,form){
  const draft=hostDraft(form),pending=draft.pendingPeriodWrite;
  if(!pending || pending.checking || pending.operation.draft.operation===pending.operation || !currentHostSave(pending.operation))return;
  pending.checking=true;setBusy(form,true);setFormError(form);
  try{
    const rows=hostReadPeriods(await api(`/properties/${property.id}/${pending.priced ? "availability" : "unavailability"}`),property.id,pending.priced);
    if(!currentHostSave(pending.operation) || draft.pendingPeriodWrite!==pending)return;
    // Without a returned creation ID, a matching date/text row is not command attribution.
    if(!pending.id)throw new Error(tr("periodUnconfirmed"));
    const saved=rows.find(row=>row.id===pending.id);
    if(!saved || saved.from!==pending.wanted.from || saved.to!==pending.wanted.to)throw new Error(tr("periodUnconfirmed"));
    const previous=property.unavailability.find(row=>row.id===pending.id);
    if(!previous)throw housingAckError();
    Object.assign(previous,saved);
    finishHostSave(pending.operation,{from:saved.from,to:plusDays(saved.to,-1)});
    delete draft.pendingPeriodWrite;renderProperties();message(tr("blockSaved"),"success");
  }catch(error){
    if(currentHostSave(pending.operation)){
      form.dataset.hostOperation="unknown";setFormError(form,error.message);message(error.message,"error");
    }
  }finally{pending.checking=false;if(currentHostSave(pending.operation))setBusy(form,false);}
}

async function addAvailability(property, form){
  if(hostDraft(form).pendingPeriodWrite)return verifyManualPeriodWrite(property,form);
  if (form.getAttribute("aria-busy") === "true") return;
  const operation = beginHostSave(form, property);
  if (!operation) return;
  const data = new FormData(form);
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("addingAvailability"));

  try {
    const wanted={period:hostPeriodDates(data),nightlyPriceCents:eurosToCents(data.get("nightlyPrice"))};
    operation.draft.pendingPeriodWrite={operation,priced:true,id:null,wanted:wanted.period};
    const created=await api(`/properties/${property.id}/availability`, {
      hostOperation:operation,
      method:"POST",
      body:JSON.stringify(wanted)
    });
    if (!currentHostSave(operation)) return;
    const [saved]=hostReadPeriods([created],property.id);
    if(saved.from!==wanted.period.from || saved.to!==wanted.period.to || saved.nightlyPriceCents!==wanted.nightlyPriceCents)
      throw housingAckError();
    delete operation.draft.pendingPeriodWrite;
    finishHostSave(operation, {from:"", to:"", nightlyPrice:""});
    message(tr("availabilityAdded"), "success");
    releaseHostSave(operation);
    if (!await refreshAvailability(property, true) && currentHostSave(operation)) form.dataset.hostOperation="saved_refresh_failed";
  } catch (error) {
    if (!currentHostSave(operation) || error.kind === "stale") return;
    const definite=error.kind==="validation" || error.kind==="busy"
      || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
    if(definite)delete operation.draft.pendingPeriodWrite;
    form.dataset.hostOperation=definite ? "failed" : "unknown";
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
    releaseHostSave(operation);
    form.removeAttribute("aria-busy");
    setBusy(form, false);
  }
}

async function refreshAvailability(property, rerender = false){
  const epoch = hostCore.session.epoch, confirmationBaseline=hostConfirmationRevision;
  const version=(hostAvailabilityLoads.get(property) || 0)+1;
  hostAvailabilityLoads.set(property,version);
  try {
    const periods = hostReadPeriods(await api(`/properties/${property.id}/availability`),property.id);
    if (epoch !== hostCore.session.epoch || !state.properties.includes(property) || hostAvailabilityLoads.get(property)!==version) return;
    property.availability = hostMergeRows(property.availability, hostConfirmedRows(property,periods,confirmationBaseline));
    property.availabilityError = "";
    if (rerender) renderProperties();
    return true;
  } catch (error) {
    if (error.kind === "stale" || epoch !== hostCore.session.epoch || !state.properties.includes(property)
      || hostAvailabilityLoads.get(property)!==version) return;
    property.availabilityError = error.message;
    if (rerender) renderProperties();
    return false;
  }
}

async function updateAvailability(property, period, form){
  // Compatibility for existing callers; the keyed draft is the sole editor owner.
  hostEditor(form,"period",period.id);
  return saveHostEditor(property,form);
}

async function deleteAvailability(property, period){
  if (!confirm(tr("deleteConfirm", period.from, plusDays(period.to, -1)))) return;
  message(tr("deletingAvailability"));
  try {
    await api(`/availability/${period.id}`, {method:"DELETE"});
    if (!state.properties.includes(property)) return;
    hostConfirmPeriod(property,period.id,null);
    hostRetireDraft(hostPeriodKey(property,period.id));
    property.availability=property.availability.filter(value=>value.id!==period.id);
    message(tr("availabilityDeleted"), "success");
    renderProperties();
  } catch (error) {
    if(error.kind === "stale") return;
    message(error.message, "error");
  }
}

async function deleteProperty(property){
  if (!confirm(tr("deletePropertyConfirm", property.title))) return;
  message(tr("deletingAvailability"));
  try {
    await api(`/properties/${property.id}`, {method:"DELETE"});
    // Retirement happens only after a successful DELETE, before any late completion.
    hostDeletedProperties.add(property.id); ++hostConfirmationRevision;
    disposeHostProperty(property.id);
    state.properties = state.properties.filter(item => item.id !== property.id);
    expandedPropertyIds.delete(property.id);
    saveState();
    message(tr("propertyDeleted"), "success");
    renderProperties();
  } catch (error) {
    if(error.kind === "stale") return;
    message(error.message, "error");
  }
}

const listingVisibilityChecks=new WeakMap();
async function updateListingVisibility(property, checkbox){
  if(!property.listing?.id || checkbox.disabled)return;
  let operation=listingVisibilityChecks.get(property);
  if(operation && (operation.epoch!==hostCore.session.epoch || operation.id!==property.listing.id)){
    listingVisibilityChecks.delete(property);operation=null;
  }
  const checking=!!operation;
  let commandAcknowledged=checking;
  operation ||= {id:property.listing.id,wanted:checkbox.checked,epoch:hostCore.session.epoch};
  const current=()=>operation.epoch===hostCore.session.epoch && state.properties.includes(property)
    && property.listing?.id===operation.id;
  checkbox.disabled=true;
  try{
    if(!checking){
      listingVisibilityChecks.set(property,operation);
      await api(`/listings/${operation.id}`,{method:"PUT",body:JSON.stringify({showInSearch:operation.wanted})});
      commandAcknowledged=true;
    }
    if(!current())return;
    const saved=await readCurrentProperty(property);
    if(!current())return;
    const matches=saved.listings.filter(value=>value.id===operation.id);
    if(matches.length!==1 || typeof matches[0].showInSearch!=="boolean"
      || matches[0].showInSearch!==operation.wanted)throw housingAckError();
    property.listing.showInSearch=matches[0].showInSearch;
    checkbox.checked=property.listing.showInSearch;
    listingVisibilityChecks.delete(property);message(tr("listingVisibilitySaved"),"success");
  }catch(error){
    if(!current())return;
    const definite=error.kind==="busy" || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
    if(!commandAcknowledged && definite){listingVisibilityChecks.delete(property);checkbox.checked=property.listing.showInSearch!==false;}
    // Unknown outcomes retain requested state; another explicit action only checks with GET.
    else checkbox.checked=operation.wanted;
    message(definite && !commandAcknowledged ? error.message : tr("conditionsUnknown"),"error");
  }finally{if(current())checkbox.disabled=false;}
}

async function deleteListing(property){
  if (!property.listing?.id || !confirm(tr("deleteListingConfirm"))) return;
  message(tr("savingListing"));
  try {
    await api(`/listings/${property.listing.id}`, {method:"DELETE"});
    property.listing = null;
    property.calendars = [];
    saveState();
    message(tr("listingDeleted"), "success");
    renderProperties();
  } catch (error) {
    if(error.kind === "stale") return;
    message(error.message, "error");
  }
}

// S5 owns command metadata, never a second copy of mutable form values.
function calendarSourceStamp(property){
  return JSON.stringify((property.calendars || []).map(value=>[value.id,value.revision,value.mode]));
}
function sourceFormCurrent(property,form){
  return state.authenticated && form.isConnected!==false && form.dataset.calendarOwner===accountId
    && state.properties.includes(property) && !property.calendarReadError && !hostCalendarViews.read(property);
}
function sourcePreviewValid(value){
  return value && Object.keys(value).length===2 && typeof value.listingId==="string"
    && /^[0-9]{1,64}$/.test(value.listingId)
    && value.publicUrl===`https://www.airbnb.com/rooms/${value.listingId}`;
}
function sourcePreviewMatches(property,draft){
  const preview=draft.sourcePreview;
  return preview && preview.value===String(draft.values.icalUrl || "").trim()
    && preview.version===(draft.versions.icalUrl || 0) && preview.stamp===calendarSourceStamp(property);
}
async function previewCalendarSource(property,form){
  if(!sourceFormCurrent(property,form))return;
  const operation=beginHostSave(form,property);
  if(!operation)return;
  const draft=operation.draft,stamp=calendarSourceStamp(property);
  delete draft.sourcePreview;form.hostRefresh?.();setFormError(form);
  try{
    const value=String(operation.values.icalUrl || "").trim();
    if(!value)return;
    const preview=await api(`/properties/${property.id}/public-links`,{method:"POST",hostOperation:operation,
      body:JSON.stringify({provider:"Airbnb",icalUrl:value}),validate:sourcePreviewValid});
    if(!currentHostSave(operation) || draft!==hostDraft(form) || stamp!==calendarSourceStamp(property)
      || draft.versions.icalUrl!==operation.versions.icalUrl || draft.values.icalUrl!==operation.values.icalUrl)return;
    draft.sourcePreview={value,version:draft.versions.icalUrl || 0,stamp,...preview};
  }catch(error){
    if(currentHostSave(operation) && error.kind!=="stale")setFormError(form,tr("previewRequired"));
  }finally{releaseHostSave(operation);if(currentHostSave(operation))form.hostRefresh?.();}
}
function calendarErrorUnknown(error){
  return error?.kind!=="http" || ![400,401,403,404,409,412,413,415,422].includes(error.status)
    || typeof error.code!=="string" || !error.code;
}
async function reconcileCalendarView(view){
  const read=await syncDashboard({propertyId:view.property.id});
  if(!hostCalendarViews.isCurrent(view))return false;
  if(!read?.applied || read.epoch!==view.epoch || read.property!==view.property || read.read!=="confirmed")return false;
  // A confirmed empty GET resolves a delete, not an unconfirmed initial source save.
  if(view.command==="source" && !(view.property.calendars || []).some(calendar=>calendar.provider==="Airbnb"))return false;
  return true; // Current-state convergence, never attribution of a lost command.
}
async function connectCalendar(property,form){
  if(!sourceFormCurrent(property,form))return;
  const draft=captureHostDraft(form);
  if(!sourcePreviewMatches(property,draft)){setFormError(form,tr("previewRequired"));return;}
  const calendar=property.calendars?.find(value=>value.provider==="Airbnb");
  if(calendar)try{calendarRevision(calendar);}catch{return;}
  const view=hostCalendarViews.begin(property,calendar,"source");
  if(!view)return;
  renderProperties();
  const operation=beginHostSave(form,property);
  if(!operation){hostCalendarViews.close(view);renderProperties();return;}
  const value=String(operation.values.icalUrl || "").trim(),stamp=calendarSourceStamp(property);
  let sent=false;
  setFormError(form);form.hostRefresh?.();
  try{
    if(calendar){
      const verification=await api(`/calendars/${calendar.id}/verification`,{validate:value=>value &&
        typeof value.status==="string" && ["required","pending","verified","failed","rejected","cancelled","expired","blocked"].includes(value.status.toLowerCase())});
      if(!hostCalendarViews.isCurrent(view) || stamp!==calendarSourceStamp(property) || !sourcePreviewMatches(property,draft))return;
      if(verification.status.toLowerCase()==="pending"){
        if(!confirm(tr("cancelPendingSource")))return;
        sent=true;
        await api(`/calendars/${calendar.id}/verification/cancel`,{method:"POST",hostOperation:operation,
          validate:value=>value && String(value.status).toLowerCase()==="cancelled"});
      }
    }
    if(!hostCalendarViews.isCurrent(view) || stamp!==calendarSourceStamp(property) || !sourcePreviewMatches(property,draft))return;
    sent=true;
    await api(`/properties/${property.id}/public-links`,{method:"PUT",hostOperation:operation,
      body:JSON.stringify({provider:"Airbnb",icalUrl:value})});
    releaseHostSave(operation); // GET-only convergence does not own the mutation lock.
    if(!hostCalendarViews.isCurrent(view))return;
    hostCalendarViews.transportSettled(view);
    if(await reconcileCalendarView(view)){
      finishHostSave(operation,{icalUrl:""});delete draft.sourcePreview;hostCalendarViews.close(view);
    }else hostCalendarViews.markUnknown(view);
  }catch(error){
    if(!hostCalendarViews.isCurrent(view))return;
    if(sent && calendarErrorUnknown(error))hostCalendarViews.markUnknown(view);
    else{hostCalendarViews.close(view);setListingFormError(form,{...error,message:tr("command_rejected")});}
  }finally{
    releaseHostSave(operation);hostCalendarViews.transportSettled(view);
    if(hostCalendarViews.isCurrent(view) && !sent)hostCalendarViews.close(view);
    if(view.epoch===hostCore.session.epoch && state.properties.includes(property)){
      if(hostCalendarViews.isCurrent(view) && sent)hostCalendarViews.markUnknown(view);
      renderProperties();form.hostRefresh?.();
    }
  }
}
function calendarSourceForm(property,calendar){
  const fragment=document.createElement("div");fragment.className="host-source-control";
  const help=document.createElement("p");help.className="host-inline-muted";help.textContent=tr("sourceSingleInputHelp");
  const form=document.createElement("form");form.className="host-inline-form host-calendar-form host-source-form";
  form.dataset.hostKey="calendar-connect";form.dataset.hostDraftKey=`property:${property.id}:calendar-connect`;
  form.dataset.calendarOwner=accountId;
  const input=document.createElement("input");input.type="url";input.name="icalUrl";input.required=true;
  input.autocomplete="off";input.placeholder=tr("calendarUrl");input.setAttribute("aria-label",tr("calendarUrl"));
  const preview=document.createElement("button");preview.type="button";preview.className="button button-small";
  preview.dataset.hostKey="source-preview";preview.dataset.sourcePreviewButton="";
  const save=document.createElement("button");save.type="submit";save.className="button button-small";save.dataset.sourceSave="";
  const link=document.createElement("a");link.className="host-saved-link";link.dataset.sourcePreview="";
  link.target="_blank";link.rel="noopener noreferrer";link.hidden=true;
  form.append(input,preview,save,link);
  form.hostRefresh=()=>{
    const draft=captureHostDraft(form),valid=sourcePreviewMatches(property,draft);
    const unavailable=!sourceFormCurrent(property,form),busy=!!draft.operation || unavailable;
    input.disabled=busy;preview.disabled=busy || !String(draft.values.icalUrl || "").trim();save.disabled=busy || !valid;
    setHostText(preview,tr("previewSource"));setHostText(save,tr(property.calendars?.length ? "replaceSource" : "saveSource"));
    link.hidden=!valid;
    if(valid){link.href=draft.sourcePreview.publicUrl;link.textContent=draft.sourcePreview.publicUrl;}
    else{link.removeAttribute("href");link.textContent="";}
    form.setAttribute("aria-busy",String(!!draft.operation));
  };
  const invalidate=()=>{delete hostDraft(form).sourcePreview;setFormError(form);form.hostRefresh();};
  input.addEventListener("input",invalidate);input.addEventListener("change",invalidate);
  preview.addEventListener("click",()=>previewCalendarSource(property,form));
  form.addEventListener("submit",event=>{event.preventDefault();return connectCalendar(property,form);});
  fragment.append(help,form);return fragment;
}
function calendarLifecycleRequest(calendar,command){
  const expectedRevision=calendarRevision(calendar);
  if(command==="sync"){
    if(calendar.mode!=="Active")throw new TypeError("Sync requires Active mode");
    return {path:`/calendars/${calendar.id}/sync`,options:{method:"POST",body:JSON.stringify({expectedRevision})}};
  }
  if(command==="freeze" || command==="disable"){
    if(command==="freeze" && calendar.mode==="Disabled")throw new TypeError("Disabled to Frozen is illegal");
    return {path:`/calendars/${calendar.id}`,options:{method:"PUT",body:JSON.stringify({mode:command==="freeze" ? "Frozen" : "Disabled",expectedRevision})}};
  }
  if(command==="activate"){
    if(calendar.mode==="Active")throw new TypeError("Activate requires a resting mode");
    return {path:`/calendars/${calendar.id}/activate`,options:{method:"POST",body:JSON.stringify({expectedRevision})}};
  }
  if(command==="delete")return {path:`/calendars/${calendar.id}`,options:{method:"DELETE",body:JSON.stringify({expectedRevision})}};
  throw new TypeError("Unknown calendar command");
}
async function performCalendarLifecycle(calendar,command){
  let request;
  try{request=calendarLifecycleRequest(calendar,command);}catch(error){message(error.message,"error");return;}
  const property=state.properties.find(item=>(item.calendars || []).includes(calendar));
  if(!property || property.calendarReadError || String(calendar.status).toLowerCase()==="pending")return;
  if(command==="delete" && !confirm(tr("disconnectCalendarConfirm")))return;
  const view=hostCalendarViews.begin(property,calendar,command);if(!view)return;
  renderProperties();
  try{
    await api(request.path,request.options);
    if(!hostCalendarViews.isCurrent(view))return;
    hostCalendarViews.transportSettled(view);
    if(await reconcileCalendarView(view))hostCalendarViews.close(view);
    else hostCalendarViews.markUnknown(view);
  }catch(error){
    if(!hostCalendarViews.isCurrent(view))return;
    if(calendarErrorUnknown(error) || error.status===412){
      hostCalendarViews.markUnknown(view);hostCalendarViews.transportSettled(view);
      if(await reconcileCalendarView(view))hostCalendarViews.close(view);
      if(hostCalendarViews.isCurrent(view))hostCalendarViews.markUnknown(view);
    }else hostCalendarViews.close(view);
    message(calendarErrorUnknown(error) ? tr("read_unknown") : error.message,"error");
  }finally{
    hostCalendarViews.transportSettled(view);
    if(view.epoch===hostCore.session.epoch && state.properties.includes(property))renderProperties();
  }
}
async function checkCalendarLifecycle(property){
  const view=hostCalendarViews.beginCheck(property);
  if(view===undefined)return;
  renderProperties();
  if(view){
    hostCalendarViews.finishCheck(view,await reconcileCalendarView(view));
  }else await syncDashboard({propertyId:property.id});
  if(state.authenticated && state.properties.includes(property))renderProperties();
}
function stopCalendarWaiting(property){
  if(!hostCalendarViews.stop(property))return;
  // Retire only UI ownership. Do not abort, replay or cancel the producer command.
  renderProperties();
}
async function syncCalendar(calendar){return performCalendarLifecycle(calendar,"sync");}
async function setCalendarEnabled(calendar,enabled){return performCalendarLifecycle(calendar,enabled ? "activate" : "disable");}
async function disconnectCalendar(calendar){return performCalendarLifecycle(calendar,"delete");}

function renderCalendarLifecycle(panel,property){
  if(!property.calendarReadError)for(const [id,verification] of hostVerificationViews){
    if(verification.propertyId===property.id && !property.calendars.some(calendar=>calendar.id===id)){
      verification.dispose();hostVerificationViews.delete(id);
      const index=calendarVerificationPanels.indexOf(verification);
      if(index>=0)calendarVerificationPanels.splice(index,1);
    }
  }
  const calendar=property.calendars?.find(value=>value.provider==="Airbnb"),view=hostCalendarViews.read(property);
  const pending=view?.phase==="pending" || !view && String(calendar?.status).toLowerCase()==="pending";
  const unknown=view?.phase==="unknown" || property.calendarReadError;
  const historical=!!(view || pending || unknown),shown=view?.lastConfirmed || calendar;
  const title=document.createElement("h3");title.textContent=tr("calendar");panel.append(title);
  panel.dataset.propertyId=property.id;panel.dataset.calendarRevision=String(calendar?.revision ?? "");
  const status=document.createElement("div");status.className="host-calendar-status host-calendar-lifecycle";
  if(!shown && !view && !property.calendarReadError)status.className+=" host-calendar-unverified";
  status.dataset.hostKey="calendar-lifecycle-status";status.dataset.phase=unknown ? "unknown" : pending ? "pending" : "confirmed";
  status.dataset.mode=shown?.mode || "unconfirmed";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  status.setAttribute("aria-busy",String(!!pending));
  const heading=document.createElement("strong"),detail=document.createElement("p");
  if(view?.command==="source"){
    heading.textContent=tr(unknown ? "create_unknown_title" : "initial_read_pending_title");
    detail.textContent=tr(unknown ? "create_unknown_body" : "initial_read_pending_body");
  }else if(unknown || pending){
    heading.textContent=tr(unknown ? "mode_change_unknown_title" : !view || view.command==="sync" ? "pending_title" : "mode_change_pending_title");
    detail.textContent=tr(unknown ? "read_unknown" : "pending_body");
  }else{heading.textContent=tr(shown ? "mode_"+shown.mode.toLowerCase() : "calendarNotConnectedUnverified");
    detail.textContent=shown ? tr("mode_"+shown.mode.toLowerCase()+"_effect") : "";}
  status.append(heading,detail);
  if(shown){
    const truth=document.createElement("p");truth.textContent=tr(historical ? "historical_mode" : "mode_current")+": "+tr("mode_"+shown.mode.toLowerCase());
    const last=document.createElement("p");last.textContent=tr("last_success")+": "+formatSyncTime(shown.lastSuccessAt);
    status.append(truth,last);
    const syncError=shown.lastError || property.calendarSyncProblems?.find(problem=>problem.id===shown.id)?.lastError;
    if(syncError){const error=document.createElement("p");error.textContent=(shown.mode==="Disabled" ? tr("historical_error")+": " : "")+syncError;status.append(error);}
    if(!historical){
      const outcome=document.createElement("p");
      outcome.textContent=shown.status==="Connected" && shown.lastSuccessAt && Array.isArray(shown.reservationBlocks)
        ? tr(shown.reservationBlocks.length ? "recovered_body" : "empty")
        : shown.status==="Error" ? tr(shown.lastSuccessAt ? "stale_body" : "first_body") : "";
      status.append(outcome);
    }
    if(Array.isArray(shown.reservationBlocks)){
      const stats=document.createElement("p");stats.textContent=tr("reservationsImported",shown.reservationBlocks.length);status.append(stats);
    }
  }
  panel.append(status);
  const actions=document.createElement("div");actions.className="host-calendar-actions";
  actions.dataset.hostKey="calendar-lifecycle-actions";
  const controls=document.createElement("div");controls.className="host-calendar-control-group";
  actions.append(controls);
  const button=(action,key,fn,parent=actions)=>{
    const node=document.createElement("button");node.type="button";node.className="button button-small";
    if(action==="delete")node.className="text-button danger host-calendar-delete";
    node.dataset.hostKey=`calendar:${calendar?.id || "none"}:${action}`;node.dataset.calendarAction=action;node.textContent=tr(key);
    node.addEventListener("click",()=>{if(!propertiesNode.contains(node) || !state.properties.includes(property))return;
      const current=property.calendars.find(value=>value.id===calendar?.id);return fn(current);});parent.append(node);return node;
  };
  if(historical){
    const check=button("check","check",()=>checkCalendarLifecycle(property));check.disabled=!!(view?.transportPending || view?.checking);
    if(view && !view.stopped)button("stop","close_wait",()=>stopCalendarWaiting(property));
  }else if(calendar){
    const sync=button("sync","syncNow",value=>syncCalendar(value),controls);sync.disabled=calendar.mode!=="Active";
    if(calendar.mode!=="Active")button("activate","enableCalendar",value=>setCalendarEnabled(value,true),controls);
    else button("disable","disableCalendar",value=>setCalendarEnabled(value,false),controls);
    button("delete","disconnectCalendar",value=>disconnectCalendar(value));
    if(calendar.mode==="Active")button("freeze","freeze",value=>performCalendarLifecycle(value,"freeze"));
    else if(calendar.mode==="Frozen")button("disable","disableCalendar",value=>setCalendarEnabled(value,false));
  }
  panel.append(actions);
  if(view){const note=document.createElement("p");note.textContent=tr("close_note");panel.append(note);}
  if(calendar && window.ParrotCalendarVerification){
    let verification=hostVerificationViews.get(calendar.id);
    if(!verification){
      const verificationCalendar={...calendar};
      verification=window.ParrotCalendarVerification.create({calendar:verificationCalendar,request:api,language:lang,onUnauthorized:addressSessionExpired});
      verification.propertyId=property.id;verification.calendar=verificationCalendar;hostVerificationViews.set(calendar.id,verification);calendarVerificationPanels.push(verification);
    }
    Object.assign(verification.calendar,calendar);
    const wrapper=document.createElement("div");wrapper.dataset.hostKey=`verification-wrapper:${calendar.id}`;
    wrapper.hidden=historical || calendar.mode!=="Active";if(wrapper.hidden)wrapper.setAttribute("inert","");
    const island=verification.node.isConnected ? document.createElement("section") : verification.node;
    island.dataset.hostKey=`verification:${calendar.id}`;island.dataset.hostIsland="verification";wrapper.append(island);panel.append(wrapper);
  }
}

function formatSyncTime(value){
  if(!value) return tr("neverSynced");
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(document.documentElement.lang);
}

async function saveUnavailability(property, form, period = null){
  if(hostDraft(form).pendingPeriodWrite)return verifyManualPeriodWrite(property,form);
  if (form.getAttribute("aria-busy") === "true") return;
  const operation = beginHostSave(form, property);
  if (!operation) return;
  const data = new FormData(form);
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("loading"));
  try {
    const wanted=hostPeriodDates(data);
    operation.draft.pendingPeriodWrite={operation,priced:false,id:period?.id || null,wanted};
    const response = await api(period ? `/unavailability/${period.id}` : `/properties/${property.id}/unavailability`, {
      hostOperation:operation,
      method:period ? "PUT" : "POST",
      body:JSON.stringify(wanted)
    });
    if (!currentHostSave(operation)) return;
    const [saved]=hostReadPeriods([response],property.id,false);
    if(period && saved.id!==period.id || saved.from!==wanted.from || saved.to!==wanted.to)throw housingAckError();
    delete operation.draft.pendingPeriodWrite;
    finishHostSave(operation, {from:period ? saved.from : "", to:period ? plusDays(saved.to,-1) : ""});
    const previous=(property.unavailability || []).find(item=>item.id===saved.id);
    const record=previous ? Object.assign(previous,saved) : saved;
    property.unavailability = [...(property.unavailability || []).filter(item => item.id !== saved.id), record]
      .sort((a,b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    renderProperties({propertyId:property.id,key:"blockSaved"});
    message(tr("blockSaved"), "success");
  } catch (error) {
    if (!currentHostSave(operation) || error.kind === "stale") return;
    const definite=error.kind==="validation" || error.kind==="busy"
      || error.status>=400 && error.status<500 && ![408,429].includes(error.status);
    if(definite)delete operation.draft.pendingPeriodWrite;
    form.dataset.hostOperation=definite ? "failed" : "unknown";
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
    releaseHostSave(operation);
    form.removeAttribute("aria-busy");
    setBusy(form, false);
  }
}

async function deleteUnavailability(property, period, form){
  if (form.getAttribute("aria-busy") === "true" || !confirm(tr("deleteBlockConfirm", period.from, plusDays(period.to, -1)))) return;
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("loading"));
  try {
    await api(`/unavailability/${period.id}`, {method:"DELETE"});
    property.unavailability = (property.unavailability || []).filter(item => item.id !== period.id);
    renderProperties({propertyId:property.id,key:"blockDeleted"});
    message(tr("blockDeleted"), "success");
  } catch (error) {
    if(error.kind === "stale") return;
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
    form.removeAttribute("aria-busy");
    setBusy(form, false);
  }
}

function renderUnavailability(property, feedbackKey = null){
  const panel = document.createElement("section");
  panel.className = "host-subpanel host-unavailability-panel";
  const title = document.createElement("h3");
  title.textContent = tr("unavailable");
  const help = document.createElement("p");
  help.className = "host-inline-muted";
  help.textContent = tr("unavailableHelp");
  panel.append(title, help);
  if(feedbackKey){
    const feedback=document.createElement("p");
    feedback.className="host-block-feedback";feedback.setAttribute("role","status");
    feedback.textContent=tr(feedbackKey);panel.append(feedback);
  }

  function dateForm(period = null){
    const form = document.createElement("form");
    form.className = period ? "host-period host-unavailability-period" : "host-inline-form host-unavailability-add";
    form.dataset.hostKey=period ? `unavailability:${period.id}` : "unavailability-add";
    form.dataset.hostDraftKey=`property:${property.id}:${form.dataset.hostKey}`;
    if (period) periodHeading(form, "savedBlock");
    else if(property.unavailability?.length) periodHeading(form, "newBlock");
    function dateField(name, text, value){
      const input = document.createElement("input");
      input.name = name; input.type = "date"; input.required = true; input.value = value || "";
      form.append(hostDateLabel(input, text));
      return input;
    }
    const from = dateField("from", "firstNight", period?.from);
    const lastNight = plusDays(period?.to, -1);
    const to = dateField("to", "lastNight", lastNight);
    to.min = from.value;
    from.addEventListener("change", () => {
      to.min = from.value;
      if (from.value && (!to.value || to.value < from.value)) to.value = to.min;
      to.refreshDateHint();
    });
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "button button-small host-block-button";
    save.textContent = tr(period ? "save" : "addBlock");
    save.hidden = Boolean(period);
    if (period) {
      const changed = () => { save.hidden = from.value === period.from && to.value === plusDays(period.to, -1); };
      form.hostRefresh=changed;
      [from, to].forEach(input => {
        input.addEventListener("input", changed);
        input.addEventListener("change", changed);
      });
    }
    const actions = document.createElement("div");
    actions.className = "host-period-actions";
    actions.append(save);
    form.append(actions);
    form.addEventListener("submit", event => { event.preventDefault(); return saveUnavailability(property, form, period); });
    if (period) {
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "text-button danger"; remove.textContent = tr("remove");
      remove.addEventListener("click", () => deleteUnavailability(property, period, form));
      actions.append(remove);
    }
    return form;
  }
  panel.append(dateForm());
  const periods = document.createElement("div");
  periods.className = "host-periods";
  const blocks = property.unavailability || [];
  if (!blocks.length) {
    const empty = document.createElement("p");
    empty.className = "host-inline-muted";
    empty.textContent = tr("noBlocks");
    periods.append(empty);
  } else blocks.forEach(period => periods.append(dateForm(period)));
  panel.append(periods);
  return panel;
}

function renderPropertyNavigation(){
  const visible=Boolean(state.authenticated && propertyNavigationId);
  propertyNavigationNode.hidden=!visible;
  if(!visible){
    document.getElementById("host-property-context-status").textContent="";
    const back=document.getElementById("host-property-return");
    back.removeAttribute("href");back.textContent="";back.hidden=true;
    return;
  }
  const owned=state.properties.some(property=>property.id===propertyNavigationId);
  document.getElementById("host-property-context-status").textContent=tr(owned?"propertyFromConversation":"propertyUnavailableHere");
  const back=document.getElementById("host-property-return");
  back.hidden=!propertyConversationId;
  if(propertyConversationId){
    back.href=`/messages.html?conversation=${propertyConversationId}`;
    back.textContent=tr("backToConversation");
  }else back.removeAttribute("href");
}

function renderProperties(blockFeedback = null,{noAutoSelect=false}={}){
  hostCalendarViews.pruneInvalid();
  if (!propertiesNode) return;
  renderPropertyNavigation();
  for (const id of [...hostViews.keys()]) {
    if (!state.authenticated || !state.properties.some(property => property.id === id)) disposeHostProperty(id);
  }
  for (const [id, panel] of hostVerificationViews) {
    if (!state.properties.some(property => property.calendars?.some(calendar => calendar.id === id))) {
      panel.dispose(); hostVerificationViews.delete(id);
      const index=calendarVerificationPanels.indexOf(panel);
      if(index>=0)calendarVerificationPanels.splice(index,1);
    }
  }
  if (!state.authenticated) {propertiesNode.replaceChildren(); renderHostSelector(null); return;}
  propertiesNode.querySelector(".host-empty")?.remove();

  const selected=[...expandedPropertyIds].find(id=>state.properties.some(property=>property.id===id))
    || (propertyNavigationId || noAutoSelect ? null : state.properties[0]?.id);
  expandedPropertyIds.clear(); if(selected)expandedPropertyIds.add(selected);
  renderHostSelector(selected);
  if (!state.properties.length) {
    const empty = document.createElement("div");
    empty.className = "host-empty";
    empty.textContent = tr("noProperties");
    propertiesNode.append(empty);
    return;
  }

  state.properties.forEach(property => {
    const expanded=expandedPropertyIds.has(property.id);
    const card = document.createElement("article");
    card.className = `host-property host-property-workspace ${expanded?"expanded":"collapsed"}`;
    card.tabIndex=-1;
    card.dataset.propertyId=property.id;

    const head = document.createElement("div");
    head.className = "host-property-head";
    const title = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = property.title; strong.className="host-property-heading";
    strong.tabIndex=-1; strong.setAttribute("role","heading"); strong.setAttribute("aria-level","3");
    const meta = document.createElement("span");
    const sleeps = Number(property.sleeps || property.bedrooms || 1);
    const accommodationType = property.accommodationType === "private_room" ? tr("privateRoom") : tr("entirePlace");
    meta.textContent = `${[property.city, property.country].filter(Boolean).join(", ")} · ${accommodationType} · ${tr("bedroom", Number(property.bedrooms))} · ${tr("sleepSummary", sleeps)}`;
    title.append(strong, meta);
    const headActions=document.createElement("div");
    headActions.className="host-property-head-actions";
    head.append(title, headActions);
    card.append(head);
    if(!expanded && !hostViews.get(property.id)?.expandedOnce){
      commitHostCard(property, card, expanded);
      return;
    }

    const settings=document.createElement("div");
    settings.className="host-subpanel host-property-settings";
    const settingsForm=document.createElement("form");
    settingsForm.className="host-settings-form";
    settingsForm.dataset.hostDraftKey=`property:${property.id}:settings`;
    settingsForm.dataset.hostKey="settings";
    const titleLabel=document.createElement("label");
    titleLabel.className="host-property-title-field";
    const titleText=document.createElement("span");
    titleText.textContent=tr("internalLabel");
    const titleInput=document.createElement("input");
    titleInput.type="text";titleInput.name="title";titleInput.required=true;titleInput.maxLength=160;titleInput.value=property.title;
    titleLabel.append(titleText,titleInput);
    const existingAddress = hostAddressViews.get(property.id);
    const addressEditor = existingAddress?.editor || window.ParrotAddress.create({
      id:`property-address-${property.id}`, tr, request:api,
      initial:property.address || null, location:property, onUnauthorized:addressSessionExpired,
      onCancel:()=>{
        const currentForm=hostAddressViews.get(property.id)?.form;
        if(!currentForm)return;
        const draft=hostDraft(currentForm);draft.addressDirty=false;
        draft.addressVersion=(draft.addressVersion || 0)+1;
        draft.addressAcknowledgedValues=hostAddressSnapshot(currentForm);setBusy(currentForm,false);hostDirtyState();
      }
    });
    const addressNode = existingAddress ? document.createElement("div") : addressEditor.node;
    addressNode.dataset.hostKey="address";
    addressNode.dataset.hostIsland="address";
    if (!existingAddress) {
      hostAddressViews.set(property.id, {editor:addressEditor, form:settingsForm});
      propertyAddressEditors.set(settingsForm, addressEditor);
      addressEditor.change.addEventListener("click",()=>{
        if(addressEditor.node.querySelector(".host-address-fields")?.hidden){
          hostDraft(settingsForm).addressDirty=false;
          hostDirtyState();
        }
      });
    }
    const accommodationLabel=document.createElement("label");
    const accommodationText=document.createElement("span");
    accommodationText.textContent=tr("accommodationTypeLabel");
    const accommodationSelect=document.createElement("select");
    accommodationSelect.name="accommodationType";
    const entireOption=document.createElement("option");
    entireOption.value="entire_place";entireOption.textContent=tr("entirePlace");
    const roomOption=document.createElement("option");
    roomOption.value="private_room";roomOption.textContent=tr("privateRoom");
    accommodationSelect.append(entireOption,roomOption);
    accommodationSelect.value=property.accommodationType==="private_room"?"private_room":"entire_place";
    accommodationLabel.append(accommodationText,accommodationSelect);
    const bedroomsLabel=document.createElement("label");
    const bedroomsText=document.createElement("span");
    bedroomsText.textContent=tr("bedroomsLabel");
    const bedroomsInput=document.createElement("input");
    bedroomsInput.type="number";bedroomsInput.name="bedrooms";bedroomsInput.min="1";bedroomsInput.max="20";bedroomsInput.required=true;bedroomsInput.value=String(property.bedrooms||1);
    bedroomsLabel.append(bedroomsText,bedroomsInput);
    const sleepsLabel=document.createElement("label");
    const sleepsText=document.createElement("span");
    sleepsText.textContent=tr("sleepsLabel");
    const sleepsInput=document.createElement("input");
    sleepsInput.type="number";sleepsInput.name="sleeps";sleepsInput.min="1";sleepsInput.max="40";sleepsInput.required=true;sleepsInput.value=String(property.sleeps||1);
    sleepsLabel.append(sleepsText,sleepsInput);
    const saveSettings=document.createElement("button");
    saveSettings.className="button button-small";saveSettings.type="submit";saveSettings.textContent=tr("savePropertySettings");
    settingsForm.append(titleLabel,addressNode,accommodationLabel,bedroomsLabel,sleepsLabel,saveSettings);
    settingsForm.addEventListener("submit",event=>{event.preventDefault();updatePropertySettings(property,settingsForm)});
    settings.append(settingsForm);

    const listing = document.createElement("div");
    listing.className = "host-subpanel";
    const listingTitle = document.createElement("h3");
    listingTitle.textContent = tr("externalListing");
    listing.append(listingTitle);

    const externalCalendar=Array.isArray(property.calendars) ? property.calendars.find(item=>item.provider==="Airbnb") : null;

    if (property.listing?.url) {
      const a = document.createElement("a");
      a.href = property.listing.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "host-saved-link";
      a.textContent = property.listing.url;
      const actions = document.createElement("div");
      actions.className = "host-listing-actions";
      const visibility=document.createElement("label");
      visibility.className="host-listing-visibility";
      const visibilityCheckbox=document.createElement("input");
      visibilityCheckbox.type="checkbox";
      visibilityCheckbox.checked=property.listing.showInSearch!==false;
      visibilityCheckbox.addEventListener("change",()=>updateListingVisibility(property,visibilityCheckbox));
      const visibilityText=document.createElement("span");
      visibilityText.textContent=tr("showListingInSearch");
      visibility.append(visibilityCheckbox,visibilityText);
      const visibilityGroup=document.createElement("div");
      visibilityGroup.className="host-listing-visibility-group";
      visibilityGroup.append(visibility);
      if(!externalCalendar){
        const visibilityHelp=document.createElement("p");
        visibilityHelp.className="host-inline-muted host-listing-unverified-note";
        visibilityHelp.textContent=tr("listingVisibleCalendarUnverified");
        visibilityGroup.append(visibilityHelp);
      }
      const removeListing = document.createElement("button");
      removeListing.type = "button";
      removeListing.className = "text-button danger";
      removeListing.textContent = tr("deleteListing");
      removeListing.addEventListener("click", () => deleteListing(property));
      const listingControls=document.createElement("div");
      listingControls.className="host-listing-controls";
      listingControls.append(visibilityGroup,removeListing);
      actions.append(a, listingControls);
      listing.append(actions);
    }
    listing.append(calendarSourceForm(property,externalCalendar));
    const syncPanel=document.createElement("div");
    syncPanel.className="host-subpanel host-calendar-sync";
    renderCalendarLifecycle(syncPanel,property);

    const calendar = document.createElement("div");
    calendar.className = "host-subpanel host-availability-panel";
    const calendarTitle = document.createElement("h3");
    calendarTitle.textContent = tr("availability");
    calendar.append(calendarTitle);
    const availabilityHelp = document.createElement("p");
    availabilityHelp.className = "host-inline-muted";
    availabilityHelp.textContent = tr("availabilityHelp");
    calendar.append(availabilityHelp);

    const staySettingsForm=document.createElement("form");
    staySettingsForm.className="host-settings-form host-stay-settings";
    staySettingsForm.dataset.hostKey="stay-settings";
    staySettingsForm.dataset.hostDraftKey=`property:${property.id}:stay-settings`;
    const minStayLabel=document.createElement("label");
    const minStayText=document.createElement("span");
    minStayText.textContent=tr("minStayLabel");
    const minStayInput=document.createElement("input");
    minStayInput.type="number";minStayInput.name="minStayDays";minStayInput.min="1";minStayInput.max="365";minStayInput.required=true;minStayInput.value=String(property.minStayDays||1);
    minStayLabel.append(minStayText,minStayInput);
    const cleaningLabel=document.createElement("label");
    const cleaningText=document.createElement("span");
    cleaningText.textContent=tr("cleaningFee");
    const propertyCleaningInput=document.createElement("input");
    propertyCleaningInput.type="number";propertyCleaningInput.name="cleaningFee";propertyCleaningInput.min="0";propertyCleaningInput.step="0.01";propertyCleaningInput.value=centsToEuros(property.cleaningFeeCents);
    cleaningLabel.append(cleaningText,propertyCleaningInput);
    const saveStaySettings=document.createElement("button");
    saveStaySettings.className="button button-small";saveStaySettings.type="submit";saveStaySettings.textContent=tr("saveStaySettings");
    staySettingsForm.append(minStayLabel,cleaningLabel,saveStaySettings);
    attachHostEditor(property,staySettingsForm,"conditions");
    calendar.append(staySettingsForm);

    const addForm = document.createElement("form");
    addForm.className = "host-inline-form host-dates";
    addForm.dataset.hostKey="availability-add";
    addForm.dataset.hostDraftKey=`property:${property.id}:availability-add`;
    periodHeading(addForm, "newPeriod");
    const fromInput = document.createElement("input");
    fromInput.type = "date";
    fromInput.name = "from";
    fromInput.required = true;
    const toInput = document.createElement("input");
    toInput.type = "date";
    toInput.name = "to";
    toInput.required = true;
    fromInput.addEventListener("change", () => {
      toInput.min = fromInput.value;
      if (!toInput.value || toInput.value < fromInput.value) toInput.value = fromInput.value;
      toInput.refreshDateHint();
    });
    const nightlyInput=document.createElement("input");
    nightlyInput.type="number";nightlyInput.min="0.01";nightlyInput.step="0.01";nightlyInput.name="nightlyPrice";nightlyInput.placeholder=tr("nightlyPrice");
    const addButton = document.createElement("button");
    addButton.className = "button button-small";
    addButton.type = "submit";
    addButton.textContent = tr("addDates");
    const addActions = document.createElement("div");
    addActions.className = "host-period-actions";
    addActions.append(addButton);
    addForm.append(hostDateLabel(fromInput, "firstNight"), hostDateLabel(toInput, "lastNight"), hostPriceLabel(nightlyInput), addActions);
    addForm.addEventListener("submit", event => {
      event.preventDefault();
      return addAvailability(property, addForm);
    });
    calendar.append(addForm);

    const periods = document.createElement("div");
    periods.className = "host-periods";

    if (property.availabilityError) {
      const err = document.createElement("p");
      err.className = "host-inline-error";
      err.textContent = property.availabilityError;
      periods.append(err);
    }
    if (!Array.isArray(property.availability)) {
      const loading = document.createElement("p");
      loading.className = "host-inline-muted";
      loading.textContent = tr("loading");
      periods.append(loading);
      refreshAvailability(property, true);
    } else if (!property.availability.length) {
      const empty = document.createElement("p");
      empty.className = "host-inline-muted";
      empty.textContent = tr("noPeriods");
      periods.append(empty);
    } else {
      property.availability.forEach(period => periods.append(renderHostPeriod(property,period)));
    }

    calendar.append(periods);
    card.append(calendar);
    card.append(hostDisclosure(property,"closed","closedDates",renderUnavailability(property, blockFeedback?.propertyId===property.id ? blockFeedback.key : null)));
    card.append(hostDisclosure(property,"calendar","calendarSettings",syncPanel));
    card.append(hostDisclosure(property,"source","sourcePanelTitle",listing));
    card.append(hostDisclosure(property,"details","propertyDetails",settings));
    const footer = document.createElement("div");
    footer.className = "host-property-footer";
    const deletePropertyButton = document.createElement("button");
    deletePropertyButton.type = "button";
    deletePropertyButton.className = "text-button danger";
    deletePropertyButton.textContent = tr("deleteProperty");
    deletePropertyButton.addEventListener("click", () => deleteProperty(property));
    footer.append(deletePropertyButton);
    card.append(footer);
    commitHostCard(property, card, expanded);
  });
  const liveKeys=new Set([propertyForm.id,
    ...[...propertiesNode.querySelectorAll("form")].map(form=>form.dataset.hostDraftKey)]);
  for(const key of hostDrafts.keys()) if(key.startsWith(`${accountId}:`) && !liveKeys.has(key.slice(String(accountId).length+1)))
    hostDrafts.delete(key);
  hostDirtyState();
}

langButtons.forEach(btn => btn.addEventListener("pointerdown", () => {
  const node=document.activeElement;
  btn.hostFocus=node && /^(INPUT|TEXTAREA)$/.test(node.tagName)
    ? {node,from:node.selectionStart,to:node.selectionEnd,epoch:hostCore.session.epoch} : null;
}));
langButtons.forEach(btn => btn.addEventListener("click", () => {
  const previous=btn.hostFocus;
  btn.hostFocus=null;
  if(btn.dataset.hostLang===lang)return;
  applyLanguage(btn.dataset.hostLang);
  if(previous && previous.epoch===hostCore.session.epoch && previous.node.isConnected){
    previous.node.focus({preventScroll:true});
    if(previous.from!==null && previous.to!==null)previous.node.setSelectionRange(previous.from,previous.to);
  }
}));

hostCore.session.subscribe(({user, reason, epoch}) => {
  if(user) {
    const changed = accountId !== user.accountId || presentedSessionEpoch !== epoch;
    presentedSessionEpoch = epoch;
    if(changed) {
      const previous = accountId;
      clearPrivatePresentation();
      if(previous) {
        propertyNavigationPending = false;
        propertyNavigationId = null; propertyConversationId = null;
        hostCore.storage.session.removeItem(profileReturnKey);
        hostCore.storage.session.removeItem(returnKey(previous));
      }
    }
    accountId = user.accountId;
    state = {...(changed ? emptyState() : state), authenticated:true,
      accountEmail:String(user.email || ""), username:String(user.username || ""), profile:{id:user.parrotId,displayName:user.displayName}};
    renderAuthState();
    if(changed) dashboardLoad = syncDashboard();
  } else {
    clearPrivatePresentation(); accountId = null;
    if(reason === "revalidate" || reason === "expired") {
      loginForm.elements.password.value = "";
      registerForm.elements.password.value = "";
    }
  }
});
applyLanguage(lang);
boot();
