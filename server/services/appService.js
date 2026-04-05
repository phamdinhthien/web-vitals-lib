import { nanoid } from 'nanoid'
import { readJSON, writeJSON } from '../utils/fileStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDataDir = path.join(__dirname, '..', 'data')

function getDataDir() {
  return process.env.DATA_DIR || defaultDataDir
}

export function list() {
  return readJSON(path.join(getDataDir(), 'apps.json'))
}

export function findById(appId) {
  const apps = readJSON(path.join(getDataDir(), 'apps.json'))
  return apps.find(a => a.appId === appId) || null
}

export async function register(name) {
  const app = {
    appId: nanoid(12),
    name,
    createdAt: new Date().toISOString()
  }
  const appsFile = path.join(getDataDir(), 'apps.json')
  const apps = readJSON(appsFile)
  apps.push(app)
  await writeJSON(appsFile, apps)
  return app
}
