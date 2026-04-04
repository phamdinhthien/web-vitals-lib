# GET /api/apps

List all registered applications.

**Requirements**: FR-002

---

## Request

```
GET /api/apps
```

No query parameters. No request body.

---

## Responses

### 200 OK -- Apps found

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

### 200 OK -- No apps registered

```json
[]
```

---

## Notes

- Returns all registered apps. No pagination in v1.
- Apps are returned in the order they were registered (insertion order).
