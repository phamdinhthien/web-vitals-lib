/**
 * Calculate the 75th percentile of an array of values
 * @param {number[]} values - Array of numeric values
 * @returns {number} The 75th percentile value
 */
export function calculateP75(values) {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(0.75 * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Get browser name from user agent string
 * @returns {string} The browser name (e.g., "Chrome", "Firefox", "Safari")
 */
export function getBrowserName() {
  const ua = navigator.userAgent
  
  // Check for Edge (must be before Chrome check)
  if (ua.indexOf('Edg/') > -1 || ua.indexOf('Edge/') > -1) {
    return 'Edge'
  }
  
  // Check for Opera (must be before Chrome check)
  if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera') > -1) {
    return 'Opera'
  }
  
  // Check for Chrome
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    return 'Chrome'
  }
  
  // Check for Safari (must be after Chrome check)
  if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    return 'Safari'
  }
  
  // Check for Firefox
  if (ua.indexOf('Firefox') > -1) {
    return 'Firefox'
  }
  
  // Check for Internet Explorer
  if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
    return 'Internet Explorer'
  }
  
  // Unknown browser
  return 'Unknown'
}
