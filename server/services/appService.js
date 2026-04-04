import { nanoid } from 'nanoid'
import { readJSON, writeJSON } from '../utils/fileStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_FILE = path.join(__dirname, '..', 'data', 'apps.json')

export function list() {
  return readJSON(APPS_FILE)
}

export function findById(appId) {
  const apps = readJSON(APPS_FILE)
  return apps.find(a => a.appId === appId) || null
}

export async function register(name) {
  const app = {
    appId: nanoid(12),
    name,
    createdAt: new Date().toISOString()
  }
  const apps = readJSON(APPS_FILE)
  apps.push(app)
  await writeJSON(APPS_FILE, apps)
  return app
}
