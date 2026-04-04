# GET /api/apps/:appId/metrics

Retrieve metric records for an app, with optional filtering.

**Requirements**: FR-017, FR-020

---

## Request

```
GET /api/apps/:appId/metrics
GET /api/apps/:appId/metrics?page=<encodedPageURL>
GET /api/apps/:appId/metrics?page=<encodedPageURL>&name=LCP&browser=Chrome&rating=good&startDate=<ISO>&endDate=<ISO>
```

### Path Parameters

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `appId`   | string | Registered app identifier |

### Query Parameters (all optional)

| Parameter   | Type   | Description                                          |
|-------------|--------|------------------------------------------------------|
| `page`      | string | Filter by exact page URL                             |
| `name`      | string | Filter by metric name (e.g., "LCP", "FCP")          |
| `browser`   | string | Filter by browser name (e.g., "Chrome")              |
| `rating`    | string | Filter by rating: "good", "needs-improvement", "poor"|
| `startDate` | string | Filter records with `receivedAt` >= this ISO-8601 date |
| `endDate`   | string | Filter records with `receivedAt` <= this ISO-8601 date |

All filters use AND logic when multiple are specified.

---

## Responses

### 200 OK -- Metrics found

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
  }
]
```

### 200 OK -- No metrics match

```json
[]
```

### 404 Not Found -- Unknown appId

```json
{
  "error": "App not found"
}
```

---

## Notes

- Returns raw MetricRecord objects as stored in the data file.
- Without any query parameters, returns all metrics for the app.
- The `startDate`/`endDate`, `browser`, `rating`, and `name` filters are P3 features (FR-050 through FR-053) but are defined here for completeness. The P1 implementation only requires the `page` filter. Additional filters are added in later phases.
- No pagination in v1. All matching records are returned.
