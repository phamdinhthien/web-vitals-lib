# GET /api/apps/:appId/routes/summary

Get aggregated metric summaries for a specific route (page URL).

**Requirements**: FR-019, FR-020

---

## Request

```
GET /api/apps/:appId/routes/summary?page=<encodedPageURL>
```

### Path Parameters

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `appId`   | string | Registered app identifier |

### Query Parameters

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `page`    | string | Yes      | URL-encoded page URL to get summary for           |

### Example

```
GET /api/apps/V1StGXR8_Z5j/routes/summary?page=http%3A%2F%2Flocalhost%3A5173%2F
```

---

## Responses

### 200 OK -- Summary computed

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
    "p75": null,
    "sampleCount": 0,
    "ratingDistribution": {
      "good": 0,
      "needsImprovement": 0,
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

The response always includes all five core web vitals. For metric types with zero samples, `p75` is `null` and all distribution counts are `0`.

### 400 Bad Request -- Missing page parameter

```json
{
  "error": "page query parameter is required"
}
```

### 404 Not Found -- Unknown appId

```json
{
  "error": "App not found"
}
```

---

## Computation Details

For each of the five core web vitals (LCP, FCP, CLS, INP, TTFB):

1. Filter all records in `data/<appId>.json` where `page` matches the query parameter and `name` matches the metric type.
2. Compute `p75` using the nearest-rank method on the `value` field.
3. Count records by `rating` field to produce `ratingDistribution`.
4. Count total records for `sampleCount`.

---

## Notes

- The `page` parameter must be an exact match (no normalization).
- The `ratingDistribution` uses camelCase keys: `good`, `needsImprovement`, `poor`.
- The `needsImprovement` key maps to the `"needs-improvement"` rating value in stored records.
- If the `page` parameter is a valid URL but no records match it, the endpoint still returns 200 with all five metrics showing `p75: null`, `sampleCount: 0`, and zeroed distribution counts. It does NOT return 404 -- that is reserved only for an unknown appId.
