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

// Resolve data directory
const bundledDataDir = path.join(__dirname, '..', 'server', 'data')

if (process.env.VERCEL) {
  // On Vercel: try /tmp/data first, copy seed data there on cold start
  const tmpDataDir = '/tmp/data'
  fs.mkdirSync(tmpDataDir, { recursive: true })

  // Try multiple possible locations for bundled seed data
  const possibleSeedDirs = [
    bundledDataDir,
    path.join(process.cwd(), 'server', 'data'),
    path.join('/var/task', 'server', 'data')
  ]

  for (const seedDir of possibleSeedDirs) {
    if (fs.existsSync(seedDir)) {
      const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'))
      if (files.length > 0) {
        for (const file of files) {
          const dest = path.join(tmpDataDir, file)
          // Always overwrite on cold start to ensure latest seed data
          fs.copyFileSync(path.join(seedDir, file), dest)
        }
        break
      }
    }
  }

  process.env.DATA_DIR = tmpDataDir
} else {
  // Local dev: use server/data directly
  fs.mkdirSync(bundledDataDir, { recursive: true })
  process.env.DATA_DIR = bundledDataDir
}

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

// Debug endpoint - check file paths on Vercel
app.get('/api/debug', (req, res) => {
  const activeDataDir = process.env.DATA_DIR
  const seedDir = path.join(__dirname, '..', 'server', 'data')
  const info = {
    cwd: process.cwd(),
    __dirname,
    activeDataDir,
    seedDir,
    bundledDataDir,
    seedDirExists: fs.existsSync(seedDir),
    dataDirExists: fs.existsSync(activeDataDir),
    seedFiles: fs.existsSync(seedDir) ? fs.readdirSync(seedDir) : [],
    dataFiles: fs.existsSync(activeDataDir) ? fs.readdirSync(activeDataDir) : [],
    isVercel: !!process.env.VERCEL
  }
  res.json(info)
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
