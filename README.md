# Web Vitals Library

A lightweight JavaScript library to collect and send Web Vitals metrics to your analytics server. Built with the official `web-vitals` library from Google.

## 📊 Metrics Collected

### Batch Metrics (Sent Together)
- **LCP** (Largest Contentful Paint) - Loading performance
- **FCP** (First Contentful Paint) - Initial render time
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response time

### INP Metrics (Sent Separately)
- **INP** (Interaction to Next Paint) - Responsiveness
  - Sent automatically by web-vitals library when:
    - User leaves/closes the page
    - New interaction has higher INP value than previous
  - Captures the worst responsiveness metric during page session

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

All metrics are sent as arrays to a single endpoint.

### Batch Metrics Request

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
      "elements": [
        {
          "selector": "div.container > div.ad-banner"
        }
      ]
    },
    {
      "name": "FCP",
      "value": 1800,
      "rating": "good",
      "delta": 1800,
      "id": "v3-1703680447000-125"
    },
    {
      "name": "TTFB",
      "value": 500,
      "rating": "good",
      "delta": 500,
      "id": "v3-1703680447000-126"
    }
  ],
  "url": "https://example.com/page",
  "userAgent": "Mozilla/5.0...",
  "timestamp": 1703680447000
}
```

### INP Request

```json
POST /api/collect
{
  "metrics": [
    {
      "name": "INP",
      "value": 350,
      "element": {
        "selector": "div.form-container > button.submit-btn"
      }
    }
  ],
  "url": "https://example.com/page",
  "userAgent": "Mozilla/5.0...",
  "timestamp": 1703680457000
}
```

## 🎯 How It Works

### Batch Metrics Flow
1. Collects LCP, CLS, FCP, TTFB as they become available
2. Once all 4 metrics are collected, sends them in a single request
3. If page closes before all metrics are ready, sends available metrics

### INP Flow
1. Web-vitals library monitors all user interactions (clicks, taps, keyboard inputs)
2. Tracks the worst (highest) INP value throughout the page session
3. Automatically sends INP data when:
   - User leaves/closes the page (pagehide, visibilitychange events)
   - A new interaction produces a higher INP value than previously recorded
4. Reports include the interaction element information for debugging

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
  const { metrics, url, userAgent, timestamp } = req.body
  
  metrics.forEach(metric => {
    if (metric.name === 'INP') {
      console.log('INP Data:', {
        value: metric.value,
        element: metric.element
      })
    } else {
      console.log(`${metric.name}:`, metric.value, metric.rating)
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
│   ├── main.js                   # Entry point
│   ├── core/
│   │   ├── WebVitalsReporter.js # Send data to API
│   │   ├── BatchCollector.js    # Batch metrics collector
│   │   └── INPCollector.js      # INP collector (immediate send)
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

- ✅ Automatic metric collection
- ✅ Single API endpoint for simplicity
- ✅ Array-based payload format
- ✅ Immediate INP reporting after each interaction
- ✅ Element selector extraction for debugging
- ✅ sendBeacon for reliability
- ✅ Debug mode
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
