import { createApp, type App as VueApp } from 'vue'
import { createRouter, type Router } from 'vue-router'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import router from './router'
import './style.css'

let app:VueApp | null = null

function render(props:{ container?: HTMLElement | null } = {}) {
    const { container } = props
    // 被 qiankun 托管时：挂载点取主应用容器内部的 #app
    // 独立运行时： container 为空，直接挂到自身 index.html 的 #app
    const mountEl = (container?.querySelector('#app') as HTMLElement | null) ?? '#app'
    app = createApp(App)
    app.use(router)
    app.mount(mountEl)
}

// 被 qiankun 托管时，插件把下面三个生命周期导出给主应用调用
renderWithQiankun({
  bootstrap() {
    console.log('[app-vue] bootstrap')
  },
  mount(props) {
    console.log('[app-vue] mount')
    render(props as { container?: HTMLElement | null })
  },
  unmount() {
    console.log('[app-vue] unmount')
    app?.unmount()
    app = null
  },
})

// 独立运行时：qiankun 沙箱没启用，不会注入__POWERED_BY_QIANKUN__变量
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
    render()
}