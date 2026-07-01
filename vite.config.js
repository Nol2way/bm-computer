import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/' = deploy ที่ root ของ Cloudflare Pages (xxx.pages.dev)
// ใช้ BrowserRouter + public/_redirects เพื่อ URL สวยและรองรับ SEO
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  // dev: เรียก /api/* เป็น same-origin แล้ว proxy ไป backend worker (wrangler dev :8787)
  // -> คุกกี้ session เป็น first-party ใช้งานราบรื่น (ตั้ง VITE_API_BASE=/ ใน .env.local)
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
})
