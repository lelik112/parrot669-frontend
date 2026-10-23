import {HttpError, record} from "./http.js";

export const sessionUser = value => record(value) && typeof value.accountId === "string" && Boolean(value.accountId)
  && (value.profile == null || (record(value.profile) && typeof value.profile.id === "string" && Boolean(value.profile.id)));

export function createSession({http, storage}) {
  let user, epoch = 0, status = "unknown", lastAccount = null, pending, refreshVersion = 0;
  const listeners = new Set();
  const emit = reason => { const state = {user, epoch, status, reason}; for (const fn of listeners) fn(state); };
  function setUser(value, {reason = value ? "authenticated" : "expired"} = {}) {
    if (value != null && !sessionUser(value)) throw new HttpError("protocol");
    const account = value?.accountId || null;
    if (value && lastAccount && account !== lastAccount) storage.clearPrivate(lastAccount);
    const nextStatus = value ? "authenticated" : reason === "expired" && lastAccount ? "expired" : "anonymous";
    const changed = user === undefined || (user?.accountId || null) !== account || status !== nextStatus;
    const profileChanged = JSON.stringify(user) !== JSON.stringify(value);
    if (changed) { epoch++; pending = undefined; }
    user = value || null; status = nextStatus;
    if (value) lastAccount = account;
    if (reason === "logout") { storage.clearPrivate(lastAccount); lastAccount = null; }
    if (changed || profileChanged) emit(reason);
    return user;
  }
  function invalidate() {
    epoch++; refreshVersion++; pending = undefined; user = undefined; status = "checking"; emit("revalidate");
  }
  async function refresh() {
    if (pending) return pending;
    const version = epoch, sequence = ++refreshVersion;
    const work = (async () => {
      try {
        const value = await http("/api/host/auth/me", {validate: sessionUser});
        if (version === epoch && sequence === refreshVersion) setUser(value);
        return user;
      } catch (error) {
        if (version !== epoch || sequence !== refreshVersion) return user;
        if (error.status === 401) { setUser(null, {reason: lastAccount ? "expired" : "anonymous"}); return null; }
        status = "unavailable"; emit("unavailable"); throw error;
      } finally { if (sequence === refreshVersion) pending = undefined; }
    })();
    pending = work; return work;
  }
  async function request(path, options = {}) {
    const version = epoch;
    const {authenticated = false, ...init} = options;
    try {
      const result = await http(path, init);
      if (version !== epoch) throw new HttpError("stale", {code: "STALE_SESSION"});
      return result;
    } catch (error) {
      if (version !== epoch) throw new HttpError("stale", {code: "STALE_SESSION"});
      if (authenticated && error.status === 401) setUser(null, {reason: "expired"});
      throw error;
    }
  }
  return {setUser, refresh, invalidate, request,
    revalidate() { invalidate(); return refresh(); },
    updateProfile(profile) { if (user) setUser({...user, profile:{...user.profile, ...profile}}); },
    subscribe(fn) { listeners.add(fn); if (status !== "unknown") fn({user, epoch, status, reason: "subscribe"}); return () => listeners.delete(fn); },
    get user() { return user; }, get epoch() { return epoch; }, get status() { return status; }};
}
