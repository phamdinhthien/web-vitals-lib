import { appendToArray } from '../utils/fileStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDataDir = path.join(__dirname, '..', 'data')

function getDataDir() {
  return process.env.DATA_DIR || defaultDataDir
}

export async function ingest(appId, metrics, browser) {
  const filePath = path.join(getDataDir(), `${appId}.json`)
  const receivedAt = new Date().toISOString()

  const enriched = metrics.map(m => ({
    ...m,
    browser,
    receivedAt
  }))

  await appendToArray(filePath, enriched)
}

export async function ingestResources(appId, page, resources, browser) {
  const filePath = path.join(getDataDir(), `${appId}_resources.json`)
  const receivedAt = new Date().toISOString()

  const record = {
    page,
    browser,
    receivedAt,
    resources
  }

  await appendToArray(filePath, [record])
}
