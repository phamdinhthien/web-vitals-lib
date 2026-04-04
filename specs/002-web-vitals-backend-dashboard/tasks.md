# Tasks: Web Vitals Backend, Demo App, and Monitoring Dashboard

**Input**: Design documents from `/specs/002-web-vitals-backend-dashboard/`  
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/  
**Feature Branch**: `002-web-vitals-backend-dashboard`  
**Date**: 2026-04-04

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration for all sub-projects.

- [ ] T001 [P] [INFRA] Create `server/package.json` with express, cors, nanoid dependencies
- [ ] T002 [P] [INFRA] Create `demo/package.json` with vue, vue-router, vite, and local web-vitals-lib (`"web-vitals-lib": "file:.."`) dependencies
- [ ] T003 [P] [INFRA] Create `dashboard/package.json` with vue, vue-router, vite, chart.js dependencies
- [ ] T004 [INFRA] Create `server/index.js` -- Express app setup with JSON body parsing (both `application/json` and `text/plain`, limit 1mb), CORS middleware (`Access-Control-Allow-Origin: *`), route mounting, port config (default 3001 via `PORT` env var), and auto-creation of `server/data/` directory on startup (FR-014, FR-015, FR-025)
- [ ] T005 [P] [INFRA] Create `demo/vite.config.js` with dev server port 5173, and `demo/index.html` SPA entry point
- [ ] T006 [P] [INFRA] Create `demo/.env.example` with `VITE_APP_ID` and `VITE_API_ENDPOINT=http://localhost:3001` template variables
- [ ] T007 [P] [INFRA] Create `dashboard/vite.config.js` with dev server port 5174, proxy `/api` to `http://localhost:3001`, and `dashboard/index.html` SPA entry point
- [ ] T008 [INFRA] Add `server/data/` to `.gitignore`

**Checkpoint**: All three sub-projects can install dependencies and start (server responds, Vite dev servers load).

---

## Phase 2: Foundation (Data Layer and Core Services)

**Purpose**: File storage, app registry, and metric ingestion -- the data backbone that all features depend on.

- [ ] T009 [BE] Create `server/utils/fileStore.js` -- low-level JSON file read/write with per-appId write queue (promise chain) to ensure atomic appends and prevent data corruption on concurrent writes (FR-016, FR-021, FR-022, FR-023)
- [ ] T010 [BE] Create `server/services/appService.js` -- register app (generate 12-char nanoid, persist to `data/apps.json`), list all apps, find app by appId; initialize `apps.json` as `[]` if missing (FR-004, FR-005, FR-007)
- [ ] T011 [BE] Create `server/services/metricService.js` -- validate payload (require appId, non-empty metrics array, browser field), enrich each metric with `browser` and `receivedAt` ISO-8601 timestamp, append to `data/<appId>.json` via fileStore write queue (FR-009, FR-010, FR-011, FR-012, FR-013, FR-016)
- [ ] T012 [BE] Create `server/services/aggregationService.js` -- extract distinct routes from metric data, filter metrics by page URL, compute p75 (nearest-rank method returning `null` for empty arrays), compute rating distributions (`good`/`needsImprovement`/`poor` counts), and build summary for all 5 core web vitals (FR-017, FR-018, FR-019)

**Checkpoint**: All data services are unit-testable; file I/O works correctly with concurrent writes.

---

## Phase 3: Library Update

**Purpose**: Add appId support to the web-vitals-lib and fix existing bug.

- [ ] T013 [P] [LIB] [US1] Fix typo `metric.idm` to `metric.id` in `src/core/BatchCollector.js` line 29 (FR-058)
- [ ] T014 [P] [LIB] [US1] Add `appId` to default config in `src/main.js` (default: `undefined`); update default `apiEndpoint` from port 5000 to 3001 (FR-055)
- [ ] T015 [LIB] [US1] Update `src/core/WebVitalsReporter.js` to include `config.appId` in the outbound payload when present; omit when undefined for backward compatibility (FR-056, FR-057)
- [ ] T016 [LIB] Rebuild the library (`npm run build`) and verify dist output

**Checkpoint**: Library sends `{ "appId": "...", "metrics": [...], "browser": "..." }` when appId is configured; sends without appId when not configured. The `metric.idm` bug is fixed.

---

## Phase 4: Backend API Endpoints

**Purpose**: All REST endpoints for app registration, metric collection, and data retrieval.

### US1 -- App Registration and Metric Ingestion (P1)

- [ ] T017 [BE] [US1] Create `server/routes/apps.js` -- implement `POST /api/apps` (validate name not empty, call appService.register, return 201), `GET /api/apps` (call appService.list, return 200), `GET /api/apps/:appId` (call appService.findById, return 200 or 404) per contracts/POST-apps.md, contracts/GET-apps.md, contracts/GET-apps-appId.md (FR-001, FR-002, FR-003, FR-006)
- [ ] T018 [BE] [US1] Create `server/routes/collect.js` -- implement `POST /api/collect` (validate appId present, validate app exists via appService, validate metrics array non-empty, validate browser present, call metricService.ingest, return 204) per contracts/POST-collect.md (FR-008, FR-010, FR-011, FR-012)
- [ ] T019 [BE] [US1] Register app routes and collect route in `server/index.js` and add JSON parse error handler returning `{ "error": "Invalid JSON payload" }` with HTTP 400

### US4/US5 -- Metric Retrieval (P2)

- [ ] T020 [BE] [US4] Create `server/routes/metrics.js` -- implement `GET /api/apps/:appId/routes` (validate app exists, call aggregationService.getRoutes, return sorted array) per contracts/GET-apps-appId-routes.md (FR-018, FR-020)
- [ ] T021 [BE] [US4] Implement `GET /api/apps/:appId/routes/summary?page=...` in `server/routes/metrics.js` (validate app exists, require page param, call aggregationService.getSummary, return summary for all 5 metrics) per contracts/GET-apps-appId-routes-summary.md (FR-019, FR-020)
- [ ] T022 [BE] [US5] Implement `GET /api/apps/:appId/metrics?page=...` in `server/routes/metrics.js` (validate app exists, apply optional page filter, return metric records array) per contracts/GET-apps-appId-metrics.md (FR-017, FR-020)

### US7 -- Extended Filtering (P3)

- [ ] T023 [BE] [US7] Add `name`, `browser`, `rating`, `startDate`, `endDate` query parameter support to `GET /api/apps/:appId/metrics` in `server/routes/metrics.js` with AND logic (FR-050, FR-051, FR-052, FR-053)
- [ ] T024 [BE] [US7] Update `server/services/aggregationService.js` to accept and apply filter parameters (startDate, endDate, browser, rating) when computing summaries

**Checkpoint**: All 7 API endpoints are functional. `curl` can register an app, send metrics, and retrieve routes/summaries/metrics with filtering.

---

## Phase 5: Demo App (P1)

**Purpose**: Vue demo application that exercises the web-vitals-lib and generates real metrics.

- [ ] T025 [FE] [US2] Create `demo/src/main.js` -- Vue 3 app creation, mount router, import and call `initWebVitals()` with appId from `import.meta.env.VITE_APP_ID` and apiEndpoint from `import.meta.env.VITE_API_ENDPOINT`; display setup warning if appId not configured (FR-027, FR-031)
- [ ] T026 [FE] [US2] Create `demo/src/App.vue` -- root component with `<router-view>`, navigation bar with links to Home, About, and Gallery routes
- [ ] T027 [FE] [US2] Create `demo/src/router/index.js` -- Vue Router with 3 routes: `/` (Home), `/about` (About), `/gallery` (Gallery) (FR-026, FR-028)
- [ ] T028 [FE] [US2] Create `demo/src/pages/HomePage.vue` -- large hero image for LCP, prominent heading and text block for FCP, interactive button for INP (FR-029, FR-030)
- [ ] T029 [FE] [US2] Create `demo/src/pages/AboutPage.vue` -- dynamically loaded content after delay to trigger CLS, form with text inputs and submit button for INP (FR-029, FR-030)
- [ ] T030 [FE] [US2] Create `demo/src/pages/GalleryPage.vue` -- multiple images with lazy loading for varied LCP/TTFB, click-to-expand interaction for INP (FR-029, FR-030)
- [ ] T031 [P] [FE] [US2] Add static image assets to `demo/public/assets/` (hero image, gallery images) for generating measurable LCP values

**Checkpoint**: Demo app runs on port 5173. Navigating all 3 routes and interacting with elements generates all 5 core web vitals (LCP, FCP, CLS, INP, TTFB). Metrics appear in `server/data/<appId>.json` after tab switch.

---

## Phase 6: Dashboard -- App List and Setup (P1)

**Purpose**: Dashboard application scaffold and the entry-point app list view.

- [ ] T032 [FE] [US3] Create `dashboard/src/main.js` -- Vue 3 app creation, mount router
- [ ] T033 [FE] [US3] Create `dashboard/src/App.vue` -- root component with `<router-view>` and top navigation bar with breadcrumb-style nav
- [ ] T034 [FE] [US3] Create `dashboard/src/router/index.js` -- Vue Router with routes: `/` (AppList), `/apps/:appId` (RouteList), `/apps/:appId/routes/:page` (RouteDetail)
- [ ] T035 [FE] [US3] Create `dashboard/src/services/api.js` -- fetch wrapper for all backend API calls: getApps(), getApp(appId), getRoutes(appId), getRouteSummary(appId, page), getMetrics(appId, filters)
- [ ] T036 [FE] [US3] Create `dashboard/src/utils/thresholds.js` -- Web Vitals threshold constants (LCP, FCP, CLS, INP, TTFB) and `getRating(metricName, value)` function per SC-006
- [ ] T037 [FE] [US3] Create `dashboard/src/pages/AppListPage.vue` -- fetch and display all apps (name, appId, createdAt), clickable rows navigating to `/apps/:appId`, empty state ("No apps registered yet"), error state when backend unreachable (FR-032, FR-033, FR-034, FR-035)

**Checkpoint**: Dashboard loads on port 5174, shows registered apps, handles empty and error states. Clicking an app navigates to route list (stub).

---

## Phase 7: Dashboard -- Route List and Route Detail (P2)

**Purpose**: Per-app route summaries and detailed per-route metric views with visualizations.

### Route List View

- [ ] T038 [FE] [US4] Create `dashboard/src/components/MetricCard.vue` -- displays p75 value, color-coded rating badge (green/amber/red), sample count, and "No data" for null p75 (FR-037, FR-038, FR-039, FR-041)
- [ ] T039 [FE] [US4] Create `dashboard/src/pages/RouteListPage.vue` -- fetch routes and summary for each route, display 5 MetricCard components per route, clickable rows navigating to route detail, empty state for zero metrics (FR-036, FR-040, FR-042)

### Route Detail View

- [ ] T040 [FE] [US5] Create `dashboard/src/components/TimeSeriesChart.vue` -- Chart.js line chart with `receivedAt` on X-axis and metric `value` on Y-axis; handle single data point gracefully (FR-044)
- [ ] T041 [FE] [US5] Create `dashboard/src/components/DistributionChart.vue` -- Chart.js horizontal bar chart showing good/needs-improvement/poor counts with green/amber/red colors (FR-043)
- [ ] T042 [FE] [US5] Create `dashboard/src/components/BrowserChart.vue` -- Chart.js doughnut chart showing browser distribution as percentages (FR-046)
- [ ] T043 [FE] [US5] Create `dashboard/src/components/AttributionPanel.vue` -- display element selector and resource URL for LCP, shift target for CLS, event target for INP; hide section for FCP/TTFB or when no attribution data (FR-045)
- [ ] T044 [FE] [US5] Create `dashboard/src/pages/RouteDetailPage.vue` -- fetch metrics for the selected route, render per-metric sections (LCP, FCP, CLS, INP, TTFB) each with p75/rating/count, TimeSeriesChart, DistributionChart, AttributionPanel; include BrowserChart for overall browser breakdown (FR-043, FR-044, FR-045, FR-046)

**Checkpoint**: Full dashboard navigation works: App List -> Route List (with p75 color-coded summaries) -> Route Detail (time-series charts, distribution bars, browser doughnut, element attribution). Single data point and missing data cases are handled.

---

## Phase 8: Dashboard -- P3 Features (Filtering and Waterfall)

**Purpose**: Quality-of-life enhancements for power users.

### Filtering (US7)

- [ ] T045 [FE] [US7] Create `dashboard/src/components/FilterBar.vue` -- date range selector (last 1h, 24h, 7d, 30d, custom), browser dropdown, rating filter (good/needs-improvement/poor), clear all filters button (FR-050, FR-051, FR-052)
- [ ] T046 [FE] [US7] Integrate FilterBar into `dashboard/src/pages/RouteDetailPage.vue` -- pass filter values as query params to API calls, re-fetch and re-render on filter change, display "No metrics match filters" for zero results (FR-053, FR-054)

### Network Waterfall (US6)

- [ ] T047 [FE] [US6] Create `dashboard/src/components/WaterfallPanel.vue` -- placeholder panel displaying "Resource timing data not available" message; wire into RouteDetailPage as a collapsible section (FR-047, FR-048, FR-049)

**Checkpoint**: Filtering by date/browser/rating works with AND logic on route detail. Waterfall section shows placeholder message.

---

## Phase 9: Integration and Polish

**Purpose**: End-to-end verification, error handling consistency, and cross-cutting concerns.

- [ ] T048 [FULL] Verify CORS end-to-end: demo app (port 5173) sends metrics to server (port 3001) via sendBeacon and fetch fallback without CORS errors (FR-014)
- [ ] T049 [FULL] Verify consistent error response format `{ "error": "..." }` with correct HTTP status codes across all 7 endpoints (SC-008)
- [ ] T050 [FULL] End-to-end smoke test: register app via API, configure demo app with appId, navigate all 3 demo routes, interact with elements, switch tabs, verify all 5 metrics appear in dashboard route list and route detail views (SC-001, SC-005)
- [ ] T051 [BE] Verify concurrent write safety: send 10 simultaneous metric payloads for the same appId and confirm no data corruption in `data/<appId>.json` (FR-016)
- [ ] T052 [FULL] Verify server restart persistence: register apps, send metrics, restart server, confirm all data is intact via API (FR-007)
- [ ] T053 [BE] Verify edge cases: malformed JSON returns 400, empty metrics array returns 400, missing appId returns 400, unknown appId returns 404, empty name returns 400 (spec Edge Cases section)
- [ ] T054 [FE] Add basic CSS styling to dashboard for readability: metric card colors, chart sizing, responsive layout, loading spinners
- [ ] T055 [FE] Add basic CSS styling to demo app: navigation, page layout, image sizing

**Checkpoint**: Complete end-to-end pipeline works. All error cases handled consistently. UI is presentable.

---

## Domain Execution Summary

### Task Distribution

| Domain | Tag | Task Count | Parallel Tasks | Key Dependencies |
|--------|-----|-----------|---------------|-----------------|
| Infrastructure | [INFRA] | 8 | T001, T002, T003, T005, T006, T007 | None (Phase 1) |
| Backend | [BE] | 13 | T013, T014 (lib) | Phase 1 complete |
| Library | [LIB] | 4 | T013, T014 | None |
| Frontend (Demo) | [FE] | 7 | T031 | Phase 3 (lib) + Phase 4 (server) |
| Frontend (Dashboard) | [FE] | 16 | T040-T043 | Phase 4 (API endpoints) |
| Full-stack | [FULL] | 5 | None | All phases complete |
| **Total** | | **53** | | |

### Execution Order

```
Phase 1 [INFRA] ─────────────────────────────────────────────┐
    |                                                         |
Phase 2 [BE] (data layer)                                    |
    |                                                         |
Phase 3 [LIB] (can run parallel with Phase 2) ───────┐       |
    |                                                  |       |
Phase 4 [BE] (API endpoints)                          |       |
    |                          \                       |       |
Phase 5 [FE-Demo] ←────────────(depends on lib+server)|      |
    |                                                  |       |
Phase 6 [FE-Dashboard setup] ←─(depends on Phase 4)   |      |
    |                                                         |
Phase 7 [FE-Dashboard views] ←─(depends on Phase 6)          |
    |                                                         |
Phase 8 [FE-Dashboard P3] ←────(depends on Phase 7)          |
    |                                                         |
Phase 9 [FULL] ←────────────────(depends on ALL above) ──────┘
```

### Parallel Opportunities

1. **Phase 1**: T001, T002, T003, T005, T006, T007 can all run in parallel (different files/projects)
2. **Phase 2 + Phase 3**: Backend data layer (T009-T012) and Library updates (T013-T016) can run in parallel (different codebases)
3. **Phase 5 + Phase 6**: Demo app (T025-T031) and Dashboard setup (T032-T037) can start in parallel once Phase 4 is complete
4. **Phase 7**: Chart components T040, T041, T042, T043 can be built in parallel (independent components)

### Agent Assignment

| Agent | Phases | Tasks | Description |
|-------|--------|-------|-------------|
| **INFRA Agent** | Phase 1 | T001-T008 | Project scaffolding, config, build setup |
| **BE Agent** | Phase 2, Phase 4 | T009-T012, T017-T024, T051, T053 | Data layer, all API endpoints, server-side validation |
| **LIB Agent** | Phase 3 | T013-T016 | Library appId support, bug fix, rebuild |
| **FE Agent (Demo)** | Phase 5 | T025-T031, T055 | Vue demo app with 3 routes and web-vitals integration |
| **FE Agent (Dashboard)** | Phase 6, 7, 8 | T032-T047, T054 | Dashboard app list, route views, charts, filters |
| **FULL Agent** | Phase 9 | T048-T050, T052 | End-to-end integration testing and verification |
