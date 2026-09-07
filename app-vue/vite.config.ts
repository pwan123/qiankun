import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

// 应用名必须与主应用 app.ts 里注册的name完全一致
const MICRO_APP_NAME = 'app-vue'

export default defineConfig({
  plugins: [
    vue(),
    qiankun(MICRO_APP_NAME, {useDevMode: true }),
  ],
  server: {
    port: 8081,
    strictPort: true, // 端口被占用时直接报错，避免静默换端口导致主应用注册地址失效
    cors: true, // qiankun 加载子应用 HTML 需要跨域支持
  },
})
