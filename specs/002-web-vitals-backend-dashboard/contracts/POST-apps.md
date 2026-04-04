# POST /api/apps

Register a new application.

**Requirements**: FR-001, FR-004, FR-005, FR-006, FR-007

---

## Request

```
POST /api/apps
Content-Type: application/json
```

### Body

| Field  | Type   | Required | Description          |
|--------|--------|----------|----------------------|
| `name` | string | Yes      | Application display name (non-empty) |

### Example

```json
{
  "name": "My Demo App"
}
```

---

## Responses

### 201 Created

App registered successfully.

```json
{
  "appId": "V1StGXR8_Z5j",
  "name": "My Demo App",
  "createdAt": "2026-04-04T10:30:00.000Z"
}
```

### 400 Bad Request -- Missing or empty name

```json
{
  "error": "App name is required"
}
```

Triggered when:
- Request body is missing the `name` field
- `name` is an empty string `""`
- `name` is whitespace-only

---

## Notes

- Duplicate app names are allowed (FR-005). Each registration creates a new unique appId.
- The `appId` is a 12-character nanoid (URL-safe: A-Za-z0-9_-).
- The app is persisted to `data/apps.json` immediately.
