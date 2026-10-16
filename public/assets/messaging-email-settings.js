(() => {
  "use strict";
  const M = window.ParrotMessaging;
  const panel = document.getElementById("msg-email-settings");
  const toggle = document.getElementById("msg-email-enabled"), language = document.getElementById("msg-email-language");
  const status = document.getElementById("msg-email-status"), retry = document.getElementById("msg-email-retry");
  let revision = 0, saved = null, busy = false;
  function render() {
    toggle.checked = saved?.enabled || false;
    language.value = saved?.language || "en";
    toggle.disabled = busy || !saved; language.disabled = busy || !saved;
  }
  function message(text, error = false) {
    status.textContent = text; status.classList.toggle("error",error);
    status.setAttribute("role",error ? "alert" : "status");
  }
  async function load() {
    const version = revision; busy = true; render(); retry.hidden = true; message(M.t("loading"));
    try {
      const result = await M.api("/notification-settings");
      if (version !== revision) return;
      saved = result; message("");
    } catch (error) {
      if (version !== revision) return;
      message(M.errorText(error),true); retry.hidden = false;
      if (error.status === 401) M.setUser(null);
    } finally { if (version === revision) { busy = false; render(); } }
  }
  async function save() {
    if (!saved || busy) return;
    const desired = {enabled:toggle.checked,language:language.value}, version = revision;
    busy = true; toggle.disabled = true; language.disabled = true; message(M.t("loading"));
    try {
      const result = await M.api("/notification-settings",{method:"PUT",body:JSON.stringify(desired)});
      if (version !== revision) return;
      saved = result; message(M.t("settingSaved"));
    } catch (error) {
      if (version !== revision) return;
      message(M.errorText(error),true);
      if (error.status === 401) M.setUser(null);
    } finally { if (version === revision) { busy = false; render(); } }
  }
  toggle.addEventListener("change",() => void save());
  language.addEventListener("change",() => void save());
  retry.addEventListener("click",() => void load());
  M.onSession(user => {
    revision++; saved = null; busy = false; panel.hidden = !user; panel.open = false;
    message(""); render(); if (user) void load();
  });
})();
