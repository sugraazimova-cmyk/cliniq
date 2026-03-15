// Local dev server — replaces `vercel dev` for API routes
// Usage: node server.js
// Vite proxies /api/* → http://localhost:3000

import http from "http"
import chatHandler from "./api/chat.js"

const PORT = 3000

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      try {
        req.body = JSON.parse(body)
      } catch {
        req.body = {}
      }
      chatHandler(req, res)
    })
  } else {
    res.writeHead(404).end("Not found")
  }
})

server.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
