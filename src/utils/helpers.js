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
