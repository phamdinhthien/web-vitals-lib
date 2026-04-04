<template>
  <div class="dist-chart-container">
    <canvas ref="canvas"></canvas>
    <div v-if="total === 0" class="chart-empty">No data available</div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'DistributionChart',
  props: {
    ratingDistribution: {
      type: Object,
      default: () => ({ good: 0, needsImprovement: 0, poor: 0 })
    }
  },
  data() {
    return { chart: null }
  },
  computed: {
    total() {
      const d = this.ratingDistribution || {}
      return (d.good || 0) + (d.needsImprovement || 0) + (d.poor || 0)
    }
  },
  watch: {
    ratingDistribution: {
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
      const d = this.ratingDistribution || {}
      const total = this.total
      if (total === 0) return

      const ctx = this.$refs.canvas.getContext('2d')
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Good', 'Needs Improvement', 'Poor'],
          datasets: [{
            data: [d.good || 0, d.needsImprovement || 0, d.poor || 0],
            backgroundColor: ['#0cce6b', '#ffa400', '#ff4e42'],
            borderRadius: 4,
            barThickness: 24
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
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
                  const pct = total > 0 ? ((ctx.parsed.x / total) * 100).toFixed(1) : 0
                  return `${ctx.parsed.x} (${pct}%)`
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.5)' },
              ticks: { color: '#64748b' },
              beginAtZero: true
            },
            y: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { weight: '500' } }
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.dist-chart-container {
  position: relative;
  height: 130px;
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
