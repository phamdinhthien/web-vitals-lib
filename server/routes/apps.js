import { Router } from 'express'
import * as appService from '../services/appService.js'

const router = Router()

// POST /api/apps - Register a new app
router.post('/', async (req, res) => {
  try {
    const { name } = req.body || {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' })
    }

    const app = await appService.register(name.trim())
    return res.status(201).json(app)
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/apps - List all apps
router.get('/', (req, res) => {
  try {
    const apps = appService.list()
    return res.status(200).json(apps)
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/apps/:appId - Get app by ID
router.get('/:appId', (req, res) => {
  try {
    const app = appService.findById(req.params.appId)
    if (!app) {
      return res.status(404).json({ error: 'App not found' })
    }
    return res.status(200).json(app)
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
