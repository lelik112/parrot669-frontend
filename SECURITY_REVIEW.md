# Public candidate security review

## Scope

The review covered every retained file in this clean-history candidate: application assets, the Worker gateway, package/configuration files, product tests and the non-deploy CI workflow. Exact source provenance and source-to-output evidence are maintained separately in the private reviewer packet and are not part of this public tree.

## Disposition

- No credential, token, private key, account ID or live personal record is retained.
- Owner-specific `workers.dev` QA hostnames and named QA environments were removed from source, tests and Wrangler config.
- The backend endpoint is no longer hardcoded. `API_ORIGIN` is validated at runtime and backend routes fail closed when it is absent or invalid.
- `PUBLIC_ORIGIN` is validated and unknown API origins are rejected. Plain HTTP is accepted only for loopback local development.
- QA hostnames are explicitly configured through `QA_HOSTNAMES`; QA API access fails closed unless `QA_WORKER_SECRET` is at least 32 characters.
- The Worker retains its route allowlists, same-origin mutation checks, session-cookie filtering, QA-header stripping/attestation and no-store API responses.
- Contact delivery now requires `NOTIFY_TO`, `RESEND_API_KEY` and `RESEND_FROM`; there is no committed sender, recipient or credential value.
- Test credentials, emails, IDs and secrets use visibly synthetic `.example.test`/fixture values.
- The retained GitHub Actions workflow has `contents: read`, bounded timeouts and no deploy step or cloud credential reference.
- Historical source metadata, internal coordination records and inherited deploy/diagnostic automation are omitted.

## Remaining gates

- The unused corrupt standalone emblem file is excluded from this candidate; the distinct About-section inline image and every current runtime reference remain unchanged. Its exact bytes are owner-attested as created by Alex. This does not identify a verified generator or grant broader name, trademark or publication approval. Exact attribution for both Unsplash references is documented in NOTICE; current usage terms remain subject to release review.
- Dependency licenses are inventoried from the lockfile, but a release owner/legal review remains required.
- No live API/contact/email/DB route, browser, Playwright, CI, deployment or migration was run during preparation.
- Secret scanners are heuristic; independent review of the archive and manifest remains mandatory before publication.
