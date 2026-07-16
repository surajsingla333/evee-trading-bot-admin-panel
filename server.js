import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const port = process.env.PORT || 8080
const target =
  process.env.API_PROXY_TARGET || 'https://evee-trading-bot-production.up.railway.app'
// Optional: set ADMIN_API_TOKEN on the server so the token never ships to the browser.
const adminToken = process.env.ADMIN_API_TOKEN || ''

const app = express()

const apiProxy = createProxyMiddleware({
  target,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      if (adminToken && !req.headers.authorization) {
        proxyReq.setHeader('Authorization', `Bearer ${adminToken}`)
      }
    },
  },
})

app.use('/api', apiProxy)
app.use('/health', apiProxy)

const dist = path.join(__dirname, 'dist')
app.use(express.static(dist))
// SPA fallback: serve index.html for any non-API route
app.use((_req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})

app.listen(port, () => {
  console.log(`Admin panel listening on :${port}, proxying /api -> ${target}`)
})
