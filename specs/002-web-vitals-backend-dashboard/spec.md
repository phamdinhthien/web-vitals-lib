# Feature Specification: Web Vitals Backend, Demo App, and Monitoring Dashboard

**Feature Branch**: `002-web-vitals-backend-dashboard`  
**Created**: 2026-04-04  
**Last Revised**: 2026-04-04 (BA Review)  
**Status**: Draft (BA-Reviewed)  
**Input**: Build a backend to receive/store metrics, a Vue demo app, and a Sentry-like dashboard to monitor web vitals per app and per route.

---

## Context

The web-vitals-lib already collects browser performance metrics (LCP, FCP, CLS, INP, TTFB) with attribution data and sends them as JSON payloads to a configurable API endpoint. The payload structure is:

```json
{
  "metrics": [
    {
      "name": "LCP",
      "value": 2500,
      "rating": "good",
      "delta": 2500,
      "id": "v4-1234567890",
      "page": "https://example.com/home",
      "element": { "selector": "img.hero", "url": "https://example.com/hero.jpg" }
    }
  ],
  "browser": "Chrome"
}
```

The library uses `navigator.sendBeacon` with a `Blob` set to `Content-Type: application/json`. If sendBeacon fails, it falls back to `fetch` with `Content-Type: application/json` and `keepalive: true`. Metrics are batched per page session and sent when the page visibility changes to `hidden`.

The library currently accepts configuration with `apiEndpoint` (string) and `debug` (boolean). The `appId` field will be added as a new config option. The library currently has no concept of `appId` -- it needs to be added to both the config and the outbound payload.

There is currently no backend to receive this data, no way to visualize it, and no demo application to exercise the library. This spec covers three components that together complete the end-to-end story: collect, store, and monitor.

**Known code issue**: In `BatchCollector.js` line 29, `metric.idm` is a typo and should be `metric.id`. This should be fixed as part of the library update (FR-058).

---

## User Scenarios & Testing

### User Story 1 - Register an App and Receive Metrics (Priority: P1)

As a developer, I want to register my web application with the monitoring system and receive a unique app identifier so that the web-vitals-lib can tag metrics to my specific app and the backend can store them separately.

**Why this priority**: Without app registration and data ingestion, nothing else works. This is the foundational capability that all other features depend on.

**Independent Test**: Register an app via the API, configure web-vitals-lib with the returned appId, trigger a page load, and verify that the backend persists the metric data in that app's data store.

**Acceptance Scenarios**:

1. **Given** no apps are registered, **When** a developer sends a POST to `/api/apps` with `{ "name": "My App" }`, **Then** the system returns HTTP 201 with a response body containing `{ "appId": "<generated-id>", "name": "My App", "createdAt": "<ISO-8601 timestamp>" }` and the app appears in the list of registered apps.
2. **Given** an app is registered with appId "abc123", **When** the web-vitals-lib sends a metrics payload containing `appId: "abc123"`, **Then** the backend stores the metrics in the data file associated with "abc123" and returns HTTP 200/204.
3. **Given** a metrics payload arrives without an appId, **When** the backend processes the request, **Then** it returns HTTP 400 with error body `{ "error": "appId is required" }`.
4. **Given** a metrics payload arrives with an appId that does not match any registered app, **When** the backend processes the request, **Then** it returns HTTP 404 with error body `{ "error": "App not found" }`.
5. **Given** an app is registered, **When** multiple metric payloads are sent over time from different page visits, **Then** all payloads are appended to the app's data store (not overwritten) and each record includes a `receivedAt` server-side timestamp.
6. **Given** a registration request with an empty or missing `name` field, **When** the backend processes the request, **Then** it returns HTTP 400 with error body `{ "error": "App name is required" }`.
7. **Given** an app named "My App" already exists, **When** another registration request with `name: "My App"` is sent, **Then** the system creates a second app with its own unique appId (duplicate names are allowed).

---

### User Story 2 - Demo App Generates Real Metrics (Priority: P1)

As a developer evaluating the web-vitals-lib, I want a working demo application with multiple pages/routes so that I can see the library collecting and sending real metrics end-to-end.

**Why this priority**: A demo app is essential for testing the full pipeline (library -> backend -> dashboard) and for demonstrating the product to others. It is also the primary test harness.

**Independent Test**: Start the demo app, navigate through its routes, and verify that metrics are sent to the backend and appear in storage.

**Acceptance Scenarios**:

1. **Given** the demo app is running and configured with a valid appId, **When** a user loads the home page, **Then** the web-vitals-lib collects LCP, FCP, TTFB, and CLS metrics and sends them to the backend.
2. **Given** the demo app has at least 3 distinct routes (e.g., Home, About, Gallery or similar), **When** a user navigates between routes, **Then** each route generates its own set of metrics with the correct `page` URL recorded.
3. **Given** the demo app includes interactive elements (buttons, forms, images), **When** a user interacts with them, **Then** INP metrics are collected and element attribution data (selectors) is included.
4. **Given** the demo app includes a page with a large image, **When** the page loads, **Then** LCP attribution includes the element selector and resource URL.
5. **Given** the demo app is started, **When** the developer has not yet registered an app or configured an appId, **Then** the demo app displays a clear setup instruction or error message indicating that an appId is required.
6. **Given** the demo app is started but the backend is not running, **When** the user navigates the app, **Then** the demo app still functions normally (metrics sending fails silently per existing library behavior).

---

### User Story 3 - View List of Registered Apps (Priority: P1)

As a team lead, I want to see all registered applications on the dashboard so that I can choose which app to investigate.

**Why this priority**: The app list is the entry point to the entire dashboard experience. Without it, users cannot navigate to any monitoring data.

**Independent Test**: Register 2-3 apps via the API, open the dashboard, and verify all registered apps are listed with their names.

**Acceptance Scenarios**:

1. **Given** 3 apps are registered, **When** a user opens the dashboard, **Then** all 3 apps are displayed in a list showing the app name, appId, and creation date.
2. **Given** no apps are registered, **When** a user opens the dashboard, **Then** a clear empty state message is shown (e.g., "No apps registered yet. Use the API to register your first app.").
3. **Given** the app list is displayed, **When** a user clicks on an app, **Then** the dashboard navigates to that app's route/page list view.
4. **Given** the backend is unreachable, **When** a user opens the dashboard, **Then** an error message is displayed (e.g., "Unable to connect to the backend. Ensure the server is running.") instead of a blank page.

---

### User Story 4 - View Routes/Pages for an App (Priority: P2)

As a developer, I want to see all the routes (pages) that have reported metrics for my app so that I can identify which pages may have performance issues.

**Why this priority**: Grouping metrics by route is essential for actionable insights. A global average hides per-page problems.

**Independent Test**: Send metrics from 3 different page URLs for one app, open the dashboard for that app, and verify all 3 routes are listed with summary data.

**Acceptance Scenarios**:

1. **Given** an app has received metrics from 5 different page URLs, **When** a user views the app's detail page, **Then** all 5 routes are listed.
2. **Given** routes are listed, **When** the user views a route, **Then** they see a summary of each core web vital (LCP, FCP, CLS, INP, TTFB) with at minimum the p75 value and a rating (good/needs-improvement/poor) determined by standard Web Vitals thresholds.
3. **Given** a route has no metrics yet, **When** metrics arrive for that route, **Then** the route appears on the next dashboard refresh.
4. **Given** routes are listed, **When** a user clicks on a route, **Then** the dashboard navigates to the detailed metrics view for that route.
5. **Given** an app has received metrics but a particular metric type (e.g., INP) has zero samples for a route, **When** the user views that route's summary, **Then** that metric displays "No data" or a dash instead of a zero value.
6. **Given** an app exists but has received zero metrics, **When** the user views the app's detail page, **Then** an empty state message is shown (e.g., "No metrics received yet. Configure the web-vitals-lib with this app's appId to start collecting data.").

---

### User Story 5 - View Detailed Metrics for a Route (Priority: P2)

As a developer, I want to see detailed web vitals data for a specific route, including historical trends and element attribution, so that I can diagnose performance problems.

**Why this priority**: Detailed per-route metrics are the core value proposition of the dashboard. This is where developers find actionable information.

**Independent Test**: Send multiple metric payloads for one route over time, navigate to that route's detail view, and verify charts/data reflect the history.

**Acceptance Scenarios**:

1. **Given** a route has 20 metric samples for LCP, **When** a user views the route detail page, **Then** they see the p75 value, distribution of ratings (good/needs-improvement/poor count and percentage), sample count, and a time-series visualization of values over time.
2. **Given** LCP metrics include element attribution (selector, URL), **When** a user views LCP details, **Then** the element selector and resource URL are displayed so the developer knows which element is the LCP.
3. **Given** CLS metrics include the largest shift target selector, **When** a user views CLS details, **Then** the shift target element is displayed.
4. **Given** INP metrics include the event target selector, **When** a user views INP details, **Then** the target element is displayed.
5. **Given** a route has metrics from multiple browsers, **When** a user views the route detail, **Then** the browser breakdown is visible (e.g., a pie chart or bar chart showing percentage per browser).
6. **Given** a route has only 1 metric sample, **When** a user views the route detail, **Then** the p75 value is shown as that single sample's value, the time-series chart shows one data point, and the distribution shows counts of 1.
7. **Given** a metric type has no element attribution data (e.g., TTFB and FCP do not produce element data), **When** the user views that metric, **Then** the element attribution section is hidden or displays "N/A" rather than showing empty/broken UI.

---

### User Story 6 - View Network/Resource Waterfall (Priority: P3)

As a performance engineer, I want to see a network waterfall or resource timing breakdown for a page so that I can understand what resources are impacting load performance.

**Why this priority**: Network waterfall is an advanced diagnostic feature. Core web vitals monitoring is useful without it, so it is lower priority.

**Independent Test**: Send metric payloads that include resource timing entries, view the route detail page, and verify a waterfall/timeline visualization is rendered.

**Note**: This feature requires extending the web-vitals-lib to collect `PerformanceResourceTiming` entries. If this extension is not implemented in v1, the waterfall section should display a clear "Resource timing data not available" message.

**Acceptance Scenarios**:

1. **Given** the library sends resource timing data for a page load, **When** a user views the waterfall for that page session, **Then** individual resources are shown with their start time, duration, and type (script, stylesheet, image, etc.).
2. **Given** the waterfall is displayed, **When** a user hovers over or clicks a resource entry, **Then** they see additional details (URL, size if available, timing breakdown).
3. **Given** no resource timing data exists for a page session, **When** the user views the waterfall section, **Then** a clear "No resource timing data available" message is displayed.

---

### User Story 7 - Filter and Search Metrics (Priority: P3)

As a developer monitoring many routes, I want to filter metrics by date range, browser, and rating so that I can focus on specific problem areas.

**Why this priority**: Filtering is a quality-of-life enhancement. The dashboard is useful without it for small-to-medium data volumes.

**Independent Test**: Populate an app with metrics across multiple dates and browsers, apply filters on the dashboard, and verify the displayed data matches the filter criteria.

**Acceptance Scenarios**:

1. **Given** metrics span the last 7 days, **When** a user selects a date range of "last 3 days", **Then** only metrics from the last 3 days are shown and aggregations (p75, distribution) are recalculated based on the filtered set.
2. **Given** metrics come from Chrome and Firefox, **When** a user filters by "Chrome", **Then** only Chrome metrics are displayed and aggregations reflect only Chrome data.
3. **Given** a route has a mix of good/poor ratings, **When** a user filters by "poor", **Then** only poor-rated metrics are shown.
4. **Given** a filter is active that matches zero results, **When** the user views the dashboard, **Then** a "No metrics match the current filters" message is shown instead of an empty chart or broken UI.
5. **Given** multiple filters are active (e.g., date range + browser), **When** the user views results, **Then** filters are applied with AND logic (metrics must match all active filters).

---

### Edge Cases

- **Duplicate app names**: Two apps registering with the same name each receive a unique appId. Duplicate names are allowed. The dashboard displays both apps independently.
- **Large data files**: The system handles up to 50,000 metric records per app (see Constraints). Beyond this, the system should not crash but performance may degrade. When a data file exceeds 50,000 records, the API should still return a response (possibly slower) rather than timing out or throwing an error.
- **Malformed JSON payload**: The backend returns HTTP 400 with `{ "error": "Invalid JSON payload" }` and does not corrupt existing data.
- **Backend unreachable during metric send**: The library already handles this (sendBeacon + fetch fallback). Data for that session is lost. This is acceptable for v1.
- **Extreme outlier metric values** (e.g., LCP of 60,000ms): The system stores them as-is. Outlier filtering is out of scope for v1. The dashboard renders them in charts (may cause axis scaling issues, which is acceptable).
- **Unsupported browser**: If the demo app is accessed from a browser that does not support the Performance Observer API, metrics that cannot be measured are simply not sent. The demo app itself still functions normally.
- **Concurrent writes**: If two metric payloads arrive simultaneously for the same app, the backend must not corrupt the data file. The backend should use file locking or sequential write processing to ensure atomic appends.
- **Empty metrics array**: If a payload contains `{ "appId": "abc", "metrics": [], "browser": "Chrome" }`, the backend should return HTTP 400 with `{ "error": "Metrics array must not be empty" }` rather than storing an empty record.
- **Page URL normalization**: Routes are matched by exact `page` URL string. URLs with different query parameters (e.g., `/home?ref=a` vs `/home?ref=b`) are treated as different routes. Hash fragments are included. No normalization is applied in v1.
- **Invalid metric name**: If a metric has a `name` value other than LCP, FCP, CLS, INP, or TTFB, the backend should still accept and store it (forward compatibility), but the dashboard is only required to display the five core web vitals.
- **App deletion**: App deletion is out of scope for v1. Data files can be manually removed from disk if needed.
- **Server restart**: All registered apps and metric data must persist across server restarts (they are stored on disk). No in-memory-only state for app registry.

---

## Requirements

### Functional Requirements

**Backend - App Registration**

- **FR-001**: System MUST provide a `POST /api/apps` endpoint to register a new app by name and return a unique appId, app name, and creation timestamp.
- **FR-002**: System MUST provide a `GET /api/apps` endpoint to list all registered apps (returning appId, name, and createdAt for each).
- **FR-003**: System MUST provide a `GET /api/apps/:appId` endpoint to retrieve details of a single registered app by appId.
- **FR-004**: Each appId MUST be unique and generated by the system (not user-provided). Format: URL-safe string, minimum 8 characters (e.g., nanoid or UUID).
- **FR-005**: App names do NOT need to be unique.
- **FR-006**: Registration MUST reject requests with empty or missing `name` field with HTTP 400.
- **FR-007**: App registry data MUST be persisted to disk (e.g., an `apps.json` file) so that registered apps survive server restarts.

**Backend - Metric Ingestion**

- **FR-008**: System MUST provide a `POST /api/collect` endpoint to receive metric payloads from the web-vitals-lib.
- **FR-009**: The ingestion endpoint MUST accept the payload format: `{ "appId": "<id>", "metrics": [...], "browser": "..." }` where `metrics` is an array of metric objects matching the library's output format.
- **FR-010**: System MUST reject payloads missing `appId` with HTTP 400.
- **FR-011**: System MUST reject payloads where `appId` does not match any registered app with HTTP 404.
- **FR-012**: System MUST reject payloads where `metrics` is missing or is an empty array with HTTP 400.
- **FR-013**: System MUST append incoming metrics to the app's data file, enriching each metric record with: `browser` (from the payload), `receivedAt` (server-side ISO-8601 timestamp).
- **FR-014**: System MUST support CORS (Access-Control-Allow-Origin: *) so that browser-based clients (sendBeacon, fetch) from different origins can submit data.
- **FR-015**: System MUST handle both `Content-Type: application/json` and `Content-Type: text/plain` request bodies by parsing the body as JSON in both cases. This ensures compatibility regardless of how sendBeacon transmits the Blob.
- **FR-016**: System MUST handle concurrent write requests to the same app's data file without data corruption (via file locking, write queue, or equivalent mechanism).

**Backend - Metric Retrieval**

- **FR-017**: System MUST provide a `GET /api/apps/:appId/metrics` endpoint to retrieve all metrics for a given appId, with optional query parameter `page` to filter by page URL.
- **FR-018**: System MUST provide a `GET /api/apps/:appId/routes` endpoint to retrieve the list of distinct page URLs (routes) for a given appId.
- **FR-019**: System MUST provide a `GET /api/apps/:appId/routes/summary?page=<encodedPageURL>` endpoint to retrieve aggregated metric summaries for a given route: p75 values, rating distribution (good/needs-improvement/poor counts), and sample count for each of the five core web vitals.
- **FR-020**: All retrieval endpoints MUST return HTTP 404 if the appId does not match a registered app.

**Backend - Storage**

- **FR-021**: System MUST use file-based storage (no external database).
- **FR-022**: Each registered app MUST have its own dedicated data file (e.g., `data/<appId>.json`).
- **FR-023**: Data files MUST be human-readable JSON format.
- **FR-024**: The app registry MUST be stored in a separate file (e.g., `data/apps.json`).
- **FR-025**: The `data/` directory MUST be auto-created on server startup if it does not exist.

**Demo App**

- **FR-026**: Demo app MUST be a Vue.js single-page application with Vue Router.
- **FR-027**: Demo app MUST integrate the web-vitals-lib and configure it with an appId and backend API endpoint.
- **FR-028**: Demo app MUST have at least 3 distinct routes/pages to generate variety in the `page` field.
- **FR-029**: Demo app MUST include content that generates measurable LCP (large images or text blocks), CLS (dynamically loaded content), and INP (interactive elements like buttons and forms).
- **FR-030**: Demo app MUST include a mechanism to simulate slow-loading resources to produce varied TTFB and LCP values (e.g., lazy-loaded images, heavy content).
- **FR-031**: Demo app MUST provide a configuration mechanism (e.g., environment variable or config file) for the appId and backend API endpoint.

**Dashboard - App List View**

- **FR-032**: Dashboard MUST display a list of all registered apps retrieved from the backend API.
- **FR-033**: Each app in the list MUST show the app name and appId and be clickable to navigate to the app's detail view.
- **FR-034**: Dashboard MUST show an empty state when no apps are registered with guidance text.
- **FR-035**: Dashboard MUST show an error state when the backend API is unreachable.

**Dashboard - Route List View (per app)**

- **FR-036**: Dashboard MUST display a list of all routes (distinct page URLs) that have reported metrics for the selected app.
- **FR-037**: Each route MUST display a summary of the five core web vitals (LCP, FCP, CLS, INP, TTFB) showing p75 values.
- **FR-038**: Each metric summary MUST include a visual rating indicator (good / needs-improvement / poor) using color coding: green for good, orange/amber for needs-improvement, red for poor.
- **FR-039**: Rating thresholds MUST match Google's published Web Vitals thresholds (see SC-006).
- **FR-040**: Each route MUST be clickable to navigate to the detailed metrics view.
- **FR-041**: Dashboard MUST display "No data" for metric types that have zero samples for a given route.
- **FR-042**: Dashboard MUST show an empty state when the app has zero metrics.

**Dashboard - Route Detail View**

- **FR-043**: Dashboard MUST display per-metric detail for LCP, FCP, CLS, INP, and TTFB including: p75 value, rating, sample count, and distribution of ratings (both count and percentage).
- **FR-044**: Dashboard MUST display a time-series chart showing metric values over time for each web vital. X-axis: `receivedAt` timestamp. Y-axis: metric value.
- **FR-045**: Dashboard MUST display element attribution data where available (LCP element selector and URL, CLS shift target selector, INP event target selector). For metrics without attribution (FCP, TTFB), the attribution section is hidden.
- **FR-046**: Dashboard MUST display browser distribution for the selected route (e.g., pie chart or percentage breakdown).

**Dashboard - Network Waterfall (P3)**

- **FR-047**: Dashboard SHOULD display a network waterfall timeline for page load sessions when resource timing data is available.
- **FR-048**: Waterfall entries SHOULD show resource URL, type, start time, and duration.
- **FR-049**: When no resource timing data is available, the waterfall section SHOULD display a "Data not available" message.

**Dashboard - Filtering (P3)**

- **FR-050**: Dashboard SHOULD support filtering metrics by date range (predefined ranges: last 1 hour, last 24 hours, last 7 days, last 30 days, and custom range).
- **FR-051**: Dashboard SHOULD support filtering metrics by browser.
- **FR-052**: Dashboard SHOULD support filtering metrics by rating (good / needs-improvement / poor).
- **FR-053**: When multiple filters are active, they SHOULD be applied with AND logic.
- **FR-054**: When active filters match zero results, the dashboard SHOULD display a "No metrics match filters" message.

**Library Updates**

- **FR-055**: The web-vitals-lib configuration MUST accept an optional `appId` field (string).
- **FR-056**: When `appId` is configured, the outbound payload MUST include `appId` at the top level: `{ "appId": "<id>", "metrics": [...], "browser": "..." }`.
- **FR-057**: When `appId` is not configured, the library MUST send the payload without the `appId` field (backward compatibility).
- **FR-058**: The typo `metric.idm` in `BatchCollector.js` line 29 MUST be fixed to `metric.id`.

---

### Key Entities

- **App**: A registered web application. Attributes: `appId` (unique identifier, URL-safe string), `name` (display name, string, non-empty), `createdAt` (ISO-8601 registration timestamp).
- **MetricRecord**: A single web vitals measurement as stored on disk. Attributes: `name` (one of LCP/FCP/CLS/INP/TTFB), `value` (numeric), `rating` (one of "good"/"needs-improvement"/"poor"), `delta` (numeric), `id` (string, unique per metric instance from the library), `page` (full URL of the page), `element` (attribution object, optional -- present for LCP, CLS, INP when available), `browser` (browser name string), `receivedAt` (ISO-8601 server-side timestamp).
- **Route**: A distinct page URL within an app. Derived from the `page` field across MetricRecords. Not stored separately -- computed from metric data. Identified by exact string match of the `page` field.
- **MetricSummary**: Aggregated view of metrics for a route and metric type. Computed values: `p75` (75th percentile of `value` field), `ratingDistribution` (object with `good`, `needsImprovement`, `poor` counts), `sampleCount` (total number of records). Not stored -- computed on read from raw MetricRecords.

---

## API Summary

| Method | Endpoint | Description | Request Body | Success Response |
|--------|----------|-------------|-------------|------------------|
| POST | `/api/apps` | Register a new app | `{ "name": "..." }` | 201: `{ "appId", "name", "createdAt" }` |
| GET | `/api/apps` | List all apps | -- | 200: `[ { "appId", "name", "createdAt" }, ... ]` |
| GET | `/api/apps/:appId` | Get app details | -- | 200: `{ "appId", "name", "createdAt" }` |
| POST | `/api/collect` | Ingest metrics | `{ "appId", "metrics": [...], "browser" }` | 204: No content |
| GET | `/api/apps/:appId/metrics?page=...` | Get metrics (optionally filtered by page) | -- | 200: `[ { MetricRecord }, ... ]` |
| GET | `/api/apps/:appId/routes` | Get distinct routes | -- | 200: `[ "/home", "/about", ... ]` |
| GET | `/api/apps/:appId/routes/summary?page=...` | Get metric summary for a route | -- | 200: `{ "LCP": { p75, ratingDistribution, sampleCount }, ... }` |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A developer can register an app, configure the demo app, navigate through all demo routes, and see all collected metrics on the dashboard within 10 minutes of starting the system (including server and demo app startup).
- **SC-002**: The backend correctly stores 100% of valid metric payloads (no silent data loss for payloads that receive a success response).
- **SC-003**: The dashboard displays p75 values that match manual calculation from the stored data (correctness verified by computing p75 from the JSON data file and comparing to the dashboard display).
- **SC-004**: The dashboard loads the app list in under 2 seconds and the route detail view in under 3 seconds for an app with up to 10,000 metric records.
- **SC-005**: The demo app generates all 5 core web vitals (LCP, FCP, CLS, INP, TTFB) across its routes within a single user session of navigating all pages and interacting with elements.
- **SC-006**: Web Vitals rating thresholds match Google's published thresholds:
  - LCP: good < 2500ms, needs-improvement 2500-4000ms, poor >= 4000ms
  - CLS: good < 0.1, needs-improvement 0.1-0.25, poor >= 0.25
  - FCP: good < 1800ms, needs-improvement 1800-3000ms, poor >= 3000ms
  - INP: good < 200ms, needs-improvement 200-500ms, poor >= 500ms
  - TTFB: good < 800ms, needs-improvement 800-1800ms, poor >= 1800ms
- **SC-007**: All three components (backend, demo app, dashboard) can run simultaneously on a developer's local machine using a single command or at most 3 terminal commands.
- **SC-008**: All API error responses use a consistent format: `{ "error": "<human-readable message>" }` with appropriate HTTP status codes.

---

## Assumptions

- The web-vitals-lib will be updated minimally (adding `appId` to config and payload, fixing the `idm` typo) but its core collection and sending mechanism remains unchanged.
- File-based storage is sufficient for the expected data volume (single developer or small team usage, not production-scale).
- The backend, demo app, and dashboard are all intended for local development use, not production deployment. No authentication or authorization is required for v1.
- The dashboard is read-only -- it does not modify or delete metric data.
- Resource timing / network waterfall data (User Story 6) requires extending the library to collect `PerformanceResourceTiming` entries. If this extension is deferred, the waterfall feature will show an empty or unavailable state.
- All three components run on the same machine and communicate over localhost.
- The backend serves only as a data receiver and API for the dashboard. It does not perform alerting, anomaly detection, or any proactive notifications.
- Standard Web Vitals thresholds from Google (as of 2026) are used for rating classification. The system does not support custom thresholds in v1.
- The backend technology is Node.js with Express (or similar lightweight framework) to maintain consistency with the existing JavaScript ecosystem.
- The dashboard is a separate Vue.js application (or could be served by the backend as static files). The specific approach is a technical decision for the SA phase.

---

## Constraints

- **Storage**: File-based only, no external database dependencies. The system must function with only a Node.js runtime and file system access.
- **Data volume**: The system must handle up to 50,000 metric records per app without degradation below the performance targets in SC-004. Beyond 50,000 records per app, performance is not guaranteed but the system must not crash or corrupt data.
- **No authentication**: All APIs are open. This is acceptable for local development use.
- **Browser support for demo app**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge latest 2 versions). The demo app does not need to support legacy browsers.
- **Content-Type handling**: The backend must accept both `application/json` and `text/plain` Content-Types for the ingestion endpoint and parse both as JSON.
- **Port allocation**: Backend defaults to port 3001, demo app to port 5173 (Vite default), dashboard to port 5174. Ports should be configurable via environment variables to avoid conflicts.

---

## Clarifications

Decisions made during BA review, with reasoning:

| # | Topic | Decision | Reasoning |
|---|-------|----------|-----------|
| C-001 | **Content-Type for sendBeacon** | Backend must handle both `application/json` and `text/plain`. | The library creates a Blob with `type: 'application/json'`, so most browsers will send it as `application/json`. However, some browser/CORS configurations may strip or change the Content-Type. Handling both is defensive and low-cost. |
| C-002 | **appId placement in payload** | `appId` is a top-level field in the JSON payload body, not a URL parameter or header. | This is the simplest change to the existing library -- just add one field to the payload object. Using a header would require changes to sendBeacon usage (sendBeacon does not support custom headers). Using a URL parameter would require dynamic endpoint construction. |
| C-003 | **URL normalization for routes** | No normalization in v1. Exact string match on the `page` field. | URL normalization is complex (query params, trailing slashes, hash fragments). For v1 with developer-controlled demo apps, exact match is sufficient and avoids unexpected behavior. |
| C-004 | **Dashboard technology** | Vue.js for the dashboard (matching the demo app). | Keeps the project in a single frontend framework, reducing context switching for developers. |
| C-005 | **Backend technology** | Node.js with Express (or similar). | Matches the existing JavaScript/Node.js ecosystem of the library. Low barrier for contributors. |
| C-006 | **App deletion** | Out of scope for v1. | App deletion requires cascade logic (deleting data files) and confirmation UX. For a local dev tool, manual file deletion suffices. |
| C-007 | **Metric data retention / rotation** | Out of scope for v1. Data grows indefinitely up to the 50K constraint. | For local dev use, data volumes are manageable. Retention policies add complexity not needed for v1. |
| C-008 | **Real-time updates on dashboard** | Not required. Dashboard uses manual refresh or page navigation to load fresh data. | Real-time (WebSocket) adds significant complexity. For a local dev tool, refresh-on-navigate is sufficient. |
| C-009 | **P75 calculation method** | Use the nearest-rank method: sort values ascending, take the value at index `ceil(0.75 * n) - 1`. | This matches the existing `calculateP75` function in `src/utils/helpers.js` and is the standard method used by Google for Web Vitals reporting. |
| C-010 | **Backward compatibility of library** | When `appId` is not configured, the library omits it from the payload (no breaking change for existing users). | Existing users who do not use the backend should not be affected by the library update. |
| C-011 | **Summary endpoint design** | Use a query parameter for route (`?page=...`) rather than encoding the full URL in the path. | Full URLs in path segments require encoding/decoding and can hit URL length limits. Query parameters are simpler. |
