# Cloudflare CLI migration

This project now has a Workers Static Assets deployment path managed by the
Cloudflare CLI (`cf`). The migration follows the repository's
`cloudflare-cli-migration-guide.md` reference: the existing Hono routes and D1
resources are retained, while the React build is served by Workers Static
Assets.

## Configuration

The active configuration is [cloudflare.config.ts](../cloudflare.config.ts).

- Worker name: `gy-nav`
- Worker entrypoint: `lib/worker.ts`
- Compatibility date: `2024-06-18`
- Compatibility flags: `nodejs_compat`, `nodejs_compat_v2`
- Static assets use SPA fallback
- `/api/*` is routed to the Worker before the SPA fallback
- Preview uses D1 database `30166e34-c12a-4b94-b298-90b8e99606f3`
- Non-preview deployments use D1 database `468b4939-9622-4192-b867-fc20fb41b456`

The D1 IDs were carried over from the existing `wrangler.toml`; this migration
does not create or alter databases.

## Commands

Authenticate the Cloudflare CLI before using remote operations:

```sh
cf auth login
cf auth whoami
```

Run the normal development, build, and deployment commands:

```sh
pnpm dev
pnpm build
pnpm deploy
```

`cf deploy` builds and deploys the Worker. Do not run it until the target
account, D1 bindings, secrets, and custom domain have been checked.

## Secrets

Secret values must be configured outside the repository. The application
requires these names:

- `DataSecretKey`
- `PasswordSecret`
- `TokenSecret`

These values are optional in code but should be configured for the features that
use them:

- `PASSKEY_RP_ID`
- `PASSKEY_RP_NAME`
- `PASSKEY_ORIGIN`
- `RTC_TURN_KEY_ID`
- `RTC_TURN_KEY_SECRET`

The new `cf` configuration deliberately does not contain secret values. Verify
the CLI version's secret-management command before provisioning them; the
current beta may still require Wrangler or the Cloudflare dashboard for some
secret operations.

## Pages rollback path

The old Pages deployment path remains available:

```sh
pnpm build:pages
pnpm preview-api
pnpm rtc:dev
```

`build:pages` uses [vite.pages.config.ts](../vite.pages.config.ts), copies the
existing Pages Functions into `build/`, and preserves the original
`wrangler.toml` D1 environment definitions. This path is for rollback and
compatibility testing; it is separate from `cf build` and `cf deploy`.

## Remote configuration audit

The Cloudflare CLI was authenticated and the existing Pages project `gy-nav`
was read without changing it. The remote configuration confirms:

- Pages project ID: `6018ca3c-131b-4159-8566-27339f4ec3ff`;
- production branch: `deploy-cf`;
- GitHub repository: `ailuoku6/gy_nav`;
- Pages domains: `gy-nav.pages.dev`, `nav.ailuoku6.top`, and
  `www.ailuoku6.top`;
- production D1 binding `DB` points to
  `468b4939-9622-4192-b867-fc20fb41b456` (`gy_nav`);
- preview D1 binding `DB` points to
  `30166e34-c12a-4b94-b298-90b8e99606f3` (`gy_nav_dev`);
- Pages compatibility date is `2024-06-18` with `nodejs_compat`;
- Pages is still configured for GitHub push deployments and uses Pages
  Functions.

Cloudflare redacts secret values in the response. The remote secret names are
`DataSecretKey`, `PasswordSecret`, and `TokenSecret` in both environments;
production additionally declares `PASSKEY_ORIGIN`, `PASSKEY_RP_ID`, and
`PASSKEY_RP_NAME`. Their values must be provisioned or verified separately on
the new Worker. The Pages project also does not currently expose the optional
RTC TURN secrets in its deployment configuration.

The custom domains are intentionally not included in `cloudflare.config.ts`.
The first Worker deployment should be tested on its `workers.dev` URL before
any domain attachment or DNS cutover. Pages Git deployment should remain the
rollback path until that verification is complete.

No production deployment, domain change, database migration, or resource
creation is performed by this migration.
