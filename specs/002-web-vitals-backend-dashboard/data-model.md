# Data Model: Web Vitals Backend

**Feature**: 002-web-vitals-backend-dashboard  
**Date**: 2026-04-04

---

## Storage Layout

```
server/
  data/
    apps.json              # App registry (array of App objects)
    <appId>.json           # Per-app metric records (array of MetricRecord objects)
```

The `data/` directory is auto-created on server startup if it does not exist (FR-025).

---

## Entity: App

Stored in `data/apps.json` as a JSON array.

| Field       | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| `appId`     | string | Yes      | Unique identifier, URL-safe, 12 chars (nanoid)   |
| `name`      | string | Yes      | Display name, non-empty, duplicates allowed       |
| `createdAt` | string | Yes      | ISO-8601 timestamp of registration                |

### Example: `data/apps.json`

```json
[
  {
    "appId": "V1StGXR8_Z5j",
    "name": "My Demo App",
    "createdAt": "2026-04-04T10:30:00.000Z"
  },
  {
    "appId": "k7Bb2xTF_m9Q",
    "name": "Production Site",
    "createdAt": "2026-04-04T11:00:00.000Z"
  }
]
```

### Initialization

When `apps.json` does not exist, it is created as an empty array `[]`.

---

## Entity: MetricRecord

Stored in `data/<appId>.json` as a JSON array. Each file contains all metric records for one app.

| Field        | Type   | Required | Description                                                    |
|--------------|--------|----------|----------------------------------------------------------------|
| `name`       | string | Yes      | Metric name: "LCP", "FCP", "CLS", "INP", or "TTFB"           |
| `value`      | number | Yes      | Metric value (ms for timing metrics, unitless for CLS)         |
| `rating`     | string | Yes      | "good", "needs-improvement", or "poor"                         |
| `delta`      | number | Yes      | Delta value from the web-vitals library                        |
| `id`         | string | Yes      | Unique metric instance ID from the library (e.g., "v4-123...")  |
| `page`       | string | Yes      | Full URL of the page where the metric was collected             |
| `element`    | object | No       | Attribution data (present for LCP, CLS, INP when available)    |
| `browser`    | string | Yes      | Browser name (added by server from payload top-level field)     |
| `receivedAt` | string | Yes      | ISO-8601 server-side timestamp (added by server on ingestion)   |

### Element Attribution Sub-object

The `element` field varies by metric type:

**LCP element**:
| Field      | Type   | Description                    |
|------------|--------|--------------------------------|
| `selector` | string | CSS selector of LCP element    |
| `url`      | string | Resource URL (optional, for images/videos) |

**CLS element**:
| Field      | Type   | Description                           |
|------------|--------|---------------------------------------|
| `selector` | string | CSS selector of largest shift target  |

**INP element**:
| Field      | Type   | Description                         |
|------------|--------|-------------------------------------|
| `selector` | string | CSS selector of event target element |

**FCP and TTFB**: No element attribution. The `element` field is absent.

### Example: `data/V1StGXR8_Z5j.json`

```json
[
  {
    "name": "LCP",
    "value": 2500,
    "rating": "good",
    "delta": 2500,
    "id": "v4-1712234567890",
    "page": "http://localhost:5173/",
    "element": {
      "selector": "img.hero-image",
      "url": "http://localhost:5173/assets/hero.jpg"
    },
    "browser": "Chrome",
    "receivedAt": "2026-04-04T10:35:00.000Z"
  },
  {
    "name": "FCP",
    "value": 1200,
    "rating": "good",
    "delta": 1200,
    "id": "v4-1712234567891",
    "page": "http://localhost:5173/",
    "browser": "Chrome",
    "receivedAt": "2026-04-04T10:35:00.000Z"
  },
  {
    "name": "CLS",
    "value": 0.05,
    "rating": "good",
    "delta": 0.02,
    "id": "v4-1712234567892",
    "page": "http://localhost:5173/about",
    "element": {
      "selector": "div.ad-banner"
    },
    "browser": "Firefox",
    "receivedAt": "2026-04-04T10:36:00.000Z"
  }
]
```

### Initialization

When a new app is registered, its data file does not exist yet. It is created as `[]` on the first metric ingestion for that app.

---

## Computed Entity: Route

Routes are **not stored**. They are derived at query time from the distinct values of the `page` field across all MetricRecord objects for a given app.

### How Routes Are Computed

1. Read all records from `data/<appId>.json`.
2. Extract the `page` field from each record.
3. Collect distinct values using `Set` or equivalent.
4. Return as a sorted array of strings.

**No normalization is applied** (per C-003). URLs are matched by exact string comparison:
- `http://localhost:5173/home` and `http://localhost:5173/home?ref=a` are **different** routes.
- `http://localhost:5173/home` and `http://localhost:5173/home/` are **different** routes.
- Hash fragments are included: `http://localhost:5173/home#section` is its own route.

---

## Computed Entity: MetricSummary

Computed on-the-fly by the `GET /api/apps/:appId/routes/summary?page=...` endpoint. Not stored on disk.

| Field                | Type   | Description                                                |
|----------------------|--------|------------------------------------------------------------|
| `p75`                | number | 75th percentile of `value` across all matching records     |
| `sampleCount`        | number | Total number of records for this metric type and route     |
| `ratingDistribution` | object | Breakdown of ratings                                       |

### Rating Distribution Sub-object

| Field              | Type   | Description                         |
|--------------------|--------|-------------------------------------|
| `good`             | number | Count of records with rating "good" |
| `needsImprovement` | number | Count of records with rating "needs-improvement" |
| `poor`             | number | Count of records with rating "poor" |

### P75 Calculation

Uses the nearest-rank method (matching `src/utils/helpers.js`):

```javascript
function calculateP75(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(0.75 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
```

> **SA Review Note**: The existing library helper `src/utils/helpers.js` returns `0` for empty arrays. The server-side implementation MUST return `null` (not `0`) for empty arrays to correctly represent "no data" in the API response. This is intentionally different from the library helper.

### Example Summary Response

For a route with metrics:

```json
{
  "LCP": {
    "p75": 2800,
    "sampleCount": 25,
    "ratingDistribution": {
      "good": 15,
      "needsImprovement": 7,
      "poor": 3
    }
  },
  "FCP": {
    "p75": 1500,
    "sampleCount": 25,
    "ratingDistribution": {
      "good": 20,
      "needsImprovement": 4,
      "poor": 1
    }
  },
  "CLS": {
    "p75": 0.08,
    "sampleCount": 22,
    "ratingDistribution": {
      "good": 18,
      "needsImprovement": 3,
      "poor": 1
    }
  },
  "INP": {
    "p75": 180,
    "sampleCount": 10,
    "ratingDistribution": {
      "good": 8,
      "needsImprovement": 2,
      "poor": 0
    }
  },
  "TTFB": {
    "p75": 600,
    "sampleCount": 25,
    "ratingDistribution": {
      "good": 22,
      "needsImprovement": 3,
      "poor": 0
    }
  }
}
```

When a metric type has zero samples for the given route, it is represented as:

```json
{
  "INP": {
    "p75": null,
    "sampleCount": 0,
    "ratingDistribution": {
      "good": 0,
      "needsImprovement": 0,
      "poor": 0
    }
  }
}
```

---

## Network Waterfall Data Format (P3)

For User Story 6, resource timing data would be collected by extending the library. The data format for future use:

### ResourceTimingRecord

Stored as an additional field `resources` on a MetricRecord (or as a separate record type):

| Field       | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `url`       | string | Resource URL                             |
| `type`      | string | Resource type: "script", "stylesheet", "image", "font", "fetch", "other" |
| `startTime` | number | Start time relative to navigation start (ms) |
| `duration`  | number | Total duration (ms)                      |
| `size`      | number | Transfer size in bytes (0 if unavailable) |

This is **not implemented in v1**. The dashboard waterfall section will show "Resource timing data not available" when this data is absent.

---

## Web Vitals Rating Thresholds

Used by the dashboard for color coding (SC-006):

| Metric | Good         | Needs Improvement | Poor          |
|--------|-------------|-------------------|---------------|
| LCP    | < 2500 ms   | 2500 - 4000 ms    | >= 4000 ms    |
| FCP    | < 1800 ms   | 1800 - 3000 ms    | >= 3000 ms    |
| CLS    | < 0.1       | 0.1 - 0.25        | >= 0.25       |
| INP    | < 200 ms    | 200 - 500 ms      | >= 500 ms     |
| TTFB   | < 800 ms    | 800 - 1800 ms     | >= 1800 ms    |

Note: The `rating` field on each MetricRecord is already computed by the web-vitals library on the client side. The dashboard uses the stored rating for distribution counts. The thresholds above are used only for color-coding the p75 summary values.

---

## Inbound Payload Format

The payload sent by the web-vitals-lib to `POST /api/collect`:

```json
{
  "appId": "V1StGXR8_Z5j",
  "metrics": [
    {
      "name": "LCP",
      "value": 2500,
      "rating": "good",
      "delta": 2500,
      "id": "v4-1712234567890",
      "page": "http://localhost:5173/",
      "element": {
        "selector": "img.hero-image",
        "url": "http://localhost:5173/assets/hero.jpg"
      }
    },
    {
      "name": "FCP",
      "value": 1200,
      "rating": "good",
      "delta": 1200,
      "id": "v4-1712234567891",
      "page": "http://localhost:5173/"
    }
  ],
  "browser": "Chrome"
}
```

The server enriches each metric with `browser` (from the top-level payload field) and `receivedAt` (server timestamp) before persisting.
