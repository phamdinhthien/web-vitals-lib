# Implementation Plan: Web Vitals Backend, Demo App, and Dashboard

**Branch**: `002-web-vitals-backend-dashboard` | **Date**: 2026-04-04 | **Spec**: `specs/002-web-vitals-backend-dashboard/spec.md`  
**Input**: Feature specification from `/specs/002-web-vitals-backend-dashboard/spec.md`

## Summary

Build three components to complete the web-vitals end-to-end story: (1) an Express.js backend that receives, stores, and serves metric data using file-based JSON storage, (2) a Vue 3 demo app that exercises the web-vitals-lib across multiple routes, and (3) a Vue 3 dashboard with Chart.js visualizations for monitoring web vitals per app and per route. The existing web-vitals-lib receives a minor update to add `appId` support and fix a typo.

## Technical Context

**Language/Version**: JavaScript (ES Modules), Node.js 18+  
**Primary Dependencies**:
- Backend: Express.js 4.x, cors, nanoid
- Demo: Vue 3, Vite 5, Vue Router 4, web-vitals-lib (local build)
- Dashboard: Vue 3, Vite 5, Vue Router 4, Chart.js 4.x
**Storage**: File-based JSON (`data/apps.json`, `data/<appId>.json`)  
**Testing**: Manual end-to-end testing (automated testing out of scope for v1)  
**Target Platform**: Local development (macOS/Linux/Windows with Node.js)  
**Project Type**: Multi-component local dev tool (library + server + 2 web apps)  
**Performance Goals**: App list < 2s, route detail < 3s for 10K records (SC-004)  
**Constraints**: No external DB, no auth, up to 50K records/app, file-based only  
**Scale/Scope**: Single developer / small team, localhost only

## Project Structure

### Documentation (this feature)

```text
specs/002-web-vitals-backend-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification (BA-reviewed)
├── research.md          # Technical decisions with rationale
├── data-model.md        # Data structures and entity definitions
├── quickstart.md        # Developer setup guide
├── contracts/           # API specifications
│   ├── POST-apps.md
│   ├── GET-apps.md
│   ├── GET-apps-appId.md
│   ├── POST-collect.md
│   ├── GET-apps-appId-routes.md
│   ├── GET-apps-appId-routes-summary.md
│   └── GET-apps-appId-metrics.md
└── tasks.md             # Phase 3 output (not created by plan)
```

### Source Code (repository root)

```text
# Library updates (existing files)
src/
├── main.js                      # Add appId to config defaults
├── core/
│   ├── WebVitalsReporter.js     # Include appId in payload
│   └── BatchCollector.js        # Fix metric.idm -> metric.id
└── utils/
    ├── helpers.js               # No changes
    └── elementInfo.js           # No changes

# Backend server (new files in existing server/ directory)
server/
├── package.json                 # Express, cors, nanoid dependencies
├── index.js                     # Server entry: Express app setup, middleware, listen
├── routes/
│   ├── apps.js                  # POST /api/apps, GET /api/apps, GET /api/apps/:appId
│   ├── collect.js               # POST /api/collect
│   └── metrics.js               # GET /api/apps/:appId/metrics, routes, routes/summary
├── services/
│   ├── appService.js            # App CRUD: register, list, find, persist to apps.json
│   ├── metricService.js         # Metric ingestion: enrich, append, write queue
│   └── aggregationService.js    # Metric retrieval: filter, p75 calc, summary
├── utils/
│   └── fileStore.js             # Low-level file read/write with write queue per appId
├── data/                        # Auto-created, gitignored
│   ├── apps.json                # App registry
│   └── <appId>.json             # Per-app metric data
└── node_modules/                # Already exists (express, cors installed)

# Demo app (new files in existing demo/ directory)
demo/
├── package.json                 # Vue 3, Vite, Vue Router, web-vitals-lib (local)
├── vite.config.js               # Dev server config (port 5173)
├── index.html                   # SPA entry
├── .env                         # VITE_APP_ID, VITE_API_ENDPOINT (gitignored)
├── .env.example                 # Template for .env
├── src/
│   ├── main.js                  # Vue app creation, router mount, web-vitals init
│   ├── App.vue                  # Root component with <router-view> and nav
│   ├── router/
│   │   └── index.js             # Route definitions: /, /about, /gallery
│   └── pages/
│       ├── HomePage.vue         # Large hero image (LCP), text content (FCP)
│       ├── AboutPage.vue        # Dynamic content load (CLS), form (INP)
│       └── GalleryPage.vue      # Multiple images, lazy-load (varied LCP/TTFB)
├── public/
│   └── assets/                  # Static images for demo content
└── node_modules/                # Already exists (vue, vue-router, vite installed)

# Dashboard (new files in existing dashboard/ directory)
dashboard/
├── package.json                 # Vue 3, Vite, Vue Router, Chart.js
├── vite.config.js               # Dev server config (port 5174)
├── index.html                   # SPA entry
├── src/
│   ├── main.js                  # Vue app creation, router mount
│   ├── App.vue                  # Root component with <router-view> and nav
│   ├── router/
│   │   └── index.js             # Route definitions: /, /apps/:appId, /apps/:appId/routes/:page
│   ├── pages/
│   │   ├── AppListPage.vue      # Lists all apps, empty/error states
│   │   ├── RouteListPage.vue    # Lists routes for an app with p75 summaries
│   │   └── RouteDetailPage.vue  # Detailed metrics, charts, attribution
│   ├── components/
│   │   ├── MetricCard.vue       # Single metric display: p75, rating badge, distribution
│   │   ├── TimeSeriesChart.vue  # Line chart of metric values over time (Chart.js)
│   │   ├── DistributionChart.vue # Bar chart of good/needs-improvement/poor counts
│   │   ├── BrowserChart.vue     # Doughnut chart of browser breakdown
│   │   ├── AttributionPanel.vue # Element selector/URL display for LCP, CLS, INP
│   │   ├── WaterfallPanel.vue   # P3: Network waterfall (placeholder in v1)
│   │   └── FilterBar.vue        # P3: Date range, browser, rating filters
│   ├── services/
│   │   └── api.js               # Fetch wrapper for all backend API calls
│   └── utils/
│       └── thresholds.js        # Web Vitals threshold constants and rating logic
├── public/                      # Already exists
└── node_modules/                # Already exists (vue, vue-router, chart.js, vite installed)
```

**Structure Decision**: Three separate sub-projects (server, demo, dashboard) each with their own package.json, running independently. This matches the spec's three-component architecture and the existing directory layout with pre-installed node_modules.

---

## Phase Breakdown

### Phase 1: Library Update + Backend Core (P1 foundation)

**Goal**: Get the data pipeline working end-to-end -- library sends appId, backend receives and stores metrics.

**Dependencies**: None (starting point)

**Tasks**:

1. **Library: Add appId support** (FR-055, FR-056, FR-057)
   - Update `src/main.js`: add `appId` to default config (default: `undefined`); also update default `apiEndpoint` from port 5000 to 3001 to match server default
   - Update `src/core/WebVitalsReporter.js`: include `config.appId` in payload when present
   - Fix `src/core/BatchCollector.js` line 29: `metric.idm` -> `metric.id` (FR-058)
   - Rebuild the library (`npm run build`)

2. **Server: Project setup**
   - Create `server/package.json` with express, cors, nanoid dependencies
   - Create `server/index.js`: Express app, middleware (JSON parsing for both content types, CORS with `express.json({ limit: '1mb', type: ['application/json', 'text/plain'] })`), port config, data dir auto-creation
   - Verify server starts and responds to requests

3. **Server: App registration** (FR-001 through FR-007)
   - Create `server/utils/fileStore.js`: read/write JSON files with write queue
   - Create `server/services/appService.js`: register, list, findById
   - Create `server/routes/apps.js`: POST /api/apps, GET /api/apps, GET /api/apps/:appId (all three endpoints per FR-001, FR-002, FR-003)
   - Test: register an app via curl, verify apps.json is created; test GET /api/apps/:appId returns single app

4. **Server: Metric ingestion** (FR-008 through FR-016)
   - Create `server/services/metricService.js`: validate payload, enrich metrics, append to file
   - Create `server/routes/collect.js`: POST /api/collect
   - Test: send a metric payload via curl, verify data/<appId>.json is created with enriched records

**Deliverable**: `curl` can register an app and send metrics; data is persisted in JSON files.

---

### Phase 2: Demo App (P1)

**Goal**: A working Vue app that generates real web vitals data and sends it to the backend.

**Dependencies**: Phase 1 (library must have appId support, backend must accept metrics)

**Tasks**:

5. **Demo: Project setup**
   - Create `demo/package.json` referencing vue, vue-router, vite, and the local web-vitals-lib build (use `"web-vitals-lib": "file:.."` to reference the parent directory build)
   - Create `demo/vite.config.js` with dev server port 5173
   - Create `demo/index.html`, `demo/src/main.js`, `demo/src/App.vue`
   - Create `demo/.env.example` with VITE_APP_ID and VITE_API_ENDPOINT

6. **Demo: Router and pages** (FR-026 through FR-031)
   - Create `demo/src/router/index.js` with 3 routes
   - Create `demo/src/pages/HomePage.vue`: large hero image, heading, text block (LCP, FCP)
   - Create `demo/src/pages/AboutPage.vue`: dynamic content that loads after delay (CLS), form with inputs and button (INP)
   - Create `demo/src/pages/GalleryPage.vue`: multiple images with lazy loading (varied LCP, TTFB)
   - Add static image assets to `demo/public/assets/`

7. **Demo: Web-vitals-lib integration**
   - In `demo/src/main.js`: import and call `initWebVitals()` with appId and apiEndpoint from env
   - Add setup instructions / error display when appId is not configured (FR-031)

**Deliverable**: Navigate the demo app, switch tabs, and see metrics appear in `server/data/<appId>.json`.

---

### Phase 3: Backend Retrieval APIs + Dashboard App List (P1)

**Goal**: Backend serves metric data; dashboard shows app list and handles empty/error states.

**Dependencies**: Phase 1 (backend stores data), Phase 2 (demo app generates data for testing)

**Tasks**:

8. **Server: Metric retrieval endpoints** (FR-017, FR-018, FR-019, FR-020)
   - Create `server/services/aggregationService.js`: filter by page, compute routes, compute summaries (p75, distributions)
   - Create `server/routes/metrics.js`: GET /api/apps/:appId/metrics, GET /api/apps/:appId/routes, GET /api/apps/:appId/routes/summary
   - Test: curl all endpoints, verify correct data

9. **Dashboard: Project setup**
   - Create `dashboard/package.json` referencing vue, vue-router, vite, chart.js
   - Create `dashboard/vite.config.js` with dev server port 5174 and API proxy config
   - Create `dashboard/index.html`, `dashboard/src/main.js`, `dashboard/src/App.vue`
   - Create `dashboard/src/router/index.js` with routes: /, /apps/:appId, /apps/:appId/routes/:page
   - Create `dashboard/src/services/api.js`: fetch wrapper for backend API

10. **Dashboard: App List page** (FR-032 through FR-035)
    - Create `dashboard/src/pages/AppListPage.vue`: fetch and display apps, empty state, error state
    - Create `dashboard/src/utils/thresholds.js`: Web Vitals threshold constants

**Deliverable**: Dashboard shows list of registered apps; clicking navigates to route list (stub).

---

### Phase 4: Dashboard Route List and Route Detail (P2)

**Goal**: Full dashboard experience with route summaries and detailed metric views.

**Dependencies**: Phase 3 (retrieval APIs and dashboard setup)

**Tasks**:

11. **Dashboard: Route List page** (FR-036 through FR-042)
    - Create `dashboard/src/pages/RouteListPage.vue`: fetch routes and summaries, display metric cards
    - Create `dashboard/src/components/MetricCard.vue`: p75 value, rating color badge, sample count

12. **Dashboard: Route Detail page** (FR-043 through FR-046)
    - Create `dashboard/src/pages/RouteDetailPage.vue`: fetch metrics, compute and display per-metric detail
    - Create `dashboard/src/components/TimeSeriesChart.vue`: Chart.js line chart (value over time)
    - Create `dashboard/src/components/DistributionChart.vue`: Chart.js bar chart (rating distribution)
    - Create `dashboard/src/components/BrowserChart.vue`: Chart.js doughnut chart (browser breakdown)
    - Create `dashboard/src/components/AttributionPanel.vue`: display element selectors and URLs

**Deliverable**: Full dashboard navigation: App List -> Route List (with p75 summaries) -> Route Detail (charts, attribution, browser breakdown).

---

### Phase 5: P3 Features (Filtering, Waterfall)

**Goal**: Quality-of-life enhancements for power users.

**Dependencies**: Phase 4 (full dashboard working)

**Tasks**:

13. **Dashboard: Filter bar** (FR-050 through FR-054)
    - Create `dashboard/src/components/FilterBar.vue`: date range picker, browser dropdown, rating filter
    - Update Route Detail page to pass filters to API calls
    - Update `server/routes/metrics.js` to support startDate, endDate, browser, rating, name query params
    - Update `server/services/aggregationService.js` to apply the new filter parameters when computing summaries

14. **Dashboard: Network waterfall placeholder** (FR-047 through FR-049)
    - Create `dashboard/src/components/WaterfallPanel.vue`: show "Resource timing data not available" message
    - Wire into Route Detail page as a collapsible section

**Deliverable**: Filtering works on route detail; waterfall section shows placeholder.

---

## Dependency Graph

```
Phase 1 (Library + Backend Core)
    |
    v
Phase 2 (Demo App) -------> Phase 3 (Retrieval APIs + Dashboard Setup)
                                  |
                                  v
                             Phase 4 (Dashboard Route List + Detail)
                                  |
                                  v
                             Phase 5 (P3: Filtering + Waterfall)
```

Phases 2 and 3 can be partially parallelized: the retrieval API work (task 8) depends only on Phase 1, not on Phase 2. The dashboard setup (tasks 9-10) can start as soon as the retrieval APIs exist.

---

## Complexity Assessment

| Dimension          | Assessment | Notes |
|--------------------|-----------|-------|
| Components         | 3 sub-projects + 1 library update | Manageable: each is small and focused |
| New dependencies   | Express, cors, nanoid (server), Chart.js (dashboard) | All well-known, pre-installed in node_modules |
| File I/O           | Write queue needed | Simple promise-chain pattern; no external locking library |
| API surface        | 7 endpoints | Straightforward CRUD + aggregation |
| Chart types        | 3 (line, bar, doughnut) | Chart.js handles all natively |
| Frontend pages     | 3 dashboard views + 3 demo pages | Vue SFCs keep each page self-contained |
| Data aggregation   | P75 + rating distribution | Algorithm already exists in library helpers |
| Risk areas         | Concurrent file writes, large JSON parsing | Mitigated by write queue and 50K record constraint |

**Overall complexity**: Moderate. The individual pieces are straightforward, but there are many files to create across four codebases. The phased approach ensures each layer works before building on top of it.

**Estimated total files to create**: ~30 new files across server (8), demo (10), dashboard (14), plus 3 modified library files.

---

## SA Review Notes (2026-04-04)

Issues found and resolved during SA review:

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | CRITICAL | Missing contract document for `GET /api/apps/:appId` (FR-003). All other 6 endpoints had contracts. | Created `contracts/GET-apps-appId.md`. |
| 2 | CRITICAL | Library default `apiEndpoint` uses port 5000, but server defaults to 3001. Would cause confusion during setup. | Added note to Phase 1 Task 1 to update the default port in `src/main.js`. |
| 3 | CRITICAL | Library `calculateP75()` returns `0` for empty arrays, but server-side must return `null`. | Added note in data-model.md to clarify server implementation must return `null`, not `0`. |
| 4 | HIGH | `POST /api/collect` contract did not specify behavior when `browser` field is missing from payload. | Updated POST-collect.md to add 400 error for missing browser field. |
| 5 | HIGH | Plan Task 3 did not explicitly mention `GET /api/apps/:appId` (FR-003). | Updated Task 3 to explicitly list all three endpoints. |
| 6 | HIGH | Plan Phase 5 Task 13 only mentioned updating routes, not aggregationService. | Updated Task 13 to include aggregationService changes. |
| 7 | MEDIUM | No payload size limit specified for `/api/collect`. | Added `express.json({ limit: '1mb' })` note to server setup task. |
| 8 | MEDIUM | Demo app local dependency mechanism not specified. | Added `file:..` reference note to Phase 2 Task 5. |
| 9 | MEDIUM | Routes/summary contract did not specify behavior for valid page with no matching records. | Added note to GET-apps-appId-routes-summary.md. |
| 10 | LOW | Quickstart VITE_PORT env var not standard for Vite. | Added note to quickstart.md. |
