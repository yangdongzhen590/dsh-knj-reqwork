# Task 4 Report — Client page list panel

## Delivered

- Added a real DSH client `apply(ctx)` in `src/client/index.ts`, protected by `applyGuard`.
- Added a React page-list panel that requests `GET /dsh-knj-reqwork/pages`, renders route path, optional name, and component file, and logs the M1 restoration placeholder on row clicks.
- Added a real center-column DOM mount (`[data-pane="conversation"], [class*="centerCol"]`), React root, close action, panel mutual-exclusion event, observer self-healing, and disposers.
- Added a `knj.menu.item` row through the real deferred `slots.inject()` contract; direct registration remains a degraded fallback only when `inject` is not available.
- Added `tsdown.config.ts` to emit `client/client.js` as a DSH `window.__ModuleLoader__.load()` factory while externalizing React runtime modules.
- Fixed `.gitignore` from `client/` to `/client/`, so generated root artifacts remain ignored but `src/client/**` is versioned.
- Added a client bundle/lifecycle regression test.

## Endpoint correction

The historical Task 4 brief showed `/api/reqwork/pages`, but the task ruling supersedes it. The client calls the actual Task 3 host endpoint exactly: `/dsh-knj-reqwork/pages`.

## Red/green evidence

1. `test/client-build.test.mjs` was created before the client implementation.
2. `npm.cmd test -- test/client-build.test.mjs` initially failed because `client/client.js` was absent.
3. After implementing the client, its first assertion surfaced a tsdown banner whitespace mismatch; the assertion was corrected to accept tsdown formatting, then passed.
4. After adversarial review found the broad `client/` ignore and cleanup weaknesses, the lifecycle regression test was expanded and failed on the ignored-source condition.
5. The ignore and cleanup defects were corrected; the focused test passed.

## Verification

```text
npm.cmd run check
# PASS: host + client typecheck, host build, tsdown client/client.js build

npm.cmd test
# PASS: 10 tests, 0 failures
```

Generated artifact: `client/client.js` (10.81 kB; intentionally gitignored as a build artifact).

## BOM and diff hygiene

All changed text files were checked: none begins with `EF BB BF`.

## Adversarial review

The first quick correctness/lifecycle review found and the implementation fixed:

1. `client/` ignored `src/client/**`.
2. A throwing `slots.inject()` could leak an already mounted panel.
3. Panel fetch was not cancelled on unmount.
4. Injected styles survived disposal.

A second quick correctness/lifecycle review reported **no confirmed defects**.

## Host API concern

No host API blocker remains. The center-column selector and deferred slot protocol follow the existing extension-center implementation. They are intentionally structural/defensive because those are host shell implementation seams; Task 6 should exercise them in a live DSH GUI installation.

## Handoff repair and Figma ruling

- The takeover audit preserved the prior client work rather than replacing it. The host/server `tsconfig.json` excludes the entire `src/client/**` tree, while `tsconfig.client.json` typechecks that tree independently; this resolves the earlier client TS18003 condition without omitting client type safety.
- Ruling Figma-1 is now implemented minimally: clicking a route row stores the selected `PageEntry` in panel state rather than logging only. The stable identity is rendered as `@page:<path>` and the in-panel source inspector shows PageRef, route path, component source file (falling back to `file`), and layout when supplied.
- Selected rows use the host's `var(--dsw-alias-interactive-bg-active)` token for an explicit visual state. No canvas, layer tree, free positioning, versions, or collaboration behavior was added.
- `test/client-build.test.mjs` now asserts the source/bundle lifecycle contract and the PageRef selection/inspector implementation. The new selection assertion was run red before the implementation, then green after it.

## Final verification

```text
npm.cmd run check
# PASS: server TypeScript, independent client TypeScript, server build, tsdown client/client.js build

npm.cmd test
# PASS: 11 tests, 0 failures

node --test test/client-build.test.mjs
# PASS: 3 tests, 0 failures (including PageRef selection regression)
```

- `client/client.js` is emitted after `npm.cmd run check`, is ignored by root-only `/client/`, and contains the expected `window.__ModuleLoader__.load({ id: "dsh-knj-reqwork" ... })` banner.
- `src/client/**` remains trackable (it is not matched by `/client/`).
- Changed text files were checked for UTF-8 BOM; none begins with `EF BB BF`.
- `knsearch_web` was not modified.

## Handoff review note

A quick correctness/lifecycle review of the uncommitted client work had no confirmed defects. The lifecycle concern raised by a finder (a throwing React unmount) was refuted by its verifier; the correctness lens did not run, so the formal post-commit Task 4 review remains the planned coverage follow-up.

## Commit

`feat(reqwork): add page list client panel`
