import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { initWebVitals } from 'web-vitals-lib'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Initialize web-vitals tracking
const appId = import.meta.env.VITE_APP_ID
const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api/collect'

if (!appId) {
  console.warn('[WebVitals Demo] VITE_APP_ID not configured. Create a .env file with VITE_APP_ID=your-app-id')
} else {
  initWebVitals({
    appId,
    apiEndpoint,
    debug: true
  })
}
