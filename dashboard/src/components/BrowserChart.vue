<template>
  <div class="browser-chart-container">
    <canvas ref="canvas"></canvas>
    <div v-if="!metrics || metrics.length === 0" class="chart-empty">No data available</div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

const BROWSER_COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#a855f7'
]

export default {
  name: 'BrowserChart',
  props: {
    metrics: { type: Array, default: () => [] }
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
    computeDistribution() {
      const counts = {}
      for (const m of this.metrics) {
        const browser = m.browser || m.userAgent || 'Unknown'
        counts[browser] = (counts[browser] || 0) + 1
      }
      return counts
    },
    renderChart() {
      if (this.chart) this.chart.destroy()
      if (!this.metrics || this.metrics.length === 0) return

      const dist = this.computeDistribution()
      const labels = Object.keys(dist)
      const data = Object.values(dist)
      const total = data.reduce((a, b) => a + b, 0)

      const ctx = this.$refs.canvas.getContext('2d')
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: labels.map((_, i) => BROWSER_COLORS[i % BROWSER_COLORS.length]),
            borderColor: '#1e293b',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#94a3b8',
                padding: 12,
                usePointStyle: true,
                pointStyleWidth: 10,
                generateLabels: (chart) => {
                  const ds = chart.data.datasets[0]
                  return chart.data.labels.map((label, i) => ({
                    text: `${label} (${((ds.data[i] / total) * 100).toFixed(1)}%)`,
                    fillStyle: ds.backgroundColor[i],
                    strokeStyle: ds.backgroundColor[i],
                    index: i,
                    fontColor: '#94a3b8',
                    pointStyle: 'circle'
                  }))
                }
              }
            },
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
                  const pct = ((ctx.parsed / total) * 100).toFixed(1)
                  return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
                }
              }
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.browser-chart-container {
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
