import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'WebVitalsLib',
      formats: ['es', 'iife'],
      fileName: (format) => `web-vitals-lib${format === 'es' ? '.es' : ''}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
