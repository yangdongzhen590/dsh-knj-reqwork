# dsh-knj-reqwork

`dsh-knj-reqwork` is a private PM workbench for DeepSeek Harness (DSH). It treats the local frontend codebase as the source of truth: instead of recreating a design file, it reads the configured Vue Router and presents the resulting pages in the DSH web workspace.

> **Not a Figma replacement.** This plugin borrows the useful interaction contracts of selection, source inspection, layout, and snapshots, but it is not a vector-design or collaboration product. It does **not** implement vector editing, multi-user collaboration, comments or approvals, remote-file permissions, cloud files, or component publishing. The relevant product-research notes are in `docs/research/2026-09-05-figma-private-workbench-patterns.md` when present in the larger project.

## M0: available now

M0 is deliberately read-only and has no persistence. Its capabilities are:

- **Vue Router page list** — scans supported Vue Router entry files and lists discovered route pages.
- **Fixed project root** — by default, reads `D:\workspace\knsearch-test\knsearch_web`; a host configuration may supply `projectRoot` for a different local project root.
- **Stable PageRef** — selecting a page exposes a stable `@page:<path>` reference, for example `@page:/home`.
- **Source inspector** — shows the selected route, component source, and available layout metadata.
- **Host API** — registers the read-only `GET /dsh-knj-reqwork/pages` endpoint through the DSH `webServer` service. It returns `{ ok, root, pages }` on success and uses 404/405/500 for unsupported paths, methods, and scanner failures.
- **Sidebar/main-area workbench panel** — injects a `需求工坊` entry into the `knj.menu.item` slot and mounts the panel in the DSH conversation/main area. The client lifecycle is reversible: it removes its menu entry, DOM, styles, observer, and listeners when disposed.

The host entry exports `scanVueRouter`, `mountReqworkRoutes`, `BASE`, `PAGES_PATH`, and `DEFAULT_PROJECT_ROOT`; the client entry is exported as `dsh-knj-reqwork/client` for DSH web loading.

## Install

1. Build and package this plugin:

   ```powershell
   npm.cmd run check
   npm.cmd test
   npm.cmd pack
   ```

2. Install the generated tarball into the DSH web profile:

   ```powershell
   dsh plugin --profile web add ./dsh-knj-reqwork-<ver>.tgz
   ```

3. Restart or reload the DSH web host as appropriate for the host environment, then open the `需求工坊` menu item.

`<ver>` is the package version in `package.json`; M0 currently produces `dsh-knj-reqwork-2026.9.5.tgz`.

## Development and verification

This package requires Node.js 20 or newer. Use `npm.cmd` in PowerShell so the npm PowerShell shim is not invoked.

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check
npm.cmd test
npm.cmd pack
```

- `check` runs both TypeScript configurations and builds the host and client artifacts.
- `test` uses Node's built-in test runner (`node --test`).
- `pack` produces an ignored `.tgz` archive for package-content inspection; do not commit it.

The repository `.npmrc` enables `legacy-peer-deps` because the pinned DSH pre-release package peers require it during install.

## Architecture

```text
DSH host (Cordis)                 DSH web client
┌─────────────────────────┐       ┌─────────────────────────────────┐
│ apply(ctx)              │       │ client apply({ slots })          │
│ inject: webServer       │       │ inject: ['slots']                │
│ /dsh-knj-reqwork/pages  │──────▶│ knj.menu.item → panel mount      │
│ scanVueRouter(root)     │ JSON  │ page list → PageRef + inspector  │
└───────────┬─────────────┘       └─────────────────────────────────┘
            │
            ▼
local Vue Router source beneath projectRoot
```

The host scanner looks only for these router candidates beneath `projectRoot`:

- `src/router/index.js`
- `src/router/index.ts`
- `src/router.js`
- `src/router.ts`

It extracts route paths, names, dynamic-imported `.vue` components, and the current `home-child` layout metadata convention. The client fetches the pages endpoint with an abortable request and is defensive about repeated apply/dispose calls.

## Data and security boundaries

- **Local and read-only:** M0 reads local router/component metadata only. It creates no database, cache, project file, cloud record, or other persistent state.
- **Configured-root boundary:** the scanner resolves component paths relative to the selected router and rejects paths outside `projectRoot`; only the router candidate list above is considered.
- **Endpoint boundary:** only same-host requests to the fixed endpoint path are served, and only `GET` is accepted. The DSH host is responsible for the surrounding origin/session boundary; the plugin does not expose a cross-origin API.
- **No remote collaboration surface:** no upload, remote file browsing, sharing, permission management, comments, approval flow, or cloud component registry exists in M0.
- **Code is authoritative:** `@page:<path>` identifies a router route; it is not a separate editable design document.

## Roadmap

- **M1:** `CanvasNode`, Layers, Inspector, and local layout-oriented workbench primitives.
- **M2:** richer layout work, source-aware comparison/diff, and snapshot-oriented flows.
- **M3:** follow-on workflow capabilities, still constrained by the private, code-as-truth model.

Future milestones may borrow familiar Figma-like interaction vocabulary, but the boundary remains: this project is a private code workbench, not a replacement for Figma.

## License

[MIT](LICENSE) © 2026 yangdongzhen
