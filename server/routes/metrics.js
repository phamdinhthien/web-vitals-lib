import { Router } from 'express'
import * as appService from '../services/appService.js'
import * as aggregationService from '../services/aggregationService.js'

const router = Router()

// Middleware to validate app exists
function validateApp(req, res, next) {
  const { appId } = req.params
  const app = appService.findById(appId)
  if (!app) {
    return res.status(404).json({ error: 'App not found' })
  }
  req.app_record = app
  next()
}

// GET /api/metrics/apps/:appId/routes - Get distinct page URLs
router.get('/apps/:appId/routes', validateApp, (req, res) => {
  try {
    const routes = aggregationService.getRoutes(req.params.appId)
    return res.status(200).json({ routes })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/metrics/apps/:appId/routes/summary - Get summary for a page
router.get('/apps/:appId/routes/summary', validateApp, (req, res) => {
  try {
    const { page } = req.query
    if (!page) {
      return res.status(400).json({ error: 'page query parameter is required' })
    }

    const summary = aggregationService.getSummary(req.params.appId, page)
    return res.status(200).json(summary)
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/metrics/apps/:appId/metrics - Get metrics with optional filters
router.get('/apps/:appId/metrics', validateApp, (req, res) => {
  try {
    const { page, name, browser, rating, startDate, endDate } = req.query
    const filters = {}

    if (page) filters.page = page
    if (name) filters.name = name
    if (browser) filters.browser = browser
    if (rating) filters.rating = rating
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    const metrics = aggregationService.getMetrics(req.params.appId, filters)
    return res.status(200).json({ metrics })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/apps/:appId/resources - Get resource timing data
router.get('/apps/:appId/resources', validateApp, (req, res) => {
  try {
    const { page } = req.query
    const resources = aggregationService.getResources(req.params.appId, page)
    return res.status(200).json({ resources })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
