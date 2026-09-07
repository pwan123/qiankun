<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
    <div class="detail">
        <h1>详情页</h1>
        <p>当前 id: {{ route.params.id }}</p>
        <router-link to="/list">返回列表</router-link>
    </div>
</template>