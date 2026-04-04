<template>
  <div class="attribution-panel">
    <h4 class="attribution-title">Attribution Data</h4>
    <div v-if="!hasAttribution" class="info-box">
      No attribution data available for {{ metricName }}.
    </div>
    <div v-else class="attribution-list">
      <div v-for="(item, idx) in attributions" :key="idx" class="attribution-item">
        <div class="attr-row" v-for="(val, key) in item" :key="key">
          <span class="attr-key">{{ key }}</span>
          <span class="attr-value">{{ val || 'N/A' }}</span>
        </div>
      </div>
      <div v-if="attributions.length === 0" class="info-box">
        No attribution entries found in recent metrics.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AttributionPanel',
  props: {
    metrics: { type: Array, default: () => [] },
    metricName: { type: String, required: true }
  },
  computed: {
    hasAttribution() {
      return ['LCP', 'CLS', 'INP'].includes(this.metricName)
    },
    attributions() {
      if (!this.hasAttribution || !this.metrics) return []

      const recent = this.metrics
        .filter(m => m.attribution && Object.keys(m.attribution).length > 0)
        .slice(-5)
        .reverse()

      return recent.map(m => {
        const attr = m.attribution
        switch (this.metricName) {
          case 'LCP':
            return {
              'Element': attr.element || attr.elementSelector || 'N/A',
              'Resource URL': attr.url || attr.resourceUrl || 'N/A',
              'Resource Type': attr.resourceType || 'N/A',
              'Value': m.value != null ? Math.round(m.value) + 'ms' : 'N/A'
            }
          case 'CLS':
            return {
              'Shift Target': attr.largestShiftTarget || attr.element || 'N/A',
              'Shift Value': attr.largestShiftValue != null ? attr.largestShiftValue.toFixed(4) : 'N/A',
              'Value': m.value != null ? m.value.toFixed(3) : 'N/A'
            }
          case 'INP':
            return {
              'Event Target': attr.eventTarget || attr.element || 'N/A',
              'Event Type': attr.eventType || 'N/A',
              'Value': m.value != null ? Math.round(m.value) + 'ms' : 'N/A'
            }
          default:
            return {}
        }
      })
    }
  }
}
</script>

<style scoped>
.attribution-panel {
  margin-top: 12px;
}

.attribution-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.attribution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attribution-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 10px 14px;
}

.attr-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 0.8rem;
}

.attr-row + .attr-row {
  border-top: 1px solid var(--border-color);
}

.attr-key {
  color: var(--text-muted);
  font-weight: 500;
}

.attr-value {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
