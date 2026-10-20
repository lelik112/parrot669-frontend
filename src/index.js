const MAX = {
  name: 120,
  contact: 200,
  service: 80,
  message: 5000,
};

const ALLOWED_SERVICES = new Set([
  "rental",
  "visit",
  "documents",
  "search",
  "owner",
  "other",
]);

const json = (data, status = 200) =>
  new Response(JSON.stringify(status >= 400 ? {...data, code:data.code || ({400:"INVALID_REQUEST",401:"AUTHENTICATION_REQUIRED",
    403:"FORBIDDEN",404:"NOT_FOUND",405:"INVALID_REQUEST",409:"CONFLICT",429:"RATE_LIMITED",500:"INTERNAL_ERROR"}[status] || "SERVICE_UNAVAILABLE")} : data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

// Contact limits count UTF-16 code units after trim; never silently truncate.
const clean = (value) => typeof value === "string" ? value.trim() : "";

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

const configuredOrigin = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
    if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
};

const configuredHosts = (value) =>
  new Set(
    typeof value === "string"
      ? value.split(",").map((host) => host.trim().toLowerCase())
        .filter((host) => /^[a-z0-9.-]+$/.test(host) && !host.startsWith(".") && !host.endsWith("."))
      : [],
  );

const proxyBackend = async (request, targetPath, qaSecret, apiOrigin) => {
  const sourceUrl = new URL(request.url);
  const upstream = new URL(targetPath, apiOrigin);
  upstream.search = sourceUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  const cookie = request.headers.get("Cookie");
  if (contentType) headers.set("Content-Type", contentType);
  if (cookie) {
    const sessionCookie = cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("parrot_session="));
    if (sessionCookie) headers.set("Cookie", sessionCookie);
  }
  headers.set("Accept", "application/json");
  if (qaSecret) {
    headers.set("X-Parrot-QA-Origin", "qa");
    headers.set("X-Parrot-QA-Worker", qaSecret);
  }

  const init = {
    method: request.method,
    headers,
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  const response = await fetch(upstream.toString(), init);
  const responseHeaders = new Headers({
    "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  for (const name of ["X-Request-ID", "Retry-After"]) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) responseHeaders.set("Set-Cookie", setCookie);

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const publicOrigin = configuredOrigin(env.PUBLIC_ORIGIN);
    const apiOrigin = configuredOrigin(env.API_ORIGIN);
    const qaHostnames = configuredHosts(env.QA_HOSTNAMES);
    const qaOrigin = qaHostnames.has(url.hostname.toLowerCase());
    const qaSecret = qaOrigin && typeof env.QA_WORKER_SECRET === "string" ? env.QA_WORKER_SECRET : "";
    const apiRequest = url.pathname.startsWith("/api/");
    if (apiRequest && !publicOrigin) return json({ error: "Public origin is not configured" }, 503);
    if (apiRequest && url.origin !== publicOrigin && !qaOrigin) return json({ error: "Forbidden" }, 403);
    if (qaOrigin && qaSecret.length < 32) return json({ error: "QA site unavailable" }, 503);
    // QA origins deliberately reject password reset API requests. Send the
    // recovery page to the ordinary origin, which shares the same accounts.
    if (qaOrigin && ["/recover", "/recover.html"].includes(url.pathname) && request.method === "GET") {
      if (!publicOrigin) return json({ error: "Public origin is not configured" }, 503);
      return Response.redirect(`${publicOrigin}/recover.html${url.search}`, 302);
    }
    if (qaOrigin && url.pathname === "/api/contact") return json({ error: "Forbidden" }, 403);

    if (url.pathname.startsWith("/api/messaging/")) {
      if (!apiOrigin) return json({ error: "Backend origin is not configured" }, 503);
      const path = url.pathname.slice("/api/messaging".length);
      const id = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
      const allowed =
        (new RegExp(`^/contact-options/${id}$`, "i").test(path) && request.method === "GET") ||
        (["/settings", "/notification-settings"].includes(path) && ["GET", "PUT"].includes(request.method)) ||
        (path === "/unread" && request.method === "GET") ||
        (path === "/conversations" && ["GET", "POST"].includes(request.method)) ||
        (new RegExp(`^/conversations/for-property/${id}$`, "i").test(path) && request.method === "GET") ||
        (new RegExp(`^/conversations/${id}$`, "i").test(path) && request.method === "GET") ||
        (new RegExp(`^/conversations/${id}/messages$`, "i").test(path) && ["GET", "POST"].includes(request.method)) ||
        (new RegExp(`^/conversations/${id}/(read|block)$`, "i").test(path) && request.method === "PUT");
      if (!allowed) return json({ error: "Not found" }, 404);
      if (request.method !== "GET") {
        const origin = request.headers.get("Origin");
        if (origin && origin !== url.origin) return json({ error: "Forbidden" }, 403);
      }
      try {
        return await proxyBackend(request, url.pathname, qaSecret, apiOrigin);
      } catch {
        return json({ error: "Messaging service unavailable" }, 502);
      }
    }

    if (url.pathname === "/api/locations/countries" || url.pathname === "/api/locations/cities") {
      if (!apiOrigin) return json({ error: "Backend origin is not configured" }, 503);
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      try {
        return await proxyBackend(request, url.pathname, qaSecret, apiOrigin);
      } catch (error) {
        console.error("Location API proxy failed", error?.message);
        return json({ error: "Location service unavailable" }, 502);
      }
    }

    if (url.pathname === "/api/search") {
      if (!apiOrigin) return json({ error: "Backend origin is not configured" }, 503);
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      const upstream = new URL("/api/search", apiOrigin);
      upstream.search = url.search;

      try {
        if (qaOrigin) return await proxyBackend(request, url.pathname, qaSecret, apiOrigin);
        const response = await fetch(upstream.toString(), {
          method: "GET",
          headers: { "Accept": "application/json" },
        });

        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            ...(response.headers.get("X-Request-ID") ? {"X-Request-ID":response.headers.get("X-Request-ID")} : {}),
            ...(response.headers.get("Retry-After") ? {"Retry-After":response.headers.get("Retry-After")} : {}),
          },
        });
      } catch (error) {
        console.error("Availability API proxy failed", error?.message);
        return json({ error: "Availability service unavailable" }, 502);
      }
    }

    if (url.pathname.startsWith("/api/host/")) {
      if (!apiOrigin) return json({ error: "Backend origin is not configured" }, 503);
      const path = url.pathname.slice("/api/host".length);

      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        const origin = request.headers.get("Origin");
        if (origin && origin !== url.origin) {
          return json({ error: "Forbidden" }, 403);
        }
      }

      const allowed =
        (path === "/auth/register" && request.method === "POST") ||
        (path === "/auth/verify-email" && request.method === "POST") ||
        (["/auth/password-reset/request", "/auth/password-reset/confirm"].includes(path) && request.method === "POST") ||
        (path === "/auth/login" && request.method === "POST") ||
        (path === "/auth/logout" && request.method === "POST") ||
        (path === "/auth/me" && request.method === "GET") ||
        (path === "/dashboard" && request.method === "GET") ||
        (path === "/profile" && request.method === "PATCH") ||
        (["/geocode/autocomplete", "/geocode/countries"].includes(path) && request.method === "GET") ||
        (path === "/properties" && request.method === "POST") ||
        (/^\/properties\/[0-9a-f-]+$/i.test(path) && ["PATCH", "DELETE"].includes(request.method)) ||
        (/^\/properties\/[0-9a-f-]+\/listings$/i.test(path) && request.method === "POST") ||
        (/^\/listings\/[0-9a-f-]+$/i.test(path) && ["PUT", "DELETE"].includes(request.method)) ||
        (/^\/properties\/[0-9a-f-]+\/availability$/i.test(path) && ["GET", "POST"].includes(request.method)) ||
        (/^\/availability\/[0-9a-f-]+$/i.test(path) && ["PUT", "DELETE"].includes(request.method)) ||
        (/^\/properties\/[0-9a-f-]+\/unavailability$/i.test(path) && ["GET", "POST"].includes(request.method)) ||
        (/^\/unavailability\/[0-9a-f-]+$/i.test(path) && ["PUT", "DELETE"].includes(request.method)) ||
        (/^\/properties\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/public-links$/i.test(path) && request.method === "PUT") ||
        (/^\/properties\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/calendars$/i.test(path) && request.method === "GET") ||
        (/^\/calendars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/activate$/i.test(path) && request.method === "POST") ||
        (/^\/calendars\/[0-9a-f-]+\/sync$/i.test(path) && request.method === "POST") ||
        (/^\/calendars\/[0-9a-f-]+\/verification$/i.test(path) && request.method === "GET") ||
        (/^\/calendars\/[0-9a-f-]+\/verification\/(start|check|cancel)$/i.test(path) && request.method === "POST") ||
        (/^\/calendars\/[0-9a-f-]+$/i.test(path) && ["PUT", "DELETE"].includes(request.method));

      if (!allowed) {
        return json({ error: "Not found" }, 404);
      }

      try {
        return await proxyBackend(request, path === "/profile" ? "/api/host/profile" : `/api${path}`, qaSecret, apiOrigin);
      } catch (error) {
        console.error("Host API proxy failed", error?.message);
        return json({ error: "Host service unavailable" }, 502);
      }
    }


    if (url.pathname.startsWith("/api/") && url.pathname !== "/api/contact") return json({ error: "Not found", code:"NOT_FOUND" }, 404);
    if (url.pathname !== "/api/contact") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ ok: false, error: "Missing or invalid fields" }, 400);
    }

    // Honeypot: real users never see/fill this field.
    if (body.website) {
      return json({ ok: true });
    }

    const name = clean(body.name);
    const contact = clean(body.contact);
    const service = clean(body.service);
    const message = clean(body.message);

    if (!name || !contact || !message || !ALLOWED_SERVICES.has(service) ||
        name.length > MAX.name || contact.length > MAX.contact ||
        service.length > MAX.service || message.length > MAX.message) {
      return json({ ok: false, error: "Missing or invalid fields" }, 400);
    }

    if (!env.NOTIFY_TO) {
      console.error("NOTIFY_TO is not configured");
      return json({ ok: false, error: "Contact destination is not configured" }, 500);
    }
    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return json({ ok: false, error: "Email delivery is not configured" }, 500);
    }
    if (!env.RESEND_FROM) {
      console.error("RESEND_FROM is not configured");
      return json({ ok: false, error: "Email sender is not configured" }, 500);
    }

    const subject = `[PARROT 669] New request: ${service}`;
    const text = [
      "New request from parrot669.com",
      "",
      `Name: ${name}`,
      `Contact: ${contact}`,
      `Service: ${service}`,
      "",
      message,
    ].join("\n");

    const html = `
      <h2>New request from PARROT 669</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Service:</strong> ${escapeHtml(service)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `;

    const replyTo =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : undefined;

    const controller = new AbortController();
    let timer;
    let timedOut = false;
    try {
      const email = {
        from: env.RESEND_FROM,
        to: [env.NOTIFY_TO],
        subject,
        text,
        html,
      };
      if (replyTo) email.reply_to = replyTo;

      // Match the existing browser HTTP boundary's 15s request convention.
      // A deadline cannot prove non-delivery; no automatic retry is safe here.
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
          reject(new Error("Contact provider deadline"));
        }, 15000);
      });
      const response = await Promise.race([fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email),
        signal: controller.signal,
      }), deadline]);

      if (!response.ok) {
        console.error("Resend email failed", response.status);
        return json({ ok: false, error: "Email delivery failed" }, 502);
      }

      return json({ ok: true });
    } catch {
      console.error(timedOut ? "Email acknowledgement timed out" : "Email outcome is unknown");
      return json({ ok: false, error: "Email delivery outcome unknown" }, timedOut ? 504 : 502);
    } finally {
      clearTimeout(timer);
    }
  },
};

