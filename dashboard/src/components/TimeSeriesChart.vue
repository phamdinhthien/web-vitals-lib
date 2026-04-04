<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
    <div v-if="!metrics || metrics.length === 0" class="chart-empty">No data available</div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import { getRatingColor, getRating } from '../utils/thresholds.js'

export default {
  name: 'TimeSeriesChart',
  props: {
    metrics: { type: Array, default: () => [] },
    metricName: { type: String, default: '' }
  },
  data() {
    return { chart: null }
  },
  watch: {
    metrics: {
      handler() { this.renderChart() },
      deep: true
    }
  },
  mounted() {
    this.renderChart()
  },
  beforeUnmount() {
    if (this.chart) this.chart.destroy()
  },
  methods: {
    renderChart() {
      if (this.chart) this.chart.destroy()
      if (!this.metrics || this.metrics.length === 0) return

      const sorted = [...this.metrics].sort(
        (a, b) => new Date(a.receivedAt) - new Date(b.receivedAt)
      )

      const labels = sorted.map(m => {
        const d = new Date(m.receivedAt)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      })
      const data = sorted.map(m => m.value)
      const pointColors = sorted.map(m => getRatingColor(getRating(this.metricName, m.value)))

      const ctx = this.$refs.canvas.getContext('2d')
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: this.metricName,
            data,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: sorted.length === 1 ? 6 : 3,
            pointHoverRadius: 6,
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#e2e8f0',
              bodyColor: '#e2e8f0',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed.y
                  const rating = getRating(this.metricName, val)
                  const unit = this.metricName === 'CLS' ? '' : 'ms'
                  const formatted = this.metricName === 'CLS' ? val.toFixed(3) : Math.round(val) + unit
                  return `${this.metricName}: ${formatted} (${rating})`
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: { color: '#64748b', maxTicksLimit: 8, maxRotation: 0 }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: { color: '#64748b' },
              beginAtZero: true
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 220px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
