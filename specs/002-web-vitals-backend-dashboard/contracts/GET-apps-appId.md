# GET /api/apps/:appId

Retrieve details of a single registered application.

**Requirements**: FR-003, FR-020

---

## Request

```
GET /api/apps/:appId
```

### Path Parameters

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `appId`   | string | Registered app identifier |

---

## Responses

### 200 OK -- App found

```json
{
  "appId": "V1StGXR8_Z5j",
  "name": "My Demo App",
  "createdAt": "2026-04-04T10:30:00.000Z"
}
```

### 404 Not Found -- Unknown appId

```json
{
  "error": "App not found"
}
```

---

## Notes

- Returns the same App object shape as `GET /api/apps` but for a single app.
- This endpoint is used by retrieval endpoints internally to validate that an appId exists before querying metric data.
