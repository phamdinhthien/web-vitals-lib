import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'WebVitalsLib',
      formats: ['es', 'umd'],
      fileName: (format) => `web-vitals-lib.${format === 'es' ? 'es' : 'umd'}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
