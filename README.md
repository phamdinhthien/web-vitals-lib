# Web Vitals Library

A lightweight JavaScript library to collect and send Web Vitals metrics to your analytics server. Built with the official `web-vitals` library from Google.

## 📊 Metrics Collected

All metrics are collected and sent together in a single batch when the page becomes hidden:

- **LCP** (Largest Contentful Paint) - Loading performance
- **FCP** (First Contentful Paint) - Initial render time
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response time
- **INP** (Interaction to Next Paint) - Responsiveness

## 🚀 Installation

```bash
npm install
```

## 📦 Build

```bash
npm run build
```

This generates:
- `dist/web-vitals-lib.es.js` - ES Module format
- `dist/web-vitals-lib.umd.js` - UMD format (for `<script>` tags)

## 💻 Usage

### ES Module (Recommended)

```javascript
import { initWebVitals } from 'web-vitals-lib'

initWebVitals({
  apiEndpoint: 'http://localhost:5000/api/collect',
  debug: true
})
```

### CDN / Script Tag (UMD)

#### Option 1: Async Loading (Recommended) ⚡

The best way to load the library without blocking your page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Website</title>
  
  <!-- Step 1: Define callback BEFORE loading script -->
  <script>
    window.onWebVitalsReady = function() {
      WebVitalsLib.initWebVitals({
        apiEndpoint: 'https://your-api.com/collect',
        debug: false
      });
    };
  </script>
  
  <!-- Step 2: Load script asynchronously -->
  <script async src="https://unpkg.com/web-vitals-lib@1.0.0/dist/web-vitals-lib.umd.js"></script>
</head>
<body>
  <h1>My Website</h1>
  <p>Content here...</p>
</body>
</html>
```

**How it works:**
1. Define `window.onWebVitalsReady` callback before loading the script
2. Load the script with `async` attribute
3. The library automatically calls your callback when ready
4. Initialize tracking inside the callback

**Benefits:**
- ✅ Non-blocking - script loads in parallel
- ✅ Automatic callback execution
- ✅ Simple and clean API
- ✅ Works perfectly with CDN

#### Option 2: Synchronous Loading

For immediate execution (blocks page loading):

```html
<script src="https://unpkg.com/web-vitals-lib@1.0.0/dist/web-vitals-lib.umd.js"></script>
<script>
  // Library is immediately available
  WebVitalsLib.initWebVitals({
    apiEndpoint: 'https://your-api.com/collect',
    debug: false
  });
</script>
```

#### Option 3: Defer Loading

Load after HTML parsing is complete:

```html
<script>
  window.onWebVitalsReady = function() {
    WebVitalsLib.initWebVitals({
      apiEndpoint: 'https://your-api.com/collect',
      debug: false
    });
  };
</script>
<script defer src="https://unpkg.com/web-vitals-lib@1.0.0/dist/web-vitals-lib.umd.js"></script>
```

## ⚙️ Configuration

```javascript
initWebVitals({
  apiEndpoint: 'http://localhost:5000/api/collect', // Your API endpoint
  debug: false // Enable console logging
})
```

## 📡 API Payload Format

All metrics are sent together in a single batch when the page becomes hidden (visibilitychange event).

### Request Format

```json
POST /api/collect
{
  "metrics": [
    {
      "name": "LCP",
      "value": 2500,
      "rating": "good",
      "delta": 2500,
      "id": "v3-1703680447000-123",
      "page": "https://example.com/page",
      "element": {
        "selector": "div.hero > img.banner",
        "url": "https://example.com/banner.jpg"
      }
    },
    {
      "name": "CLS",
      "value": 0.05,
      "rating": "good",
      "delta": 0.05,
      "id": "v3-1703680447000-124",
      "page": "https://example.com/page",
      "element": {
        "selector": "div.container > div.ad-banner"
      }
    },
    {
      "name": "FCP",
      "value": 1800,
      "rating": "good",
      "delta": 1800,
      "id": "v3-1703680447000-125",
      "page": "https://example.com/page"
    },
    {
      "name": "TTFB",
      "value": 500,
      "rating": "good",
      "delta": 500,
      "id": "v3-1703680447000-126",
      "page": "https://example.com/page"
    },
    {
      "name": "INP",
      "value": 350,
      "rating": "good",
      "delta": 350,
      "id": "v3-1703680447000-127",
      "page": "https://example.com/page",
      "element": {
        "selector": "div.form-container > button.submit-btn"
      }
    }
  ],
  "browser": "Chrome"
}
```

### Payload Structure

- **metrics**: Array of all collected metrics (LCP, FCP, CLS, TTFB, INP)
- **browser**: Browser name (Chrome, Firefox, Safari, etc.)
- Each metric includes:
  - `name`: Metric name
  - `value`: Metric value in milliseconds (or unitless for CLS)
  - `rating`: Performance rating (good, needs-improvement, poor)
  - `delta`: Change from previous value
  - `id`: Unique metric identifier
  - `page`: Current page URL
  - `element`: (Optional) Element information for LCP, CLS, and INP

## 🎯 How It Works

### Metrics Collection and Sending

1. **Collection Phase**: All Web Vitals metrics (LCP, FCP, CLS, TTFB, INP) are collected as they become available during the page session
   - The `web-vitals` library monitors and reports each metric when it's ready
   - Each metric is added to a batch collection array
   - INP can be reported multiple times if `reportAllChanges: true` (tracks worst interaction)

2. **Sending Phase**: All collected metrics are sent together in a **single batch request** when:
   - The page becomes hidden (`visibilitychange` event)
   - User navigates away, closes tab, or switches tabs
   - This ensures reliable delivery using `navigator.sendBeacon()`

3. **Element Attribution**: For debugging, the library captures element information:
   - **LCP**: The largest element rendered (with selector and URL if image)
   - **CLS**: Elements that caused layout shifts
   - **INP**: The element that triggered the interaction (button, link, etc.)

## 🧪 Testing

### Development Server

```bash
npm run dev
```

Open `http://localhost:5173` to see the demo page.

## 🔧 Server-Side Example

Simple Express.js server to receive metrics:

```javascript
const express = require('express')
const app = express()

app.use(express.json())

app.post('/api/collect', (req, res) => {
  const { metrics, browser } = req.body
  
  console.log(`Received ${metrics.length} metrics from ${browser}:`)
  
  metrics.forEach(metric => {
    console.log(`- ${metric.name}: ${metric.value} (${metric.rating}) - Page: ${metric.page}`)
    
    if (metric.element) {
      console.log(`  Element: ${metric.element.selector}`)
    }
  })
  
  res.json({ success: true })
})

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
```

## 📁 Project Structure

```
web-vitals-lib/
├── src/
│   ├── main.js                   # Entry point & initialization
│   ├── core/
│   │   ├── WebVitalsReporter.js # Send data to API
│   │   └── BatchCollector.js    # Collect all metrics in batch
│   └── utils/
│       ├── helpers.js            # Utility functions
│       └── elementInfo.js        # Element selector extraction
├── dist/                         # Build output
├── index.html                    # Demo page
├── package.json
├── vite.config.js
└── README.md
```

## 🌟 Features

- ✅ Automatic collection of all 5 Core Web Vitals metrics
- ✅ Batch sending when page becomes hidden (single request)
- ✅ Single API endpoint for simplicity
- ✅ Array-based payload format
- ✅ Element selector extraction for debugging (LCP, CLS, INP)
- ✅ Reliable delivery with `navigator.sendBeacon()`
- ✅ Fallback to `fetch` with `keepalive`
- ✅ Browser detection
- ✅ Debug mode with console logging
- ✅ Lightweight (~10KB gzipped)
- ✅ TypeScript support (coming soon)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📚 Resources

- [Web Vitals Official Docs](https://web.dev/vitals/)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Core Web Vitals](https://web.dev/articles/vitals)
