<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="separator">/</span>
      <span class="current">{{ appName || appId }}</span>
    </div>

    <div class="page-header">
      <h1 class="page-title">{{ appName || appId }}</h1>
      <p class="page-subtitle">Route-level web vitals overview</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
      <span class="spinner-text">Loading routes...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <h3>Failed to load routes</h3>
      <p>{{ error }}</p>
      <button class="btn" style="margin-top: 16px" @click="fetchData">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="routes.length === 0" class="empty-state">
      <h3>No routes tracked yet</h3>
      <p>Metrics will appear here once the web-vitals-lib starts reporting data for this application.</p>
    </div>

    <!-- Route List -->
    <div v-else>
      <div
        v-for="route in routes"
        :key="route.page"
        class="route-row"
        @click="goToRoute(route.page)"
      >
        <div class="route-header">
          <span class="route-url">{{ route.page }}</span>
          <span class="route-count" v-if="getTotalSamples(route.page)">
            {{ getTotalSamples(route.page) }} total samples
          </span>
        </div>
        <div class="metrics-grid" v-if="routeSummaries[route.page]">
          <MetricCard
            v-for="metric in metricNames"
            :key="metric"
            :metricName="metric"
            :p75="getP75(route.page, metric)"
            :sampleCount="getSampleCount(route.page, metric)"
            :ratingDistribution="getDistribution(route.page, metric)"
          />
        </div>
        <div v-else class="route-loading">
          <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
          <span>Loading metrics...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getApp, getRoutes, getRouteSummary } from '../services/api.js'
import MetricCard from '../components/MetricCard.vue'

export default {
  name: 'RouteListPage',
  components: { MetricCard },
  props: {
    appId: { type: String, required: true }
  },
  data() {
    return {
      appName: '',
      routes: [],
      routeSummaries: {},
      loading: true,
      error: null,
      metricNames: ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      this.error = null
      try {
        const [appData, routesData] = await Promise.all([
          getApp(this.appId).catch(() => null),
          getRoutes(this.appId)
        ])

        if (appData) {
          this.appName = appData.name || appData.appId || this.appId
        }

        const rawRoutes = Array.isArray(routesData) ? routesData : (routesData.routes || [])
        // routes API returns array of strings, normalize to objects
        this.routes = rawRoutes.map(r => typeof r === 'string' ? { page: r } : r)
        this.loading = false

        // Fetch summaries in parallel
        for (const route of this.routes) {
          this.fetchRouteSummary(route.page)
        }
      } catch (err) {
        this.error = err.message
        this.loading = false
      }
    },
    async fetchRouteSummary(page) {
      try {
        const summary = await getRouteSummary(this.appId, page)
        this.routeSummaries = { ...this.routeSummaries, [page]: summary }
      } catch {
        // Silently fail for individual route summaries
      }
    },
    getP75(page, metric) {
      const s = this.routeSummaries[page]
      if (!s || !s[metric]) return null
      return s[metric].p75
    },
    getSampleCount(page, metric) {
      const s = this.routeSummaries[page]
      if (!s || !s[metric]) return null
      return s[metric].count
    },
    getDistribution(page, metric) {
      const s = this.routeSummaries[page]
      if (!s || !s[metric]) return null
      return s[metric].ratingDistribution || null
    },
    getTotalSamples(page) {
      const s = this.routeSummaries[page]
      if (!s) return 0
      return this.metricNames.reduce((sum, m) => sum + (s[m]?.count || 0), 0)
    },
    goToRoute(page) {
      this.$router.push(`/apps/${this.appId}/routes/${encodeURIComponent(page)}`)
    }
  }
}
</script>

<style scoped>
.route-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.route-url {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
}

.route-count {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.route-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 8px 0;
}
</style>
