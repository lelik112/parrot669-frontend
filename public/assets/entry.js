import {createCore} from "./shared/core.js";

// A single bridge while the existing page controllers retain their DOM ownership.
// HTTP/session live in imported modules; no page needs Messaging for these services.
window.ParrotCore = createCore(window);
const page = document.querySelector("script[data-parrot-page]")?.dataset.parrotPage;
const entries = {
  home: ["lead-form.js", "script.js"],
  search: ["messaging-common.js", "search.js"],
  recover: ["recover.js"],
  host: ["messaging-common.js", "host-address.js", "calendar-verification.js", "host.js"],
  messages: ["messaging-common.js", "messaging-email-settings.js", "messages.js"]
};
for (const source of entries[page] || []) await import(`./${source}`);
