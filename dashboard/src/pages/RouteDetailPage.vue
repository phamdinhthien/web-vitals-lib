<template>
  <div class="page-container">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <router-link to="/">Dashboard</router-link>
      <span class="separator">/</span>
      <router-link :to="`/apps/${appId}`">{{ appName || appId }}</router-link>
      <span class="separator">/</span>
      <span class="current">{{ decodedPage }}</span>
    </div>

    <div class="page-header">
      <h1 class="page-title">{{ decodedPage }}</h1>
      <p class="page-subtitle">Detailed web vitals metrics for this route</p>
    </div>

    <!-- Filter Bar -->
    <FilterBar :browsers="availableBrowsers" @filter-change="onFilterChange" />

    <!-- Loading -->
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
      <span class="spinner-text">Loading metrics...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <h3>Failed to load metrics</h3>
      <p>{{ error }}</p>
      <button class="btn" style="margin-top: 16px" @click="fetchData">Retry</button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Overview Cards -->
      <div class="section">
        <h2 class="section-title">Overview (p75)</h2>
        <div class="metrics-grid">
          <MetricCard
            v-for="name in metricNames"
            :key="name"
            :metricName="name"
            :p75="getP75(name)"
            :sampleCount="getSampleCount(name)"
            :ratingDistribution="getDistribution(name)"
          />
        </div>
      </div>

      <!-- Per-metric detail sections -->
      <div v-for="name in metricNames" :key="name" class="section metric-section">
        <h2 class="section-title">
          <span class="metric-badge" :style="{ background: getBadgeColor(name) }"></span>
          {{ name }}
          <span class="section-meta">{{ getSampleCount(name) || 0 }} samples</span>
        </h2>

        <div class="detail-grid">
          <div class="detail-card">
            <h4 class="detail-card-title">Trend</h4>
            <TimeSeriesChart :metrics="getMetricsForName(name)" :metricName="name" />
          </div>
          <div class="detail-card">
            <h4 class="detail-card-title">Distribution</h4>
            <DistributionChart :ratingDistribution="getDistribution(name)" />
            <AttributionPanel
              v-if="['LCP', 'CLS', 'INP'].includes(name)"
              :metrics="getMetricsForName(name)"
              :metricName="name"
            />
          </div>
        </div>
      </div>

      <!-- Browser Distribution -->
      <div class="section">
        <h2 class="section-title">Browser Distribution</h2>
        <div class="card" style="padding: 20px;">
          <BrowserChart :metrics="allMetrics" />
        </div>
      </div>

      <!-- Waterfall -->
      <div class="section">
        <WaterfallPanel :appId="appId" :page="decodedPage" />
      </div>
    </div>
  </div>
</template>

<script>
import { getApp, getMetrics } from '../services/api.js'
import { getRating, getRatingColor, THRESHOLDS } from '../utils/thresholds.js'
import MetricCard from '../components/MetricCard.vue'
import FilterBar from '../components/FilterBar.vue'
import TimeSeriesChart from '../components/TimeSeriesChart.vue'
import DistributionChart from '../components/DistributionChart.vue'
import BrowserChart from '../components/BrowserChart.vue'
import AttributionPanel from '../components/AttributionPanel.vue'
import WaterfallPanel from '../components/WaterfallPanel.vue'

export default {
  name: 'RouteDetailPage',
  components: {
    MetricCard,
    FilterBar,
    TimeSeriesChart,
    DistributionChart,
    BrowserChart,
    AttributionPanel,
    WaterfallPanel
  },
  props: {
    appId: { type: String, required: true },
    page: { type: String, required: true }
  },
  data() {
    return {
      appName: '',
      allMetrics: [],
      loading: true,
      error: null,
      filters: {},
      metricNames: ['LCP', 'FCP', 'CLS', 'INP', 'TTFB']
    }
  },
  computed: {
    decodedPage() {
      try { return decodeURIComponent(this.page) } catch { return this.page }
    },
    availableBrowsers() {
      const set = new Set()
      for (const m of this.allMetrics) {
        const b = m.browser || m.userAgent
        if (b) set.add(b)
      }
      return [...set].sort()
    },
    metricsByName() {
      const grouped = {}
      for (const name of this.metricNames) {
        grouped[name] = this.allMetrics.filter(m => m.name === name || m.metricName === name)
      }
      return grouped
    }
  },
  mounted() {
    this.fetchData()
  },
  watch: {
    page() { this.fetchData() }
  },
  methods: {
    async fetchData() {
      this.loading = true
      this.error = null
      try {
        const [appData, metricsData] = await Promise.all([
          getApp(this.appId).catch(() => null),
          getMetrics(this.appId, { page: this.decodedPage, ...this.filters })
        ])

        if (appData) {
          this.appName = appData.name || appData.appId || this.appId
        }

        this.allMetrics = Array.isArray(metricsData)
          ? metricsData
          : (metricsData.metrics || [])
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    onFilterChange(filters) {
      this.filters = filters
      this.fetchData()
    },
    getMetricsForName(name) {
      return this.metricsByName[name] || []
    },
    getP75(name) {
      const items = this.getMetricsForName(name)
      if (items.length === 0) return null
      const values = items.map(m => m.value).filter(v => v != null).sort((a, b) => a - b)
      if (values.length === 0) return null
      const idx = Math.floor(values.length * 0.75)
      return values[Math.min(idx, values.length - 1)]
    },
    getSampleCount(name) {
      return this.getMetricsForName(name).length
    },
    getDistribution(name) {
      const items = this.getMetricsForName(name)
      const dist = { good: 0, needsImprovement: 0, poor: 0 }
      const t = THRESHOLDS[name]
      if (!t) return dist
      for (const m of items) {
        if (m.value == null) continue
        const r = getRating(name, m.value)
        if (r === 'good') dist.good++
        else if (r === 'needs-improvement') dist.needsImprovement++
        else if (r === 'poor') dist.poor++
      }
      return dist
    },
    getBadgeColor(name) {
      const p75 = this.getP75(name)
      const rating = getRating(name, p75)
      return getRatingColor(rating)
    }
  }
}
</script>

<style scoped>
.metric-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
}

.section-meta {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: auto;
}

.metric-badge {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.detail-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 16px;
}

.detail-card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}
</style>
