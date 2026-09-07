import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
    // base = '/vue':与主应用里 qiankun 的 activeRule 前缀一致
    // 效果：本应用内 push("/list")实际 URL 变为 /vue/list
    history: createWebHistory('/vue'),
    routes:[
        { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: '/list', name: 'list', component: () => import('../views/ListView.vue') },
        { path: '/detail/:id', name: 'detail', component: () => import('../views/DetailView.vue')}
    ]
})

export default router