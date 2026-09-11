<script setup lang="ts">
// window.__LEAK_ = 'vue-app';
const title = "Hello from app-vue"
</script>

<template>
    <div class="home">
        <h1>{{ title }}</h1>
        <router-link to="/list">去列表页</router-link>
    </div>
</template>

<style scoped>
/* 实验 2 状态：加了 scoped，只命中本组件模板里的 div（带 data-v-* 属性），不会串到别的应用 */
div {
  background: #ffe6e6;
  outline: 1px solid #e11d48;
}
</style>