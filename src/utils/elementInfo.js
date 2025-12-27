/**
 * Element Information Utilities
 * Extract detailed information about DOM elements for Web Vitals metrics
 */

/**
 * Generate a CSS selector for an element
 * @param {HTMLElement} element - The DOM element
 * @returns {string} CSS selector string (never null)
 */
export function getSelector(element) {
  return element;
}

/**
 * Extract element info specifically for LCP
 * Only returns selector and url
 * @param {Object} attribution - LCP attribution data from web-vitals
 * @returns {Object|null} LCP element information
 */
export function extractLCPElementInfo(attribution) {
  if (!attribution || !attribution.element) return null
  
  try {
    return {
      selector: getSelector(attribution.element),
      url: attribution.url || null
    }
  } catch (error) {
    return null
  }
}

/**
 * Extract element info specifically for CLS
 * Only returns selector
 * @param {Object} attribution - CLS attribution data from web-vitals
 * @returns {Array|null} Array of elements causing layout shifts
 */
export function extractCLSElementInfo(attribution) {
  if (!attribution || !attribution.largestShiftTarget) return null
  
  try {
    return [{
      selector: getSelector(attribution.largestShiftTarget)
    }]
  } catch (error) {
    return null
  }
}

/**
 * Extract element info specifically for INP
 * Only returns selector
 * @param {Object} attribution - INP attribution data from web-vitals
 * @returns {Object|null} INP element information
 */
export function extractINPElementInfo(attribution) {
  if (!attribution || !attribution.eventTarget) return null
  
  try {
    return {
      selector: getSelector(attribution.eventTarget)
    }
  } catch (error) {
    return null
  }
}
