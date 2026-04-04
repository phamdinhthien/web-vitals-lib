import { getBrowserName } from '../utils/helpers.js'

/**
 * WebVitalsReporter - Handles sending metrics data to API endpoint
 */
export default class WebVitalsReporter {
  constructor(config) {
    this.config = config
    this.apiEndpoint = config.apiEndpoint || 'http://localhost:3001/api/collect'
  }

  /**
   * Send metrics array to API endpoint
   * @param {Array} metricsArray - Array of metric objects
   */
  send(metricsArray, resources = []) {
    if (!metricsArray || metricsArray.length === 0) {
      return
    }

    const payload = {
      metrics: metricsArray,
      browser: getBrowserName()
    }

    if (this.config.appId) {
      payload.appId = this.config.appId
    }

    if (resources.length > 0) {
      payload.resources = resources
      payload.page = metricsArray[0]?.page || window.location.href
    }

    if (this.config.debug) {
      console.log('[WebVitals] Sending metrics:', payload)
    }

    // Use sendBeacon for reliability (works even when page is unloading)
    // Use text/plain to avoid CORS preflight (sendBeacon doesn't support preflight)
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'text/plain'
    })

    const sent = navigator.sendBeacon(this.apiEndpoint, blob)

    // Fallback to fetch if sendBeacon is not supported or fails
    if (!sent) {
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
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
