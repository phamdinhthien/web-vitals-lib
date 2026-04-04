<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Applications</h1>
      <p class="page-subtitle">Monitor web vitals across your registered applications</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
      <span class="spinner-text">Loading applications...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <h3>Unable to connect to server</h3>
      <p>{{ error }}</p>
      <p class="error-hint">Make sure the API server is running on port 3001</p>
      <button class="btn" style="margin-top: 16px" @click="fetchApps">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="apps.length === 0" class="empty-state">
      <h3>No apps registered yet</h3>
      <p>Register an app via <code>POST /api/apps</code> with a JSON body containing <code>name</code> and <code>appId</code>.</p>
    </div>

    <!-- App List -->
    <div v-else class="cards-grid">
      <div
        v-for="app in apps"
        :key="app.appId"
        class="card card-clickable app-card"
        @click="$router.push(`/apps/${app.appId}`)"
      >
        <div class="app-card-header">
          <div class="app-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div class="app-info">
            <h3 class="app-name">{{ app.name }}</h3>
            <span class="app-id">{{ app.appId }}</span>
          </div>
        </div>
        <div class="app-card-footer">
          <span class="app-date">
            Created {{ formatDate(app.createdAt) }}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getApps } from '../services/api.js'

export default {
  name: 'AppListPage',
  data() {
    return {
      apps: [],
      loading: true,
      error: null
    }
  },
  mounted() {
    this.fetchApps()
  },
  methods: {
    async fetchApps() {
      this.loading = true
      this.error = null
      try {
        const data = await getApps()
        this.apps = Array.isArray(data) ? data : (data.apps || [])
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.app-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.app-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-info {
  min-width: 0;
}

.app-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-id {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.app-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.app-date {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.arrow-icon {
  color: var(--text-muted);
  transition: transform 0.15s;
}

.app-card:hover .arrow-icon {
  transform: translateX(3px);
  color: var(--accent);
}

code {
  background: rgba(99, 102, 241, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--accent);
}
</style>
