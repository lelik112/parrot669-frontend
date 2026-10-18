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
| Host | shared session/request/auth/storage; identity notifications close private DOM; uppercase error mapping; profile PATCH updates shared profile |
| Search | shared public transport/session/auth/storage; Messaging is optional for contact UI/language, not session or HTTP |
| Messages | Messaging feature delegates shared request/auth/session; profile updates preserve composer; account changes reset private UI; Back/Forward restores selection |
| Recover | shared auth and storage; existing token handling; uppercase error codes; expected confirm-204 |
| Home | shared HTTP for Contact and optional storage; existing editing/submitting/success/error/uncertain semantics and manual retry remain |
| Worker | existing route/Origin/QA/cookie allowlists; JSON error codes and unknown-API 404; allowlisted X-Request-ID/Retry-After passthrough; streaming upstream body |

The one `window.ParrotCore` bridge lets existing DOM controllers use the imported core without a second loader or duplicate session. It is not a second state owner. Page presentation/rendering stays in existing controllers for this FR1 scope. No UI framework or generalized form engine was added.

## Protocol decisions

* A successful JSON response must parse and satisfy the consumer's boundary predicate. Session, dashboard and Search/location lists have explicit predicates. Optional conversation lookup explicitly allows JSON null. A 204 is permitted only for explicit producer-derived operations: auth POST logout/recovery-confirm; Host DELETE properties/listings/calendars/availability/unavailability by id; PUT availability/calendar by id; POST calendar-by-id/sync. Other methods/routes, including JSON GET, profile PATCH, calendar creation and unavailability PUT, reject unexpected204. No global allow204 or DELETE wildcard.
* `HttpError` retains kind/status/code/error/requestId; known PM120 uppercase codes drive localization. Unknown codes retain the safe backend text/status fallback. Two pre-existing date explanations under contextual INVALID_REQUEST remain a bounded secondary text mapping; no lowercase compatibility aliases.
* An expired session retains account-scoped drafts but hides its identity/DOM. Explicit logout and a different authenticated account clear the previous account's private drafts. Profile notifications for the same account do not advance identity epoch or restart the composer.
* Back/Forward is a read/navigation action and never resends a message. Session/network failures never retry POST automatically. Contact timeout is uncertain, not proof of rejection.
* Messages preserves the pending endpoint, full payload and clientMessageId for uncertain protocol (malformed2xx/unexpected204/invalid DTO), network, timeout,5xx,408 or unusable error-envelope outcomes. Only an applicable HTTP4xx with a decoded code (except408) releases the rejected attempt. A manual retry reuses the original key; matching own server history reconciles without another POST. No automatic resend.
* Host identity changes synchronously hide/clear private cards, forms, address/verification controllers and navigation context before showing the new identity, then request a dashboard fenced by the current session epoch. Same-account profile notifications retain property DOM/unsaved context; a delayed old-account dashboard cannot rebuild it.

## Inputs, checks and remaining limits

Main was reconstructed through the authorized GitHub connection; all 52 file blob IDs match, and the reconstructed tree is `dbbd93cc3881200abf4c5c9604d4a27e7e5dcb4b`. The Home input is integrated as a separate source input; its CSS, accepted layout/copy and network-isolated CI fixtures are retained. PM138 changes its entrypoint and transport wiring, not its design.

The existing unit/DOM tests run with matching cached jsdom26.1.0 and Playwright1.63.0 on Node24.19.0. Cached Wrangler4.136.3 differs from the lock, so no Wrangler build/runtime claim is made. CI must use npm ci against the lock. Browser binaries were not present locally; browser execution is NOT_RUN locally. Static-server/intercepted Playwright checks do not prove real backend integration or production-font visual acceptance.

No backend source/endpoints/schema, providers, deployment or live data changed. PM132/PM133 can keep their existing auth DTO and endpoint for this implementation; future endpoint changes must update the actual consumer contract. Independent review and merge approval remain separate.

## Known pre-existing calendar integration blocker (not fixed by response handling)

Read-only backend main `9b80af3de3ed78642ffb090c4467b3b5a808cf7a`: ExternalCalendarRoutes command returns204 after successful sync/mode/delete, but sync/delete require CalendarCommandRequest(expectedRevision); mode PUT requires UpdateExternalCalendarRequest(mode,expectedRevision). Current unchanged Host sync/delete omit this body and mode PUT sends `{enabled}`. This request-body drift already exists in selected Home119b3fa4 and reviewed2561da67. Accepting valid204 does not make those requests compatible or remove stale-revision fencing. Real calendar integration remains BLOCKED until separately approved frontend producer/consumer DTO reconciliation with actual revision/mode data and contract fixtures; no backend/fencing bypass or live command is authorized here.
