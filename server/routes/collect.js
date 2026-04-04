import { Router } from 'express'
import * as appService from '../services/appService.js'
import * as metricService from '../services/metricService.js'

const router = Router()

// POST /api/collect - Collect metrics
router.post('/', async (req, res) => {
  try {
    const { appId, metrics, browser, resources, page } = req.body || {}

    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({ error: 'appId is required' })
    }

    const app = appService.findById(appId)
    if (!app) {
      return res.status(404).json({ error: 'App not found' })
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: 'metrics must be a non-empty array' })
    }

    if (!browser || typeof browser !== 'string' || browser.trim().length === 0) {
      return res.status(400).json({ error: 'browser is required and must be a non-empty string' })
    }

    await metricService.ingest(appId, metrics, browser)

    // Store resource timing data if present
    if (resources && Array.isArray(resources) && resources.length > 0 && page) {
      await metricService.ingestResources(appId, page, resources, browser)
    }

    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
