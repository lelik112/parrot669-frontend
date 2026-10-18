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

const addressCopy = {
  en:{addressRateLimited:"Too many address searches. Wait a moment, then try again.",addressChooseCountry:"Select a country",addressLoadingCountries:"Loading countries…",addressCountriesUnavailable:"Could not load countries. Try again.",addressCityPlaceholder:"Start typing the city",addressStreetLabel:"Street",addressStreetPlaceholder:"Start typing the street",addressHouseLabel:"House number",addressHousePlaceholder:"e.g. 40 or 40 bis",addressHouseRequired:"Enter the house number.",addressChooseCity:"Select a city from the suggestions.",addressChooseStreet:"Select a street from the suggestions.",addressNoCities:"No cities found in this country. Try a longer name.",addressNoStreets:"No streets found in this city. Try a longer name or its local spelling.",addressStepsHelp:"Choose country, city and street, then enter the house number. Only you can see the full address.",addressChange:"Change address",addressCancelChange:"Keep saved address",addressLabel:"Property address",addressPlaceholder:"Street, house number, city",addressHelp:"Start typing and select a suggestion. Country and city fill automatically. Only you can see the exact address.",countryLabel:"Country",addressSuggestions:"Address suggestions",addressLoading:"Looking for addresses…",addressChoose:"Select an address with a street and house number from the suggestions.",addressMore:"Enter at least 3 characters.",addressNoResults:"No complete address found. Enter the street, house number and city.",addressUnavailable:"Address suggestions are unavailable. Your input is saved — try again.",addressSignIn:"Sign in again to look up addresses.",addressSelected:"Address selected. Country and city filled automatically.",addressRetry:"Try again",addressTooLong:"Use a shorter search, up to 256 characters."},
  es:{addressRateLimited:"Demasiadas búsquedas. Espera un momento y vuelve a intentarlo.",addressChooseCountry:"Selecciona un país",addressLoadingCountries:"Cargando países…",addressCountriesUnavailable:"No se pudieron cargar los países. Vuelve a intentarlo.",addressCityPlaceholder:"Empieza a escribir la ciudad",addressStreetLabel:"Calle",addressStreetPlaceholder:"Empieza a escribir la calle",addressHouseLabel:"Número",addressHousePlaceholder:"p. ej. 40 o 40 bis",addressHouseRequired:"Introduce el número de la vivienda.",addressChooseCity:"Selecciona una ciudad de las sugerencias.",addressChooseStreet:"Selecciona una calle de las sugerencias.",addressNoCities:"No se encontraron ciudades en este país. Completa el nombre.",addressNoStreets:"No se encontraron calles en esta ciudad. Completa el nombre o usa su nombre local.",addressStepsHelp:"Selecciona país, ciudad y calle; después introduce el número. Solo tú puedes ver la dirección completa.",addressChange:"Cambiar dirección",addressCancelChange:"Conservar dirección",addressLabel:"Dirección de la vivienda",addressPlaceholder:"Calle, número, ciudad",addressHelp:"Empieza a escribir y selecciona una sugerencia. País y ciudad se rellenan automáticamente. Solo tú puedes ver la dirección exacta.",countryLabel:"País",addressSuggestions:"Sugerencias de direcciones",addressLoading:"Buscando direcciones…",addressChoose:"Selecciona una dirección con calle y número de las sugerencias.",addressMore:"Introduce al menos 3 caracteres.",addressNoResults:"No se encontró una dirección completa. Introduce calle, número y ciudad.",addressUnavailable:"Las sugerencias no están disponibles. Conservamos el texto; vuelve a intentarlo.",addressSignIn:"Vuelve a iniciar sesión para buscar direcciones.",addressSelected:"Dirección seleccionada. País y ciudad completados automáticamente.",addressRetry:"Reintentar",addressTooLong:"Acorta la búsqueda a un máximo de 256 caracteres."},
  ca:{addressRateLimited:"Massa cerques. Espera un moment i torna-ho a provar.",addressChooseCountry:"Selecciona un país",addressLoadingCountries:"Carregant països…",addressCountriesUnavailable:"No s’han pogut carregar els països. Torna-ho a provar.",addressCityPlaceholder:"Comença a escriure la ciutat",addressStreetLabel:"Carrer",addressStreetPlaceholder:"Comença a escriure el carrer",addressHouseLabel:"Número",addressHousePlaceholder:"p. ex. 40 o 40 bis",addressHouseRequired:"Introdueix el número de l’habitatge.",addressChooseCity:"Selecciona una ciutat dels suggeriments.",addressChooseStreet:"Selecciona un carrer dels suggeriments.",addressNoCities:"No s’han trobat ciutats en aquest país. Completa el nom.",addressNoStreets:"No s’han trobat carrers en aquesta ciutat. Completa el nom o usa el nom local.",addressStepsHelp:"Selecciona país, ciutat i carrer; després introdueix el número. Només tu pots veure l’adreça completa.",addressChange:"Canviar adreça",addressCancelChange:"Conservar adreça",addressLabel:"Adreça de l’habitatge",addressPlaceholder:"Carrer, número, ciutat",addressHelp:"Comença a escriure i selecciona un suggeriment. El país i la ciutat s’emplenen automàticament. Només tu pots veure l’adreça exacta.",countryLabel:"País",addressSuggestions:"Suggeriments d’adreces",addressLoading:"Cercant adreces…",addressChoose:"Selecciona una adreça amb carrer i número dels suggeriments.",addressMore:"Introdueix almenys 3 caràcters.",addressNoResults:"No s’ha trobat cap adreça completa. Introdueix carrer, número i ciutat.",addressUnavailable:"Els suggeriments no estan disponibles. Conservem el text; torna-ho a provar.",addressSignIn:"Torna a iniciar sessió per cercar adreces.",addressSelected:"Adreça seleccionada. País i ciutat emplenats automàticament.",addressRetry:"Torna-ho a provar",addressTooLong:"Escurça la cerca a un màxim de 256 caràcters."},
  ru:{addressRateLimited:"Слишком много запросов адреса. Подождите немного и повторите поиск.",addressChooseCountry:"Выберите страну",addressLoadingCountries:"Загружаем страны…",addressCountriesUnavailable:"Не удалось загрузить страны. Попробуйте ещё раз.",addressCityPlaceholder:"Начните вводить город",addressStreetLabel:"Улица",addressStreetPlaceholder:"Начните вводить улицу",addressHouseLabel:"Номер дома",addressHousePlaceholder:"Например, 40 или 40 bis",addressHouseRequired:"Укажите номер дома.",addressChooseCity:"Выберите город из подсказок.",addressChooseStreet:"Выберите улицу из подсказок.",addressNoCities:"Города в этой стране не найдены. Уточните название.",addressNoStreets:"Улицы в этом городе не найдены. Уточните название или введите его на местном языке.",addressStepsHelp:"Выберите страну, город и улицу, затем укажите номер дома. Полный адрес видите только вы.",addressChange:"Изменить адрес",addressCancelChange:"Оставить прежний адрес",addressLabel:"Адрес объекта",addressPlaceholder:"Улица, номер дома, город",addressHelp:"Начните вводить адрес и выберите подсказку. Страна и город заполнятся автоматически. Точный адрес видите только вы.",countryLabel:"Страна",addressSuggestions:"Подсказки адресов",addressLoading:"Ищем адреса…",addressChoose:"Выберите адрес с улицей и номером дома из списка подсказок.",addressMore:"Введите хотя бы 3 символа.",addressNoResults:"Полный адрес не найден. Укажите улицу, номер дома и город.",addressUnavailable:"Подсказки адресов сейчас недоступны. Введённый текст сохранён — попробуйте ещё раз.",addressSignIn:"Войдите снова, чтобы найти адрес.",addressSelected:"Адрес выбран. Страна и город заполнены автоматически.",addressRetry:"Повторить поиск",addressTooLong:"Сократите поисковый запрос до 256 символов."}
};
Object.entries(addressCopy).forEach(([language, values]) => Object.assign(copy[language], values));

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
  en:{navProfile:"Host profile",profileTitle:"Host profile",profileHelp:"Your host name is visible to guests. Your email and login stay private.",profileName:"Public host name",profileSave:"Save name",profileAccount:"Account",profileSaved:"Host name saved.",profileReturn:"← Back to conversation"},
  es:{navProfile:"Perfil de anfitrión",profileTitle:"Perfil de anfitrión",profileHelp:"Los huéspedes pueden ver tu nombre de anfitrión. El email y el usuario de acceso son privados.",profileName:"Nombre público del anfitrión",profileSave:"Guardar nombre",profileAccount:"Cuenta",profileSaved:"Nombre guardado.",profileReturn:"← Volver a la conversación"},
  ca:{navProfile:"Perfil d'amfitrió",profileTitle:"Perfil d'amfitrió",profileHelp:"Els hostes poden veure el nom d'amfitrió. El correu i l'usuari d'accés són privats.",profileName:"Nom públic de l'amfitrió",profileSave:"Desar el nom",profileAccount:"Compte",profileSaved:"Nom desat.",profileReturn:"← Tornar a la conversa"},
  ru:{navProfile:"Профиль хозяина",profileTitle:"Профиль хозяина",profileHelp:"Имя хозяина видно гостям. Email и логин остаются личными.",profileName:"Публичное имя хозяина",profileSave:"Сохранить имя",profileAccount:"Учётная запись",profileSaved:"Имя хозяина сохранено.",profileReturn:"← Вернуться к диалогу"}
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
const hostProfileReturn = document.getElementById("host-profile-return");
const hostProfileForm = document.getElementById("host-profile-form");
const profileReturnKey = "parrot669-profile-return";
const profileReturnId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function profileReturnContext(){
  if (!state.authenticated || new URLSearchParams(window.location.search).get("fromMessages") !== "1" || window.location.hash !== "#host-profile") return null;
  try {
    const saved=JSON.parse(hostCore.storage.session.getItem(profileReturnKey)||"null");
    return saved?.accountId === accountId && profileReturnId.test(saved.conversationId || "") &&
      saved.savedAt > Date.now()-86400000 ? saved : null;
  } catch { return null; }
}
const propertyForm = document.getElementById("property-form");
const hostAccountEmail = document.getElementById("host-account-email");
const propertiesNode = document.getElementById("host-properties");
const resetButton = document.getElementById("reset-host");
const langButtons = document.querySelectorAll("[data-host-lang]");
const authModeButtons = document.querySelectorAll("[data-auth-mode]");
const propertyAddressEditors = new Map();
const calendarVerificationPanels = [];
const newPropertyAddress = window.ParrotAddress.create({
  id:"new-property-address", tr, request:api, required:true, onUnauthorized:addressSessionExpired
});
document.getElementById("property-address").append(newPropertyAddress.node);

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
  try {
    if (path === "/auth/me") {
      const user = await hostCore.session.refresh();
      if (!user) throw Object.assign(new Error(tr("signIn")), {status:401, code:"AUTHENTICATION_REQUIRED"});
      return user;
    }
    if (path.startsWith("/auth/")) return await hostCore.auth(path.slice(5), options);
    // Explicit producer contracts; a 204 from any other operation is a protocol error.
    const method = options.method || "GET";
    const empty = method === "DELETE" && /^\/(properties|listings|calendars|availability|unavailability)\/[^/]+$/.test(path)
      || method === "PUT" && /^\/(availability|calendars)\/[^/]+$/.test(path)
      || method === "POST" && /^\/calendars\/[^/]+\/(sync|activate)$/.test(path);
    return await hostCore.session.request(`/api/host${path}`, {...options, authenticated:true,
      ...(empty ? {expected:"empty"} : {}),
      ...(path === "/dashboard" ? {validate:value => value && typeof value === "object" && Array.isArray(value.properties)} : {})});
  } catch (error) {
    const keys = {EMAIL_VERIFICATION_REQUIRED:"verifyFirst", TITLE_REQUIRED:"titleRequired", TITLE_TOO_LONG:"titleTooLong",
      ADDRESS_REQUIRED:"addressChoose", FULL_ADDRESS_REQUIRED:"addressChoose", AVAILABILITY_OVERLAP:"overlapError",
      UNAVAILABILITY_OVERLAP:"blockOverlap"};
    if(keys[error.code]) error.message = tr(keys[error.code]);
    // INVALID_REQUEST is contextual in PM120; retain these two existing date
    // explanations until the backend has a field-specific validation contract.
    if(error.code === "INVALID_REQUEST" && ["to must be after from; checkout date is exclusive",
      "to must be after from; end date is exclusive"].includes(error.message)) error.message=tr("blockDateError");
    throw error;
  }
}

function setBusy(form, busy){
  form?.querySelectorAll("button,input,select").forEach(node => node.disabled = busy);
  if (!busy) {
    if (form === propertyForm) newPropertyAddress.refreshDisabled();
    propertyAddressEditors.get(form)?.refreshDisabled();
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
  setFormError(hostProfileForm);
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
  const returnContext=ready ? profileReturnContext() : null;
  hostProfileReturn.hidden = !returnContext;
  if(returnContext)hostProfileReturn.href=`/messages.html?conversation=${encodeURIComponent(returnContext.conversationId)}`;
  else hostProfileReturn.href="#host-profile";
  hostAccountEmail.textContent = ready ? (state.username || tr("accountLabel")) : "";
  hostAccountEmail.removeAttribute("title");
  document.getElementById("host-profile-email").textContent = ready ? state.accountEmail : "";
  document.getElementById("host-profile-username").textContent = ready ? state.username : "";
  if (ready && state.profile) hostProfileForm.elements.displayName.value = state.profile.displayName || "";
  else hostProfileForm.elements.displayName.value = "";
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
      || !Number.isSafeInteger(calendar.revision) || calendar.revision < 0) return false;
    ids.add(calendar.id.toLowerCase());
    return true;
  });
}

function calendarRevision(calendar){
  const snapshot = calendar && calendarSnapshots.get(calendar);
  if(!snapshot || snapshot.epoch !== hostCore.session.epoch || !state.authenticated
    || !state.properties.some(property => property.id === snapshot.propertyId && property.calendars.includes(calendar)))
    throw new Error("Invalid server response");
  return snapshot.revision;
}

async function syncDashboard(){
  const epoch = hostCore.session.epoch, version = ++dashboardVersion;
  message(tr("loading"));
  try {
    const dashboard = await api("/dashboard");
    if(epoch !== hostCore.session.epoch || version !== dashboardVersion) return;
    let calendarError;
    const properties = await Promise.all(dashboard.properties.map(async property => {
      let calendars = [];
      try {
        // Dashboard does not contain calendar mode/revision. Only the
        // authenticated property snapshot is a command source.
        const snapshot = await api(`/properties/${property.id}/calendars`, {validate:calendarSnapshot});
        calendars = snapshot.calendars.map(calendar => {
          const view = {...calendar, status:String(calendar.status || "").toLowerCase()};
          calendarSnapshots.set(view, {propertyId:property.id, epoch, revision:calendar.revision});
          return view;
        });
      } catch(error) {
        if(error.kind === "stale" || error.status === 401) throw error;
        calendarError ||= error;
      }
      return {...property,
        listing:Array.isArray(property.listings) ? (property.listings[0] || null) : null,
        availability:Array.isArray(property.availability) ? property.availability : [],
        unavailability:Array.isArray(property.unavailability) ? property.unavailability : [],
        calendars};
    }));
    if(epoch !== hostCore.session.epoch || version !== dashboardVersion) return;
    if (dashboard.profile) {
      state.profile = dashboard.profile;
      hostProfileForm.elements.displayName.value = dashboard.profile.displayName || "";
    }
    state.properties = properties;
    const navigateToProperty = propertyNavigationPending;
    const returningFromMessages = !navigateToProperty && profileReturnContext();
    let previousScroll = null;
    if(navigateToProperty){
      propertyNavigationPending = false;
      expandedPropertyIds.clear();
      if(state.properties.some(property=>property.id===propertyNavigationId)) expandedPropertyIds.add(propertyNavigationId);
      try { hostCore.storage.session.removeItem(returnKey(accountId)); } catch {}
    }else if(!returningFromMessages) previousScroll=restoreHostContext();
    renderProperties();
    if(navigateToProperty) requestAnimationFrame(()=>{
      const card=Array.from(propertiesNode.children).find(node=>node.dataset.propertyId===propertyNavigationId);
      (card || propertyNavigationNode).scrollIntoView?.({block:"start",behavior:"auto"});
      card?.focus?.({preventScroll:true});
    });
    else if(returningFromMessages)
      requestAnimationFrame(()=>hostProfilePanel.scrollIntoView?.({block:"start"}));
    else if(previousScroll!==null && previousScroll!==undefined)
      restoreHostScroll(previousScroll);
    message(calendarError?.message || "", calendarError ? "error" : "");
  } catch (error) {
    if(error.kind === "stale" || epoch !== hostCore.session.epoch || version !== dashboardVersion) return;
    if (error.status === 401) {
      state = emptyState();
      state.properties = [];
      renderAuthState();
    }
    message(error.message, "error");
    state.properties = [];
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
hostProfileForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.authenticated) return;
  setFormError(hostProfileForm);
  setBusy(hostProfileForm, true);
  try {
    const profile = await api("/profile", {
      method:"PATCH",
      body:JSON.stringify({displayName:hostProfileForm.elements.displayName.value.trim()})
    });
    state.profile = profile;
    hostCore.session.updateProfile(profile);
    hostProfileForm.elements.displayName.value = profile.displayName;
    message(tr("profileSaved"), "success");
  } catch (error) {
    setFormError(hostProfileForm, error.message);
    if (error.status === 401) {
      state = emptyState();
      renderAuthState();
    }
  } finally {
    setBusy(hostProfileForm, false);
  }
});
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

propertyForm.addEventListener("submit", async event => {
  event.preventDefault();

  const form = new FormData(propertyForm);
  setFormError(propertyForm);

  try {
    const address = newPropertyAddress.getValue();
    setBusy(propertyForm, true);
    message(tr("addingProperty"));
    const created = await api("/properties", {
      method:"POST",
      body:JSON.stringify({
        title:String(form.get("title") || "").trim(),
        city:address.city,
        address,
        accommodationType:String(form.get("accommodationType") || "entire_place"),
        bedrooms:Number(form.get("bedrooms")),
        sleeps:Number(form.get("sleeps"))
      })
    });

    state.properties.push({
      id:created.id,
      title:created.title,
      city:created.city,
      countryCode:created.countryCode,
      country:created.country,
      address:created.address,
      accommodationType:created.accommodationType,
      bedrooms:created.bedrooms,
      sleeps:created.sleeps,
      minStayDays:created.minStayDays,
      cleaningFeeCents:created.cleaningFeeCents,
      listing:null,
      availability:[],
      unavailability:[],
      calendars:[]
    });
    expandedPropertyIds.add(created.id);
    propertyForm.elements.title.value = "";
    newPropertyAddress.reset();
    message(tr("propertyAdded"), "success");
    renderProperties();
  } catch (error) {
    setFormError(propertyForm, error.message);
    message(error.message, "error");
  } finally {
    setBusy(propertyForm, false);
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

async function updatePropertySettings(property, form){
  setFormError(form);
  const data=new FormData(form);
  const payload={
    accommodationType:data.has("accommodationType") ? String(data.get("accommodationType")||"entire_place") : property.accommodationType,
    bedrooms:data.has("bedrooms") ? Number(data.get("bedrooms")) : Number(property.bedrooms),
    sleeps:data.has("sleeps") ? Number(data.get("sleeps")) : Number(property.sleeps),
    minStayDays:data.has("minStayDays") ? Number(data.get("minStayDays")) : Number(property.minStayDays||1),
    cleaningFeeCents:data.has("cleaningFee") ? eurosToCents(data.get("cleaningFee")) : property.cleaningFeeCents
  };
  if(data.has("title")) payload.title=String(data.get("title")||"").trim();
  try{
    const addressEditor = propertyAddressEditors.get(form);
    if (addressEditor) payload.address = addressEditor.getValue();
    setBusy(form,true);
    message(tr("loading"));
    const updated=await api(`/properties/${property.id}`,{
      method:"PUT",
      body:JSON.stringify(payload)
    });
    property.title=updated.title;
    property.accommodationType=updated.accommodationType;
    property.bedrooms=updated.bedrooms;
    property.sleeps=updated.sleeps;
    property.minStayDays=updated.minStayDays;
    property.cleaningFeeCents=updated.cleaningFeeCents;
    property.city=updated.city;
    property.countryCode=updated.countryCode;
    property.country=updated.country;
    property.address=updated.address;
    saveState();
    message(tr("propertySettingsSaved"),"success");
    renderProperties();
  }catch(error){setFormError(form,error.message);message(error.message,"error")}
  finally{setBusy(form,false)}
}

async function addListing(property, form){
  setFormError(form);
  const data = new FormData(form);
  setBusy(form, true);
  message(tr("savingListing"));

  try {
    const created = await api(`/properties/${property.id}/listings`, {
      method:"POST",
      body:JSON.stringify({
        platform:"Airbnb",
        externalId:String(data.get("externalId") || "").trim()
      })
    });
    property.listing = {id:created.id, platform:created.platform, externalId:created.externalId, url:created.url, showInSearch:created.showInSearch!==false};
    saveState();
    message(tr("listingSaved"), "success");
    renderProperties();
  } catch (error) {
    const text=setListingFormError(form,error);
    message(text, "error");
  } finally {
    setBusy(form, false);
  }
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

async function addAvailability(property, form){
  if (form.getAttribute("aria-busy") === "true") return;
  const data = new FormData(form);
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("addingAvailability"));

  try {
    await api(`/properties/${property.id}/availability`, {
      method:"POST",
      body:JSON.stringify({...hostPeriodDates(data), nightlyPriceCents:eurosToCents(data.get("nightlyPrice"))})
    });
    message(tr("availabilityAdded"), "success");
    await refreshAvailability(property, true);
  } catch (error) {
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
    form.removeAttribute("aria-busy");
    setBusy(form, false);
  }
}

async function refreshAvailability(property, rerender = false){
  try {
    property.availability = await api(`/properties/${property.id}/availability`);
    property.availabilityError = "";
    if (rerender) renderProperties();
  } catch (error) {
    property.availabilityError = error.message;
    if (rerender) renderProperties();
  }
}

async function updateAvailability(property, period, form){
  if (form.getAttribute("aria-busy") === "true") return;
  const data = new FormData(form);
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("updatingAvailability"));
  try {
    await api(`/availability/${period.id}`, {
      method:"PUT",
      body:JSON.stringify({...hostPeriodDates(data), nightlyPriceCents:eurosToCents(data.get("nightlyPrice"))})
    });
    message(tr("availabilityUpdated"), "success");
    await refreshAvailability(property, true);
  } catch (error) {
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
    form.removeAttribute("aria-busy");
    setBusy(form, false);
  }
}

async function deleteAvailability(property, period){
  if (!confirm(tr("deleteConfirm", period.from, plusDays(period.to, -1)))) return;
  message(tr("deletingAvailability"));
  try {
    await api(`/availability/${period.id}`, {method:"DELETE"});
    message(tr("availabilityDeleted"), "success");
    await refreshAvailability(property, true);
  } catch (error) {
    message(error.message, "error");
  }
}

async function deleteProperty(property){
  if (!confirm(tr("deletePropertyConfirm", property.title))) return;
  message(tr("deletingAvailability"));
  try {
    await api(`/properties/${property.id}`, {method:"DELETE"});
    state.properties = state.properties.filter(item => item.id !== property.id);
    expandedPropertyIds.delete(property.id);
    saveState();
    message(tr("propertyDeleted"), "success");
    renderProperties();
  } catch (error) {
    message(error.message, "error");
  }
}

async function updateListingVisibility(property, checkbox){
  if(!property.listing?.id) return;
  checkbox.disabled=true;
  try{
    const updated=await api(`/listings/${property.listing.id}`,{
      method:"PUT",
      body:JSON.stringify({showInSearch:checkbox.checked})
    });
    property.listing.showInSearch=updated.showInSearch!==false;
    checkbox.checked=property.listing.showInSearch;
    message(tr("listingVisibilitySaved"),"success");
  }catch(error){
    checkbox.checked=property.listing.showInSearch!==false;
    message(error.message,"error");
  }finally{
    checkbox.disabled=false;
  }
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
    message(error.message, "error");
  }
}

async function connectCalendar(property, form){
  const data=new FormData(form);
  setFormError(form);
  setBusy(form,true);
  message(tr("loading"));
  try{
    await api(`/properties/${property.id}/calendars`,{
      method:"POST",
      body:JSON.stringify({provider:"Airbnb",icalUrl:String(data.get("icalUrl")||"").trim()})
    });
    message(tr("calendarConnected"),"success");
    await syncDashboard();
  }catch(error){
    setFormError(form,error.message);
    message(error.message,"error");
  }
  finally{setBusy(form,false)}
}

async function syncCalendar(calendar){
  message(tr("loading"));
  try{
    const expectedRevision = calendarRevision(calendar);
    await api(`/calendars/${calendar.id}/sync`,{method:"POST",body:JSON.stringify({expectedRevision})});
    message(tr("calendarSynced"),"success");
    await syncDashboard();
  }catch(error){if(error.kind !== "stale")message(error.message,"error")}
}

async function setCalendarEnabled(calendar, enabled){
  message(tr("loading"));
  try{
    const expectedRevision = calendarRevision(calendar);
    await api(`/calendars/${calendar.id}${enabled ? "/activate" : ""}`,{
      method:enabled ? "POST" : "PUT",body:JSON.stringify(enabled ? {expectedRevision} : {mode:"Disabled",expectedRevision})});
    message(tr(enabled ? "calendarEnabled" : "calendarDisabled"),"success");
    await syncDashboard();
  }catch(error){if(error.kind !== "stale")message(error.message,"error")}
}

async function disconnectCalendar(calendar){
  if(!confirm(tr("disconnectCalendarConfirm"))) return;
  message(tr("loading"));
  try{
    const expectedRevision = calendarRevision(calendar);
    await api(`/calendars/${calendar.id}`,{method:"DELETE",body:JSON.stringify({expectedRevision})});
    message(tr("calendarDisconnected"),"success");
    await syncDashboard();
  }catch(error){if(error.kind !== "stale")message(error.message,"error")}
}

function formatSyncTime(value){
  if(!value) return tr("neverSynced");
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(document.documentElement.lang);
}

async function saveUnavailability(property, form, period = null){
  if (form.getAttribute("aria-busy") === "true") return;
  const data = new FormData(form);
  setFormError(form);
  form.setAttribute("aria-busy", "true");
  setBusy(form, true);
  message(tr("loading"));
  try {
    const saved = await api(period ? `/unavailability/${period.id}` : `/properties/${property.id}/unavailability`, {
      method:period ? "PUT" : "POST",
      body:JSON.stringify(hostPeriodDates(data))
    });
    property.unavailability = [...(property.unavailability || []).filter(item => item.id !== saved.id), saved]
      .sort((a,b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    renderProperties({propertyId:property.id,key:"blockSaved"});
    message(tr("blockSaved"), "success");
  } catch (error) {
    setFormError(form, error.message);
    message(error.message, "error");
  } finally {
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
      const changed = () => { save.hidden = from.value === period.from && to.value === lastNight; };
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

function renderProperties(blockFeedback = null){
  unsavedHostChanges=false;
  if (!propertiesNode) return;
  renderPropertyNavigation();
  calendarVerificationPanels.splice(0).forEach(panel=>panel.dispose());
  propertyAddressEditors.forEach(editor => editor.dispose());
  propertyAddressEditors.clear();
  propertiesNode.replaceChildren();

  if (!state.authenticated) return;

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
    card.className = `host-property ${expanded?"expanded":"collapsed"}`;
    card.dataset.propertyId=property.id;

    const head = document.createElement("div");
    head.className = "host-property-head";
    const title = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = property.title;
    const meta = document.createElement("span");
    const sleeps = Number(property.sleeps || property.bedrooms || 1);
    const accommodationType = property.accommodationType === "private_room" ? tr("privateRoom") : tr("entirePlace");
    meta.textContent = `${[property.city, property.country].filter(Boolean).join(", ")} · ${accommodationType} · ${tr("bedroom", Number(property.bedrooms))} · ${tr("sleepSummary", sleeps)}`;
    title.append(strong, meta);
    const headActions=document.createElement("div");
    headActions.className="host-property-head-actions";
    const togglePropertyButton=document.createElement("button");
    togglePropertyButton.type="button";
    togglePropertyButton.className="host-property-toggle";
    togglePropertyButton.textContent=expanded?"▴":"▾";
    togglePropertyButton.title=tr(expanded?"collapseProperty":"expandProperty");
    togglePropertyButton.setAttribute("aria-label",tr(expanded?"collapseProperty":"expandProperty"));
    togglePropertyButton.setAttribute("aria-expanded",String(expanded));
    togglePropertyButton.addEventListener("click",()=>{
      if(unsavedHostChanges && !confirm(tr("discardChanges")))return;
      if(expanded) expandedPropertyIds.delete(property.id);
      else expandedPropertyIds.add(property.id);
      renderProperties();
    });
    headActions.append(togglePropertyButton);
    head.append(title, headActions);
    card.append(head);
    if(!expanded){
      propertiesNode.append(card);
      return;
    }

    const settings=document.createElement("div");
    settings.className="host-subpanel host-property-settings";
    const settingsForm=document.createElement("form");
    settingsForm.className="host-settings-form";
    const titleLabel=document.createElement("label");
    titleLabel.className="host-property-title-field";
    const titleText=document.createElement("span");
    titleText.textContent=tr("internalLabel");
    const titleInput=document.createElement("input");
    titleInput.type="text";titleInput.name="title";titleInput.required=true;titleInput.maxLength=160;titleInput.value=property.title;
    titleLabel.append(titleText,titleInput);
    const addressEditor = window.ParrotAddress.create({
      id:`property-address-${property.id}`, tr, request:api,
      initial:property.address || null, location:property, onUnauthorized:addressSessionExpired
    });
    propertyAddressEditors.set(settingsForm, addressEditor);
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
    settingsForm.append(titleLabel,addressEditor.node,accommodationLabel,bedroomsLabel,sleepsLabel,saveSettings);
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
    } else {
      const form = document.createElement("form");
      form.className = "host-inline-form";
      const help = document.createElement("p");
      help.className = "host-inline-muted host-listing-help";
      help.textContent = tr("airbnbIdHelp");
      listing.append(help);

      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]+";
      input.name = "externalId";
      input.required = true;
      input.placeholder = tr("airbnbIdPlaceholder");
      const button = document.createElement("button");
      button.className = "button button-small";
      button.type = "submit";
      button.textContent = tr("saveAirbnb");
      form.append(input, button);
      form.addEventListener("submit", event => {
        event.preventDefault();
        addListing(property, form);
      });
      listing.append(form);
    }

    const syncPanel=document.createElement("div");
    syncPanel.className="host-subpanel host-calendar-sync";
    const syncTitle=document.createElement("h3");
    syncTitle.textContent=tr("calendarSync");
    syncPanel.append(syncTitle);

    if(externalCalendar){
      const status=document.createElement("div");
      status.className=`host-calendar-status ${externalCalendar.enabled===false ? "disabled" : (externalCalendar.status||"")}`;

      const statusTop=document.createElement("div");
      const statusLabel=document.createElement("strong");
      statusLabel.textContent=externalCalendar.enabled===false
        ? `Airbnb · ${tr("calendarDisabledStatus")}`
        : (externalCalendar.status==="connected" ? `Airbnb · ${tr("calendarConnectedStatus")}` : `Airbnb · ${tr("calendarError")}`);
      const last=document.createElement("span");
      last.textContent=tr("lastSync",formatSyncTime(externalCalendar.lastSyncedAt));
      statusTop.append(statusLabel,last);

      const stats=document.createElement("div");
      stats.className="host-calendar-stats";
      const reservations=Array.isArray(externalCalendar.reservationBlocks)?externalCalendar.reservationBlocks:[];
      const imported=document.createElement("span");
      imported.textContent=tr("reservationsImported",reservations.length);
      const ignored=document.createElement("span");
      ignored.textContent=tr("ignoredBlocks",Number(externalCalendar.platformUnavailableCount||0));
      stats.append(imported,ignored);

      const actions=document.createElement("div");
      actions.className="host-calendar-actions";
      const controlGroup=document.createElement("div");
      controlGroup.className="host-calendar-control-group";
      const syncButton=document.createElement("button");
      syncButton.type="button";syncButton.className="button button-small";syncButton.textContent=tr("syncNow");syncButton.disabled=externalCalendar.enabled===false;
      syncButton.addEventListener("click",()=>syncCalendar(externalCalendar));
      const toggleButton=document.createElement("button");
      toggleButton.type="button";toggleButton.className="text-button";toggleButton.textContent=tr(externalCalendar.enabled===false ? "enableCalendar" : "disableCalendar");
      toggleButton.addEventListener("click",()=>setCalendarEnabled(externalCalendar,externalCalendar.enabled===false));
      const disconnectButton=document.createElement("button");
      disconnectButton.type="button";disconnectButton.className="text-button danger host-calendar-delete";disconnectButton.textContent=tr("disconnectCalendar");
      disconnectButton.addEventListener("click",()=>disconnectCalendar(externalCalendar));
      controlGroup.append(syncButton,toggleButton);
      actions.append(controlGroup,disconnectButton);

      status.append(statusTop);
      if(window.ParrotCalendarVerification){
        const verification=window.ParrotCalendarVerification.create({calendar:externalCalendar,request:api,language:lang,onUnauthorized:addressSessionExpired,
          onStatus:value=>{statusLabel.hidden=String(value.status||"").toLowerCase()==="verified" && externalCalendar.enabled!==false && externalCalendar.status==="connected";}});
        calendarVerificationPanels.push(verification);
        syncTitle.textContent=verification.name;
        status.append(verification.node);
      }
      status.append(stats);
      if(externalCalendar.lastError){
        const err=document.createElement("p");err.className="host-inline-error";err.textContent=externalCalendar.lastError;status.append(err);
      }

      if(reservations.length){
        const blocks=document.createElement("div");
        blocks.className="host-calendar-blocks";
        reservations.forEach(block=>{
          const item=document.createElement("span");
          item.textContent=`${block.from} → ${block.to}`;
          blocks.append(item);
        });
        status.append(blocks);
      }

      syncPanel.append(status,actions);
    }else{
      if(property.listing?.url){
        const status=document.createElement("div");
        status.className="host-calendar-status host-calendar-unverified";
        const statusLabel=document.createElement("strong");
        statusLabel.textContent=tr("calendarNotConnectedUnverified");
        status.append(statusLabel);
        syncPanel.append(status);
      }
      const help=document.createElement("p");
      help.className="host-inline-muted host-listing-help";
      help.textContent=tr("calendarHelp");
      const form=document.createElement("form");
      form.className="host-inline-form host-calendar-form";
      const input=document.createElement("input");
      input.type="url";input.name="icalUrl";input.required=true;input.autocomplete="off";input.placeholder=tr("calendarUrl");
      const button=document.createElement("button");
      button.className="button button-small";button.type="submit";button.textContent=tr("connectCalendar");
      form.append(input,button);
      form.addEventListener("submit",event=>{event.preventDefault();connectCalendar(property,form)});
      syncPanel.append(help,form);
    }

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
    staySettingsForm.addEventListener("submit",event=>{event.preventDefault();updatePropertySettings(property,staySettingsForm)});
    calendar.append(staySettingsForm);

    const addForm = document.createElement("form");
    addForm.className = "host-inline-form host-dates";
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
    } else if (!Array.isArray(property.availability)) {
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
      property.availability.forEach(period => {
        const row = document.createElement("form");
        row.className = "host-period";
        periodHeading(row, "savedPeriod");

        const from = document.createElement("input");
        from.type = "date";
        from.name = "from";
        from.required = true;
        from.value = period.from;
        const to = document.createElement("input");
        to.type = "date";
        to.name = "to";
        to.required = true;
        const lastNight = plusDays(period.to, -1);
        to.value = lastNight;
        to.min = period.from;
        from.addEventListener("change", () => {
          to.min = from.value;
          if (!to.value || to.value < from.value) to.value = from.value;
          to.refreshDateHint();
        });

        const nightly=document.createElement("input");
        nightly.type="number";nightly.min="0.01";nightly.step="0.01";nightly.placeholder=tr("nightlyPrice");nightly.value=centsToEuros(period.nightlyPriceCents);
        nightly.name="nightlyPrice";

        const save = document.createElement("button");
        save.type = "submit";
        save.className = "button button-small host-period-save";
        save.textContent = tr("save");
        save.hidden = true;
        const originalNightly = centsToEuros(period.nightlyPriceCents);
        const syncSaveVisibility = () => {
          save.hidden =
            from.value === period.from &&
            to.value === lastNight &&
            nightly.value === originalNightly;
        };
        [from,to,nightly].forEach(input => {
          input.addEventListener("input", syncSaveVisibility);
          input.addEventListener("change", syncSaveVisibility);
        });
        row.addEventListener("submit", event => {
          event.preventDefault();
          return updateAvailability(property, period, row);
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "text-button danger";
        remove.textContent = tr("remove");
        remove.addEventListener("click", () => deleteAvailability(property, period));

        const actions = document.createElement("div");
        actions.className = "host-period-actions";
        actions.append(save, remove);
        row.append(hostDateLabel(from, "firstNight"), hostDateLabel(to, "lastNight"), hostPriceLabel(nightly), actions);
        periods.append(row);
      });
    }

    calendar.append(periods);
    card.append(settings, listing);
    if(property.listing) card.append(syncPanel);
    card.append(calendar);
    card.append(renderUnavailability(property, blockFeedback?.propertyId===property.id ? blockFeedback.key : null));
    const footer = document.createElement("div");
    footer.className = "host-property-footer";
    const deletePropertyButton = document.createElement("button");
    deletePropertyButton.type = "button";
    deletePropertyButton.className = "text-button danger";
    deletePropertyButton.textContent = tr("deleteProperty");
    deletePropertyButton.addEventListener("click", () => deleteProperty(property));
    footer.append(deletePropertyButton);
    card.append(footer);
    propertiesNode.append(card);
  });
}

langButtons.forEach(btn => btn.addEventListener("click", () => {
  if(btn.dataset.hostLang===lang)return;
  if(unsavedHostChanges && !confirm(tr("discardChanges")))return;
  applyLanguage(btn.dataset.hostLang);
}));

hostCore.session.subscribe(({user, reason}) => {
  if(user) {
    const changed = accountId !== user.accountId;
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
      accountEmail:String(user.email || ""), username:String(user.username || ""), profile:user.profile || null};
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
