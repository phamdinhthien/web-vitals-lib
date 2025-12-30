import { getBrowserName } from '../utils/helpers.js'

/**
 * WebVitalsReporter - Handles sending metrics data to API endpoint
 */
export default class WebVitalsReporter {
  constructor(config) {
    this.config = config
    this.apiEndpoint = config.apiEndpoint || 'http://localhost:5000/api/collect'
  }

  /**
   * Send metrics array to API endpoint
   * @param {Array} metricsArray - Array of metric objects
   */
  send(metricsArray) {
    if (!metricsArray || metricsArray.length === 0) {
      return
    }

    const payload = {
      metrics: metricsArray,
      browser: getBrowserName()
    }

    if (this.config.debug) {
      console.log('[WebVitals] Sending metrics:', payload)
    }

    // Use sendBeacon for reliability (works even when page is unloading)
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json'
    })
    
    const sent = navigator.sendBeacon(this.apiEndpoint, blob)
    
    // Fallback to fetch if sendBeacon is not supported or fails
    if (!sent) {
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => {
        if (this.config.debug) {
          console.error('[WebVitals] Failed to send metrics:', err)
        }
      })
    }
  }
}
