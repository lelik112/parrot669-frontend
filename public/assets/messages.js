(() => {
  "use strict";
  const M = window.ParrotMessaging, t = M.t, node = M.node;
  const $ = id => document.getElementById(id);
  const app = $("messages-app"), historyNode = $("msg-history"), form = $("msg-compose");
  const loginForm = $("msg-login-form"), registerForm = $("msg-register-form");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let actor = null, accountVersion = 0, threadVersion = 0, inboxVersion = 0;
  const initialQuery = new URLSearchParams(window.location.search);
  const calendarNudgeProperty = initialQuery.get("verifyCalendar") === "1" ? initialQuery.get("property") : null;
  let calendarNudgeApplied = false;
  let active = null, inbox = [], nextCursor = null, inboxBusy = false, pollBusy = false;
  let messages = new Map(), fetchedThrough = 0, readThrough = 0, readBusy = false;
  let sending = false, pending = null, authBusy = false, threadError = null;
  let authRequested = false, guestLoginAccount = null;
  const guestDraftKey = propertyId => `parrot669-guest-draft:property:${propertyId}`;
  const registrationDraftKey = "parrot669-registration-draft";
  const registrationTabKey = "parrot669-registration-intent";
  const profileReturnKey = "parrot669-profile-return";

  function status(text = "", error = false, target = $("msg-status")) {
    target.textContent = text; target.classList.toggle("error", error);
    target.setAttribute("role", error ? "alert" : "status");
  }
  function failed(error, target = $("msg-status")) {
    if (error.status === 401) { M.setUser(null); target = $("msg-status"); }
    if (target === $("msg-thread-notice")) threadError = error;
    status(M.errorText(error), true, target);
  }
  function dateLabel(value) {
    return new Intl.DateTimeFormat(document.documentElement.lang, {day:"numeric", month:"short", year:"numeric", timeZone:"UTC"})
      .format(new Date(value + "T12:00:00Z"));
  }
  function validDates(from, to) {
    if (!from && !to) return true;
    const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    return valid(from) && valid(to) && to > from;
  }
  function queryDates() {
    const query = new URLSearchParams(window.location.search);
    const from = query.get("from") || "", to = query.get("to") || "";
    return validDates(from,to) ? {from,to} : {from:"",to:""};
  }
  function draftKey(context = active) {
    if (!context) return null;
    return actor ? `parrot669-draft:${actor.accountId}:${context.id || `property:${context.propertyId}`}` :
      context.propertyId ? guestDraftKey(context.propertyId) : null;
  }
  function saveDraft() {
    const key = draftKey(); if (!key) return;
    const draft = {body:form.elements.body.value,from:form.elements.from.value,
      to:form.elements.to.value,...(actor ? {pending} : {}),savedAt:Date.now()};
    try {
      window.ParrotCore.storage.session.setItem(key, JSON.stringify(draft));
    } catch {}
    if (!actor) try {
      const handoff = JSON.parse(window.ParrotCore.storage.local.getItem(registrationDraftKey) || "null");
      if (handoff?.propertyId === active?.propertyId && handoff.nonce === window.ParrotCore.storage.session.getItem(registrationTabKey) &&
          handoff.savedAt > Date.now() - 86400000)
        window.ParrotCore.storage.local.setItem(registrationDraftKey,JSON.stringify({...handoff,draft,savedAt:Date.now()}));
    } catch {}
  }
  function removeDraft(key) { try { if (key) window.ParrotCore.storage.session.removeItem(key); } catch {} }
  function promoteGuestDraft(user) {
    const propertyId = new URLSearchParams(window.location.search).get("property");
    if (!uuid.test(propertyId || "")) return;
    try {
      const marker = JSON.parse(window.ParrotCore.storage.local.getItem(registrationDraftKey) || "null");
      const fromRegistration = marker?.propertyId === propertyId && marker.savedAt > Date.now() - 86400000 &&
        marker.username?.toLowerCase() === user.username?.toLowerCase();
      // Once registration claims the guest draft, a different account must not inherit it via login.
      if (marker?.propertyId === propertyId && marker.savedAt > Date.now() - 86400000 && !fromRegistration) return;
      if (guestLoginAccount !== user.accountId && !fromRegistration) return;
      const key = guestDraftKey(propertyId);
      const localDraft = JSON.parse(window.ParrotCore.storage.session.getItem(key) || "null");
      const draft = localDraft?.savedAt > Date.now() - 86400000 ? localDraft : fromRegistration ? marker.draft : null;
      if (typeof draft?.body === "string" && draft.savedAt > Date.now() - 86400000) {
        window.ParrotCore.storage.session.setItem(`parrot669-draft:${user.accountId}:property:${propertyId}`,
          JSON.stringify({body:draft.body,from:draft.from || "",to:draft.to || "",pending:null,savedAt:Date.now()}));
        window.ParrotCore.storage.session.removeItem(key);
      }
      window.ParrotCore.storage.local.removeItem(registrationDraftKey);
      window.ParrotCore.storage.session.removeItem(registrationTabKey);
    } catch {}
  }
  function restoreDraft(dates = {}) {
    let draft = null;
    try {
      draft = JSON.parse(window.ParrotCore.storage.session.getItem(draftKey()) || "null");
      if (draft?.savedAt < Date.now() - 86400000 || typeof draft?.body !== "string") draft = null;
    } catch {}
    form.reset();
    const prefill = !calendarNudgeApplied && calendarNudgeProperty === active?.propertyId && !draft;
    form.elements.body.value = draft?.body || (prefill ? t("verifyCalendarDraft") : "");
    form.elements.from.value = draft?.from || dates.from || "";
    form.elements.to.value = draft?.to || dates.to || "";
    pending = actor ? draft?.pending || null : null;
    if (pending && !(uuid.test(pending.payload?.clientMessageId) &&
      (pending.endpoint === "/conversations" && pending.payload.propertyId === active.propertyId ||
       pending.endpoint === `/conversations/${active.id}/messages`))) pending = null;
    if (prefill) { calendarNudgeApplied = true; saveDraft(); }
    $("msg-dates").open = Boolean(form.elements.from.value || form.elements.to.value);
    updateComposer();
  }
  function setUrl(id) {
    const url = new URL(window.location.href); url.search = "";
    if (id) url.searchParams.set("conversation", id);
    if (url.pathname + url.search !== window.location.pathname + window.location.search)
      window.history.pushState(null, "", url.pathname + url.search);
  }
  function updateComposer() {
    form.hidden = !active?.canReply;
    for (const input of form.querySelectorAll("textarea,input")) input.disabled = sending || Boolean(pending);
    $("msg-send").disabled = sending || !active?.canReply;
    $("msg-send").textContent = t(sending ? "sending" : pending ? "pendingRetry" : "send");
    $("msg-block").hidden = !active?.id;
    $("msg-block").textContent = t(active?.blockedByMe ? "unblock" : "block");
    const notice = active?.blockedByMe ? "blockedMe" : active?.blockedByOther ? "blockedOther" :
      active?.id && !active.propertyId ? "errorDeleted" : active?.self ? "noSelf" :
      active && !active.canReply ? "errorDisabled" : pending ? "pendingUnknown" : null;
    status(threadError ? M.errorText(threadError) : notice ? t(notice) : "", Boolean(pending || threadError), $("msg-thread-notice"));
  }
  function renderContext() {
    $("msg-property").textContent = active?.propertyTitle || t("newEnquiry");
    $("msg-other").textContent = active?.otherDisplayName || "";
    $("msg-own-profile").hidden = !actor?.accountId || !active?.id || active.hostProfileId !== actor.profile?.id;
    const propertyLink = $("msg-open-property");
    const ownProperty = actor?.profile?.id && active?.hostProfileId === actor.profile?.id &&
      uuid.test(active?.propertyId || "") && uuid.test(active?.id || "");
    propertyLink.hidden = !ownProperty;
    if (ownProperty) propertyLink.href = `/host.html?property=${active.propertyId}&conversation=${active.id}`;
    else propertyLink.removeAttribute("href");
    updateComposer();
  }
  function renderInbox() {
    const list = $("msg-list"); list.replaceChildren();
    for (const item of inbox) {
      const button = node("button", "messages-conversation"); button.type = "button";
      button.setAttribute("aria-current", String(item.id === active?.id));
      const unread = Number(item.unreadCount) > 0;
      button.classList.toggle("unread",unread);
      button.append(node("strong", "", item.propertyTitle), node("span", "", item.otherDisplayName), node("small", "", item.lastMessagePreview));
      if (unread) {
        button.append(node("span", "messages-unread-label", t("unreadShort")),
          node("span", "messaging-badge", item.unreadCount > 99 ? "99+" : item.unreadCount));
        button.setAttribute("aria-label",`${item.propertyTitle}, ${item.otherDisplayName}, ${t("unreadCount")(item.unreadCount)}. ${item.lastMessagePreview}`);
      }
      button.addEventListener("click", () => void openConversation(item.id)); list.append(button);
    }
    $("msg-more").hidden = !nextCursor;
    status(inbox.length ? "" : t("emptyInbox"), false, $("msg-inbox-status"));
  }
  async function loadInbox(more = false) {
    if (!actor || inboxBusy) return;
    inboxBusy = true; const version = accountVersion, request = ++inboxVersion;
    $("msg-more").disabled = true;
    try {
      const cursor = more && nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : "";
      const page = await M.api(`/conversations?limit=20${cursor}`);
      if (version !== accountVersion || request !== inboxVersion) return;
      const merged = new Map(inbox.map(item => [item.id,item]));
      page.items.forEach(item => merged.set(item.id,item));
      inbox = [...merged.values()].sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt) || b.id.localeCompare(a.id));
      if (more || inbox.length <= 20) nextCursor = page.nextCursor;
      renderInbox();
    } catch (error) { if (version === accountVersion) failed(error,$("msg-inbox-status")); }
    finally { if (version === accountVersion) { inboxBusy = false; $("msg-more").disabled = false; } }
  }
  function atBottom() { return historyNode.scrollHeight - historyNode.scrollTop - historyNode.clientHeight < 45; }
  function threadVisible() { return !document.hidden && document.hasFocus() && historyNode.getClientRects().length > 0; }
  function renderMessages({bottom = false, older = false} = {}) {
    const previousHeight = historyNode.scrollHeight, previousTop = historyNode.scrollTop;
    const wasBottom = atBottom();
    historyNode.replaceChildren();
    for (const item of [...messages.values()].sort((a,b) => a.sequence-b.sequence)) {
      const bubble = node("article", `message-bubble${item.senderProfileId === actor?.profile?.id ? " mine" : ""}`);
      if (item.from && item.to) bubble.append(node("p", "message-stay", `${t("savedDates")}: ${dateLabel(item.from)} → ${dateLabel(item.to)}`));
      bubble.append(node("p", "", item.body));
      const time = node("time", "", new Intl.DateTimeFormat(document.documentElement.lang,
        {day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt)));
      time.dateTime = item.createdAt; bubble.append(time); historyNode.append(bubble);
    }
    $("msg-earlier").hidden = !messages.size || Math.min(...messages.keys()) <= 1;
    if (older) historyNode.scrollTop = previousTop + historyNode.scrollHeight - previousHeight;
    else if (bottom || wasBottom) historyNode.scrollTop = historyNode.scrollHeight;
    else historyNode.scrollTop = previousTop;
    $("msg-jump").hidden = atBottom();
    requestAnimationFrame(() => void acknowledgeRead());
  }
  async function acknowledgeRead() {
    if (!active?.id || readBusy || !atBottom() || !threadVisible() || fetchedThrough <= readThrough) return;
    const version = threadVersion, id = active.id, sequence = fetchedThrough;
    readBusy = true;
    try {
      const value = await M.api(`/conversations/${id}/read`, {method:"PUT", body:JSON.stringify({throughSequence:sequence})});
      if (version !== threadVersion) return;
      readThrough = Math.max(readThrough,value.throughSequence);
      // Only a fresh server count can account for a simultaneous incoming message.
      void loadInbox(); void M.refreshUnread();
    } catch (error) { if (error.status === 401 && version === threadVersion) M.setUser(null); }
    finally { if (version === threadVersion) readBusy = false; }
  }
  async function fetchMessages(version, {initial = false, older = false} = {}) {
    const id = active.id;
    let after = older ? Math.max(0,Math.min(...messages.keys()) - 51) : initial ? Math.max(0,active.lastSequence-50) : fetchedThrough;
    const page = await M.api(`/conversations/${id}/messages?afterSequence=${after}&limit=${older ? 50 : 100}`);
    if (version !== threadVersion) return;
    let changed = false;
    for (const item of page.items) { if (!messages.has(item.sequence)) changed = true; messages.set(item.sequence,item); }
    if (!older && page.items.length) fetchedThrough = Math.max(fetchedThrough,page.items.at(-1).sequence);
    // A previous send may have committed even when its response was lost.
    if (pending && page.items.some(item => item.senderProfileId === actor.profile.id && item.clientMessageId === pending.payload.clientMessageId)) {
      pending = null; threadError = null; form.reset(); removeDraft(draftKey()); updateComposer();
    }
    if (initial || changed) renderMessages({bottom:initial, older});
    if (!older && page.nextAfterSequence) await fetchMessages(version);
  }
  function prepareThread() {
    saveDraft(); threadVersion++; messages = new Map(); fetchedThrough = 0; readThrough = 0; readBusy = false;
    sending = false; pending = null; active = null; threadError = null;
    form.reset(); form.hidden = true; $("msg-thread").hidden = false; $("msg-empty").hidden = true;
    $("msg-block").disabled = false; $("msg-earlier").disabled = false;
    $("msg-earlier").hidden = true; $("msg-jump").hidden = true;
    historyNode.replaceChildren(); app.classList.add("has-thread");
    renderContext();
    status(t("loading"), false, $("msg-thread-notice"));
    return threadVersion;
  }
  async function openConversation(id, dates = {}, known = null, updateHistory = true) {
    if (!uuid.test(id)) return status(t("errorMissing"),true);
    const version = prepareThread();
    try {
      const detail = known || await M.api(`/conversations/${id}`);
      if (version !== threadVersion) return;
      active = detail; readThrough = detail.readThroughSequence;
      if(updateHistory) setUrl(id);
      restoreDraft(dates); renderContext(); renderInbox(); status();
      await fetchMessages(version,{initial:true});
    } catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
  }
  async function openEnquiry(propertyId, dates, updateHistory = true) {
    const version = prepareThread();
    try {
      const [options, existing] = await Promise.all([M.api(`/contact-options/${propertyId}`), M.api(`/conversations/for-property/${propertyId}`)]);
      if (version !== threadVersion) return;
      if (existing) {
        // Move a pending first send to its server-created conversation without changing its idempotency key.
        try {
          const oldKey = `parrot669-draft:${actor.accountId}:property:${propertyId}`;
          const draft = window.ParrotCore.storage.session.getItem(oldKey);
          if (draft) { window.ParrotCore.storage.session.setItem(`parrot669-draft:${actor.accountId}:${existing.id}`,draft); window.ParrotCore.storage.session.removeItem(oldKey); }
        } catch {}
        return await openConversation(existing.id,dates,existing,updateHistory);
      }
      active = {id:null,propertyId,propertyTitle:options.propertyTitle,otherDisplayName:options.hostDisplayName,
        self:Boolean(actor.profile?.id) && options.hostProfileId === actor.profile.id,
        canReply:!actor.profile?.id || options.hostProfileId !== actor.profile.id};
      restoreDraft(dates); renderContext(); status();
    } catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
  }
  async function openGuestEnquiry(propertyId, dates) {
    const version = prepareThread();
    try {
      const options = await M.api(`/contact-options/${propertyId}`);
      if (version !== threadVersion) return;
      active = {id:null,propertyId,propertyTitle:options.propertyTitle,otherDisplayName:options.hostDisplayName,canReply:true};
      restoreDraft(dates); renderContext(); status();
    } catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
  }
  async function poll() {
    if (!actor || pollBusy || document.hidden) return;
    pollBusy = true; const version = threadVersion, account = accountVersion;
    try {
      await loadInbox();
      if (version !== threadVersion || !active?.id) return;
      const detail = await M.api(`/conversations/${active.id}`);
      if (version !== threadVersion) return;
      active = detail; renderContext();
      await fetchMessages(version); await acknowledgeRead();
    } catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
    finally { if (account === accountVersion) pollBusy = false; }
  }
  function activateSession(user) {
    if(user && actor?.accountId === user.accountId) {
      actor=user; $("msg-account-name").textContent=user.username || t("account");
      if(active) renderContext();
      return;
    }
    saveDraft();
    if(actor?.accountId && user?.accountId && actor.accountId !== user.accountId)
      window.ParrotCore.storage.clearPrivate(actor.accountId);
    if (actor?.accountId && actor.accountId !== user?.accountId) {
      try { window.ParrotCore.storage.session.removeItem(profileReturnKey); } catch {}
    }
    if (user && !actor) promoteGuestDraft(user);
    guestLoginAccount = null; authRequested = false;
    actor = user; accountVersion++; threadVersion++; inboxVersion++;
    inboxBusy = false; pollBusy = false; readBusy = false; sending = false;
    active = null; inbox = []; nextCursor = null; messages = new Map(); pending = null; threadError = null;
    historyNode.replaceChildren(); $("msg-list").replaceChildren(); form.reset();
    $("msg-property").textContent = ""; $("msg-other").textContent = "";
    $("msg-own-profile").hidden = true;
    $("msg-open-property").hidden = true; $("msg-open-property").removeAttribute("href");
    const query = new URLSearchParams(window.location.search);
    const propertyId = query.get("property"), guestEnquiry = !user && uuid.test(propertyId || "");
    $("msg-auth").hidden = Boolean(user) || guestEnquiry;
    $("msg-auth-lead").textContent = t("authLead");
    $("msg-find-housing").hidden = Boolean(user) || guestEnquiry;
    app.hidden = !user && !guestEnquiry; app.classList.toggle("guest-enquiry",guestEnquiry);
    $("msg-inbox").hidden = guestEnquiry;
    historyNode.hidden = guestEnquiry; $("msg-back").hidden = guestEnquiry;
    $("msg-guest-hint").hidden = !guestEnquiry;
    $("msg-account").hidden = !user;
    $("msg-login-link").hidden = Boolean(user);
    $("msg-register-link").hidden = Boolean(user);
    $("msg-account-name").textContent = user ? (user.username || t("account")) : "";
    $("msg-thread").hidden = true; $("msg-empty").hidden = false; app.classList.remove("has-thread");
    if (!user) { if (guestEnquiry) void openGuestEnquiry(propertyId,queryDates()); return; }
    status(); $("msg-session-retry").hidden = true;
    void loadInbox();
    if (uuid.test(query.get("conversation") || "")) void openConversation(query.get("conversation"));
    else if (uuid.test(query.get("property") || "")) void openEnquiry(query.get("property"),queryDates());
  }
  async function boot() {
    status(t("loading")); $("msg-session-retry").hidden = true;
    try { await M.refreshSession(); status(); }
    catch (error) { status(M.errorText(error),true); $("msg-session-retry").hidden = false; }
  }
  function switchAuth(mode) {
    if (authBusy) return;
    loginForm.hidden = mode !== "login"; registerForm.hidden = mode !== "register";
    document.querySelectorAll("[data-msg-auth]").forEach(button => button.setAttribute("aria-pressed",String(button.dataset.msgAuth === mode)));
  }
  function showAuth(mode) {
    $("msg-auth").hidden = false;
    switchAuth(mode);
    (mode === "register" ? registerForm : loginForm).querySelector("input").focus();
  }
  function busyAuth(busy) {
    authBusy = busy;
    $("msg-auth").querySelectorAll("input,button").forEach(el => el.disabled = busy);
  }
  for (const [authForm,path] of [[loginForm,"/login"],[registerForm,"/register"]]) {
    authForm.addEventListener("submit", async event => {
      event.preventDefault(); if (authBusy || !authForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(authForm));
      busyAuth(true); status(t("loading"));
      try {
        const result = await M.auth(path,{method:"POST",body:JSON.stringify(values),
          beforeSession:user => { if(path === "/login") guestLoginAccount=user.accountId; }});
        if (path === "/login") { guestLoginAccount = result.accountId; M.setUser(result); status(); }
        else {
          try { window.ParrotCore.storage.local.setItem("parrot669-message-return",JSON.stringify({path:window.location.pathname+window.location.search,expires:Date.now()+86400000})); } catch {}
          if (active?.propertyId) try {
            saveDraft();
            const nonce=crypto.randomUUID();
            window.ParrotCore.storage.session.setItem(registrationTabKey,nonce);
            window.ParrotCore.storage.local.setItem(registrationDraftKey,JSON.stringify({username:values.username,propertyId:active.propertyId,nonce,
              draft:{body:form.elements.body.value,from:form.elements.from.value,to:form.elements.to.value,savedAt:Date.now()},
              savedAt:Date.now()}));
          } catch {}
          status(t("registered")); loginForm.elements.login.value = values.email;
          busyAuth(false); switchAuth("login");
        }
      } catch (error) {
        status(error.status === 401 && error.code !== "EMAIL_VERIFICATION_REQUIRED" ? t("authError") : M.errorText(error),true);
      } finally { authForm.elements.password.value = ""; busyAuth(false); }
    });
  }
  $("msg-logout").addEventListener("click", async () => {
    const account = actor?.accountId; $("msg-logout").disabled = true;
    try { await M.auth("/logout",{method:"POST"}); M.setUser(null); M.clearDrafts(account); window.ParrotCore.storage.session.removeItem(profileReturnKey); status(); }
    catch (error) { failed(error); }
    finally { $("msg-logout").disabled = false; }
  });
  $("msg-login-link").addEventListener("click", event => {
    event.preventDefault();
    showAuth("login");
  });
  $("msg-register-link").addEventListener("click", event => {
    event.preventDefault();
    showAuth("register");
  });
  $("msg-own-profile").addEventListener("click", event => {
    if (!actor?.accountId || !active?.id || active.hostProfileId !== actor.profile?.id) {
      event.preventDefault(); return;
    }
    saveDraft();
    try { window.ParrotCore.storage.session.setItem(profileReturnKey,JSON.stringify({accountId:actor.accountId,conversationId:active.id,savedAt:Date.now()})); }
    catch { event.preventDefault(); status(t("errorNetwork"),true); }
  });
  document.querySelectorAll("[data-msg-auth]").forEach(button => button.addEventListener("click",() => switchAuth(button.dataset.msgAuth)));
  form.addEventListener("input", () => {
    threadError = null; updateComposer();
    for (const input of form.querySelectorAll("textarea,input")) input.setCustomValidity("");
    if (!sending && !pending) saveDraft();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault(); if (sending || !active?.canReply) return;
    const body = form.elements.body.value.trim(), from = form.elements.from.value, to = form.elements.to.value;
    form.elements.body.setCustomValidity(!body || [...body].length > 4000 ? t("characterLimit") : "");
    form.elements.to.setCustomValidity(validDates(from,to) ? "" : t("invalidDates"));
    if (!pending && !form.reportValidity()) return;
    if (!actor) {
      saveDraft(); authRequested = true;
      $("msg-auth-lead").textContent = t("authToSend");
      $("msg-find-housing").hidden = true;
      $("msg-auth").hidden = false;
      $("msg-auth").scrollIntoView?.({block:"center"});
      loginForm.elements.login.focus();
      return;
    }
    if (!pending) {
      const payload = {clientMessageId:crypto.randomUUID(),body,...(from && to ? {from,to} : {})};
      if (!active.id) payload.propertyId = active.propertyId;
      pending = {endpoint:active.id ? `/conversations/${active.id}/messages` : "/conversations",payload};
    }
    const attempt = pending, version = threadVersion, key = draftKey();
    saveDraft(); sending = true; threadError = null; updateComposer();
    try {
      const response = await M.api(attempt.endpoint,{method:"POST",body:JSON.stringify(attempt.payload)});
      if (!(response?.id || response?.conversationId)) throw new Error("Invalid send response");
      if (version !== threadVersion) return;
      removeDraft(key);
      pending = null; form.reset(); $("msg-dates").open = false; status();
      if (response.conversationId && !active.id) await openConversation(response.conversationId);
      else {
        // Fetch from the last contiguous server cursor, not from the returned send sequence.
        await fetchMessages(version); await loadInbox();
      }
    } catch (error) {
      if (version !== threadVersion) return;
      if (error.status && error.status < 500) pending = null;
      saveDraft(); failed(error,$("msg-thread-notice"));
      if (error.status === 409) void poll();
    } finally {
      if (version === threadVersion) { sending = false; updateComposer(); }
    }
  });
  $("msg-block").addEventListener("click", async () => {
    if (!active?.id || !actor) return;
    const version = threadVersion, id = active.id, blocked = !active.blockedByMe;
    if (blocked && !window.confirm(t("confirmBlock"))) return;
    $("msg-block").disabled = true;
    try {
      await M.api(`/conversations/${id}/block`,{method:"PUT",body:JSON.stringify({blocked})});
      if (version !== threadVersion) return;
      const detail = await M.api(`/conversations/${id}`);
      if (version !== threadVersion) return;
      active = detail; threadError = null;
      renderContext(); await loadInbox();
    } catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
    finally { if (version === threadVersion) $("msg-block").disabled = false; }
  });
  $("msg-earlier").addEventListener("click", async () => {
    if (!active?.id || !messages.size) return;
    const version = threadVersion; $("msg-earlier").disabled = true;
    try { await fetchMessages(version,{older:true}); }
    catch (error) { if (version === threadVersion) failed(error,$("msg-thread-notice")); }
    finally { if (version === threadVersion) $("msg-earlier").disabled = false; }
  });
  $("msg-back").addEventListener("click", () => {
    saveDraft(); threadVersion++; active = null; pending = null; sending = false; messages.clear();
    $("msg-thread").hidden = true; $("msg-empty").hidden = false; app.classList.remove("has-thread"); setUrl(null); renderInbox();
  });
  $("msg-jump").addEventListener("click", () => { historyNode.scrollTop = historyNode.scrollHeight; void acknowledgeRead(); });
  historyNode.addEventListener("scroll", () => { $("msg-jump").hidden = atBottom(); void acknowledgeRead(); });
  $("msg-more").addEventListener("click", () => void loadInbox(true));
  $("msg-session-retry").addEventListener("click", () => void boot());
  window.addEventListener("pagehide",saveDraft);
  window.addEventListener("popstate", () => {
    saveDraft();
    const query=new URLSearchParams(window.location.search),id=query.get("conversation"),property=query.get("property");
    if(actor && uuid.test(id || "")) void openConversation(id,{},null,false);
    else if(uuid.test(property || "")) {
      if(actor) void openEnquiry(property,queryDates(),false);
      else void openGuestEnquiry(property,queryDates());
    }
    else {
      threadVersion++; active=null; pending=null; sending=false; messages.clear();
      $("msg-thread").hidden=true; $("msg-empty").hidden=false;
      app.classList.remove("has-thread"); renderInbox();
    }
  });
  window.addEventListener("focus", () => void M.refreshSession().then(poll).catch(() => {}));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void poll(); });
  setInterval(() => void poll(),15000);
  function language(value) {
    document.documentElement.lang = value; document.title = `PARROT 669 — ${t("messages")}`;
    $("msg-search-link").textContent = {en:"Find availability",es:"Buscar disponibilidad",ca:"Cercar disponibilitat",ru:"Найти жильё"}[value];
    $("msg-host-link").textContent = {en:"For hosts",es:"Para propietarios",ca:"Per a propietaris",ru:"Владельцам"}[value];
    document.querySelectorAll("[data-msg-lang]").forEach(button => button.classList.toggle("active",button.dataset.msgLang === value));
    if (actor && !actor.username) $("msg-account-name").textContent = t("account");
    if (authRequested) $("msg-auth-lead").textContent = t("authToSend");
    if (actor) { renderInbox(); if (active) { renderContext(); renderMessages(); } }
    else if (active) renderContext();
  }
  M.onLanguage(language);
  document.querySelectorAll("[data-msg-lang]").forEach(button => button.addEventListener("click",() => {
    try { window.ParrotCore.storage.local.setItem("parrot669-language",button.dataset.msgLang); } catch {}
    M.setLanguage(button.dataset.msgLang);
  }));
  try { M.setLanguage(window.ParrotCore.storage.local.getItem("parrot669-language") || navigator.language.slice(0,2)); } catch { M.setLanguage("en"); }
  M.onSession(activateSession); void boot();
})();
