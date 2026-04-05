import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import appsRouter from '../server/routes/apps.js'
import collectRouter from '../server/routes/collect.js'
import metricsRouter from '../server/routes/metrics.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Ensure data directory exists (use /tmp on Vercel)
const dataDir = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, '..', 'server', 'data')
fs.mkdirSync(dataDir, { recursive: true })

// On Vercel: copy seed data from bundled server/data/ to /tmp/data/ on cold start
if (process.env.VERCEL) {
  const seedDir = path.join(__dirname, '..', 'server', 'data')
  if (fs.existsSync(seedDir)) {
    const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const dest = path.join(dataDir, file)
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(seedDir, file), dest)
      }
    }
  }
}

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
