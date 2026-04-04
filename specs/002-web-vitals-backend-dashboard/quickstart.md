# Quickstart Guide: Web Vitals Backend + Demo + Dashboard

**Feature**: 002-web-vitals-backend-dashboard

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A modern browser (Chrome recommended for full Web Vitals support)

---

## 1. Install Dependencies

From the project root (`web-vitals-lib/`):

```bash
# Build the web-vitals-lib (required by the demo app)
npm install
npm run build

# Install server dependencies
cd server
npm install

# Install demo app dependencies
cd ../demo
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

---

## 2. Start the Backend Server

```bash
cd server
npm start
```

The server starts on **http://localhost:3001** by default.

To use a different port:
```bash
PORT=4000 npm start
```

Verify the server is running:
```bash
curl http://localhost:3001/api/apps
# Expected: []
```

---

## 3. Register an App

Register your demo app with the backend:

```bash
curl -X POST http://localhost:3001/api/apps \
  -H "Content-Type: application/json" \
  -d '{"name": "Demo App"}'
```

Response:
```json
{
  "appId": "V1StGXR8_Z5j",
  "name": "Demo App",
  "createdAt": "2026-04-04T10:30:00.000Z"
}
```

Copy the `appId` value -- you will use it to configure the demo app.

---

## 4. Configure and Start the Demo App

Create or edit the `.env` file in the `demo/` directory:

```bash
cd demo
```

Create `.env`:
```
VITE_APP_ID=V1StGXR8_Z5j
VITE_API_ENDPOINT=http://localhost:3001/api/collect
```

Replace `V1StGXR8_Z5j` with the appId you received in Step 3.

Start the demo app:
```bash
npm run dev
```

The demo app starts on **http://localhost:5173** by default.

---

## 5. Start the Dashboard

In a new terminal:

```bash
cd dashboard
npm run dev
```

The dashboard starts on **http://localhost:5174** by default.

To use a different port, edit the `server` section in `dashboard/vite.config.js` or use:
```bash
npx vite --port 5175
```

---

## 6. Generate Metrics (End-to-End Test)

1. Open the demo app at **http://localhost:5173** in Chrome.
2. Navigate through all pages (Home, About, Gallery or similar).
3. Click buttons, interact with forms, and scroll to generate INP and CLS metrics.
4. **Switch to another tab or minimize the browser** -- this triggers the `visibilitychange` event, which causes the web-vitals-lib to send the collected metrics to the backend.
5. Verify metrics were stored:

```bash
curl http://localhost:3001/api/apps/V1StGXR8_Z5j/routes
# Expected: ["http://localhost:5173/", "http://localhost:5173/about", ...]
```

6. Open the dashboard at **http://localhost:5174**.
7. Click on "Demo App" in the app list.
8. Browse routes and view detailed metrics.

---

## Summary of Running Services

| Component  | URL                        | Default Port | Terminal |
|------------|----------------------------|-------------|----------|
| Backend    | http://localhost:3001       | 3001        | Terminal 1 |
| Demo App   | http://localhost:5173       | 5173        | Terminal 2 |
| Dashboard  | http://localhost:5174       | 5174        | Terminal 3 |

---

## Troubleshooting

**Demo app shows "appId required" error**  
Ensure the `.env` file exists in the `demo/` directory with a valid `VITE_APP_ID` value.

**Metrics not appearing on the dashboard**  
- Metrics are sent when the page visibility changes (tab switch or minimize). Navigate the demo app, then switch tabs.
- Check the server terminal for incoming requests.
- Verify the appId in the demo `.env` matches a registered app.

**Backend returns "App not found"**  
The appId in the request does not match any registered app. Re-register or check `server/data/apps.json` for existing apps.

**Port conflict**  
Use environment variables to change ports:
- Server: `PORT=4000 npm start`
- Demo: Vite auto-picks the next available port, or set in `vite.config.js`
- Dashboard: Configured in its `vite.config.js`

**CORS errors in browser console**  
Ensure the backend server is running. The server enables CORS for all origins by default.
