import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env into process.env when running `node server.js` locally.
// (Vite loads it for the dev server, but this standalone server does not.)
const envFile = path.join(__dirname, '.env')
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envFile)
  } catch {
    // no .env file — rely on real environment variables (e.g. on Railway)
  }
} else if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const key = match[1]
    if (process.env[key] !== undefined) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

const port = process.env.PORT || 8080

/** Ensure the proxy target always has a protocol, even if .env omits it. */
function normalizeTarget(value) {
  if (!value) return 'https://evee-trading-bot-production.up.railway.app'
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const target = normalizeTarget(process.env.API_PROXY_TARGET)
// Optional: set ADMIN_API_TOKEN on the server so the token never ships to the browser.
const adminToken = process.env.ADMIN_API_TOKEN || ''

const app = express()

// Mounted at root with pathFilter so the full path (/api/v1/...) is preserved.
// Mounting via app.use('/api', ...) would strip the /api prefix before proxying.
const apiProxy = createProxyMiddleware({
  target,
  changeOrigin: true,
  pathFilter: ['/api', '/health'],
  on: {
    proxyReq: (proxyReq, req) => {
      if (adminToken && !req.headers.authorization) {
        proxyReq.setHeader('Authorization', `Bearer ${adminToken}`)
      }
    },
  },
})

app.use(apiProxy)

const dist = path.join(__dirname, 'dist')
app.use(express.static(dist))
// SPA fallback: serve index.html for any non-API route
app.use((_req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.listen(port, () => {
  console.log(`Admin panel listening on :${port}, proxying /api -> ${target}`)
})
