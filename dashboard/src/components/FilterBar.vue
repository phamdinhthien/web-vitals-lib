<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label">Time Range</label>
      <select v-model="dateRange" @change="emitChange">
        <option value="">All time</option>
        <option value="1h">Last 1 hour</option>
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
    </div>
    <div class="filter-group">
      <label class="filter-label">Browser</label>
      <select v-model="browser" @change="emitChange">
        <option value="">All browsers</option>
        <option v-for="b in browsers" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>
    <div class="filter-group">
      <label class="filter-label">Rating</label>
      <select v-model="rating" @change="emitChange">
        <option value="">All</option>
        <option value="good">Good</option>
        <option value="needs-improvement">Needs Improvement</option>
        <option value="poor">Poor</option>
      </select>
    </div>
    <button class="btn" @click="clearAll" :disabled="!hasFilters">Clear all</button>
  </div>
</template>

<script>
export default {
  name: 'FilterBar',
  props: {
    browsers: { type: Array, default: () => [] }
  },
  emits: ['filter-change'],
  data() {
    return {
      dateRange: '',
      browser: '',
      rating: ''
    }
  },
  computed: {
    hasFilters() {
      return this.dateRange || this.browser || this.rating
    }
  },
  methods: {
    getDateRange() {
      if (!this.dateRange) return {}
      const now = new Date()
      let start
      switch (this.dateRange) {
        case '1h':
          start = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          return {}
      }
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString()
      }
    },
    emitChange() {
      const dates = this.getDateRange()
      this.$emit('filter-change', {
        ...dates,
        browser: this.browser,
        rating: this.rating
      })
    },
    clearAll() {
      this.dateRange = ''
      this.browser = ''
      this.rating = ''
      this.emitChange()
    }
  }
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
