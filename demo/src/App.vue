<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">Web Vitals Demo</div>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
        <router-link to="/gallery">Gallery</router-link>
      </div>
    </nav>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
.navbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: #1a1a2e; color: white; }
.nav-brand { font-size: 1.25rem; font-weight: bold; }
.nav-links { display: flex; gap: 1.5rem; }
.nav-links a { color: #a8a8b3; text-decoration: none; transition: color 0.2s; }
.nav-links a:hover, .nav-links a.router-link-active { color: white; }
.content { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
</style>
