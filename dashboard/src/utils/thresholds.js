export const THRESHOLDS = {
  LCP:  { good: 2500, poor: 4000, unit: 'ms' },
  FCP:  { good: 1800, poor: 3000, unit: 'ms' },
  CLS:  { good: 0.1,  poor: 0.25, unit: '' },
  INP:  { good: 200,  poor: 500, unit: 'ms' },
  TTFB: { good: 800,  poor: 1800, unit: 'ms' }
}

export function getRating(metricName, value) {
  const t = THRESHOLDS[metricName]
  if (!t || value == null) return 'unknown'
  if (value < t.good) return 'good'
  if (value < t.poor) return 'needs-improvement'
  return 'poor'
}

export function getRatingColor(rating) {
  switch (rating) {
    case 'good': return '#0cce6b'
    case 'needs-improvement': return '#ffa400'
    case 'poor': return '#ff4e42'
    default: return '#999'
  }
}

export function formatValue(metricName, value) {
  if (value == null) return 'N/A'
  const t = THRESHOLDS[metricName]
  if (metricName === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}${t?.unit || ''}`
}
