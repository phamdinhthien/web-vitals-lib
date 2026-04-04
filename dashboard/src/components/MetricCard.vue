<template>
  <div class="metric-card" :class="{ 'no-data': p75 == null }">
    <div class="metric-header">
      <span class="metric-name">{{ metricName }}</span>
      <span v-if="p75 != null" class="badge" :class="'badge-' + rating">{{ ratingLabel }}</span>
    </div>
    <div class="metric-value" :style="{ color: valueColor }">
      {{ formattedValue }}
    </div>
    <div class="metric-footer">
      <span class="sample-count" v-if="sampleCount != null">
        {{ sampleCount }} sample{{ sampleCount !== 1 ? 's' : '' }}
      </span>
      <div class="mini-distribution" v-if="ratingDistribution && p75 != null">
        <div
          class="dist-bar good"
          :style="{ width: distPercent('good') + '%' }"
          :title="'Good: ' + (ratingDistribution.good || 0)"
        ></div>
        <div
          class="dist-bar needs-improvement"
          :style="{ width: distPercent('needsImprovement') + '%' }"
          :title="'Needs Improvement: ' + (ratingDistribution.needsImprovement || 0)"
        ></div>
        <div
          class="dist-bar poor"
          :style="{ width: distPercent('poor') + '%' }"
          :title="'Poor: ' + (ratingDistribution.poor || 0)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { getRating, getRatingColor, formatValue } from '../utils/thresholds.js'

export default {
  name: 'MetricCard',
  props: {
    metricName: { type: String, required: true },
    p75: { type: Number, default: null },
    sampleCount: { type: Number, default: null },
    ratingDistribution: { type: Object, default: null }
  },
  computed: {
    rating() {
      return getRating(this.metricName, this.p75)
    },
    ratingLabel() {
      return this.rating.replace('-', ' ')
    },
    valueColor() {
      return getRatingColor(this.rating)
    },
    formattedValue() {
      return formatValue(this.metricName, this.p75)
    }
  },
  methods: {
    distPercent(key) {
      const d = this.ratingDistribution
      if (!d) return 0
      const total = (d.good || 0) + (d.needsImprovement || 0) + (d.poor || 0)
      if (total === 0) return 0
      return ((d[key] || 0) / total) * 100
    }
  }
}
</script>

<style scoped>
.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 14px 16px;
  min-width: 0;
}

.metric-card.no-data {
  opacity: 0.5;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: var(--font-mono);
  margin-bottom: 8px;
  line-height: 1.2;
}

.metric-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sample-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.mini-distribution {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--border-color);
}

.dist-bar {
  height: 100%;
  min-width: 0;
  transition: width 0.3s;
}

.dist-bar.good { background: var(--good); }
.dist-bar.needs-improvement { background: var(--needs-improvement); }
.dist-bar.poor { background: var(--poor); }
</style>
