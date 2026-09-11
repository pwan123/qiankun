<script setup lang="ts">
import { globalState, actions } from './micro-global'
import { computed } from 'vue'

const userName = computed(() => globalState.user)
const theme = computed(() => globalState.theme)

function logout() {
  // 反向操作：主应用是唯一写入方，这里只是"申请变更"——仍走 setGlobalState
  actions.setGlobalState?.({ user: '' })
}

</script>

<template>
  <div class="app-vue" :style="{ '--brand-color': theme === 'blue' ? '#3b82f6' : '#42b883' }">
    <header class="vue-header">
      <span v-if="userName">app-vue 页头：你好，{{ userName }}</span>
      <span v-else>app-vue（未登录）</span>
      <button v-if="userName" @click="logout">退出</button>
    </header>
    <router-view />
  </div>
</template>

<style>
.app-vue { font-family: inherit; }
.vue-header { display: flex; gap: 8px; align-items: center; padding: 8px; background: color-mix(in srgb, var(--brand-color) 15%, white); }
</style>