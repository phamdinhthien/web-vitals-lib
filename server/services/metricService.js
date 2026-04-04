import { appendToArray } from '../utils/fileStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function ingest(appId, metrics, browser) {
  const filePath = path.join(__dirname, '..', 'data', `${appId}.json`)
  const receivedAt = new Date().toISOString()

  const enriched = metrics.map(m => ({
    ...m,
    browser,
    receivedAt
  }))

  await appendToArray(filePath, enriched)
}

export async function ingestResources(appId, page, resources, browser) {
  const filePath = path.join(__dirname, '..', 'data', `${appId}_resources.json`)
  const receivedAt = new Date().toISOString()

  const record = {
    page,
    browser,
    receivedAt,
    resources
  }

  await appendToArray(filePath, [record])
}
