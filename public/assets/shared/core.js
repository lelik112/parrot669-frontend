import {createHttp} from "./http.js";
import {createStorage} from "./storage.js";
import {createSession} from "./session.js";
import {createAuth} from "./auth.js";

export function createCore(root) {
  const storage = createStorage(root);
  const http = createHttp({fetch: (...args) => root.fetch(...args), Headers: root.Headers || globalThis.Headers,
    AbortController: root.AbortController || globalThis.AbortController,
    setTimeout: root.setTimeout?.bind(root) || globalThis.setTimeout,
    clearTimeout: root.clearTimeout?.bind(root) || globalThis.clearTimeout});
  const session = createSession({http, storage});
  const core = {http, storage, session, auth: createAuth(session)};
  root.addEventListener?.("pageshow", event => {
    if (event.persisted) void session.revalidate().catch(() => {});
  });
  return core;
}
