import { extractLCPElementInfo, extractCLSElementInfo } from '../utils/elementInfo.js'

/**
 * BatchCollector - Collects LCP, CLS, FCP, TTFB metrics and sends them as a batch
 */
export default class BatchCollector {
  constructor(reporter) {
    this.reporter = reporter
    this.metrics = {}
    this.requiredMetrics = ['LCP', 'CLS', 'FCP', 'TTFB']
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
      id: metric.id
    }

    // Add element information for specific metrics
    if (metric.name === 'LCP' && metric.attribution) {
      const elementInfo = extractLCPElementInfo(metric.attribution)
      if (elementInfo) {
        metricData.element = elementInfo
      }
    }

    if (metric.name === 'CLS' && metric.attribution) {
      const elementsInfo = extractCLSElementInfo(metric.attribution)
      if (elementsInfo) {
        metricData.elements = elementsInfo
      }
    }

    this.metrics[metric.name] = metricData

    // Check if we have all required metrics
    if (this.hasAllMetrics()) {
      this.send()
    }
  }

  /**
   * Check if all required metrics have been collected
   * @returns {boolean}
   */
  hasAllMetrics() {
    return this.requiredMetrics.every(name => this.metrics[name])
  }

  /**
   * Send collected metrics as an array
   */
  send() {
    if (Object.keys(this.metrics).length === 0) {
      return
    }

    // Convert metrics object to array
    const metricsArray = Object.values(this.metrics)
    this.reporter.send(metricsArray)
    
    // Reset metrics after sending
    this.metrics = {}
  }

  /**
   * Force send any collected metrics (called on page unload)
   */
  forceSend() {
    if (Object.keys(this.metrics).length > 0) {
      const metricsArray = Object.values(this.metrics)
      this.reporter.send(metricsArray)
      this.metrics = {}
    }
  }
}
