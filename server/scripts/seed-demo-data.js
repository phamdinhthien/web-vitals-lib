import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

fs.mkdirSync(dataDir, { recursive: true })

// --- Config ---
const apps = [
  { appId: 'demo-ecommerce', name: 'E-Commerce Website' },
  { appId: 'demo-blog', name: 'Blog Platform' },
  { appId: 'demo-saas', name: 'SaaS Dashboard' }
]

const pagesMap = {
  'demo-ecommerce': [
    'https://shop.example.com/',
    'https://shop.example.com/products',
    'https://shop.example.com/products/detail',
    'https://shop.example.com/cart',
    'https://shop.example.com/checkout'
  ],
  'demo-blog': [
    'https://blog.example.com/',
    'https://blog.example.com/posts',
    'https://blog.example.com/posts/how-to-optimize-web-vitals',
    'https://blog.example.com/about'
  ],
  'demo-saas': [
    'https://app.example.com/dashboard',
    'https://app.example.com/reports',
    'https://app.example.com/settings',
    'https://app.example.com/users'
  ]
}

const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
const browserWeights = [0.55, 0.15, 0.2, 0.1]

const elementsForLCP = [
  { selector: 'main>section.hero>img.banner', url: 'https://cdn.example.com/hero-banner.webp' },
  { selector: 'main>div.content>h1.title', url: null },
  { selector: 'main>section.featured>img.product-image', url: 'https://cdn.example.com/product-1.jpg' },
  { selector: 'main>div.article>p.intro', url: null },
  { selector: 'main>div.dashboard>div.chart-container>canvas', url: null }
]

const elementsForCLS = [
  { selector: 'div.ad-slot>iframe', url: 'https://ads.example.com/ad-123' },
  { selector: 'main>img.lazy-loaded', url: 'https://cdn.example.com/photo.jpg' },
  { selector: 'header>nav.menu', url: null },
  { selector: 'div.cookie-banner', url: null }
]

const elementsForINP = [
  { selector: 'button.add-to-cart', url: null },
  { selector: 'input.search-box', url: null },
  { selector: 'a.nav-link', url: null },
  { selector: 'button.submit-form', url: null },
  { selector: 'div.dropdown-toggle', url: null }
]

// Metric generation profiles per page type
const metricProfiles = {
  // Homepage - generally good
  '/': { LCP: [1800, 800], FCP: [1200, 500], CLS: [0.05, 0.04], INP: [120, 60], TTFB: [400, 200] },
  // Product listing - medium
  '/products': { LCP: [2800, 1000], FCP: [1600, 600], CLS: [0.12, 0.08], INP: [180, 80], TTFB: [600, 250] },
  // Product detail - heavier
  '/products/detail': { LCP: [3200, 1200], FCP: [1800, 700], CLS: [0.15, 0.1], INP: [220, 100], TTFB: [700, 300] },
  // Cart
  '/cart': { LCP: [2200, 900], FCP: [1400, 500], CLS: [0.08, 0.05], INP: [250, 120], TTFB: [500, 200] },
  // Checkout - interactive
  '/checkout': { LCP: [2500, 1000], FCP: [1500, 600], CLS: [0.06, 0.04], INP: [300, 150], TTFB: [550, 250] },
  // Blog home
  '/posts': { LCP: [2000, 700], FCP: [1000, 400], CLS: [0.04, 0.03], INP: [100, 50], TTFB: [350, 150] },
  // Blog post
  '/posts/how-to-optimize-web-vitals': { LCP: [2400, 900], FCP: [1300, 500], CLS: [0.18, 0.12], INP: [90, 40], TTFB: [400, 180] },
  // About
  '/about': { LCP: [1500, 600], FCP: [900, 350], CLS: [0.02, 0.02], INP: [80, 30], TTFB: [300, 120] },
  // SaaS Dashboard - heavy JS
  '/dashboard': { LCP: [3500, 1500], FCP: [2000, 800], CLS: [0.1, 0.07], INP: [350, 180], TTFB: [800, 350] },
  // Reports
  '/reports': { LCP: [4000, 1800], FCP: [2200, 900], CLS: [0.08, 0.06], INP: [280, 130], TTFB: [900, 400] },
  // Settings
  '/settings': { LCP: [1800, 700], FCP: [1100, 400], CLS: [0.03, 0.02], INP: [150, 70], TTFB: [500, 200] },
  // Users
  '/users': { LCP: [2600, 1100], FCP: [1500, 600], CLS: [0.06, 0.04], INP: [200, 90], TTFB: [650, 280] }
}

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 }
}

function getRating(name, value) {
  const t = thresholds[name]
  if (value <= t.good) return 'good'
  if (value <= t.poor) return 'needs-improvement'
  return 'poor'
}

function gaussianRandom(mean, stdDev) {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(0, mean + z * stdDev)
}

function pickWeighted(items, weights) {
  const r = Math.random()
  let cumulative = 0
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]
    if (r <= cumulative) return items[i]
  }
  return items[items.length - 1]
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getPagePath(fullUrl) {
  try {
    const u = new URL(fullUrl)
    return u.pathname
  } catch {
    return '/'
  }
}

function generateId() {
  return `v3-${Date.now()}-${Math.floor(Math.random() * 1e13)}`
}

function generateMetricsForSession(page, browser, timestamp) {
  const pagePath = getPagePath(page)
  const profile = metricProfiles[pagePath] || metricProfiles['/']
  const metrics = []

  const metricNames = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']

  for (const name of metricNames) {
    const [mean, stdDev] = profile[name]
    let value = gaussianRandom(mean, stdDev)

    // Round appropriately
    if (name === 'CLS') {
      value = Math.round(value * 1000) / 1000
    } else {
      value = Math.round(value * 10) / 10
    }

    const metric = {
      name,
      value,
      rating: getRating(name, value),
      delta: value,
      id: generateId(),
      page,
      browser,
      receivedAt: timestamp
    }

    // Add element attribution
    if (name === 'LCP') {
      metric.element = pickRandom(elementsForLCP)
    } else if (name === 'CLS' && value > 0.05) {
      metric.element = pickRandom(elementsForCLS)
    } else if (name === 'INP') {
      metric.element = pickRandom(elementsForINP)
    }

    metrics.push(metric)
  }

  return metrics
}

function generateResources(page, browser, timestamp) {
  const resourceTemplates = [
    { name: '/assets/main.css', initiatorType: 'link', size: [15000, 45000] },
    { name: '/assets/app.js', initiatorType: 'script', size: [80000, 250000] },
    { name: '/assets/vendor.js', initiatorType: 'script', size: [150000, 400000] },
    { name: '/assets/fonts/inter.woff2', initiatorType: 'css', size: [20000, 60000] },
    { name: '/assets/logo.svg', initiatorType: 'img', size: [2000, 8000] },
    { name: '/api/data', initiatorType: 'fetch', size: [500, 15000] },
    { name: '/assets/hero.webp', initiatorType: 'img', size: [30000, 120000] },
    { name: '/assets/icons.svg', initiatorType: 'img', size: [5000, 20000] }
  ]

  const count = 4 + Math.floor(Math.random() * 5)
  const selected = resourceTemplates.sort(() => Math.random() - 0.5).slice(0, count)
  let currentTime = 50 + Math.random() * 100

  const resources = selected.map(tmpl => {
    const startTime = Math.round(currentTime * 10) / 10
    const dns = Math.round(Math.random() * 5 * 10) / 10
    const connect = Math.round(Math.random() * 10 * 10) / 10
    const request = Math.round((10 + Math.random() * 40) * 10) / 10
    const response = Math.round((5 + Math.random() * 30) * 10) / 10
    const duration = Math.round((dns + connect + request + response) * 10) / 10
    const bodySize = Math.floor(tmpl.size[0] + Math.random() * (tmpl.size[1] - tmpl.size[0]))

    currentTime += duration + Math.random() * 30

    const domain = new URL(page).origin
    return {
      name: domain + tmpl.name,
      initiatorType: tmpl.initiatorType,
      startTime,
      duration,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: startTime,
      dnsStart: startTime,
      dnsEnd: Math.round((startTime + dns) * 10) / 10,
      connectStart: Math.round((startTime + dns) * 10) / 10,
      connectEnd: Math.round((startTime + dns + connect) * 10) / 10,
      secureConnectionStart: Math.round((startTime + dns) * 10) / 10,
      requestStart: Math.round((startTime + dns + connect) * 10) / 10,
      responseStart: Math.round((startTime + dns + connect + request) * 10) / 10,
      responseEnd: Math.round((startTime + duration) * 10) / 10,
      transferSize: bodySize + 300,
      encodedBodySize: bodySize,
      decodedBodySize: bodySize,
      nextHopProtocol: 'h2'
    }
  })

  return { page, browser, receivedAt: timestamp, resources }
}

// --- Generate data ---
const now = new Date()
const DAYS_BACK = 14
const SESSIONS_PER_DAY_PER_PAGE = 15

console.log('Generating demo data...')

// Save apps
const appsData = apps.map(a => ({
  appId: a.appId,
  name: a.name,
  createdAt: new Date(now.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString()
}))
fs.writeFileSync(path.join(dataDir, 'apps.json'), JSON.stringify(appsData, null, 2))
console.log(`Created ${apps.length} apps`)

for (const app of apps) {
  const allMetrics = []
  const allResources = []
  const pages = pagesMap[app.appId]

  for (let day = DAYS_BACK; day >= 0; day--) {
    for (const page of pages) {
      const sessionsToday = SESSIONS_PER_DAY_PER_PAGE + Math.floor(Math.random() * 10) - 5

      for (let s = 0; s < sessionsToday; s++) {
        const hourOffset = Math.random() * 24
        const timestamp = new Date(
          now.getTime() - day * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000
        ).toISOString()

        const browser = pickWeighted(browsers, browserWeights)
        const metrics = generateMetricsForSession(page, browser, timestamp)
        allMetrics.push(...metrics)

        // ~30% of sessions have resource data
        if (Math.random() < 0.3) {
          allResources.push(generateResources(page, browser, timestamp))
        }
      }
    }
  }

  // Sort by receivedAt
  allMetrics.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
  allResources.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))

  fs.writeFileSync(path.join(dataDir, `${app.appId}.json`), JSON.stringify(allMetrics, null, 2))
  fs.writeFileSync(path.join(dataDir, `${app.appId}_resources.json`), JSON.stringify(allResources, null, 2))

  console.log(`${app.name}: ${allMetrics.length} metrics, ${allResources.length} resource records across ${pages.length} pages`)
}

console.log('\nDone! Demo data generated successfully.')
