/** Shared JSON boundary. It never changes session state or retries a request. */
export class HttpError extends Error {
  constructor(kind, {status = 0, code = "", error = "", requestId = "", cause} = {}) {
    super(error || (kind === "timeout" ? "Request deadline exceeded" : kind === "abort" ? "Request cancelled" : kind === "protocol" ? "Invalid server response" : "Request failed"));
    this.name = "HttpError";
    Object.assign(this, {kind, status, code, error: this.message, requestId});
    if (cause) this.cause = cause;
  }
}

export const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
export const jsonValue = value => record(value) || Array.isArray(value);

export function createHttp({fetch: fetchImpl, Headers: HeadersImpl = globalThis.Headers, AbortController: Controller = globalThis.AbortController,
  setTimeout: schedule = globalThis.setTimeout, clearTimeout: cancel = globalThis.clearTimeout} = {}) {
  return async function request(path, options = {}) {
    const {signal: caller, timeoutMs = 15000, expected = "json", validate = jsonValue, headers: callerHeaders,
      ...init} = options;
    const controller = new Controller();
    let timedOut = false, timer, rejectAbort;
    const interrupted = new Promise((_, reject) => { rejectAbort = reject; });
    const abort = () => controller.abort();
    const onAbort = () => rejectAbort(new HttpError(timedOut ? "timeout" : "abort"));
    controller.signal.addEventListener("abort", onAbort, {once: true});
    if (caller?.aborted) controller.abort();
    else caller?.addEventListener("abort", abort, {once: true});
    if (!controller.signal.aborted && Number.isFinite(timeoutMs) && timeoutMs > 0)
      timer = schedule(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const headers = new HeadersImpl(callerHeaders || {});
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      const operation = (async () => {
        if (controller.signal.aborted) throw new HttpError(timedOut ? "timeout" : "abort");
        const response = await fetchImpl(path, {...init, headers, credentials: "same-origin", signal: controller.signal});
        const requestId = response.headers?.get("X-Request-ID") || "";
        if (response.status === 204) {
          if (expected !== "empty") throw new HttpError("protocol", {status: 204, requestId});
          return null;
        }
        let data;
        try { data = await response.json(); }
        catch (cause) {
          if (response.ok) throw new HttpError("protocol", {status: response.status, requestId, cause});
        }
        if (!response.ok) throw new HttpError("http", {status: response.status,
          code: typeof data?.code === "string" ? data.code : "",
          error: typeof data?.error === "string" ? data.error : `HTTP ${response.status}`,
          requestId: typeof data?.requestId === "string" ? data.requestId : requestId});
        if (expected === "empty" || !validate(data)) throw new HttpError("protocol", {status: response.status, requestId});
        return data;
      })();
      return await Promise.race([operation, interrupted]);
    } catch (cause) {
      if (cause instanceof HttpError) throw cause;
      if (controller.signal.aborted) throw new HttpError(timedOut ? "timeout" : "abort", {cause});
      throw new HttpError("network", {cause});
    } finally {
      cancel(timer);
      caller?.removeEventListener("abort", abort);
      controller.signal.removeEventListener("abort", onAbort);
    }
  };
}
