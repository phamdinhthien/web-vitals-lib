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
      id: metric.id,
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

    // Collect resource timing entries
    let resources = []
    try {
      const entries = performance.getEntriesByType('resource')
      resources = entries.map(e => ({
        name: e.name,
        initiatorType: e.initiatorType,
        startTime: Math.round(e.startTime * 100) / 100,
        duration: Math.round(e.duration * 100) / 100,
        redirectStart: Math.round(e.redirectStart * 100) / 100,
        redirectEnd: Math.round(e.redirectEnd * 100) / 100,
        fetchStart: Math.round(e.fetchStart * 100) / 100,
        dnsStart: Math.round(e.domainLookupStart * 100) / 100,
        dnsEnd: Math.round(e.domainLookupEnd * 100) / 100,
        connectStart: Math.round(e.connectStart * 100) / 100,
        connectEnd: Math.round(e.connectEnd * 100) / 100,
        secureConnectionStart: Math.round(e.secureConnectionStart * 100) / 100,
        requestStart: Math.round(e.requestStart * 100) / 100,
        responseStart: Math.round(e.responseStart * 100) / 100,
        responseEnd: Math.round(e.responseEnd * 100) / 100,
        transferSize: e.transferSize || 0,
        encodedBodySize: e.encodedBodySize || 0,
        decodedBodySize: e.decodedBodySize || 0,
        nextHopProtocol: e.nextHopProtocol || ''
      }))
      performance.clearResourceTimings()
    } catch (e) {
      // Resource Timing API not available
    }

    this.reporter.send(this.metrics, resources)
    this.metrics = []
  }
}
