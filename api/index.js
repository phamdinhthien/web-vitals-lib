import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

import appsRouter from '../server/routes/apps.js'
import collectRouter from '../server/routes/collect.js'
import metricsRouter from '../server/routes/metrics.js'

const app = express()

// Ensure data directory exists (use /tmp on Vercel)
const dataDir = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'server', 'data')
fs.mkdirSync(dataDir, { recursive: true })

// Export data dir for services to use
process.env.DATA_DIR = dataDir

app.use(cors())
app.options('*', cors())

app.use(express.json({ limit: '1mb' }))
app.use(express.text({ limit: '1mb', type: 'text/plain' }))

// Parse text/plain body as JSON
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body)
    } catch (e) { /* leave as-is */ }
  }
  next()
})

app.use('/api/apps', appsRouter)
app.use('/api/collect', collectRouter)
app.use('/api', metricsRouter)

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }
  next(err)
})

export default app
