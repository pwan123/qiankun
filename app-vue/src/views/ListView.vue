<script setup lang="ts">
const items = [
    { id: 1, name: 'Vue 子应用列表项 1' },
    { id: 2, name: 'Vue 子应用列表项 2' }, 
]
</script>

<template>
    <div class="list">
        <h1>列表页</h1>
        <ul>
            <li v-for="item in items" :key="item.id">
                <router-link :to="`/detail/${item.id}`">{{ item.name }}</router-link>
            </li>
        </ul>
    </div>
</template>