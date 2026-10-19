import {createCore} from "./shared/core.js";

// A single bridge while the existing page controllers retain their DOM ownership.
// HTTP/session live in imported modules; no page needs Messaging for these services.
window.ParrotCore = createCore(window);
