import fs from 'fs'
import path from 'path'

const writeQueues = new Map()

export function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

function writeJSONSync(filePath, data) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function appendToArray(filePath, items) {
  const queue = writeQueues.get(filePath) || Promise.resolve()
  const next = queue.then(() => {
    const existing = readJSON(filePath)
    existing.push(...items)
    writeJSONSync(filePath, existing)
  })
  writeQueues.set(filePath, next.catch(() => {}))
  return next
}

export function writeJSON(filePath, data) {
  const queue = writeQueues.get(filePath) || Promise.resolve()
  const next = queue.then(() => {
    writeJSONSync(filePath, data)
  })
  writeQueues.set(filePath, next.catch(() => {}))
  return next
}
