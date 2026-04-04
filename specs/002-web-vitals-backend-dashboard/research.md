# Technical Research: Web Vitals Backend, Demo App, and Dashboard

**Feature**: 002-web-vitals-backend-dashboard  
**Date**: 2026-04-04  
**Status**: Final

---

## Decision 1: Backend Framework

**Decision**: Express.js (v4.x) on Node.js

**Rationale**:
- The existing web-vitals-lib is a JavaScript/Node.js project (Vite build, npm ecosystem). Express keeps everything in one language.
- Express is the most widely-known Node.js HTTP framework. Any contributor can read and modify it immediately.
- The backend is simple: 7 REST endpoints, JSON body parsing, CORS, file I/O. Express handles this with minimal boilerplate.
- Express + cors + body-parser (built-in since Express 4.16) covers all middleware needs with zero custom code.
- The server/node_modules already contains `express` and `cors`, confirming this was the intended direction.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Fastify | Faster at scale, but the backend handles local dev traffic only. The performance advantage is irrelevant and the API surface is less familiar to most developers. |
| Koa | Cleaner middleware model, but requires more boilerplate for common tasks (body parsing, error handling). Smaller ecosystem of ready-made middleware. |
| Hono | Modern and lightweight, but less mainstream. Adds unnecessary learning curve for a local dev tool. |
| No framework (raw http module) | Too much boilerplate for routing, body parsing, CORS, and error handling. |

---

## Decision 2: Data Storage

**Decision**: File-based JSON storage (one file per app + one registry file)

**Rationale**:
- Spec constraint FR-021 mandates file-based storage with no external database.
- JSON files are human-readable (FR-023), debuggable, and require zero setup.
- Structure: `data/apps.json` for the app registry, `data/<appId>.json` for per-app metric arrays.
- For the target scale (up to 50,000 records per app), reading and parsing a JSON file is acceptable. A 50K-record file is roughly 15-25 MB, which Node.js handles in under 1 second.
- Concurrent write safety is achieved via an in-process write queue (sequential file writes per app). Since this is a single-process local server, no cross-process locking is needed.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| SQLite | Excellent for structured queries, but adds a native dependency (better-sqlite3 or similar). The spec explicitly requires file-based JSON storage. |
| LevelDB / LokiJS | Embedded databases add complexity. JSON files are simpler and human-readable per FR-023. |
| NDJSON (newline-delimited JSON) | Better for append-only writes (no need to parse the whole file to append). However, aggregation queries (p75, distributions) still require reading all lines. The added complexity of a non-standard format is not justified for the target scale. |
| In-memory with periodic flush | Risks data loss on crash. Spec requires persistence across restarts (FR-007). Pure file I/O is safer. |

**Write Queue Design**:
- Maintain one write queue per appId using a simple promise chain.
- Each write operation reads the file, appends new records, and writes the file back.
- Concurrent requests for the same app are serialized; requests for different apps proceed in parallel.

---

## Decision 3: Demo App Framework

**Decision**: Vue 3 + Vite + Vue Router

**Rationale**:
- Spec FR-026 mandates Vue.js with Vue Router.
- Vue 3 Composition API provides a clean, modern development experience.
- Vite is already the build tool for the main library, keeping tooling consistent.
- The demo/node_modules already contains `vue`, `vue-router`, and `vite`.
- The demo app is intentionally simple (3+ routes with varied content). Vue SFC (Single File Components) make each page self-contained and readable.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| React + Vite | Spec mandates Vue. Also, keeping one frontend framework reduces context switching. |
| Nuxt.js | Full framework is overkill for a 3-page demo app. Adds SSR complexity that conflicts with client-side metric collection. |
| Plain HTML | Would not demonstrate SPA routing behavior, which is important for generating distinct `page` URLs per route. |

---

## Decision 4: Dashboard Framework

**Decision**: Vue 3 + Vite + Vue Router + Chart.js (via chart.js package)

**Rationale**:
- Spec C-004 mandates Vue.js for the dashboard to match the demo app.
- Chart.js is already installed in dashboard/node_modules. It provides time-series line charts, pie/doughnut charts, and bar charts -- all needed for the dashboard views.
- Chart.js has a small bundle size (~60KB gzipped), good Vue integration (either direct Canvas API or via vue-chartjs wrapper), and covers all visualization needs: time-series (line chart), distributions (bar chart), browser breakdown (doughnut chart).
- Vue Router provides the multi-view navigation: App List -> Route List -> Route Detail.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| D3.js | Far more powerful but requires significantly more code for standard chart types. Chart.js provides everything needed with a declarative API. |
| ECharts | Feature-rich but larger bundle and heavier API. Overkill for the chart types needed. |
| Recharts | React-only library. Not compatible with Vue. |
| vue-chartjs wrapper | Could be added on top of Chart.js for more Vue-idiomatic usage, but direct Chart.js with Canvas refs is simpler and avoids an extra dependency. The dashboard/node_modules does not include vue-chartjs, so using Chart.js directly avoids needing to install it. |

---

## Decision 5: App ID Generation

**Decision**: nanoid (URL-safe, 12 characters)

**Rationale**:
- Spec FR-004 requires URL-safe string, minimum 8 characters.
- nanoid is already available in dashboard/node_modules (transitive dep), and can be added to the server easily.
- nanoid generates URL-safe IDs by default (A-Za-z0-9_-), is cryptographically strong, and has zero dependencies.
- 12-character nanoid provides ~71 bits of entropy, which is more than sufficient for a local dev tool.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| UUID v4 | Works but produces long IDs (36 chars with dashes). Less ergonomic for display and copy-paste. |
| crypto.randomUUID() | Built into Node.js but same UUID length issue. |
| Short sequential IDs | Not collision-safe if data files are deleted and recreated. |

---

## Decision 6: P75 Calculation

**Decision**: Nearest-rank method (matching existing library helper)

**Rationale**:
- Spec C-009 mandates this method: sort ascending, take value at index `ceil(0.75 * n) - 1`.
- The library already has `calculateP75()` in `src/utils/helpers.js` using this exact algorithm.
- The server will implement the same algorithm for server-side aggregation in the summary endpoint.
- This matches Google's method for Web Vitals percentile reporting.

---

## Decision 7: Dashboard-to-Backend Communication

**Decision**: Direct REST API calls via fetch (no state management library)

**Rationale**:
- The dashboard is read-only with simple data flows: fetch list, fetch detail, display.
- Vue 3 Composition API with reactive refs and `onMounted` lifecycle hooks is sufficient for data fetching.
- No complex state sharing between views -- each view fetches its own data.
- Adding Vuex/Pinia would be over-engineering for this use case.

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|-------------|
| Pinia (Vue state management) | Adds a dependency and boilerplate for state that is view-local. Each dashboard page fetches fresh data on mount. |
| Axios | Adds a dependency when the native fetch API is sufficient for all API calls. |
| WebSocket for real-time | Spec C-008 explicitly states real-time updates are not required. Refresh-on-navigate is sufficient. |

---

## Decision 8: Project Port Allocation

**Decision**: Server 3001, Demo 5173, Dashboard 5174 (per spec)

**Rationale**:
- Spec defines these defaults in the Constraints section.
- Port 3001 avoids conflict with common dev servers on 3000.
- Vite defaults to 5173; the dashboard uses 5174 as the next available.
- All ports are configurable via environment variables for flexibility.

---

## Decision 9: Content-Type Handling for /api/collect

**Decision**: Express middleware that parses both `application/json` and `text/plain` as JSON

**Rationale**:
- Spec FR-015 and C-001 require handling both Content-Types.
- `navigator.sendBeacon` with a Blob typed as `application/json` typically sends as `application/json`, but some browsers may send as `text/plain`.
- Express `body-parser` supports `express.json({ type: ['application/json', 'text/plain'] })` to parse both types as JSON.
- A payload size limit of 1 MB (`express.json({ limit: '1mb' })`) should be configured to prevent oversized payloads from filling disk. The default Express limit of 100KB may be too small for large metric batches.
- This is a one-line configuration change, no custom middleware needed.

> **SA Review Note**: The library's default `apiEndpoint` is currently `http://localhost:5000/api/collect` (see `src/main.js` and `src/core/WebVitalsReporter.js`). This MUST be updated to port 3001 as part of the library update in Phase 1 to match the server default. Without this fix, the library and server defaults would be misaligned, causing developer confusion.
