import { onLCP, onFCP, onCLS, onINP, onTTFB } from 'web-vitals/attribution'
import WebVitalsReporter from './core/WebVitalsReporter.js'
import BatchCollector from './core/BatchCollector.js'

/**
 * Initialize Web Vitals tracking and reporting
 * @param {Object} config - Configuration options
 * @param {string} config.apiEndpoint - API endpoint to send metrics (default: http://localhost:5000/api/collect)
 * @param {boolean} config.debug - Enable debug logging (default: false)
 * @returns {Object} - Returns collectors for advanced usage
 */
export function initWebVitals(config = {}) {
  // Merge with default configuration
  const defaultConfig = {
    apiEndpoint: 'http://localhost:5000/api/collect',
    debug: false
  }

  const finalConfig = { ...defaultConfig, ...config }

  // Initialize reporter and collector
  const reporter = new WebVitalsReporter(finalConfig)
  const batchCollector = new BatchCollector(reporter)

  // Collect batch metrics (LCP, CLS, FCP, TTFB)
  onLCP((metric) => {
    if (finalConfig.debug) {
      console.log('[WebVitals] LCP:', metric.value)
    }
    batchCollector.collect(metric)
  })

  onFCP((metric) => {
    if (finalConfig.debug) {
      console.log('[WebVitals] FCP:', metric.value)
    }
    batchCollector.collect(metric)
  })

  onCLS((metric) => {
    if (finalConfig.debug) {
      console.log('[WebVitals] CLS:', metric.value)
    }
    batchCollector.collect(metric)
  }, {reportAllChanges: true})

  onTTFB((metric) => {
    if (finalConfig.debug) {
      console.log('[WebVitals] TTFB:', metric.value)
    }
    batchCollector.collect(metric)
  })

  // Collect INP metrics
  onINP((metric) => {
    if (finalConfig.debug) {
      console.log('[WebVitals] INP interaction:', metric.value)
    }
    batchCollector.collect(metric)
  }, {reportAllChanges: true})

  if (finalConfig.debug) {
    console.log('[WebVitals] Initialized with config:', finalConfig)
  }

  // Return collector for advanced usage if needed
  return {
    batchCollector,
    reporter
  }
}

// Auto-initialize when library loads
// Check if window.onWebVitalsReady callback is defined and call it
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after all synchronous code
  setTimeout(() => {
    if (typeof window.onWebVitalsReady === 'function') {
      try {
        if (console.log) {
          console.log('[WebVitals] Library loaded, calling window.onWebVitalsReady()')
        }
        window.onWebVitalsReady()
      } catch (error) {
        console.error('[WebVitals] Error in window.onWebVitalsReady callback:', error)
      }
    }
  }, 0)
}
