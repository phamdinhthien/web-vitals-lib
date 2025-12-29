import { onLCP, onFCP, onCLS, onINP, onTTFB } from 'web-vitals/attribution'
import WebVitalsReporter from './core/WebVitalsReporter.js'
import BatchCollector from './core/BatchCollector.js'
import INPCollector from './core/INPCollector.js'

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

  // Initialize reporter and collectors
  const reporter = new WebVitalsReporter(finalConfig)
  const batchCollector = new BatchCollector(reporter)
  const inpCollector = new INPCollector(reporter, finalConfig)

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
  })

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
    inpCollector.collect(metric)
  })

  if (finalConfig.debug) {
    console.log('[WebVitals] Initialized with config:', finalConfig)
  }

  // Return collectors for advanced usage if needed
  return {
    batchCollector,
    inpCollector,
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
