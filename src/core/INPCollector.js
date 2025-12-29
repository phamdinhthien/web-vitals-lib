import { extractINPElementInfo } from '../utils/elementInfo.js'

/**
 * INPCollector - Collects and immediately sends INP metrics
 */
export default class INPCollector {
  constructor(reporter, config) {
    this.reporter = reporter
    this.config = config
  }

  /**
   * Collect an INP metric value and send immediately
   * @param {Object} metric - Web Vitals INP metric object
   */
  collect(metric) {
    // Extract element info for the interaction
    let elementInfo = null
    if (metric.attribution) {
      elementInfo = extractINPElementInfo(metric.attribution)
    }

    // Send immediately
    this.send(metric, elementInfo)
  }

  /**
   * Send INP data to server
   * @param {Object} metric - Web Vitals INP metric object
   * @param {Object} elementInfo - Element information
   */
  send(metric, elementInfo) {
    // Create INP metric as a single object in an array
    const metricData = {
      name: 'INP',
      value: metric.value
    }

    // Add element info if available
    if (elementInfo) {
      metricData.element = elementInfo
    }

    const metricsArray = [metricData]

    if (this.config.debug) {
      console.log('[WebVitals] Sending INP data:', metricsArray[0])
    }

    this.reporter.send(metricsArray)
  }
}
