import { extractLCPElementInfo, extractCLSElementInfo, extractINPElementInfo } from '../utils/elementInfo.js'

/**
 * BatchCollector - Collects LCP, CLS, FCP, TTFB, INP metrics and sends them when page is hidden
 */
export default class BatchCollector {
  constructor(reporter) {
    this.reporter = reporter
    this.metrics = []
    
    // Send metrics when page becomes hidden
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.send()
      }
    })
  }

  /**
   * Collect a metric and check if all batch metrics are ready
   * @param {Object} metric - Web Vitals metric object
   */
  collect(metric) {
    const metricData = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.idm,
      page: window.location.href
    }


    if(metric.attribution) {
      // Add element information for specific metrics
      if (metric.name === 'LCP') {
        const elementInfo = extractLCPElementInfo(metric.attribution)
        if (elementInfo) {
          metricData.element = elementInfo
        }
      }
      if (metric.name === 'CLS') {
        const elementInfo = extractCLSElementInfo(metric.attribution)
        if (elementInfo) {
          metricData.element = elementInfo
        }
      }
      if (metric.name === 'INP') {
        const elementInfo = extractINPElementInfo(metric.attribution)
        if (elementInfo) {
          metricData.element = elementInfo
        }
      }
    }

    this.metrics.push(metricData)
  }

  /**
   * Send collected metrics as an array
   */
  send() {
    if (this.metrics.length === 0) {
      return
    }

    // Send metrics array
    this.reporter.send(this.metrics)
    
    // Reset metrics after sending
    this.metrics = []
  }
}
