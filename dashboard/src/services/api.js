const BASE = '/api'

async function request(url) {
  const res = await fetch(`${BASE}${url}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function getApps() { return request('/apps') }
export function getApp(appId) { return request(`/apps/${appId}`) }
export function getRoutes(appId) { return request(`/apps/${appId}/routes`) }
export function getRouteSummary(appId, page) { return request(`/apps/${appId}/routes/summary?page=${encodeURIComponent(page)}`) }
export function getResources(appId, page) {
  return request(`/apps/${appId}/resources${page ? '?page=' + encodeURIComponent(page) : ''}`)
}

export function getMetrics(appId, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
  const qs = params.toString()
  return request(`/apps/${appId}/metrics${qs ? '?' + qs : ''}`)
}
