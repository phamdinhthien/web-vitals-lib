import { readJSON } from '../utils/fileStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDataDir = path.join(__dirname, '..', 'data')

function getDataDir() {
  return process.env.DATA_DIR || defaultDataDir
}

function getDataFilePath(appId) {
  return path.join(getDataDir(), `${appId}.json`)
}

function calculateP75(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(0.75 * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

export function getRoutes(appId) {
  const metrics = readJSON(getDataFilePath(appId))
  const pages = new Set(metrics.map(m => m.page).filter(Boolean))
  return [...pages].sort()
}

export function getMetrics(appId, filters = {}) {
  let metrics = readJSON(getDataFilePath(appId))

  if (filters.page) {
    metrics = metrics.filter(m => m.page === filters.page)
  }
  if (filters.name) {
    metrics = metrics.filter(m => m.name === filters.name)
  }
  if (filters.browser) {
    metrics = metrics.filter(m => m.browser === filters.browser)
  }
  if (filters.rating) {
    metrics = metrics.filter(m => m.rating === filters.rating)
  }
  if (filters.startDate) {
    metrics = metrics.filter(m => m.receivedAt >= filters.startDate)
  }
  if (filters.endDate) {
    metrics = metrics.filter(m => m.receivedAt <= filters.endDate)
  }

  return metrics
}

export function getSummary(appId, page) {
  const allMetrics = readJSON(getDataFilePath(appId))
  const pageMetrics = allMetrics.filter(m => m.page === page)

  const metricNames = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']
  const summary = {}

  for (const name of metricNames) {
    const entries = pageMetrics.filter(m => m.name === name)
    const values = entries.map(m => m.value).filter(v => v != null)

    const ratingCounts = { good: 0, needsImprovement: 0, poor: 0 }
    for (const entry of entries) {
      if (entry.rating === 'good') ratingCounts.good++
      else if (entry.rating === 'needs-improvement') ratingCounts.needsImprovement++
      else if (entry.rating === 'poor') ratingCounts.poor++
    }

    summary[name] = {
      p75: calculateP75(values),
      count: entries.length,
      ratingDistribution: ratingCounts
    }
  }

  return summary
}

export function getResources(appId, page) {
  const filePath = path.join(getDataDir(), `${appId}_resources.json`)
  const allRecords = readJSON(filePath)

  if (page) {
    return allRecords.filter(r => r.page === page)
  }
  return allRecords
}
