# 第 5 章 · 主应用挂载 Vue 子应用（app-vue）—— 详细操作步骤

> 环境：Windows + PowerShell + Vite 8 / Vue 3.5 + vue-router 4 / qiankun 2。
> 本文档把任务拆成「先子应用 → 再基座 → 最后联调观察时序」三步走，每条命令、每个文件都给了**在哪个目录执行 / 覆盖哪个文件**，照做即可。
> ⚠️ 与仓库既有文档的关系：`docs/qiankun-微前端实施操作手册.md` 的 **Phase 1** 与本任务等价（差异仅在页面数量）。**请只按其中一份执行**，不要两套代码混着贴，否则会出现页面/路由不一致。本文档按任务清单组织，推荐照本文档做。

---

## 0. 动手前：现状核对与准备

### 0.1 项目现状（2026-09-07 实测，先核对）

| 项目 | 已就绪 | 本次要做的 |
| --- | --- | --- |
| `app-vue` | `vite-plugin-qiankun@1.0.15` 已在 devDependencies（精确版本=已锁定）；`vue-router` 已装；vite.config.ts 已配端口 8081 / `cors` | 启用插件、改 `main.ts`、建页面与路由、清理脚手架 |
| `main-app` | `qiankun@^2.10.16` 已装；`vue-router` 已装；vite.config.ts 已配端口 8080 / `cors` | 建 `micro/`、建路由/页面、改布局与 `main.ts`、清理脚手架 |

一句话：**依赖与端口都已就绪，剩下的全是代码改造。**

### 0.2 需要打开的终端

共 2 个，都保持常开（启动时机见 §3.1）：

```powershell
# 终端 1
cd d:\study\qiankun\app-vue
# 终端 2
cd d:\study\qiankun\main-app
```

### 0.3 本次涉及的文件清单（先有个全貌）

**app-vue 侧**
| 操作 | 文件 |
| --- | --- |
| 覆盖 | `app-vue/vite.config.ts` |
| 新建 | `app-vue/src/views/HomeView.vue`、`app-vue/src/views/ChildView.vue` |
| 新建 | `app-vue/src/router/index.ts` |
| 覆盖 | `app-vue/src/main.ts`、`app-vue/src/App.vue`、`app-vue/src/style.css` |
| 删除 | `app-vue/src/components/HelloWorld.vue` |

**main-app 侧**
| 操作 | 文件 |
| --- | --- |
| 新建 | `main-app/src/micro/apps.ts`、`main-app/src/micro/index.ts` |
| 新建 | `main-app/src/views/HomeView.vue`、`main-app/src/views/MicroSlot.vue` |
| 新建 | `main-app/src/router/index.ts` |
| 覆盖 | `main-app/src/App.vue`、`main-app/src/main.ts`、`main-app/src/style.css` |
| 删除 | `main-app/src/components/HelloWorld.vue` |

> 代码块开头标注 `【新建】`/`【整体覆盖】`：覆盖 = 用该内容整体替换原文件，不要只插一段。

---

## 1. 子应用侧：改造 app-vue

### 1.1 确认/锁定 vite-plugin-qiankun 版本

在 **app-vue 目录**执行，先确认已装的精确版本：

```powershell
cd d:\study\qiankun\app-vue
npm ls vite-plugin-qiankun
```

预期输出里应能看到 `vite-plugin-qiankun@1.0.15`。

- 已装且是精确版本（package.json 里不带 `^`）→ 版本已锁定，直接进 1.2；
- 若未装，安装并**锁定精确版本**（`--save-exact` 会去掉 `^`）：

```powershell
npm i -D vite-plugin-qiankun@1.0.15 --save-exact
```

顺带记录插件最近一次发布时间（写进 app-vue 的 README，供以后判断是否停更）：

```powershell
npm view vite-plugin-qiankun time --json
```

### 1.2 vite.config.ts：启用插件（base 本阶段不动）

`app-vue/vite.config.ts` 【整体覆盖】：

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

// 应用名：必须与基座 main-app/src/micro/apps.ts 里注册的 name 完全一致
const MICRO_APP_NAME = 'app-vue'

export default defineConfig({
  plugins: [
    vue(),
    // useDevMode: true —— dev 阶段以"源码模块"方式被 qiankun 加载（联调必需）
    qiankun(MICRO_APP_NAME, { useDevMode: true }),
  ],
  server: {
    port: 8081,
    strictPort: true, // 端口被占用直接报错，避免静默换端口导致基座注册地址失效
    cors: true, // qiankun 跨域 fetch 子应用 HTML/资源必需
  },
  // ⚠️ base：第 5 章保持默认 '/'，故意不写该字段；
  //    子应用的"地址形态/构建 base"留到第 6 章统一处理。
})
```

要点：端口 8081、`cors: true` 本来就是现成的，这步**只是加插件**，不要误删。

### 1.3 新建业务页面 + 子页面（供后续章节验证子路由）

业务页面 `app-vue/src/views/HomeView.vue` 【新建】：

```vue
<script setup lang="ts">
const title = 'app-vue 业务首页'
</script>

<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <p>我是 Vue 子应用的业务页面（子应用内根路由 /）。</p>
    <router-link to="/child">进入子页面</router-link>
  </div>
</template>
```

子页面 `app-vue/src/views/ChildView.vue` 【新建】：

```vue
<script setup lang="ts">
const text = 'app-vue 子页面'
</script>

<template>
  <div class="child">
    <h1>{{ text }}</h1>
    <p>我是子应用内部二级路由页面，完整地址形态为 /vue/child。</p>
    <router-link to="/">返回业务首页</router-link>
  </div>
</template>
```

### 1.4 新建子应用路由

`app-vue/src/router/index.ts` 【新建】：

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // base = '/vue'：与基座注册表 activeRule 前缀一致。
  // 效果：独立访问 http://localhost:8081/vue 可打开；
  //       被托管时子应用内部跳转也落在 /vue 前缀下，不会跳出子应用。
  // 注意：这是"路由层"的 base；vite 配置层的 base 留到第 6 章统一。
  history: createWebHistory('/vue'),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/child', name: 'child', component: () => import('../views/ChildView.vue') },
  ],
})

export default router
```

### 1.5 main.ts：导出 bootstrap / mount / unmount（核心改造）

`app-vue/src/main.ts` 【整体覆盖】：

```ts
import { createApp, type App as VueApp } from 'vue'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import router from './router'
import './style.css'

let vueApp: VueApp | null = null

function render(props: { container?: HTMLElement | null } = {}) {
  const { container } = props
  // 被 qiankun 托管时：container 是基座传入的挂载容器，取它内部的 #app 子节点
  // 独立运行时：container 为空 → 直接挂到自身 index.html 的 #app
  const mountEl = (container?.querySelector('#app') as HTMLElement | null) ?? '#app'
  vueApp = createApp(App)
  vueApp.use(router)
  vueApp.mount(mountEl)
}

// 被 qiankun 托管时，插件把这三个生命周期导出给基座调用
renderWithQiankun({
  bootstrap() {
    // 子应用第一次被激活前执行（只执行一次）
    console.log('[app-vue] bootstrap')
  },
  mount(props) {
    // 每次进入子应用都会执行
    console.log('[app-vue] mount')
    render(props as { container?: HTMLElement | null })
  },
  unmount() {
    // 每次切离子应用都会执行
    console.log('[app-vue] unmount')
    vueApp?.unmount()
    vueApp = null
  },
})

// 独立运行时：qiankun 沙箱没有注入 __POWERED_BY_QIANKUN__ → 自己挂载
// 关键点：被托管时不走这里，避免出现"双实例 / already mounted"
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
```

> 三个生命周期函数里的 `console.log` 就是任务要求的「时序观察日志」，§3.3 会用到，不要删。
> 若你想改用原生 `window.__POWERED_BY_QIANKUN__` 判断，需另建 `src/qiankun.d.ts` 给 `window` 补全局类型声明；用 `qiankunWindow`（插件自带类型）则不需要。

### 1.6 App.vue：改成极简壳（只留路由出口）

`app-vue/src/App.vue` 【整体覆盖】：

```vue
<template>
  <router-view />
</template>
```

### 1.7 清理脚手架残留

1. 删除 `app-vue/src/components/HelloWorld.vue`（它引用了 assets 图片与模板样式，不删会报找不到模块或残留样式）；
2. `app-vue/src/style.css` 【整体覆盖】成最小样式（原模板 CSS 里的 `#app` 定宽/hero 样式会干扰子应用布局）：

```css
body {
  margin: 0;
  font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
}
```

### 1.8 子应用侧自测（先跑通再改基座）

```powershell
cd d:\study\qiankun\app-vue
npm run dev
```

浏览器打开 **http://localhost:8081/vue**：

- 应看到「app-vue 业务首页」，URL 自动落在 `/vue`；
- 点「进入子页面」→ URL 变 `/vue/child`，出现「app-vue 子页面」；点「返回」正常回首页。

> 注意：因为 router `base='/vue'`，直接访问 `http://localhost:8081/` 空白是**正常现象**（路径不在 base 内），独立访问一律用 `/vue`。

**通过后进入第 2 部分。**

---

## 2. 基座侧：改造 main-app

### 2.1 确认 qiankun 已安装

在 **main-app 目录**执行：

```powershell
cd d:\study\qiankun\main-app
npm ls qiankun
```

预期出现 `qiankun@2.10.16`。若未装：

```powershell
npm i qiankun@^2.10.16
```

### 2.2 新建 micro/apps.ts（应用注册表）

`main-app/src/micro/apps.ts` 【新建】：

```ts
export interface MicroAppItem {
  name: string
  entry: string
  container: string
  activeRule: string
}

// 应用注册表：qiankun 的"路由表"。
// name        必须与子应用内部配置的应用名（vite.config 里的 MICRO_APP_NAME）一致
// entry       子应用 HTML 入口地址
// container   子应用挂载进的 DOM 容器选择器（该容器必须真实存在于 DOM）
// activeRule  激活规则（路径前缀，命中即激活该子应用）
// 第 5 章只注册 app-vue；后续章节在此数组追加 app-react
export const microApps: MicroAppItem[] = [
  {
    name: 'app-vue',
    entry: '//localhost:8081',
    container: '#micro-container-vue',
    activeRule: '/vue',
  },
]
```

### 2.3 新建 micro/index.ts（注册 + 启动）

`main-app/src/micro/index.ts` 【新建】：

```ts
import { registerMicroApps, start } from 'qiankun'
import { microApps } from './apps'

export function microInit() {
  // 注册子应用；第二个参数是基座侧生命周期钩子，打日志方便对照子应用日志看调度时序
  registerMicroApps(microApps, {
    beforeLoad: [(app) => console.log(`[qiankun] beforeLoad: ${app.name}`)],
    beforeMount: [(app) => console.log(`[qiankun] beforeMount: ${app.name}`)],
    afterMount: [(app) => console.log(`[qiankun] afterMount: ${app.name}`)],
    afterUnmount: [(app) => console.log(`[qiankun] afterUnmount: ${app.name}`)],
  })

  start()
}
```

### 2.4 基座路由：/vue/:pathMatch(.*)* 挂载容器页（防 404）

`main-app/src/router/index.ts` 【新建】：

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/HomeView.vue') },
    // /vue 前缀由 qiankun 接管：
    // 主路由只负责"占位不 404"，真实内容渲染在 App.vue 布局里常驻的 #micro-container-vue 中
    {
      path: '/vue/:pathMatch(.*)*',
      name: 'vue-micro',
      component: () => import('../views/MicroSlot.vue'),
    },
  ],
})

export default router
```

> 为什么必须加这条：若不加，从 8080 访问 `/vue`、`/vue/child` 会直接落到主应用路由匹配不到的 404。

### 2.5 基座页面：HomeView.vue + MicroSlot.vue

`main-app/src/views/HomeView.vue` 【新建】：

```vue
<template>
  <div class="home">
    <h1>主应用首页</h1>
    <p>当前是基座 main-app 自身页面（/home），上面的导航可以切换到 Vue 子应用。</p>
  </div>
</template>
```

`main-app/src/views/MicroSlot.vue` 【新建】（子应用占位空壳）：

```vue
<template>
  <!-- 子应用真实内容渲染在 App.vue 布局的常驻容器 #micro-container-vue 中，这里保持空壳即可 -->
  <div class="micro-slot"></div>
</template>
```

### 2.6 App.vue：布局加导航 + 常驻子应用容器

`main-app/src/App.vue` 【整体覆盖】：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isVueActive = computed(() => route.path.startsWith('/vue'))
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <router-link to="/home">首页</router-link>
      <router-link to="/vue">Vue 子应用</router-link>
    </nav>

    <main class="main">
      <!-- 基座自身页面 -->
      <router-view />

      <!-- 子应用挂载容器【必须常驻 DOM】：
           qiankun 激活时从这里找挂载点。用 v-show 控制显隐，
           不要用 v-if —— v-if 会销毁容器，导致切回时找不到挂载点报错 -->
      <div id="micro-container-vue" v-show="isVueActive" class="micro-container"></div>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
}
.layout {
  min-height: 100vh;
}
.nav {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
}
.nav a {
  color: #333;
  text-decoration: none;
}
.nav a.router-link-active {
  color: #42b883;
  font-weight: bold;
}
.main {
  padding: 16px;
}
.micro-container {
  min-height: 200px;
  border: 1px dashed #ccc;
  padding: 8px;
}
</style>
```

### 2.7 main.ts：接路由 + 启动 qiankun

`main-app/src/main.ts` 【整体覆盖】：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { microInit } from './micro'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 必须先 mount 再 microInit：
// 保证 App.vue 布局里的 #micro-container-vue 已在 DOM 中，qiankun 注册的容器才能被找到
microInit()
```

### 2.8 清理脚手架残留

1. 删除 `main-app/src/components/HelloWorld.vue`；
2. `main-app/src/style.css` 【整体覆盖】成最小样式（原模板 CSS 里的 `#app` 定宽样式会干扰基座布局）：

```css
body {
  margin: 0;
  font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
}
```

---

## 3. 联调验证：观察生命周期时序

### 3.1 启动两个终端

```powershell
# 终端 1：子应用（先启动更稳）
cd d:\study\qiankun\app-vue;   npm run dev   # http://localhost:8081

# 终端 2：基座
cd d:\study\qiankun\main-app;  npm run dev   # http://localhost:8080
```

> 改过 `main.ts` / `vite.config.ts` 后 Vite 会自动重启；若没生效，手动 Ctrl+C 再 `npm run dev` 一次。

### 3.2 操作步骤与预期（逐步打勾）

| # | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开 http://localhost:8080 | 出现基座布局：导航「首页 / Vue 子应用」，默认进 `/home` 主应用首页 |
| 2 | 点「首页」 | 基座自身页面正常（纯基座路由，未触碰子应用） |
| 3 | 点「Vue 子应用」 | URL 变 `http://localhost:8080/vue`，虚线容器内出现「app-vue 业务首页」 |
| 4 | 首次进入时开 Console | 见 §3.3 的 `bootstrap → mount` 时序日志 |
| 5 | 在子应用内点「进入子页面」 | URL 变 `/vue/child`，容器内切换成「app-vue 子页面」（**子路由验证**） |
| 6 | 点导航「首页」切走 | Console 出现 `unmount`；Elements 面板中 `#micro-container-vue` 内容被清空 |
| 7 | 再点「Vue 子应用」切回 | **只出现 `mount`，不再出现 `bootstrap`** |
| 8 | 独立打开 http://localhost:8081/vue | 子应用仍可单独使用，业务页/子页面可互跳 |

### 3.3 预期控制台日志与时序解释

首次点「Vue 子应用」，Console 大致按此顺序出现（前缀区分来源）：

```
[app-vue] bootstrap        ← 子应用首次被激活前，只执行这一次
[qiankun] beforeLoad       ← 基座开始加载子应用
[qiankun] beforeMount      ← 基座准备挂载
[app-vue] mount            ← 子应用自己挂载（render + app.mount）
[qiankun] afterMount       ← 基座确认挂载完成
```

切走（点「首页」）：

```
[qiankun] afterUnmount
[app-vue] unmount          ← 子应用调用 app.unmount() 清理实例
```

切回：「`[app-vue] mount`」+ 基座钩子再次出现，但 **`bootstrap` 不再出现**。

记忆锚点：

| 生命周期 | 调用时机 | 责任 |
| --- | --- | --- |
| `bootstrap` | 子应用**首次**被激活前（一次） | 只做一次性初始化 |
| `mount` | **每次**进入子应用 | 创建 app 实例并挂载 |
| `unmount` | **每次**切离子应用 | `app.unmount()` 卸载实例、置空引用 |

### 3.4 常见报错排查

| 现象 | 原因与处理 |
| --- | --- |
| 点「Vue 子应用」容器空白，Console 报 `Application died in status LOADING_SOURCE_CODE` | 子应用入口没走插件导出：检查 app-vue 的 `main.ts` 是否调了 `renderWithQiankun(...)`；**改完必须重启 app-vue 的 dev server** |
| 报 `container '#micro-container-vue' not found` | 容器不在 DOM：确认 `App.vue` 里有该 div 且未被 `v-if` 包裹；确认 `main.ts` 里 `microInit()` 在 `app.mount('#app')` **之后**调用 |
| Console 报跨域 / fetch 失败 | app-vue 的 vite.config.ts 漏了 `cors: true`，或端口与 apps.ts 的 `entry` 不一致（应为 8081） |
| 页面出现两份 Vue / 报 "already mounted" | 独立运行时也调了 `render()`：检查 `if (!qiankunWindow.__POWERED_BY_QIANKUN__)` 判断是否写对 |
| 子应用页面有样式但布局怪 | 脚手架残留 `style.css` 没精简（模板 `#app` 定宽等），按 §1.7 覆盖最小样式 |
| 访问 8081/ 是白屏 | 正常现象：router `base='/vue'`，独立访问请用 `http://localhost:8081/vue` |

### 3.5 第 5 章验收清单

- [ ] 从 8080 点「Vue 子应用」，容器内出现 app-vue 业务首页；
- [ ] 控制台首次依次出现 `bootstrap → mount`，切走再切回**只有 `mount`**；
- [ ] 切走后 Elements 里 `#micro-container-vue` 内容被卸载清空；
- [ ] 子应用内 `/vue/child` 子页面可跳转、可返回（为后续章节的子路由验证打底）；
- [ ] 子应用仍可独立访问 `http://localhost:8081/vue` 正常使用。

---

## 4. 收尾（可选）：git 提交

在**根目录**执行（若还没 `git init`，先按《实施操作手册》Phase 0 初始化并补 `.gitignore`）：

```powershell
cd d:\study\qiankun
git add -A
git commit -m "feat: 第5章 - 基座挂载 app-vue（vite-plugin-qiankun）"
```
