import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/hoime' },
        { path: '/home', name: 'home', component: () => import('../views/HomeView.vue') },
        //  /vue、/react 前缀由 qiankun 接管：
        // 注册路由只负责 “占位不 404 ”,真是内容渲染在布局中常驻的容器 div 里
        { path: '/vue/:pathMatch(.*)', component: () => import('../views/MicroSlot.vue') },
        { path: '/react/:pathMatch(.*)*', component: () => import('../views/MicroSlot.vue') },
    ]
})

export default router
