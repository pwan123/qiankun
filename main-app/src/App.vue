<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getGlobalActions } from './micro/actions'

const route = useRoute()
const actions = getGlobalActions()

const isVueActive = computed(() => route.path.startsWith('/vue'))
const isReactActive = computed(() => route.path.startsWith('/react'))
const navs = [
  { to: '/home', label: '首页', active: computed(() => route.path === '/home') },
  { to: '/vue', label: 'Vue 子应用', active: isVueActive },
  { to: '/react', label: 'React 子应用', active: isReactActive },
]

const username = ref('')
const currentUser = ref('')
const theme = ref<'default' | 'blue'>('default')

function login() {
  currentUser.value = username.value.trim() || '匿名用户'
  actions.setGlobalState({ user: currentUser.value })
}
function logout() {
  currentUser.value = ''
  actions.setGlobalState({ user: '' })
}
function switchTheme(t: 'default' | 'blue') {
  theme.value = t
  actions.setGlobalState({ theme: t })
}
</script>

<template>
  <div class="layout" :data-theme="theme">
    <nav class="nav">
      <router-link
        v-for="item in navs"
        :key="item.to"
        :to="item.to"
        :class="{ 'nav-active': item.active.value }"
      >{{ item.label }}</router-link>
    </nav>
    <div class="toolbar">
      <input v-model="username" placeholder="输入用户名" @keyup.enter="login" />
      <button @click="login">登录</button>
      <template v-if="currentUser">
        <span class="user">当前用户：{{ currentUser }}</span>
        <button @click="logout">退出</button>
      </template>
      <button @click="switchTheme(theme === 'default' ? 'blue' : 'default')">
        切换主题（当前 {{ theme }}）
      </button>
    </div>
    <main class="main">
      <router-view />
      <div id="micro-container-vue" v-show="isVueActive" class="micro-container"></div>
      <div id="micro-container-react" v-show="isReactActive" class="micro-container"></div>
    </main>
  </div>
</template>

<style>
.nav { display: flex; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #ddd; }
.nav a { color: #333; text-decoration: none; }
.nav a.nav-active { color: #42b883; font-weight: bold; }
.toolbar { display: flex; gap: 8px; align-items: center; padding: 8px 16px; }
.user { margin: 0 4px; }

/* 主题色通过 CSS 变量下发：子应用用它即可跟着变色 */
.layout { --brand-color: #42b883; }
.layout[data-theme='blue'] { --brand-color: #3b82f6; }

.main { padding: 16px; }
.micro-container { min-height: 200px; }
</style>