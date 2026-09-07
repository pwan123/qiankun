import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8081,
    strictPort: true, // 端口被占用时直接报错，避免静默换端口导致主应用注册地址失效
    cors: true, // qiankun 加载子应用 HTML 需要跨域支持
  },
})
