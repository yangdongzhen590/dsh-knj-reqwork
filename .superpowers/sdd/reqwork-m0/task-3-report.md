# Task 3 Report — Host route layer + configuration

## Delivered interface

- `GET /dsh-knj-reqwork/pages` is mounted through `webServer.register({ kind: 'prefix', path: '/dsh-knj-reqwork', handler })`.
- `apply()` injects only `webServer` and returns the route disposer from its injection callback.
- The configured scan root is `Config.projectRoot`, with fallback `D:\workspace\knsearch-test\knsearch_web`.
- Query parameters are parsed only to identify the pathname; `?root=C:\outside` cannot alter the configured root.
- Responses are JSON with `content-type: application/json; charset=utf-8`:
  - `200` `{ ok: true, root, pages }` for `GET /dsh-knj-reqwork/pages`
  - `404` for any other pathname
  - `405` for non-GET requests to the pages pathname
  - `500` `{ ok: false, error }` when the scanner fails.

## Tests and interface exercise

Fresh verification on 2026-09-05:

```text
npx.cmd tsc -p tsconfig.json
# exit 0

npm.cmd test
# 8 passing, 0 failing
```

`test/routes.test.mjs` covers success (at least 11 scanned pages), 404, 405, scanner-error 500, query-root isolation, prefix route registration/disposer, and `apply()` injection/disposer propagation.

A red/green record was captured for the missing `mountReqworkRoutes` export and for the missing injection-callback disposer return. Both initially failed and then passed after implementation.

## BOM

Verified new files' first bytes:

```text
src/routes.ts: 69 6D 70
src/index.ts: 69 6D 70
test/routes.test.mjs: 69 6D 70
```

None starts with `EF BB BF`.

## Review

A quick adversarial correctness/contract review after the disposer fix reported no confirmed defects.

## Commit

Pending at report-writing time; expected commit message: `feat(reqwork): expose page list api`.

## Concerns

`npm.cmd run typecheck` remains intentionally red with client-side `TS18003` because `src/client` does not exist until Task 4. This is the explicitly documented Task 4 ordering concern. The required host-only compile (`npx.cmd tsc -p tsconfig.json`) is green. `knsearch_web` was only read by scanner tests and was not modified.
