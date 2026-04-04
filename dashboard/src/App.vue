<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="top-nav-inner">
        <router-link to="/" class="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Web Vitals Dashboard</span>
        </router-link>
        <nav class="nav-links">
          <a href="https://web.dev/vitals/" target="_blank" rel="noopener">Docs</a>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
}

.nav-brand svg {
  color: var(--accent);
}

.nav-brand:hover {
  color: var(--text-primary);
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-links a {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
}

.nav-links a:hover {
  color: var(--text-primary);
}

.main-content {
  flex: 1;
}
</style>
