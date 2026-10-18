(() => {
  "use strict";
  const core = window.ParrotCore, session = core.session;
  const texts = {
    en: {
      messages:"Messages", writeHost:"Message host", conversations:"Conversations", emptyInbox:"No conversations yet. Start from a property in search.", chooseConversation:"Choose a conversation", from:"Check-in", to:"Check-out", datesOptional:"Stay dates (optional)", send:"Send message", sending:"Sending…", messageLabel:"Your message", placeholder:"Ask about the property or the stay…", loading:"Loading…", retry:"Try again", loadMore:"More conversations", earlier:"Earlier messages", backList:"All conversations", newEnquiry:"New enquiry", notBooking:"A message does not reserve the property.", login:"Log in", register:"Create account", loginLabel:"Email or username", password:"Password", username:"Username", displayName:"Display name", email:"Email", passwordHelp:"At least 10 characters.", usernameHelp:"Unique, case-insensitive. No @ symbol.", authLead:"Log in to message hosts and see your conversations.", registered:"Account created. Check your email (including spam), confirm it, then return here.", logout:"Log out", sessionExpired:"Log in again to continue. Your draft is kept for your account.", errorNetwork:"Could not connect. Please try again.", errorRate:"Too many messages. Wait a little and try again.", errorBlocked:"Messaging is blocked between these participants.", errorDisabled:"You can't send messages in this conversation.", errorDeleted:"This property was deleted. You can still read the conversation.", errorMissing:"This conversation or property is unavailable.", errorInput:"Check the message and dates.", block:"Block participant", unblock:"Unblock participant", confirmBlock:"Block this participant? Neither of you will be able to send messages to the other, including about other properties. History stays available.", blockedMe:"You blocked this participant. Unblock to resume messaging.", blockedOther:"This participant has blocked messaging.", pendingRetry:"Retry sending", pendingUnknown:"Delivery was not confirmed. Retry the same message safely; it will not be duplicated.", invalidDates:"Choose both dates. Check-out must be after check-in.", noSelf:"This is your property. You can reply to guests from your inbox.", newMessages:"New messages ↓", characterLimit:"Use 1–4000 characters.", authError:"Check your email/username and password.", verifyFirst:"Confirm your email before logging in.", draftRestored:"Draft restored", closed:"Read-only conversation", savedDates:"Stay"
    },
    es: {
      messages:"Mensajes", writeHost:"Escribir al propietario", conversations:"Conversaciones", emptyInbox:"Aún no hay conversaciones. Empieza desde una vivienda en la búsqueda.", chooseConversation:"Elige una conversación", from:"Entrada", to:"Salida", datesOptional:"Fechas de estancia (opcional)", send:"Enviar mensaje", sending:"Enviando…", messageLabel:"Tu mensaje", placeholder:"Pregunta por la vivienda o la estancia…", loading:"Cargando…", retry:"Reintentar", loadMore:"Más conversaciones", earlier:"Mensajes anteriores", backList:"Todas las conversaciones", newEnquiry:"Nueva consulta", notBooking:"Un mensaje no reserva la vivienda.", login:"Entrar", register:"Crear cuenta", loginLabel:"Email o usuario", password:"Contraseña", username:"Usuario", displayName:"Nombre visible", email:"Email", passwordHelp:"Al menos 10 caracteres.", usernameHelp:"Único, sin distinguir mayúsculas. Sin @.", authLead:"Entra para escribir a propietarios y ver tus conversaciones.", registered:"Cuenta creada. Revisa tu correo (también spam), confírmalo y vuelve aquí.", logout:"Salir", sessionExpired:"Vuelve a entrar para continuar. Tu borrador se conserva para tu cuenta.", errorNetwork:"No se pudo conectar. Inténtalo de nuevo.", errorRate:"Demasiados mensajes. Espera un poco y vuelve a intentarlo.", errorBlocked:"La comunicación entre estos participantes está bloqueada.", errorDisabled:"No puedes enviar mensajes en esta conversación.", errorDeleted:"La vivienda se ha eliminado. Puedes seguir leyendo la conversación.", errorMissing:"La conversación o vivienda no está disponible.", errorInput:"Revisa el mensaje y las fechas.", block:"Bloquear participante", unblock:"Desbloquear participante", confirmBlock:"¿Bloquear a este participante? Ninguno podrá escribir al otro, tampoco sobre otras viviendas. El historial se conserva.", blockedMe:"Has bloqueado a este participante. Desbloquéalo para continuar.", blockedOther:"Este participante ha bloqueado los mensajes.", pendingRetry:"Reintentar envío", pendingUnknown:"No se confirmó la entrega. Reintenta el mismo mensaje; no se duplicará.", invalidDates:"Elige ambas fechas. La salida debe ser posterior a la entrada.", noSelf:"Esta es tu vivienda. Puedes responder a los huéspedes desde tu bandeja.", newMessages:"Mensajes nuevos ↓", characterLimit:"Usa entre 1 y 4000 caracteres.", authError:"Revisa tu email/usuario y contraseña.", verifyFirst:"Confirma tu email antes de entrar.", draftRestored:"Borrador recuperado", closed:"Conversación de solo lectura", savedDates:"Estancia"
    },
    ca: {
      messages:"Missatges", writeHost:"Escriure al propietari", conversations:"Converses", emptyInbox:"Encara no hi ha converses. Comença des d'un habitatge de la cerca.", chooseConversation:"Tria una conversa", from:"Entrada", to:"Sortida", datesOptional:"Dates d'estada (opcional)", send:"Enviar missatge", sending:"Enviant…", messageLabel:"El teu missatge", placeholder:"Pregunta per l'habitatge o l'estada…", loading:"Carregant…", retry:"Torna-ho a provar", loadMore:"Més converses", earlier:"Missatges anteriors", backList:"Totes les converses", newEnquiry:"Nova consulta", notBooking:"Un missatge no reserva l'habitatge.", login:"Entrar", register:"Crear compte", loginLabel:"Correu o usuari", password:"Contrasenya", username:"Usuari", displayName:"Nom visible", email:"Correu electrònic", passwordHelp:"Com a mínim 10 caràcters.", usernameHelp:"Únic, sense distingir majúscules. Sense @.", authLead:"Entra per escriure als propietaris i veure les teves converses.", registered:"Compte creat. Revisa el correu (també la brossa), confirma'l i torna aquí.", logout:"Sortir", sessionExpired:"Torna a entrar per continuar. L'esborrany es conserva per al teu compte.", errorNetwork:"No s'ha pogut connectar. Torna-ho a provar.", errorRate:"Massa missatges. Espera una mica i torna-ho a provar.", errorBlocked:"La comunicació entre aquests participants està bloquejada.", errorDisabled:"No pots enviar missatges en aquesta conversa.", errorDeleted:"L'habitatge s'ha eliminat. Encara pots llegir la conversa.", errorMissing:"La conversa o l'habitatge no està disponible.", errorInput:"Revisa el missatge i les dates.", block:"Bloquejar participant", unblock:"Desbloquejar participant", confirmBlock:"Vols bloquejar aquest participant? Cap dels dos podrà escriure a l'altre, tampoc sobre altres habitatges. Es conserva l'historial.", blockedMe:"Has bloquejat aquest participant. Desbloqueja'l per continuar.", blockedOther:"Aquest participant ha bloquejat els missatges.", pendingRetry:"Reintentar enviament", pendingUnknown:"No s'ha confirmat el lliurament. Reintenta el mateix missatge; no es duplicarà.", invalidDates:"Tria totes dues dates. La sortida ha de ser posterior a l'entrada.", noSelf:"Aquest és el teu habitatge. Pots respondre als hostes des de la bústia.", newMessages:"Missatges nous ↓", characterLimit:"Fes servir entre 1 i 4000 caràcters.", authError:"Revisa el correu/usuari i la contrasenya.", verifyFirst:"Confirma el correu abans d'entrar.", draftRestored:"Esborrany recuperat", closed:"Conversa de només lectura", savedDates:"Estada"
    },
    ru: {
      messages:"Сообщения", writeHost:"Написать владельцу", conversations:"Диалоги", emptyInbox:"Диалогов пока нет. Написать владельцу можно из результатов поиска.", chooseConversation:"Выберите диалог", from:"Заезд", to:"Выезд", datesOptional:"Даты поездки (необязательно)", send:"Отправить", sending:"Отправляем…", messageLabel:"Ваше сообщение", placeholder:"Спросите о жилье или условиях проживания…", loading:"Загружаем…", retry:"Повторить", loadMore:"Ещё диалоги", earlier:"Предыдущие сообщения", backList:"Все диалоги", newEnquiry:"Новое обращение", notBooking:"Сообщение не бронирует жильё.", login:"Войти", register:"Создать аккаунт", loginLabel:"Email или имя пользователя", password:"Пароль", username:"Имя пользователя", displayName:"Отображаемое имя", email:"Email", passwordHelp:"Не менее 10 символов.", usernameHelp:"Уникальное, без учёта регистра. Без символа @.", authLead:"Войдите, чтобы писать владельцам и читать свои диалоги.", registered:"Аккаунт создан. Проверьте почту, включая спам, подтвердите email и вернитесь сюда.", logout:"Выйти", sessionExpired:"Войдите снова, чтобы продолжить. Черновик сохранён для вашего аккаунта.", errorNetwork:"Не удалось связаться с сервером. Попробуйте ещё раз.", errorRate:"Слишком много сообщений. Немного подождите и повторите.", errorBlocked:"Переписка между этими участниками заблокирована.", errorDisabled:"В этом диалоге нельзя отправлять сообщения.", errorDeleted:"Объект удалён. Историю переписки можно читать.", errorMissing:"Диалог или объект недоступен.", errorInput:"Проверьте текст сообщения и даты.", block:"Заблокировать собеседника", unblock:"Разблокировать собеседника", confirmBlock:"Заблокировать собеседника? Вы оба больше не сможете писать друг другу, в том числе о других объектах. История останется доступна.", blockedMe:"Вы заблокировали собеседника. Чтобы продолжить переписку, разблокируйте его.", blockedOther:"Собеседник заблокировал переписку.", pendingRetry:"Повторить отправку", pendingUnknown:"Не удалось подтвердить отправку. Повторите то же сообщение — дубликата не будет.", invalidDates:"Укажите обе даты. Выезд должен быть позже заезда.", noSelf:"Это ваш объект. Ответить гостям можно из списка диалогов.", newMessages:"Новые сообщения ↓", characterLimit:"От 1 до 4000 символов.", authError:"Проверьте email/имя пользователя и пароль.", verifyFirst:"Перед входом подтвердите email.", draftRestored:"Черновик восстановлен", closed:"Диалог только для чтения", savedDates:"Поездка"
    }
  };
  const emailCopy = {
    en:{emailSettings:"Email notifications",emailEnabled:"Email me about unread messages",emailLanguage:"Email language"},
    es:{emailSettings:"Notificaciones por email",emailEnabled:"Recibir emails sobre mensajes sin leer",emailLanguage:"Idioma de los emails"},
    ca:{emailSettings:"Notificacions per correu",emailEnabled:"Rebre correus sobre missatges sense llegir",emailLanguage:"Idioma dels correus"},
    ru:{emailSettings:"Email-уведомления",emailEnabled:"Получать письма о непрочитанных сообщениях",emailLanguage:"Язык писем"}
  };
  Object.entries(emailCopy).forEach(([key,value]) => Object.assign(texts[key],value));
  Object.entries({en:"Forgot password?",es:"¿Has olvidado la contraseña?",ca:"Has oblidat la contrasenya?",ru:"Забыли пароль?"}).forEach(([key,value])=>texts[key].forgotPassword=value);
  let lang = "en", unreadBusy = false, unreadTotal = 0, initialSearchSession = null;
  const languageSubscribers = new Set();
  const contactCache = new Map();
  let contactActive = 0;
  const contactQueue = [];
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };
  Object.assign(texts.en,{askCalendarVerification:"Ask the host to verify the calendar",verifyCalendarDraft:"Could you please confirm control of the calendar for this property on PARROT?"});
  Object.assign(texts.es,{askCalendarVerification:"Pedir al propietario que verifique el calendario",verifyCalendarDraft:"¿Podrías confirmar el control del calendario de esta vivienda en PARROT?"});
  Object.assign(texts.ca,{askCalendarVerification:"Demanar al propietari que verifiqui el calendari",verifyCalendarDraft:"Podries confirmar el control del calendari d'aquest habitatge a PARROT?"});
  Object.assign(texts.ru,{askCalendarVerification:"Попросить владельца подтвердить календарь",verifyCalendarDraft:"Можете, пожалуйста, подтвердить контроль календаря этого жилья в PARROT?"});
  Object.assign(texts.en,{authLead:"Log in to see your private conversations. To contact a host, start from a property in search.",authToSend:"Your message is ready. Log in or create an account to send it; your draft will stay here.",guestComposerHelp:"Write your message now. Log in or create an account to send it and keep the conversation private.",findHousing:"Find housing"});
  Object.assign(texts.es,{authLead:"Entra para ver tus conversaciones privadas. Para escribir a un propietario, empieza por una vivienda en la búsqueda.",authToSend:"Tu mensaje está listo. Entra o crea una cuenta para enviarlo; conservaremos el borrador aquí.",guestComposerHelp:"Escribe tu mensaje ahora. Entra o crea una cuenta para enviarlo y mantener privada la conversación.",findHousing:"Buscar vivienda"});
  Object.assign(texts.ca,{authLead:"Entra per veure les teves converses privades. Per escriure a un propietari, comença per un habitatge de la cerca.",authToSend:"El teu missatge és a punt. Entra o crea un compte per enviar-lo; conservarem l'esborrany aquí.",guestComposerHelp:"Escriu el missatge ara. Entra o crea un compte per enviar-lo i mantenir privada la conversa.",findHousing:"Cercar habitatge"});
  Object.assign(texts.ru,{authLead:"Войдите, чтобы читать личные диалоги. Чтобы написать владельцу, выберите жильё в поиске.",authToSend:"Сообщение готово. Войдите или создайте аккаунт для отправки — черновик сохранится здесь.",guestComposerHelp:"Напишите сообщение сейчас. Для отправки войдите или создайте аккаунт; переписка останется приватной.",findHousing:"Найти жильё"});
  Object.assign(texts.en,{ownProfile:"My host profile"});
  Object.assign(texts.es,{ownProfile:"Mi perfil de anfitrión"});
  Object.assign(texts.ca,{ownProfile:"El meu perfil d'amfitrió"});
  Object.assign(texts.ru,{ownProfile:"Мой профиль хозяина"});
  Object.assign(texts.en,{openProperty:"Open property ↗"});
  Object.assign(texts.es,{openProperty:"Abrir vivienda ↗"});
  Object.assign(texts.ca,{openProperty:"Obrir habitatge ↗"});
  Object.assign(texts.ru,{openProperty:"Открыть объект ↗"});
  Object.assign(texts.en,{backToSite:"← Back to site",account:"Account"});
  Object.assign(texts.es,{backToSite:"← Volver al sitio",account:"Cuenta"});
  Object.assign(texts.ca,{backToSite:"← Tornar al web",account:"Compte"});
  Object.assign(texts.ru,{backToSite:"← Назад на сайт",account:"Аккаунт"});
  Object.assign(texts.en,{messagesEyebrow:"PRIVATE CONVERSATIONS",messagesTitleFirst:"Plan the stay.",messagesTitleAccent:"Keep the conversation together.",messagesLead:"Your conversations with hosts and guests live here."});
  Object.assign(texts.es,{messagesEyebrow:"CONVERSACIONES PRIVADAS",messagesTitleFirst:"Organiza la estancia.",messagesTitleAccent:"Mantén la conversación en un solo lugar.",messagesLead:"Aquí encontrarás tus conversaciones con propietarios y huéspedes."});
  Object.assign(texts.ca,{messagesEyebrow:"CONVERSES PRIVADES",messagesTitleFirst:"Organitza l’estada.",messagesTitleAccent:"Mantén la conversa en un sol lloc.",messagesLead:"Aquí trobaràs les converses amb propietaris i hostes."});
  Object.assign(texts.ru,{messagesEyebrow:"ЛИЧНЫЕ ДИАЛОГИ",messagesTitleFirst:"Обсудите поездку.",messagesTitleAccent:"Сохраните всё в одном диалоге.",messagesLead:"Здесь хранятся ваши диалоги с владельцами и гостями."});
  Object.assign(texts.en,{unreadShort:"Unread",unreadCount:n=>`${n} unread message${n===1?"":"s"}`});
  Object.assign(texts.es,{unreadShort:"Sin leer",unreadCount:n=>`${n} mensaje${n===1?"":"s"} sin leer`});
  Object.assign(texts.ca,{unreadShort:"Sense llegir",unreadCount:n=>`${n} missatge${n===1?"":"s"} sense llegir`});
  Object.assign(texts.ru,{unreadShort:"Не прочитано",unreadCount:n=>`${n} ${n%10===1 && n%100!==11 ? "непрочитанное сообщение" : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? "непрочитанных сообщения" : "непрочитанных сообщений"}`});
  function t(key) { return texts[lang][key] || texts.en[key] || key; }
  function renderUnread(){
    document.querySelectorAll("[data-msg-unread]").forEach(el => {
      el.textContent = unreadTotal ? unreadTotal > 99 ? "99+" : String(unreadTotal) : "";
      el.hidden = !unreadTotal;
      const link = el.closest(".messaging-nav-link");
      if (link) {
        link.classList.toggle("has-unread",Boolean(unreadTotal));
        link.setAttribute("aria-label",unreadTotal ? `${t("messages")}, ${t("unreadCount")(unreadTotal)}` : t("messages"));
      }
    });
  }
  function setLanguage(value) {
    lang = texts[value] ? value : "en";
    document.querySelectorAll("[data-msg-i18n]").forEach(el => el.textContent = t(el.dataset.msgI18n));
    document.querySelectorAll("[data-msg-placeholder]").forEach(el => el.placeholder = t(el.dataset.msgPlaceholder));
    renderUnread();
    languageSubscribers.forEach(fn => fn(lang));
  }
  function errorText(error) {
    const detail = error?.message || "";
    const keys = {EMAIL_VERIFICATION_REQUIRED:"verifyFirst", MESSAGING_BLOCKED:"errorBlocked", MESSAGING_PROPERTY_DELETED:"errorDeleted"};
    if(keys[error?.code]) return t(keys[error.code]);
    if (error?.status === 401) return t("sessionExpired");
    if (error?.status === 404) return t("errorMissing");
    if (error?.status === 429) return t("errorRate");
    if (!error?.status || error.status >= 500) return t("errorNetwork");
    return detail || t("errorInput");
  }
  const api = (path, options = {}) => session.request(`/api/messaging${path}`, {...options, authenticated:true,
    ...(path.startsWith('/conversations/for-property/') ? {validate:value => value === null || typeof value === 'object'} : {})});
  const auth = core.auth;
  const setUser = (value, options) => session.setUser(value, options);
  const refreshSession = () => session.refresh();
  async function refreshUnread({allowHidden=false} = {}) {
    if (!session.user || unreadBusy || (!allowHidden && document.visibilityState === "hidden")) return;
    unreadBusy = true;
    const version = session.epoch;
    try {
      const value = await api("/unread");
      if (version !== session.epoch) return;
      unreadTotal = Math.max(0,Number(value.messages) || 0);
      renderUnread();
    } catch (error) { if (error.status === 401 && version === session.epoch) setUser(null); }
    finally { unreadBusy = false; }
  }
  function contactOptions(id) {
    const cached = contactCache.get(id);
    if (cached && cached.until > Date.now()) return cached.promise;
    const promise = new Promise((resolve, reject) => { contactQueue.push({id, resolve, reject}); pumpContacts(); });
    if (contactCache.size > 300) contactCache.clear();
    contactCache.set(id, {promise, until:Date.now() + 30000});
    return promise;
  }
  function pumpContacts() {
    while (contactActive < 4 && contactQueue.length) {
      const job = contactQueue.shift(); contactActive++;
      api(`/contact-options/${encodeURIComponent(job.id)}`).then(job.resolve, error => {
        contactCache.delete(job.id); job.reject(error);
      }).finally(() => { contactActive--; pumpContacts(); });
    }
  }
  function attachContact(container, property) {
    const link = node("a", "availability-link message-property-link", t("writeHost"));
    link.dataset.msgI18n = "writeHost";
    const params = new URLSearchParams({property:property.propertyId});
    if (property.availableFrom && property.availableTo) {
      params.set("from", property.availableFrom); params.set("to", property.availableTo);
    }
    link.href = `/messages.html?${params}`;
    container.append(link);
    const canNudge = (property.links || []).some(item => item.calendarControlStatus && item.calendarControlStatus !== "verified");
    const nudge = canNudge ? node("a", "availability-verify-nudge", t("askCalendarVerification")) : null;
    if (nudge) {
      nudge.dataset.msgI18n = "askCalendarVerification";
      const request = new URLSearchParams(params);
      request.set("verifyCalendar", "1");
      nudge.href = `/messages.html?${request}`;
      container.append(nudge);
    }
    const currentSession = session.user === undefined ? (initialSearchSession || refreshSession().catch(() => null)) : Promise.resolve(session.user);
    return Promise.all([contactOptions(property.propertyId), currentSession]).then(([options,currentUser]) => {
      const self = Boolean(currentUser?.profile?.id) && options.hostProfileId === currentUser.profile.id;
      link.hidden = self;
      if (nudge) nudge.hidden = self;
      return self;
    }).catch(() => false);
  }
  function resumeAfterVerification() {
    try {
      const saved = JSON.parse(core.storage.local.getItem("parrot669-message-return") || "null");
      core.storage.local.removeItem("parrot669-message-return");
      if (!saved || saved.expires < Date.now()) return;
      const url = new URL(saved.path, window.location.origin);
      if (url.origin === window.location.origin && ["/messages", "/messages.html"].includes(url.pathname))
        window.location.assign(url.pathname + url.search);
    } catch {}
  }
  function clearDrafts(accountId) {
    try {
      const prefix = `parrot669-draft:${accountId}:`;
      for (let i = core.storage.session.length - 1; i >= 0; i--) {
        const key = core.storage.session.key(i); if (key?.startsWith(prefix)) core.storage.session.removeItem(key);
      }
    } catch {}
  }
  window.ParrotMessaging = {t, node, api, auth, errorText, setLanguage, setUser, refreshSession, refreshUnread,
    attachContact, resumeAfterVerification, clearDrafts, get user() { return session.user; },
    onSession(fn) { return session.subscribe(({user}) => fn(user)); },
    onLanguage(fn) { languageSubscribers.add(fn); }};
  try { setLanguage(core.storage.local.getItem("parrot669-language") || navigator.language.slice(0,2)); } catch { setLanguage("en"); }
  setInterval(() => void refreshUnread(), 30000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshSession().then(refreshUnread).catch(() => {});
  });
  let previousEpoch = session.epoch;
  session.subscribe(() => {
    if(previousEpoch !== session.epoch) {
      previousEpoch = session.epoch; unreadTotal=0; contactCache.clear(); renderUnread();
    }
    if(session.user) void refreshUnread({allowHidden:true});
  });

  if (document.body.classList.contains("search-page")) initialSearchSession = refreshSession().catch(() => null);
})();
