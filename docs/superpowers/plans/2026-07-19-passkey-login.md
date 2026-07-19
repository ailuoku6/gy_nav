# Passkey Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WebAuthn Passkey binding and login to the existing React/Vite + Hono/Cloudflare Pages app while preserving username/password login.

**Architecture:** The backend owns WebAuthn options, challenge storage, credential verification, and JWT issuance. The frontend only asks the backend for options, invokes the browser WebAuthn ceremony through SimpleWebAuthn, then submits the result back to the backend.

**Tech Stack:** React 18, Vite, Hono, Cloudflare Pages Functions, D1, `@simplewebauthn/browser`, `@simplewebauthn/server`, Vitest for focused service tests.

---

## File Structure

- Modify `package.json`: add SimpleWebAuthn and Vitest scripts/dependencies.
- Modify `tsconfig.node.json`: include Vitest config if needed.
- Create `vitest.config.ts`: Node/Workers-compatible unit test config for backend service tests.
- Create `lib/hono/SQL/passkeys.sql`: D1 schema additions for passkey credentials, challenges, and `users.passkeyUserId`.
- Modify `lib/hono/types/index.ts`: add Passkey env bindings and small D1 row types used by services.
- Modify `lib/hono/service/userService.ts`: extract a reusable login success response helper for password and Passkey login.
- Create `lib/hono/service/passkeyService.ts`: WebAuthn options, challenge lifecycle, credential storage, authentication verification, credential listing, and deletion.
- Create `lib/hono/service/passkeyService.test.ts`: focused tests for challenge expiry, single-use validation, user-handle behavior, and credential ownership checks.
- Modify `lib/hono/index.ts`: register Passkey API routes and add login options/verify to the auth-free set.
- Modify `src/utils/http.ts`: add `postJson` for nested WebAuthn payloads.
- Modify `src/utils/Api.ts`: add Passkey API constants.
- Create `src/utils/passkey.ts`: browser support check, registration/login ceremony wrappers, and user-facing error messages.
- Modify `src/pages/Login.tsx`: add Passkey login button for signed-out users and Passkey binding/credential management for signed-in users.

## Task 1: Dependencies and Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Test: `lib/hono/service/passkeyService.test.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm install @simplewebauthn/browser@13.3.0 @simplewebauthn/server@13.3.2
pnpm install -D vitest@2.1.9
```

Expected: dependencies are added to `package.json` and `package-lock.json`; no install errors.

- [ ] **Step 2: Add test scripts**

Update `package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Expected: `node_modules/.bin/vitest run lib/hono/service/passkeyService.test.ts` starts Vitest after a test file exists.

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

Expected: backend tests under `lib/` are discovered.

## Task 2: SQL Schema

**Files:**
- Create: `lib/hono/SQL/passkeys.sql`
- Create: `lib/hono/SQL/passkeys_user_column.sql`
- Create: `lib/hono/SQL/README_passkeys.md`
- Modify: `lib/hono/types/index.ts`

- [ ] **Step 1: Create the D1 schema file**

Create `lib/hono/SQL/passkeys.sql` for repeatable Passkey tables and indexes:

```sql
CREATE TABLE IF NOT EXISTS passkey_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  credentialId TEXT UNIQUE NOT NULL,
  publicKey TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  deviceType TEXT,
  backedUp INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_userId
  ON passkey_credentials(userId);

CREATE TABLE IF NOT EXISTS passkey_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge_type
  ON passkey_challenges(challenge, type);
```

Create `lib/hono/SQL/passkeys_user_column.sql` for the one-time users table migration:

```sql
ALTER TABLE users ADD COLUMN passkeyUserId TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_passkeyUserId
  ON users(passkeyUserId);
```

Expected: `passkeys.sql` can be repeated safely. `passkeys_user_column.sql` must be run once per D1 database, or skipped when `users.passkeyUserId` already exists.

- [ ] **Step 2: Extend bindings**

Add these optional env fields in `lib/hono/types/index.ts`:

```ts
PASSKEY_RP_ID?: string;
PASSKEY_RP_NAME?: string;
PASSKEY_ORIGIN?: string;
```

Expected: services can read Passkey config from `ctx.env`.

## Task 3: User Login Response Helper

**Files:**
- Modify: `lib/hono/service/userService.ts`
- Test: `lib/hono/service/passkeyService.test.ts`

- [ ] **Step 1: Write a failing test for reusable login response shape**

Add a test that stubs D1 rows and calls the helper expected from `UserService.buildLoginSuccessPayload(ctx, user)`.

Expected failure: `UserService.buildLoginSuccessPayload is not a function`.

- [ ] **Step 2: Extract `buildLoginSuccessPayload`**

Implement:

```ts
public static buildLoginSuccessPayload = async (
  ctx: Ctx,
  user: { id: number; userName: string; partData: string }
) => {
  const token = await signToken(
    { user: { id: user.id, userName: user.userName } },
    ctx.env.TokenSecret
  );
  const popularSitesRow = await ctx.env.DB
    .prepare('SELECT popularSites FROM popularSites WHERE userId = ?')
    .bind(user.id)
    .first();

  return {
    result: true,
    user: {
      id: user.id,
      userName: user.userName,
      partData: user.partData,
      popularSites: popularSitesRow?.popularSites ?? '',
    },
    msg: 'Login successful',
    token,
  };
};
```

Then update password login to return `ctx.json(await UserService.buildLoginSuccessPayload(ctx, user as any))`.

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm test -- lib/hono/service/passkeyService.test.ts
```

Expected: the new helper test passes.

## Task 4: Passkey Challenge and Config Service

**Files:**
- Create: `lib/hono/service/passkeyService.ts`
- Test: `lib/hono/service/passkeyService.test.ts`

- [ ] **Step 1: Write failing tests for config defaults and challenge validation**

Test behaviors:

```ts
expect(PasskeyService.getConfig(ctx)).toEqual({
  rpID: 'localhost',
  rpName: 'GY Nav',
  origin: 'http://localhost:5173',
});

await expect(
  PasskeyService.consumeChallenge(ctx, {
    challenge: 'expired',
    type: 'authentication',
  })
).resolves.toBeNull();
```

Expected failure: `PasskeyService` does not exist.

- [ ] **Step 2: Implement config and challenge helpers**

Add methods:

```ts
getConfig(ctx): { rpID: string; rpName: string; origin: string }
saveChallenge(ctx, { userId, challenge, type }): Promise<void>
consumeChallenge(ctx, { userId, challenge, type }): Promise<ChallengeRow | null>
```

Implementation details:

- Use env overrides when present.
- Fall back to `localhost`, `GY Nav`, and `http://localhost:5173`.
- Set `expiresAt` to five minutes after creation.
- Delete expired or consumed challenge rows.
- Require matching `userId` for registration challenges and allow `NULL` userId for discoverable login challenges.

- [ ] **Step 3: Run the focused test**

Run:

```bash
npm test -- lib/hono/service/passkeyService.test.ts
```

Expected: config and challenge tests pass.

## Task 5: Registration APIs

**Files:**
- Modify: `lib/hono/service/passkeyService.ts`
- Modify: `lib/hono/index.ts`
- Test: `lib/hono/service/passkeyService.test.ts`

- [ ] **Step 1: Write failing tests for registration options**

Test behaviors:

- Current JWT user gets a stable `passkeyUserId` if missing.
- Generated options include `residentKey: 'required'`, `userVerification: 'required'`, `attestationType: 'none'`, and existing credentials in `excludeCredentials`.

Expected failure: registration method does not exist.

- [ ] **Step 2: Implement `createRegistrationOptions(ctx)`**

Use `generateRegistrationOptions` from `@simplewebauthn/server` and save the generated challenge with type `registration`.

- [ ] **Step 3: Implement `verifyRegistration(ctx, body)`**

Use `verifyRegistrationResponse` from `@simplewebauthn/server`, consume the matching challenge, then insert into `passkey_credentials`.

- [ ] **Step 4: Wire routes**

Add:

```ts
app.post('/api/passkey/register/options', async (ctx) => {
  return await PasskeyService.createRegistrationOptions(ctx);
});

app.post('/api/passkey/register/verify', async (ctx) => {
  const body = await ctx.req.json();
  return await PasskeyService.verifyRegistration(ctx, body);
});
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test -- lib/hono/service/passkeyService.test.ts
npm run build
```

Expected: tests pass and TypeScript build succeeds.

## Task 6: Login and Credential Management APIs

**Files:**
- Modify: `lib/hono/service/passkeyService.ts`
- Modify: `lib/hono/index.ts`
- Test: `lib/hono/service/passkeyService.test.ts`

- [ ] **Step 1: Write failing tests for login and ownership**

Test behaviors:

- Login options without username omit `allowCredentials`.
- Login options with username include only that user's credential IDs.
- Login verify with unknown credential returns a generic failure.
- Deleting another user's credential fails.

Expected failure: login and management methods do not exist.

- [ ] **Step 2: Implement login options and verify**

Add:

```ts
createLoginOptions(ctx, { userName }: { userName?: string })
verifyLogin(ctx, { credential }: { credential: AuthenticationResponseJSON })
```

Use `generateAuthenticationOptions` and `verifyAuthenticationResponse`. On successful verification, update `counter` and `lastUsedAt`, then return `ctx.json(await UserService.buildLoginSuccessPayload(ctx, user))`.

- [ ] **Step 3: Implement list/delete**

Add:

```ts
listCredentials(ctx)
deleteCredential(ctx, { id }: { id: number })
```

Delete must include both `id = ?` and `userId = ?`.

- [ ] **Step 4: Wire routes and auth-free set**

Add login routes to `authFreeSet`:

```ts
'/api/passkey/login/options'
'/api/passkey/login/verify'
```

Add routes for login, list, and delete.

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test -- lib/hono/service/passkeyService.test.ts
npm run build
```

Expected: tests pass and TypeScript build succeeds.

## Task 7: Frontend HTTP and Passkey Utility

**Files:**
- Modify: `src/utils/http.ts`
- Modify: `src/utils/Api.ts`
- Create: `src/utils/passkey.ts`

- [ ] **Step 1: Add JSON API constants**

Add constants for all six Passkey API endpoints in `src/utils/Api.ts`.

- [ ] **Step 2: Add `postJson`**

Implement:

```ts
export function postJson(
  url: string,
  params: { [key: string]: any }
): Promise<{ result: boolean; [key: string]: any }> {
  return new Promise((resolve, reject) => {
    axios
      .post(BaseUrl + url, params, {
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      })
      .then((res) => resolve(res?.data))
      .catch((err) => reject(err?.data ?? err));
  });
}
```

- [ ] **Step 3: Add `src/utils/passkey.ts`**

Implement browser wrappers around `startRegistration` and `startAuthentication`, plus a `getPasskeyErrorMessage(error)` mapper for `NotAllowedError`, unsupported browsers, challenge expiry, and generic failures.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: TypeScript build succeeds.

## Task 8: Login Page UI

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/login.css` only if spacing needs CSS rather than inline styles.

- [ ] **Step 1: Extract shared login success handling**

Move duplicate password login/signup success handling into `applyLoginSuccess(data, passwordForStorage?)` inside `Login.tsx`.

- [ ] **Step 2: Add signed-out Passkey login**

Add a secondary button below password login:

```tsx
<Button variant="outlined" fullWidth onClick={handlePasskeySignin}>
  使用 Passkey 登录
</Button>
```

`handlePasskeySignin` calls login options, `startAuthentication`, login verify, then `applyLoginSuccess`.

- [ ] **Step 3: Add signed-in binding and credential list**

Add a `绑定 Passkey` button in the signed-in panel. After binding, refresh credentials with `GET /api/passkey/credentials`. Show credential name, created time, last used time, and a delete button.

- [ ] **Step 4: Handle cancellations and unsupported browsers**

Display friendly `tipText` for unsupported WebAuthn, user cancellation, expired challenge, and verification failure. Do not clear username/password on Passkey cancellation.

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: TypeScript build succeeds.

## Task 9: End-to-End Verification

**Files:**
- No required edits unless verification finds issues.

- [ ] **Step 1: Run full build**

Run:

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 2: Run backend tests**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 3: Run local Pages dev**

Run:

```bash
npm run preview-api
```

Expected: app starts with Pages Functions.

- [ ] **Step 4: Browser manual verification**

Verify:

- Password login still works.
- Signed-in user can bind Passkey on macOS Chrome or Safari.
- Signed-out user can login with the bound Passkey.
- Canceling the browser Passkey prompt shows a non-destructive cancellation message.
- Credential list shows the new credential and can delete it.
