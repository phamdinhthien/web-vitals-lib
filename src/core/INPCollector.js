import { extractINPElementInfo } from '../utils/elementInfo.js'

/**
 * INPCollector - Collects INP metrics and sends them based on idle detection
 * Sends when: user is idle for 10s, page hidden, or page unload
 * Only tracks and sends the maximum INP value
 */
export default class INPCollector {
  constructor(reporter, config) {
    this.reporter = reporter
    this.config = config
    this.maxINP = 0
    this.maxINPElement = null
    this.hasInteractions = false
    this.idleTimer = null
    this.IDLE_TIMEOUT = 10000 // 10 seconds
  }

  /**
   * Collect an INP metric value - only keep the maximum
   * @param {Object} metric - Web Vitals INP metric object
   */
  collect(metric) {
    if (metric.value > this.maxINP) {
      this.maxINP = metric.value
      
      // Save element info for the interaction with highest INP
      if (metric.attribution) {
        this.maxINPElement = extractINPElementInfo(metric.attribution)
      }
    }
    this.hasInteractions = true
    this.resetIdleTimer()
  }

  /**
   * Reset the idle timer - called after each interaction
   */
  resetIdleTimer() {
    clearTimeout(this.idleTimer)
    
    this.idleTimer = setTimeout(() => {
      this.send('idle')
    }, this.IDLE_TIMEOUT)
  }

  /**
   * Setup page lifecycle event listeners
   * Sends INP data when user leaves or hides the page
   */
  setupPageLifecycle() {
    // Page becomes hidden (tab switch, minimize)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(this.idleTimer)
        this.send('visibility-hidden')
      }
    })

    // Page is about to be unloaded (close tab, navigate away)
    window.addEventListener('pagehide', () => {
      clearTimeout(this.idleTimer)
      this.send('pagehide')
    })

    // Fallback for older browsers
    window.addEventListener('beforeunload', () => {
      clearTimeout(this.idleTimer)
      this.send('beforeunload')
    })
  }

  /**
   * Send INP data to server - only sends the maximum value
   * @param {string} trigger - What triggered the send (idle, visibility-hidden, pagehide)
   */
  send(trigger) {
    if (!this.hasInteractions || this.maxINP === 0) {
      return
    }

    // Create INP metric as a single object in an array
    const metricData = {
      name: 'INP',
      value: this.maxINP,
      trigger: trigger
    }

    // Add element info if available
    if (this.maxINPElement) {
      metricData.element = this.maxINPElement
    }

    const metricsArray = [metricData]

    if (this.config.debug) {
      console.log('[WebVitals] Sending INP data:', metricsArray[0])
    }

    this.reporter.send(metricsArray)
    
    // Reset after sending
    this.maxINP = 0
    this.maxINPElement = null
    this.hasInteractions = false
  }
}
