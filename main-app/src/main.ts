import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { microInit } from './micro'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 根组件同步渲染完成后，布局里的子应用容器已存在于 DOM
// 此时注册并启动 qiankun 才能保证 container 可被找到
microInit()
