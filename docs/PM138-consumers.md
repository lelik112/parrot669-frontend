# PM138 HTTP/session boundary

Implementation: Igor / Developer. Main input: `69dc7d02dad8ceac60b4cc2df50235d522e627f8`.
Selected unmerged Home input: `119b3fa462d59c580cca5f123629bddf15613cd8` (PR1).

## Owners and consumers

| Owner | Contract / consumers |
| --- | --- |
| shared/http.js | JSON decoding, explicit empty response, deadline/caller abort, header merge; no session mutation and no automatic retry |
| shared/session.js | account/profile, identity epoch, current-user validation, coalesced refresh, stale-response fencing; no Messaging/DOM imports |
| shared/storage.js | optional persistence with in-memory fallback and deletion tombstones; account-scoped draft cleanup |
| shared/auth.js | existing `/api/host/auth` actions, validated login/verification identity, explicit logout/confirm-204; no new endpoint |
| shared/core.js + entry.js + entry-*.js | one per-window instance; BFCache invalidation before refresh; static per-page module graphs initialize controllers before document load completes |
| Host | shared session/request/auth/storage; identity notifications close private DOM; uppercase error mapping; profile PATCH updates shared profile; authenticated per-property calendar snapshot is the sole mode/revision command source |
| Search | shared public transport/session/auth/storage; Messaging is optional for contact UI/language, not session or HTTP |
| Messages | Messaging feature delegates shared request/auth/session; profile updates preserve composer; account changes reset private UI; Back/Forward restores selection |
| Recover | shared auth and storage; existing token handling; uppercase error codes; expected confirm-204 |
| Home | shared HTTP for Contact and optional storage; existing editing/submitting/success/error/uncertain semantics and manual retry remain |
| Worker | existing route/Origin/QA/cookie allowlists; JSON error codes and unknown-API 404; allowlisted X-Request-ID/Retry-After passthrough; streaming upstream body |

The one `window.ParrotCore` bridge lets existing DOM controllers use the imported core without a second loader or duplicate session. It is not a second state owner. Page presentation/rendering stays in existing controllers for this FR1 scope. No UI framework or generalized form engine was added.

## Protocol decisions

* A successful JSON response must parse and satisfy the consumer's boundary predicate. Session, dashboard, calendar snapshots and Search/location lists have explicit predicates. Optional conversation lookup explicitly allows JSON null. A 204 is permitted only for explicit producer-derived operations: auth POST logout/recovery-confirm; Host DELETE properties/listings/calendars/availability/unavailability by id; PUT availability/calendar by id; POST calendar-by-id/sync or /activate. Other methods/routes, including JSON GET, profile PATCH, calendar creation, activate GET/PUT and unavailability PUT, reject unexpected204. No global allow204 or DELETE wildcard.
* `HttpError` retains kind/status/code/error/requestId; known PM120 uppercase codes drive localization. Unknown codes retain the safe backend text/status fallback. Two pre-existing date explanations under contextual INVALID_REQUEST remain a bounded secondary text mapping; no lowercase compatibility aliases.
* An expired session retains account-scoped drafts but hides its identity/DOM. Explicit logout and a different authenticated account clear the previous account's private drafts. Profile notifications for the same account do not advance identity epoch or restart the composer.
* Back/Forward is a read/navigation action and never resends a message. Session/network failures never retry POST automatically. Contact timeout is uncertain, not proof of rejection.
* Messages preserves the pending endpoint, full payload and clientMessageId for uncertain protocol (malformed2xx/unexpected204/invalid DTO), network, timeout,5xx,408 or unusable error-envelope outcomes. Only an applicable HTTP4xx with a decoded code (except408) releases the rejected attempt. A manual retry reuses the original key; matching own server history reconciles without another POST. No automatic resend.
* Before destructive send success, the existing HTTP boundary validates the operation-specific producer ACK: start requires ConversationStarted(conversationId,message); reply requires MessageView directly. IDs are canonical UUID strings under existing semantics; the message must match the pending clientMessageId/sender/body/dates, have a positive producer Int sequence and a usable createdAt. Wrong variant/type/value/missing shape is an uncertain protocol outcome, never proof of commit or rejection. Optional dates are the producer's explicit null/string values; no new product limits or schema library. Extra fields and UUID letter case do not invalidate a usable ACK. Unit and browser success fixtures now serialize the actual producer variants/full MessageView, including distinct message id and idempotency key.
* Host identity changes synchronously hide/clear private cards, forms, address/verification controllers and navigation context before showing the new identity, then request a dashboard fenced by the current session epoch. Same-account profile notifications retain property DOM/unsaved context; a delayed old-account dashboard cannot rebuild it.

## Inputs, checks and remaining limits

Main was reconstructed through the authorized GitHub connection; all 52 file blob IDs match, and the reconstructed tree is `dbbd93cc3881200abf4c5c9604d4a27e7e5dcb4b`. The Home input is integrated as a separate source input; its CSS, accepted layout/copy and network-isolated CI fixtures are retained. PM138 changes its entrypoint and transport wiring, not its design.

The existing unit/DOM tests run with matching cached jsdom26.1.0 and Playwright1.63.0 on Node24.19.0. Cached Wrangler4.136.3 differs from the lock, so no Wrangler build/runtime claim is made. CI must use npm ci against the lock. Browser binaries were not present locally; browser execution is NOT_RUN locally. Static-server/intercepted Playwright checks do not prove real backend integration or production-font visual acceptance.

No backend source/endpoints/schema, providers, deployment or live data changed. PM132/PM133 can keep their existing auth DTO and endpoint for this implementation; future endpoint changes must update the actual consumer contract. Independent review and merge approval remain separate.

## Calendar transport and producer contract adaptation

Read-only backend main `9b80af3de3ed78642ffb090c4467b3b5a808cf7a`: `ExternalCalendarRoutes` provides authenticated GET `/api/properties/:id/calendars` with `{calendars:[ExternalCalendarView]}`. Each view has `id`, `mode` and `revision: Long`; dashboard `HostProperty` does not contain calendars. Snapshot service checks property ownership, and repository commands check calendar owner and exact revision. These are source observations, not executed backend authorization tests.

The bounded continuation reads that property snapshot while loading the dashboard, never the optional/fictitious embedded dashboard calendars. Usable UUID, known mode, boolean enabled and nonnegative safe-integer revision are required; ambiguous duplicate IDs or imprecise Long values fail closed. Each mapped object is bound in a WeakMap to its property, session epoch and captured revision. Only the same object in the current property's state may send a command. Old-session responses and superseded same-session dashboard loads cannot install snapshots. A refused/malformed property snapshot leaves that property's calendar commands unavailable and uses the existing error display without hiding independent valid properties. No automatic command retry or refresh/resubmit.

Sync POST and DELETE send `{expectedRevision}`. Disable PUT sends `{mode:"Disabled",expectedRevision}`; enable uses existing POST `/calendars/:id/activate` with `{expectedRevision}`, never prohibited PUT Active. Successful204 refreshes the dashboard/snapshot;412 CALENDAR_STALE or409 disabled/invalid-transition remain errors without success, refresh or retry. Session fencing prevents old-account command completions from affecting the new account.

Worker adds only two canonical-UUID method/path pairs inside the existing Host proxy: GET `/api/host/properties/:id/calendars` and POST `/api/host/calendars/:id/activate`, mapped to the existing backend `/api/...` paths. No new wildcard, auth/QA/origin/cookie/header/security setting or backend endpoint. Local Worker tests execute the real handler with synthetic upstream responses: exact forwarding, body/cookie filtering, missing auth/error passthrough and forbidden paths/methods/origin/QA; they do not execute backend ownership checks. Existing Host tests use actual DTO fixtures and revision commands; the browser scenario is network-isolated and synthetic too. Actual backend/calendar/provider integration, independent exact-head review, Home fonts/visual and release remain separate gates. This source adaptation does not authorize live activation, merge or deployment.
