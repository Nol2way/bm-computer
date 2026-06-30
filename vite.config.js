import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/' = deploy ที่ root ของ Cloudflare Pages (xxx.pages.dev)
// ใช้ BrowserRouter + public/_redirects เพื่อ URL สวยและรองรับ SEO
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
