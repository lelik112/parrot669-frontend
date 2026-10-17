# PARROT 669 frontend

[Манифест PARROT 669](MANIFESTO.md)

This repository contains the canonical static frontend and Cloudflare Worker gateway for PARROT 669. It preserves the product's search, host, authentication, messaging, recovery and contact behavior. The accepted public destination is `lelik112/parrot669-frontend`; this clean-history candidate contains no operational Git history or internal coordination records.

## Prerequisites

- Node.js 22
- npm 11 or a compatible npm that honors lockfile version 3
- Cloudflare Wrangler for local Worker development (installed by `npm ci`)
- Playwright browsers only when running the E2E suite

Install deterministically without package lifecycle scripts:

```sh
npm ci --ignore-scripts
```

## Checks

```sh
npm test
npm run test:e2e
```

The GitHub Actions workflow runs both jobs on standard `ubuntu-latest` runners. It has read-only repository permissions and performs no deploy. Browser installation and CI execution were not performed while preparing this candidate.

## Runtime configuration

Configure values in the deployment environment; never commit them. Only names are listed here.

| Name | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_ORIGIN` | Yes | Exact public frontend origin. HTTPS is required except loopback local development. |
| `API_ORIGIN` | Yes for backend-proxy routes | Exact backend API origin. HTTPS is required except loopback local development. |
| `QA_HOSTNAMES` | Optional | Comma-separated QA hostnames that may use the QA attestation path. |
| `QA_WORKER_SECRET` | Required when `QA_HOSTNAMES` is non-empty | QA-to-backend attestation secret; at least 32 characters. |
| `NOTIFY_TO` | Required for contact delivery | Contact destination. |
| `RESEND_API_KEY` | Required for contact delivery | Resend API credential. |
| `RESEND_FROM` | Required for contact delivery | Verified sender identity. |
| `ASSETS` | Platform binding | Static asset binding declared by `wrangler.jsonc`. |

The Worker rejects API requests when the public origin is missing or invalid, rejects unknown request origins, and returns 503 for backend-proxy routes when `API_ORIGIN` is absent. QA hosts fail closed without a valid QA secret. Only the session cookie is forwarded upstream.

## Local development

Run `npm run dev` and provide local values through an untracked Wrangler environment file or shell environment. Do not use live credentials or production accounts in local tests. The committed `wrangler.jsonc` contains no account ID, routes, secrets, custom domains or environment-specific hostnames.

## Deployment boundary

`npm run deploy` is a manual convenience command only. The public repository purpose and Apache-2.0 license are settled, but this candidate has not been published or deployed. Operational actions such as repository creation, Cloudflare configuration, CI enablement, deployment, migration, DNS changes, access changes, billing changes and production cutover remain separately controlled. Follow [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) after independent review.

## Licensing and external assets

Project source is offered under Apache-2.0; see [LICENSE](LICENSE). Dependency and remote-asset notices are in [NOTICE](NOTICE) and [THIRD_PARTY_LICENSES.tsv](THIRD_PARTY_LICENSES.tsv). Exact creator/page attribution is recorded for both remote Unsplash image references, while current usage terms remain subject to release review. The prior unused corrupt standalone emblem file is excluded from this candidate. The unchanged About-section inline image remains the only emblem payload used by the frontend; its exact bytes are owner-attested as created by Alex. This record does not identify a verified generator or claim rights, names, or release authority beyond that attestation.
