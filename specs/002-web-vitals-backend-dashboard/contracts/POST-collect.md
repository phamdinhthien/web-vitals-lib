# POST /api/collect

Receive and store metric payloads from the web-vitals-lib.

**Requirements**: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016

---

## Request

```
POST /api/collect
Content-Type: application/json
```

Also accepts `Content-Type: text/plain` (parsed as JSON). This accommodates browser `sendBeacon` behavior.

### Body

| Field     | Type   | Required | Description                                 |
|-----------|--------|----------|---------------------------------------------|
| `appId`   | string | Yes      | Registered app identifier                   |
| `metrics` | array  | Yes      | Non-empty array of metric objects            |
| `browser` | string | Yes      | Browser name (e.g., "Chrome", "Firefox")    |

### Metric Object (within `metrics` array)

| Field     | Type   | Required | Description                         |
|-----------|--------|----------|-------------------------------------|
| `name`    | string | Yes      | Metric name (LCP, FCP, CLS, INP, TTFB, or other) |
| `value`   | number | Yes      | Metric value                        |
| `rating`  | string | Yes      | "good", "needs-improvement", or "poor" |
| `delta`   | number | Yes      | Delta value                         |
| `id`      | string | Yes      | Unique metric instance ID           |
| `page`    | string | Yes      | Full page URL                       |
| `element` | object | No       | Attribution data (varies by metric type) |

### Example

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

---

## Responses

### 204 No Content

Metrics stored successfully. No response body.

### 400 Bad Request -- Missing appId

```json
{
  "error": "appId is required"
}
```

### 400 Bad Request -- Missing browser

```json
{
  "error": "browser is required"
}
```

Triggered when the `browser` field is missing or is an empty string.

### 400 Bad Request -- Missing or empty metrics

```json
{
  "error": "Metrics array must not be empty"
}
```

Triggered when:
- `metrics` field is missing
- `metrics` is not an array
- `metrics` is an empty array `[]`

### 400 Bad Request -- Invalid JSON

```json
{
  "error": "Invalid JSON payload"
}
```

Triggered when the request body cannot be parsed as JSON.

### 404 Not Found -- Unknown appId

```json
{
  "error": "App not found"
}
```

Triggered when the `appId` does not match any registered app.

---

## Server-Side Processing

For each metric object in the `metrics` array, the server:

1. Copies all fields from the metric object as-is.
2. Adds `browser` from the top-level payload field.
3. Adds `receivedAt` as the current server time in ISO-8601 format.
4. Appends the enriched record to `data/<appId>.json`.

---

## CORS

This endpoint supports CORS with `Access-Control-Allow-Origin: *` to allow browser-based clients from any origin to submit data (FR-014).

---

## Notes

- Unknown metric names (not LCP/FCP/CLS/INP/TTFB) are accepted and stored for forward compatibility.
- The `element` field is stored as-is without server-side validation.
- Concurrent writes to the same app's data file are serialized via a write queue (FR-016).
