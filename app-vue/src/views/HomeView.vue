<script setup lang="ts">
const title = "Hello from app-vue"
</script>

<template>
    <div class="home">
        <h1>{{ title }}</h1>
        <router-link to="/list">去列表页</router-link>
    </div>
</template>