# GET /api/apps/:appId/routes

List all distinct page URLs (routes) that have reported metrics for an app.

**Requirements**: FR-018, FR-020

---

## Request

```
GET /api/apps/:appId/routes
```

### Path Parameters

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `appId`   | string | Registered app identifier |

---

## Responses

### 200 OK -- Routes found

```json
[
  "http://localhost:5173/",
  "http://localhost:5173/about",
  "http://localhost:5173/gallery"
]
```

Returns a sorted array of distinct `page` URL strings.

### 200 OK -- No metrics received yet

```json
[]
```

Returned when the app exists but has no metric data.

### 404 Not Found -- Unknown appId

```json
{
  "error": "App not found"
}
```

---

## Notes

- Routes are computed by extracting distinct `page` field values from the app's metric data file.
- No URL normalization is applied. Exact string matching is used.
- The array is sorted alphabetically.
