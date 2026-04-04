import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import appsRouter from './routes/apps.js'
import collectRouter from './routes/collect.js'
import metricsRouter from './routes/metrics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Auto-create data directory on startup
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true })

// CORS middleware - allow all origins, methods, and handle preflight
app.use(cors())
app.options('*', cors())

// JSON body parsing for both application/json and text/plain content types
// (sendBeacon with Blob sends as application/json, but some browsers may send as text/plain)
app.use(express.json({ limit: '1mb' }))
app.use(express.text({ limit: '1mb', type: 'text/plain' }))

// Parse text/plain body as JSON if it looks like JSON
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body)
    } catch (e) {
      // leave as-is
    }
  }
  next()
})

// Route mounting
app.use('/api/apps', appsRouter)
app.use('/api/collect', collectRouter)
app.use('/api', metricsRouter)

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }
  next(err)
})

app.listen(PORT, () => {
  console.log(`Web Vitals server running on http://localhost:${PORT}`)
})
