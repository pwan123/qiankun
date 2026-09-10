<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isVueActive = computed(() => route.path.startsWith('/vue'))
const isReactActive = computed(() => route.path.startsWith('/react'))

// 手动算激活态：子应用内部跳转（/vue/list、/react/detail/1）时导航也要亮
const navs = [
  { to: '/home', label: '首页', active: computed(() => route.path === '/home') },
  { to: '/vue', label: 'Vue 子应用', active: isVueActive },
  { to: '/react', label: 'React 子应用', active: isReactActive },
]
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <!-- <router-link to="/home">首页</router-link>
      <router-link to="/vue">Vue 子应用</router-link>
      <router-link to="/react">React 子应用</router-link> -->
       <router-link
        v-for="item in navs"
        :key="item.to"
        :to="item.to"
        :class="{ 'nav-active': item.active.value }"
      >{{ item.label }}</router-link>
    </nav>

    <main class="main">
      <!-- 主应用自身页面 -->
       <router-view></router-view>
       <!-- 两个子应用容器【常驻 DOM】:qiankun 注册时容器必须已存在，
        否则激活子应用时找不到挂载点会报错。用 v-show 而非 v-if 控制显隐 -->
        <div id="micro-container-vue" v-show="isVueActive" class="micro-container"></div>
        <div id="micro-container-react" v-show="isReactActive" class="micro-container"></div>
    </main>
  </div>
</template>

<style>
.nav { display: flex; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #ddd; }
.nav a { color: #333; text-decoration: none; }
.nav a.nav-active { color: #42b883; font-weight: bold; }
.main { padding: 16px; }
.micro-container { min-height: 200px; }
</style>