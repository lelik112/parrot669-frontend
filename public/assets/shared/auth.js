import {sessionUser} from "./session.js";

/** One auth action controller; the existing pages own their form presentation. */
export function createAuth(session) {
  return async function auth(path, options = {}) {
    const {beforeSession, ...init} = options;
    const empty = path === "/logout" || path === "/password-reset/confirm";
    const adoptsUser = path === "/login" || path === "/verify-email";
    const result = await session.request(`/api/host/auth${path}`, {...init,
      ...(empty ? {expected: "empty"} : {}), ...(adoptsUser || path === "/me" ? {validate: sessionUser} : {})});
    if (adoptsUser) { beforeSession?.(result); session.setUser(result); }
    if (path === "/logout") session.setUser(null, {reason: "logout"});
    return result;
  };
}
