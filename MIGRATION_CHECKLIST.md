# Migration and cutover checklist

Preparation of this archive does not authorize any item below.

- [x] Public destination and purpose are settled: `lelik112/parrot669-frontend` is the canonical frontend build-source repository.
- [x] Apache-2.0 is the accepted project license; LICENSE and current notices are included.
- [ ] Independent reviewer verifies the source commit/tree, archive SHA-256, file manifest and source-to-output diff.
- [x] The unused corrupt standalone emblem file is excluded; the distinct runtime inline image is unchanged and owner-attested as created by Alex.
- [x] Exact creator/page attribution for both Unsplash image references is documented in NOTICE.
- [ ] Existing remote-image usage is rechecked against current source/usage terms during release review.
- [ ] Dependency/license inventory receives the required release review.
- [ ] The exact independently accepted clean-history candidate is published to the accepted public repository without importing source Git metadata or remotes.
- [ ] Branch protection and the reviewed non-deploy CI workflow are configured.
- [ ] CI runs `npm ci`, `npm test` and the browser smoke suite successfully on the exact exported tree.
- [ ] Deployment variables/secrets are configured out of band: `PUBLIC_ORIGIN`, `API_ORIGIN`, optional `QA_HOSTNAMES`/`QA_WORKER_SECRET`, `NOTIFY_TO`, `RESEND_API_KEY`, `RESEND_FROM`.
- [ ] No secret values, Cloudflare account IDs, routes, custom domains or live fixture data are committed.
- [ ] Staging validates search, auth, host, messaging, recovery and contact boundaries without using production accounts.
- [ ] Cloudflare integration, DNS/bindings, deployment, cutover and access changes receive their separate operational authorization.
- [ ] Rollback target and previous deployment are recorded before cutover.
- [ ] Cost impact is measured after the approved migration; no saving is claimed from this preparation alone.
