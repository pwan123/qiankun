# Qiankun 微前端学习项目 · 实施操作手册

> 本手册是《qiankun-微前端学习项目设计文档.md》的**配套执行手册**：把设计文档里"做什么"细化为"打开哪个文件、粘贴什么代码、执行哪条命令、看到什么算过"。
> 环境：Windows + PowerShell + Vite 8 / Vue 3.5 / React 19 / Webpack 5。

## 0. 怎么用这本手册

### 0.1 两个文档的分工

| 文档 | 作用 | 何时看 |
| --- | --- | --- |
| 设计文档 | 讲清"为什么这么设计"（架构、机制、取舍） | 动手前/卡住时补充心智模型 |
| 本操作手册 | 告诉你"每一步具体怎么操作" | 照着做、逐条打勾 |

### 0.2 项目当前进度基线（2026-09 实测）

动手前先核对，**确认你站在哪一步**：

| 项目 | 现状 | 结论 |
| --- | --- | --- |
| 根目录 | 无 `git init`、无根 `.gitignore`、无 `deploy/` | Phase 0 未收尾 |
| `main-app` | Vue3+Vite 脚手架；端口 8080+cors 已配；**无 vue-router / qiankun / router / micro 目录** | Phase 1 全部待做 |
| `app-vue` | Vue3+Vite 脚手架；端口 8081+cors 已配；**无 vue-router / vite-plugin-qiankun** | Phase 1 全部待做 |
| `app-react` | 手动 Webpack5 工程，8082 可跑通；**无 react-router-dom、无 UMD、无生命周期** | Phase 2 待做 |
| 文档 | `docs/` 下仅设计文档 | — |

一句话：**三端"能独立跑"≈ 完成，接下来从「Phase 0 收尾」→「Phase 1」开始**。

### 0.3 通用约定

- 每条命令都在**对应应用自己的目录**下执行（如 `cd d:\study\qiankun\app-vue`），根目录命令除外；
- 需要三个终端：分别跑 `main-app`(8080)、`app-vue`(8081)、`app-react`(8082) 的 `npm run dev`，**本文所有验证都假设三个 dev server 同时在跑**；
- 每个 Phase 完成后按第 0.4 节打一次 git 提交，方便出错回退；
- 代码块标注文件路径的，表示「用该内容整体覆盖该文件」；只给片段的是「在现有文件里插入/替换」；
- Windows PowerShell 里 `npm i -D @babel/core` 这类 `@` 开头的包名要加**双引号**（`npm i -D "@babel/core"`）。

### 0.4 版本决策（对应设计文档第 8 章开放决策点）

| # | 决策 | 本手册采用的默认 |
| --- | --- | --- |
| 1 | app-vue 接入插件 | 用 `vite-plugin-qiankun`（tengmaoqing 原版）。**实施第一步执行 2.1 节锁定版本**，若发现该包长期停更，换活跃 fork 后仅需改 `app-vue/vite.config.ts` 与 `src/main.ts` 两处（API 兼容）。 |
| 2 | app-react 手动 Webpack | 已采用（现状就是手动工程） |
| 3 | TS 范围 | 两 Vue 应用用 TS（模板默认）；app-react 用 JSX |
| 4 | 通信场景 | 登录用户 + 主题色（Phase 5） |
| 5 | git 提交 | 每 Phase 一提交 |
| 6 | 任务卡 | 本手册即任务卡 |

> ⚠️ **已记录的偏差**：设计文档原规划 app-react 用 React 18，当前工程实际装了 **React 19.2**（`^19.2.8`）。React 19 的 `createRoot`/`root.unmount()` API 与 18 一致，不影响 UMD 接入，本手册**按 React 19 编写**，无需降级。

---

## Phase 0 · 收尾：把三端固化成"干净基线"

> 现状已满足的部分（跳过）：三端已建、端口 8080/8081/8082 已配、cors 已开、app-react 的 webpack+babel 链已通。
> 本节只做**还没做的 4 件事**。

### 0.0 打开三个终端确认基线

在三个终端分别启动，三端都能独立访问即为基线 OK：

```powershell
# 终端 1
cd d:\study\qiankun\main-app; npm run dev   # http://localhost:8080
# 终端 2
cd d:\study\qiankun\app-vue;   npm run dev   # http://localhost:8081
# 终端 3
cd d:\study\qiankun\app-react; npm run dev   # http://localhost:8082
```

浏览器分别打开 8080 / 8081 / 8082，均能出页面即通过。

### 0.1 根目录 git 初始化 + .gitignore

在**根目录** `d:\study\qiankun` 执行：

```powershell
git init
```

新建根目录文件 `d:\study\qiankun\.gitignore`，内容：

```gitignore
# 依赖与构建产物
node_modules/
dist/
deploy/html/

# 环境变量（各应用 .env* 均不入库）
.env
.env.*

# 日志与系统文件
*.log
.DS_Store
Thumbs.db
```

提交一次：

```powershell
git add -A
git commit -m "chore: phase 0 - 三端独立工程基线（端口 8080/8081/8082）"
```

> 若还没配置 git 用户信息，先执行一次 `git config --global user.name "你的名字"` 与 `git config --global user.email "你的邮箱"`（只在第一次）。

### 0.2 安装各 Phase 需要的通用依赖（现在就装好）

```powershell
# main-app：路由 + qiankun（基座必需）
cd d:\study\qiankun\main-app
npm i vue-router qiankun

# app-vue：路由 + qiankun 接入插件（先看 2.1 节的版本锁定命令再装）
cd d:\study\qiankun\app-vue
npm i vue-router
npm i -D vite-plugin-qiankun

# app-react：路由（v7，兼容 React 19）
cd d:\study\qiankun\app-react
npm i react-router-dom
```

### 0.3 （可选）清理脚手架残留

两 Vue 应用里 `src/components/HelloWorld.vue`、`src/assets/*` 仅被默认 `App.vue` 引用，Phase 1 会整体重写 `App.vue` 与 `main.ts`，**现在可不清理**，避免白费功夫。

### ✅ Phase 0 验收

- [ ] 三个终端 `npm run dev` 各自出页面；
- [ ] 根目录已 `git init`、`.gitignore` 生效（`git status` 不出现 node_modules）；
- [ ] 三个应用依赖已装齐（`npm ls vue-router` / `npm ls qiankun` / `npm ls react-router-dom` 能查到）；
- [ ] 已打 `phase 0` 提交。

---

## Phase 1 · 最小接入：主应用挂载 app-vue（核心）

> 目标：8080 打开主应用 → 点「Vue 子应用」→ 容器内出现 app-vue 首页，控制台能看到 `bootstrap → mount` 时序日志。
> 全程 4 步：① 锁插件版本 → ② 改 app-vue → ③ 改 main-app → ④ 双端启动验证。

### 1.1 先锁定 vite-plugin-qiankun 版本（设计文档"实施第一步"）

装完 `vite-plugin-qiankun` 后，执行下面命令**记录下它最后一次发布时间与版本**（写进 app-vue 的 README 或本手册）：

```powershell
npm view vite-plugin-qiankun time --json   # 看最近发布时间
npm ls vite-plugin-qiankun                  # 确认装的是哪个版本
```

- 若上次发布在一年以内 → 直接用（本手册代码按此 API 编写）；
- 若长期停更 → `npm i -D vite-plugin-qiankun` 换成活跃 fork（如 `@tiny-codes/vite-plugin-qiankun`），区别只在 vite.config.ts 的 import 名与插件写法，后续步骤遇到编译报错再按该包 README 微调。

### 1.2 改造 app-vue（子应用侧）

#### 文件 1：`app-vue/vite.config.ts`（整体覆盖）

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

// 应用名必须与主应用 apps.ts 里注册的 name 完全一致
const MICRO_APP_NAME = 'app-vue'

export default defineConfig({
  plugins: [
    vue(),
    qiankun(MICRO_APP_NAME, { useDevMode: true }),
  ],
  server: {
    port: 8081,
    strictPort: true,
    cors: true, // qiankun 跨域 fetch 本应用 HTML/JS 必需
  },
})
```

#### 文件 2：新建 `app-vue/src/views/` 下的三个页面

先建 `src/views/HomeView.vue`：

```vue
<script setup lang="ts">
const title = 'Hello from app-vue'
</script>

<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <router-link to="/list">去列表页</router-link>
  </div>
</template>
```

再建 `src/views/ListView.vue`（Phase 3 验证二级路由要用）：

```vue
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
```

再建 `src/views/DetailView.vue`：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="detail">
    <h1>详情页</h1>
    <p>当前 id：{{ route.params.id }}</p>
    <router-link to="/list">返回列表</router-link>
  </div>
</template>
```

#### 文件 3：新建 `app-vue/src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // base = '/vue'：与主应用里 qiankun 的 activeRule 前缀一致（Phase 3 详解）
  // 效果：本应用内 push('/list') 实际 URL 变为 /vue/list
  history: createWebHistory('/vue'),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/list', name: 'list', component: () => import('../views/ListView.vue') },
    { path: '/detail/:id', name: 'detail', component: () => import('../views/DetailView.vue') },
  ],
})

export default router
```

#### 文件 4：新建 `app-vue/src/qiankun.d.ts`（类型声明）

```ts
export {}

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string
  }
}
```

#### 文件 5：`app-vue/src/main.ts`（整体覆盖，核心改造）

```ts
import { createApp, type App as VueApp } from 'vue'
import { createRouter, type Router } from 'vue-router'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import router from './router'
import './style.css'

let app: VueApp | null = null

function render(props: { container?: HTMLElement | null } = {}) {
  const { container } = props
  // 被 qiankun 托管时：挂载点取主应用容器内部的 #app
  // 独立运行时：container 为空，直接挂到自身 index.html 的 #app
  const mountEl = (container?.querySelector('#app') as HTMLElement | null) ?? '#app'
  app = createApp(App)
  app.use(router)
  app.mount(mountEl)
}

// 被 qiankun 托管时，插件把下面三个生命周期导出给主应用调用
renderWithQiankun({
  bootstrap() {
    console.log('[app-vue] bootstrap')
  },
  mount(props) {
    console.log('[app-vue] mount')
    render(props as { container?: HTMLElement | null })
  },
  unmount() {
    console.log('[app-vue] unmount')
    app?.unmount()
    app = null
  },
})

// 独立运行时：qiankun 沙箱没启用，不会注入 __POWERED_BY_QIANKUN__，正常自挂载
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
```

> 注意 `App.vue` 内部默认是 `<HelloWorld />` 脚手架，**无需改模板结构**，但要删掉对 HelloWorld 的引用（见文件 6），否则报"找不到 HelloWorld"或样式残留。

#### 文件 6：`app-vue/src/App.vue`（覆盖成极简壳，挂 router-view）

```vue
<script setup lang="ts">
</script>

<template>
  <router-view />
</template>

<style>
/* 保留少量全局样式即可，子应用样式规范见 Phase 4 */
</style>
```

> 同时删除脚手架残留文件：`src/components/HelloWorld.vue`、`src/assets/` 下的示例图（可留）。`src/style.css` 若引用了 assets 里的图，一并精简为空或删掉 import。

**app-vue 侧改造完毕。先自测一次**：`npm run dev` 后浏览器访问 **http://localhost:8081/vue**，应自动进首页（显示 "Hello from app-vue"）；点「去列表页」URL 变为 `/vue/list`。能跑通再改主应用。

### 1.3 改造 main-app（基座侧）

#### 文件 1：新建 `main-app/src/micro/apps.ts`（应用注册表）

```ts
// 应用注册表：qiankun 的"路由表"。
// name 必须等于子应用内配置的应用名；entry 是子应用 HTML 入口地址；
// container 是子应用挂载进的 DOM 容器（须在 DOM 中真实存在）；
// activeRule 是激活规则（路径前缀）。
export interface MicroAppItem {
  name: string
  entry: string
  container: string
  activeRule: string
  props?: Record<string, unknown>
}

// Phase 1 只注册 app-vue；Phase 2 再追加 app-react
export const microApps: MicroAppItem[] = [
  {
    name: 'app-vue',
    entry: '//localhost:8081',
    container: '#micro-container-vue',
    activeRule: '/vue',
  },
]
```

#### 文件 2：新建 `main-app/src/micro/index.ts`（注册 + 启动）

```ts
import { registerMicroApps, start } from 'qiankun'
import { microApps } from './apps'

export function microInit() {
  registerMicroApps(microApps, {
    beforeLoad: [(app) => console.log('[qiankun] beforeLoad:', app.name)],
    beforeMount: [(app) => console.log('[qiankun] beforeMount:', app.name)],
    afterMount: [(app) => console.log('[qiankun] afterMount:', app.name)],
    afterUnmount: [(app) => console.log('[qiankun] afterUnmount:', app.name)],
  })

  start({
    prefetch: 'all', // 先全部预加载，便于观察；Phase 6 再谈按需
  })
}
```

#### 文件 3：新建 `main-app/src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'home', component: () => import('../views/HomeView.vue') },
    // /vue、/react 前缀由 qiankun 接管：
    // 主路由只负责"占位不 404"，真实内容渲染在布局中常驻的容器 div 里
    { path: '/vue/:pathMatch(.*)*', component: () => import('../views/MicroSlot.vue') },
    { path: '/react/:pathMatch(.*)*', component: () => import('../views/MicroSlot.vue') },
  ],
})

export default router
```

#### 文件 4：新建 `main-app/src/views/HomeView.vue`

```vue
<script setup lang="ts">
</script>

<template>
  <div class="home">
    <h1>主应用首页</h1>
    <p>当前是 main-app（基座）自身页面。</p>
  </div>
</template>
```

#### 文件 5：新建 `main-app/src/views/MicroSlot.vue`（子应用占位视图）

```vue
<template>
  <!-- 子应用实际内容渲染在 App.vue 布局里的容器 div 中，这里保持空壳 -->
  <div class="micro-slot"></div>
</template>
```

#### 文件 6：`main-app/src/App.vue`（整体覆盖：导航 + 常驻双容器）

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isVueActive = computed(() => route.path.startsWith('/vue'))
const isReactActive = computed(() => route.path.startsWith('/react'))
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <router-link to="/home">首页</router-link>
      <router-link to="/vue">Vue 子应用</router-link>
      <router-link to="/react">React 子应用</router-link>
    </nav>

    <main class="main">
      <!-- 主应用自身页面 -->
      <router-view />
      <!-- 两个子应用容器【常驻 DOM】：qiankun 注册时容器必须已存在，
           否则激活子应用时找不到挂载点会报错。用 v-show 而非 v-if 控制显隐 -->
      <div id="micro-container-vue" v-show="isVueActive" class="micro-container"></div>
      <div id="micro-container-react" v-show="isReactActive" class="micro-container"></div>
    </main>
  </div>
</template>

<style>
.nav { display: flex; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #ddd; }
.nav a { color: #333; text-decoration: none; }
.nav a.router-link-active { color: #42b883; font-weight: bold; }
.main { padding: 16px; }
.micro-container { min-height: 200px; }
</style>
```

#### 文件 7：`main-app/src/main.ts`（整体覆盖）

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { microInit } from './micro'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 根组件同步渲染完成后，布局里的子应用容器已存在于 DOM，
// 此时注册并启动 qiankun 才能保证 container 可被找到
microInit()
```

> 若此时删除脚手架残留文件（HelloWorld 等），同时把 `main-app/src/style.css` 精简掉对 assets 的引用。

### 1.4 启动顺序与验证

先确保 app-vue(8081) 与 main-app(8080) 两个终端都在 `npm run dev`。然后：

1. 浏览器打开 **http://localhost:8080** → 看到主应用导航；
2. 点「首页」→ 主应用自身页面正常；
3. 点「Vue 子应用」→ URL 变 `http://localhost:8080/vue` → **主应用内容区内出现 app-vue 首页**；
4. 打开 DevTools Console，首次进入应依次看到：`[app-vue] bootstrap` → `[app-vue] mount`，以及 `[qiankun] beforeMount/afterMount` 日志；
5. 点导航「首页」切走 → Console 出现 `[app-vue] unmount`，Elements 面板里 `#micro-container-vue` 变为空；
6. 再点「Vue 子应用」切回 → **只出现 `mount`（不会再 bootstrap）**；
7. 独立打开 **http://localhost:8081/vue** 仍可单独使用。

### 1.5 常见报错排查表

| 现象 | 原因与处理 |
| --- | --- |
| 点「Vue 子应用」后容器空白、Console 报 `Application died in status LOADING_SOURCE_CODE` | 最常见：子应用入口没走插件导出。检查 app-vue 是否 `renderWithQiankun(...)`、`main.ts` 是否被正确打包（改完必须重启 app-vue 的 dev server） |
| 报 `container '#micro-container-vue' not found` | 容器不在 DOM。确认 App.vue 中该 div 存在且非 `v-if` 包裹；`microInit()` 在 `mount` 之后调用 |
| Console 报跨域 / fetch 失败 | app-vue 的 `vite.config.ts` 漏了 `cors: true`，或端口与 apps.ts 的 `entry` 不一致 |
| 页面出现两次 Vue 应用 / "already mounted" | 独立运行时也调了 `render()`。检查 `if (!qiankunWindow.__POWERED_BY_QIANKUN__)` 是否写对 |
| app-vue 页面出来了但没样式/白屏 | dev 模式偶发插件与 Vite 版本兼容问题 → 看插件 README 的 Vite 版本要求；或把 `useDevMode` 关掉对比 |

### ✅ Phase 1 验收

- [ ] 从 8080 点「Vue 子应用」，容器内出现 app-vue 首页；
- [ ] Console 首次 `bootstrap → mount`，切走切回只有 `mount`；
- [ ] 切走后 `#micro-container-vue` 内 DOM 被卸载；
- [ ] 独立访问 8081/vue 正常；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 1 - 基座挂载 app-vue（vite-plugin-qiankun）"`

---

## Phase 2 · 接入 app-react（Webpack-UMD 官方形态）

> 目标：主应用可在 Vue / React 两个子应用间切换；同时看懂「UMD 打包配置 ↔ qiankun 加载协议」的关系。
> app-react 当前是**普通 Webpack 工程**（8082 可独立跑），本节只改 3 类文件：`webpack.config.js`、`src/index.js`、新增路由。

### 2.1 改造 app-react（子应用侧）

#### 文件 1：`app-react/webpack.config.js`（整体覆盖）

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        clean: true,
        // ===== qiankun UMD 协议四件套（本 Phase 新增）=====
        library: 'appReact',      // 全局变量名，qiankun 从 window.appReact 上拿生命周期
        libraryTarget: 'umd',     // 打包成 UMD：能同时兼容 全局变量/CommonJS/AMD
        globalObject: 'window',   // 关键：让 UMD 代码在沙箱里取 window 而不是 globalThis
        chunkLoadingGlobal: 'webpackJsonp_app_react', // webpack5 版 jsonpFunction，多应用防冲突
        // ==============================================
    },
    module: {
        rules: [
            { test: /\.(js|jsx)$/, exclude: /node_modules/, use: 'babel-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        // 该 HTML 只服务于"独立运行"；被 qiankun 托管时真正执行的是它引用的 UMD JS
        new HtmlWebpackPlugin({ template: './index.html' }),
    ],
    devServer: {
        port: 8082,
        open: true,
        hot: true,
        historyApiFallback: true, // 子应用二级路由刷新兜底（Phase 3 验证）
        // ===== 本 Phase 新增：允许主应用(8080)跨域 fetch 本应用 =====
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        // ==========================================================
    },
};
```

> **停一下，理解这 4 行**：webpack 打包入口 `src/index.js` 时，若该文件 `export` 了 `bootstrap/mount/unmount`，UMD 会把它们挂到 `window.appReact`。qiankun 加载这个 UMD 后，从 `window['appReact']` 读生命周期调用——这就是"官方标准接入协议"的全貌。

#### 文件 2：`app-react/src/index.js`（整体覆盖：生命周期 + 路由）

```js
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import List from './views/List';
import Detail from './views/Detail';

let root = null;
let container = null;

function render(props = {}) {
  // props.container 由 qiankun 的 mount 传入（主应用容器）；独立运行时为空
  container = (props.container && props.container.querySelector('#root')) || document.getElementById('root');
  root = createRoot(container);
  root.render(
    // basename='/react'：与主应用 activeRule 前缀一致（Phase 3 详解）。
    // 独立运行时也用它：独立访问走 http://localhost:8082/react/...（dev server 会回退到 index.html）
    <BrowserRouter basename="/react">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/list" element={<List />} />
        <Route path="/detail/:id" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  );
}

// ===== 生命周期三件套：qiankun 只认这三个名字 =====
export async function bootstrap() {
  console.log('[app-react] bootstrap');
}

export async function mount(props) {
  console.log('[app-react] mount');
  render(props);
}

export async function unmount() {
  console.log('[app-react] unmount');
  if (root) {
    root.unmount();
    root = null;
  }
}
// =================================================

// 独立运行时：qiankun 沙箱未启用，window.__POWERED_BY_QIANKUN__ 为 undefined → 自己挂载
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}
```

> `App.jsx` 现内容（`<h1>Hello from app-react</h1>`）会成为路由 `/` 的页面，保留即可；下面补充导航与二级页。

#### 文件 3：新建 `app-react/src/views/List.jsx`

```jsx
import { Link } from 'react-router-dom';

export default function List() {
  const items = [
    { id: 1, name: 'React 子应用列表项 1' },
    { id: 2, name: 'React 子应用列表项 2' },
  ];
  return (
    <div>
      <h1>React 列表页</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/detail/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
      <Link to="/">返回首页</Link>
    </div>
  );
}
```

#### 文件 4：新建 `app-react/src/views/Detail.jsx`

```jsx
import { Link, useParams } from 'react-router-dom';

export default function Detail() {
  const { id } = useParams();
  return (
    <div>
      <h1>React 详情页</h1>
      <p>当前 id：{id}</p>
      <Link to="/list">返回列表</Link>
    </div>
  );
}
```

**先自测 app-react**：`npm run dev` 后访问 **http://localhost:8082/react** → 出现首页；点链接跳 `/react/list`、`/react/detail/1`，F5 刷新不 404。通过后再改主应用。

### 2.2 改造 main-app（追加注册 + 容器）

#### 文件 1：`main-app/src/micro/apps.ts`（数组追加一行）

```ts
export const microApps: MicroAppItem[] = [
  {
    name: 'app-vue',
    entry: '//localhost:8081',
    container: '#micro-container-vue',
    activeRule: '/vue',
  },
  // ===== Phase 2 新增 =====
  {
    name: 'app-react',
    entry: '//localhost:8082',
    container: '#micro-container-react',
    activeRule: '/react',
  },
  // ========================
]
```

> `App.vue` 布局、`router/index.ts`、`views/MicroSlot.vue` 在 Phase 1 已把 `/react` 占位、容器 `#micro-container-react`、导航「React 子应用」全部备好，**此处无需再改**——这就是 Phase 1 按规划搭好双容器的好处。

### 2.3 验证与 Network 观察

三个终端全部在跑（8080/8081/8082）。然后：

1. 8080 打开主应用，依次点「Vue 子应用」「React 子应用」，两边都能渲染并**互不干扰**；
2. React 子应用内点「列表」跳二级路由，URL 保持 `/react/list`；
3. 打开 DevTools → Network 面板，切到 React 子应用，应能看到主应用对 `//localhost:8082/` 发起的 HTML 请求、以及后续的 `main.bundle.js`、`index.html` 资源请求（观察 qiankun 的 HTML Entry 加载过程）；
4. 两个子应用独立访问（8081/vue、8082/react）仍正常。

### 2.4 常见报错排查表

| 现象 | 原因与处理 |
| --- | --- |
| 切到 React 报 `lifecycles does not export necessary lifecyle functions` | 入口没正确导出。确认 webpack `library`/`libraryTarget:'umd'` 已加、`src/index.js` 是**具名导出** `export async function bootstrap/mount/unmount`（不要写成 `export default`） |
| 报 `window is not defined` 或 `global is not defined` | 漏了 `output.globalObject: 'window'`（UMD 在非浏览器上下文取全局变量失败） |
| 页面一片空白且 Console 无错，但子应用 HTML 已加载 | 多为 React 找不到 `#root`：`props.container.querySelector('#root')` 取到 null → 检查容器 id 与 `index.html` 是否一致 |
| 两个子应用来回切，其中 React 偶发重复渲染 | `unmount` 里漏了 `root.unmount()` + `root = null`，排查入口文件 |
| 独立访问 8082 正常，托管后子应用内部资源 404 | dev server 下一般不会出现；若出现，给 `output` 加 `publicPath: '//localhost:8082/'` 再看 |

### ✅ Phase 2 验收

- [ ] 主应用内 Vue / React 双应用来回切换互不干扰；
- [ ] React 子应用二级路由可跳转，URL 形如 `/react/list`；
- [ ] Network 能看到 `//localhost:8082` 的 HTML/JS/CSS 请求；
- [ ] 两个子应用独立访问正常；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 2 - 接入 app-react（UMD）双应用可切换"`

---

## Phase 3 · 路由联动、刷新与激活规则

> 目标：把「URL 由谁控制」这件事彻底搞懂，并让主应用菜单高亮与子应用联动。
> 前提：Phase 1/2 的二级路由页面已在 app-vue、app-react 里写好，本节主要是**实验 + 微调**。

### 3.1 先做 3 个实验，把现象记下来

| # | 操作 | 预期现象（记录到你的笔记） |
| --- | --- | --- |
| 1 | 主应用切到 app-vue，点「去列表页」 | 地址栏变为 `http://localhost:8080/vue/list`，页面切换，**URL 全程只有一个**，没有 iframe 式双地址 |
| 2 | 在 `/vue/list` 直接按 **F5 刷新** | 页面仍在列表页（dev server 的 historyApiFallback/spa fallback 已兜底；部署到 nginx 后要靠 `try_files`，见 Phase 7） |
| 3 | 在 React 子应用的 `/react/detail/2` 按 F5 刷新 | 同上，不 404 |

若 F5 后 404 或回到首页，优先检查两件事：
- app-vue：`src/router/index.ts` 的 `createWebHistory('/vue')` 是否写了 base；
- app-react：`<BrowserRouter basename="/react">` 是否写了 basename。

**结论（背下来）**：子应用的 router base / basename **必须等于**主应用里该子应用的 `activeRule` 前缀。因为子应用在基座眼里是"挂在 `/vue` 前缀下的路由子树"。

### 3.2 主应用菜单高亮联动（在 `/vue/list` 时导航也要高亮「Vue 子应用」）

现在 `App.vue` 用的是 `router-link-active` 自动高亮：它按**完整路径**匹配，子应用内部跳 `/vue/list` 时「Vue 子应用」链接（to="/vue"）**不会高亮**。改成前缀感知的激活类：

修改 `main-app/src/App.vue`：

```vue
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
      <router-link
        v-for="item in navs"
        :key="item.to"
        :to="item.to"
        :class="{ 'nav-active': item.active.value }"
      >{{ item.label }}</router-link>
    </nav>
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
.main { padding: 16px; }
.micro-container { min-height: 200px; }
</style>
```

验证：切到 app-vue 后点「去列表页」，此时地址是 `/vue/list`，导航里「Vue 子应用」应保持高亮。

### 3.3 实验：改 activeRule 观察不匹配行为

临时把 `apps.ts` 里 app-vue 的 `activeRule` 改成 `'/vue-child'`，保存（qiankun 会热重载）：

- 访问 `/vue` → **不会**加载 app-vue（规则不匹配），主页面只剩占位空壳；
- 访问 `/vue-child` → app-vue 加载。

验证完**改回 `/vue`**。这个实验帮你理解：激活规则与子应用内部 router base 是**两套独立配置**，靠"同值"约定协同。

### 3.4 观察加载时序（loader 日志）

qiankun 的 `registerMicroApps` 生命周期钩子已在 Phase 1 埋好（`micro/index.ts` 里 `beforeLoad/beforeMount/afterMount/afterUnmount` 的 console.log）。再对照子应用自身的 bootstrap/mount/unmount 日志，画出一次"进入 → 切走 → 再进入"的完整时序，能回答设计文档 K3。

### ✅ Phase 3 验收

- [ ] 子应用内部前进/后退/刷新全部正常，URL 始终是 `/vue/...`、`/react/...` 形态；
- [ ] 子应用内部跳二级路由时，主应用菜单对应项保持高亮；
- [ ] 能口头解释"为什么 router base 必须等于 activeRule 前缀"；
- [ ] 做完 3.3 实验且把 activeRule 改回 `/vue`；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 3 - 路由联动/菜单高亮/激活规则实验"`

---

## Phase 4 · 沙箱与样式隔离实验

> 目标：亲手制造污染 → 亲眼看到沙箱/隔离生效 → 沉淀样式规范。
> 全程不改业务代码结构，只做**实验 + 记录**。

### 4.1 JS 沙箱实验

**实验 1：全局变量是否泄漏**

1. 编辑 `app-vue/src/views/HomeView.vue`，在 `script setup` 里加一行：`window.__LEAK_ = 'vue-app'`；
2. 主应用切到「Vue 子应用」再切回「首页」；
3. 在主应用 Console 输入 `window.__LEAK_` → 应为 `undefined`（Proxy 沙箱把子应用的写操作留在了自己的上下文里，退出即隔离）。

**实验 2：开关沙箱对比（体会差异）**

1. 修改 `main-app/src/micro/index.ts`，把 `start({ prefetch: 'all' })` 临时改成 `start({ prefetch: 'all', sandbox: false })`；
2. 重复实验 1 → 此时 `window.__LEAK_` 应该是 `'vue-app'`（泄漏了）；
3. **改回默认沙箱**，记录差异结论。

**实验 3：观察沙箱产物**

在主应用切到 app-vue 后，Console 里检查 `window.__POWERED_BY_QIANKUN__`（应为 `true`）——这个标记就是"是否被 qiankun 托管"的运行时判断来源。

### 4.2 CSS 隔离实验

**实验 1：制造污染**

给 `app-vue/src/views/HomeView.vue` 追加一个**非 scoped** 的 `<style>` 块：

```vue
<style>
/* 故意写全局样式：污染基座/其他子应用 */
body { background: #ffe6e6; }
</style>
```

切到「Vue 子应用」再切到「React 子应用」→ 会发现 React 页面背景也是淡红色（样式串了）。

**实验 2：开启样式隔离**

修改 `main-app/src/micro/index.ts` 的 `start`：

```ts
start({
  prefetch: 'all',
  sandbox: { experimentalStyleIsolation: true },
})
```

保存后刷新 8080，切到 React 子应用 → 背景恢复正常；用 Elements 面板选中 app-vue 页面元素，能看到样式选择器被包上了 `div[data-qiankun="app-vue"]` 前缀。

> 前提：子应用挂载容器内**有且仅有一个根节点**，前缀才加得上去（我们的 App.vue 是单根 `<router-view>`，天然满足）。

**实验 3（仅了解）**：`strictStyleIsolation`（shadow DOM）副作用大，阅读设计文档 3.6 即可，不必真开。

**实验完撤销实验 1 的全局样式，并保留 `experimentalStyleIsolation: true` 作为工程默认。**

### 4.3 副作用清理实验

1. 在 app-vue `mount` 生命周期里加一行 `window.setInterval(() => {}, 1000)`，切走再切回，多次后在 Performance 面板 Memory 录制看内存只涨不降；
2. 改成把 interval id 存到模块级变量，`unmount` 里 `clearInterval`，再录一次对比；
3. 结论沉淀：**mount 里开的东西，unmount 里必须清**（含 `onGlobalStateChange` 订阅，Phase 5 会再遇到）。

### 4.4 沉淀样式规范（写进 docs/规范.md）

新建 `docs/规范.md`，内容先写三条（后续 Phase 再补）：

```markdown
# 前端规范（本项目沉淀）

## 样式规范
1. 子应用一律使用局部样式：Vue 用 scoped，React 用 CSS Module；禁止裸写全局样式；
2. 确需全局的主题样式（如 CSS 变量）在基座统一定义下发（见 Phase 5）；
3. 基座已开启 experimentalStyleIsolation，注意子应用根节点唯一。
```

### ✅ Phase 4 验收

- [ ] 能讲清"Proxy 沙箱下写隔离、读共享"并演示开关沙箱的差异；
- [ ] 能演示样式污染与 `experimentalStyleIsolation` 修复；
- [ ] `docs/规范.md` 已建；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 4 - 沙箱与样式隔离实验并沉淀规范"`

---

## Phase 5 · 应用间通信（登录用户 + 主题联动）

> 场景：主应用顶栏输入用户名登录；app-vue 页头显示该用户名并提供「退出」；app-react 显示同一用户名；主题色三端联动（用 CSS 变量体现"样式隔离下共享"）。
> 数据流约定（设计文档 5.6）：**主应用是唯一写入方**（`setGlobalState`），子应用只 `onGlobalStateChange` 订阅 + 通过 `setGlobalState` 触发"登出"这种反向请求。

### 5.1 主应用：封装 actions

新建 `main-app/src/micro/actions.ts`：

```ts
import { initGlobalState, type MicroAppStateActions } from 'qiankun'

// 全局状态：主应用为唯一写入方
const initialState = {
  user: '',          // 当前登录用户
  theme: 'default',  // 主题名（default / blue）
}

// qiankun 内部是全局单例：重复调用 initGlobalState 会复用同一份 state
const actions: MicroAppStateActions = initGlobalState(initialState)

export function getGlobalActions() {
  return actions
}
```

> qiankun 会把 `setGlobalState / onGlobalStateChange` 自动注入每个子应用的 `mount(props)`，**无需手动下传**，子应用在 `props` 上直接拿。

### 5.2 主应用：顶栏登录 UI + 主题切换（改 App.vue）

`main-app/src/App.vue` 整体覆盖为：

```vue
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
```

### 5.3 子应用 app-vue：订阅用户 + 展示 + 退出

**step 1**：新建 `app-vue/src/micro-global.ts`（保存 qiankun 注入的 props，供组件用）：

```ts
import type { MicroAppStateActions } from 'qiankun'
import { reactive } from 'vue'

// 由 qiankun 注入的全局状态（订阅回调里更新）
export const globalState = reactive({
  user: '',
  theme: 'default' as string,
})

// mount(props) 里由 main.ts 赋值
export const actions: { setGlobalState?: MicroAppStateActions['setGlobalState'] } = {}
```

> app-vue 没装 `qiankun` 包时，`import type ... from 'qiankun'` 会编译报错。**不装主依赖的话**，把这行类型换成：`export const actions: { setGlobalState?: (state: Record<string, unknown>) => void } = {}` 即可。

**step 2**：`app-vue/src/main.ts` 里，在 `renderWithQiankun.mount` 中注册订阅（只注册一次，unmount 时取消）：

```ts
import { createApp, type App as VueApp } from 'vue'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import router from './router'
import { globalState, actions } from './micro-global'
import './style.css'

let app: VueApp | null = null
let offGlobalListener: (() => void) | null = null

function render(props: { container?: HTMLElement | null } & Record<string, unknown> = {}) {
  const { container } = props
  const mountEl = (container?.querySelector('#app') as HTMLElement | null) ?? '#app'

  // 保存 setGlobalState，供"退出"这类反向操作使用（第一次进来注册即可）
  const injected = props as { setGlobalState?: typeof actions.setGlobalState }
  actions.setGlobalState = injected.setGlobalState

  app = createApp(App)
  app.use(router)
  app.mount(mountEl)
}

function registerGlobalListener(props: Record<string, unknown>) {
  const injected = props as {
    onGlobalStateChange?: (cb: (s: { user?: string; theme?: string }) => void, fireNow?: boolean) => () => void
  }
  offGlobalListener =
    injected.onGlobalStateChange?.((state) => {
      if (typeof state.user === 'string') globalState.user = state.user
      if (typeof state.theme === 'string') globalState.theme = state.theme
    }, true) ?? null // fireImmediately=true：首次进入就同步当前值
}

renderWithQiankun({
  bootstrap() {},
  mount(props) {
    const p = props as { container?: HTMLElement | null } & Record<string, unknown>
    if (!offGlobalListener) registerGlobalListener(p)
    render(p)
  },
  unmount() {
    offGlobalListener?.()
    offGlobalListener = null
    app?.unmount()
    app = null
  },
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
```

**step 3**：`app-vue/src/App.vue` 显示用户并提供退出：

```vue
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

<style scoped>
.app-vue { font-family: inherit; }
.vue-header { display: flex; gap: 8px; align-items: center; padding: 8px; background: color-mix(in srgb, var(--brand-color) 15%, white); }
</style>
```

### 5.4 子应用 app-react：同样的订阅逻辑

`app-react/src/index.js` 的 `mount`/`unmount` 中接线：

```js
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import App from './App';
import List from './views/List';
import Detail from './views/Detail';

let root = null;
let container = null;
let offListener = null;

// 跨应用共享的用户态：React 侧用模块级 store 模拟（无需额外依赖）
export const globalStore = {
  user: '',
  theme: 'default',
  listeners: new Set(),
  emit() {
    this.listeners.forEach((fn) => fn());
  },
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};

function render(props = {}) {
  container = (props.container && props.container.querySelector('#root')) || document.getElementById('root');
  root = createRoot(container);
  root.render(
    <BrowserRouter basename="/react">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/list" element={<List />} />
        <Route path="/detail/:id" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  );
}

export async function bootstrap() {}

export async function mount(props) {
  // 订阅全局状态（fireImmediately 拉取当前值）
  if (props.onGlobalStateChange && !offListener) {
    offListener = props.onGlobalStateChange((state) => {
      globalStore.user = state.user ?? '';
      globalStore.theme = state.theme ?? 'default';
      globalStore.emit();
    }, true);
  }
  render(props);
}

export async function unmount() {
  if (offListener) { offListener(); offListener = null; }
  if (root) { root.unmount(); root = null; }
}

if (!window.__POWERED_BY_QIANKUN__) {
  render();
}
```

`app-react/src/App.jsx` 展示用户与退出：

```jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { globalStore } from './index';
import { useEffect } from 'react';

export default function App() {
  const [, force] = useState(0);
  useEffect(() => globalStore.subscribe(() => force((n) => n + 1)), []);

  return (
    <div style={{ padding: 8 }}>
      <h1>Hello from app-react (Webpack 5 + UMD)</h1>
      <p>{globalStore.user ? `当前用户：${globalStore.user}` : '（未登录）'}</p>
      <Link to="/list">去列表页</Link>
    </div>
  );
}
```

> 「退出」按钮如需放 React 侧，同样调用 `props.setGlobalState({ user: '' })`（在 `mount` 里把它存到 `globalStore`），参照 app-vue 的做法即可。

### 5.5 验证顺序

1. 8080 顶栏输入用户名登录 → 切到「Vue 子应用」「React 子应用」，两端页头都显示该用户名（证明跨技术栈共享）；
2. 在 app-vue 点「退出」→ 主应用顶栏与 React 端同步清空；
3. 点「切换主题」→ 主应用 `data-theme` 变化，app-vue 页头底色随之变化，且 **React 端不被串样式**；
4. 反复切走/切回子应用几次，Console 无"重复订阅"现象。

### ✅ Phase 5 验收

- [ ] 登录后两个子应用同时显示用户名；
- [ ] 任一子应用登出，三端同步；
- [ ] 主题切换三端联动且样式不互相污染；
- [ ] 规范.md 补上通信命名约定（`域:动作`，如 `auth:logout`）；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 5 - 跨应用通信（用户/主题 globalState）"`

---

## Phase 6 · 工程化演进（demo → 模板）

> 目标：把"能跑的 demo"升级成"敢交付的架子"：地址可配置、加载有反馈、挂了有提示。
> 本 Phase 以 main-app 改动为主。

### 6.1 注册表地址 env 化（去掉硬编码）

**step 1**：新建 `main-app/.env`（Vite 默认载入，dev/build 共用）与 `main-app/.env.development`：

```ini
# main-app/.env            （build 与 dev 均生效，被 .env.development 覆盖同名项）
VITE_MICRO_VUE_ENTRY=http://localhost:8081
VITE_MICRO_REACT_ENTRY=http://localhost:8082
```

```ini
# main-app/.env.development（dev 模式专用；此处与 .env 一致，未来端口分化只改这里）
VITE_MICRO_VUE_ENTRY=http://localhost:8081
VITE_MICRO_REACT_ENTRY=http://localhost:8082
```

> Vite 里 `import.meta.env.VITE_*` 是字符串类型，但需要类型声明才不报 TS 错。若 `src/` 下没有 `vite-env.d.ts`，新建一个：

```ts
/// <reference types="vite/client" />
```

**step 2**：改 `main-app/src/micro/apps.ts` 读环境变量：

```ts
export interface MicroAppItem {
  name: string
  entry: string
  container: string
  activeRule: string
  props?: Record<string, unknown>
}

export function getMicroApps(): MicroAppItem[] {
  const vueEntry = import.meta.env.VITE_MICRO_VUE_ENTRY ?? 'http://localhost:8081'
  const reactEntry = import.meta.env.VITE_MICRO_REACT_ENTRY ?? 'http://localhost:8082'
  return [
    { name: 'app-vue', entry: vueEntry, container: '#micro-container-vue', activeRule: '/vue' },
    { name: 'app-react', entry: reactEntry, container: '#micro-container-react', activeRule: '/react' },
  ]
}
```

**step 3**：同步改 `main-app/src/micro/index.ts`：

```ts
import { addGlobalUncaughtErrorHandler, registerMicroApps, start } from 'qiankun'
import { getMicroApps } from './apps'

export function microInit() {
  registerMicroApps(getMicroApps(), {
    beforeLoad: [(app) => console.log('[qiankun] beforeLoad:', app.name)],
    beforeMount: [(app) => console.log('[qiankun] beforeMount:', app.name)],
    afterMount: [(app) => console.log('[qiankun] afterMount:', app.name)],
    afterUnmount: [(app) => console.log('[qiankun] afterUnmount:', app.name)],
  })

  start({
    prefetch: 'all', // 实验结论：切到子应用几乎没有白屏 → 说明预加载生效
    sandbox: { experimentalStyleIsolation: true }, // Phase 4 沉淀的工程默认
  })

  // 容错：任何子应用加载/运行期异常统一兜底（可接 toast/错误页）
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun] uncaught error:', event.message)
    // 示例：alert(event.message) —— 正式项目接 UI 提示组件
  })
}
```

### 6.2 子应用"独立/托管"双模式说明（本期零改动）

设计文档 5.5 曾规划 `MICRO_MODE` 环境变量切换，结论：**本期统一用运行时判断 `__POWERED_BY_QIANKUN__`**（已在 Phase 1/2 实现），不需要 `.env.micro`。把结论写进根 README，避免后人纠结。

### 6.3 加载体验：loading 骨架（可选项，做就做小的）

在 `main-app/src/views/MicroSlot.vue` 中放一个骨架，子应用未挂载完时给用户反馈：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
// 容器内容由 qiankun 填充；qiankun 的 loader 回调可驱动此状态（此处简化）
const loading = ref(true)
onMounted(() => setTimeout(() => (loading.value = false), 0))
</script>

<template>
  <div class="micro-slot">
    <p v-if="loading" class="loading">子应用加载中…</p>
  </div>
</template>

<style scoped>
.loading { color: #999; }
</style>
```

> 更精确的做法：把 `start({ loader })` 的回调接到一个共享 ref 上控制骨架显隐。qiankun 的 loader 会高频调用（loading 状态反复翻转），示例从简即可。

### 6.4 每应用 README 与规范补全

1. 三个应用各自 README 写明：启动命令、端口、在整体项目中的角色、依赖安装方式；
2. 根目录新建 `README.md`：项目结构图（可抄设计文档 2.3）+ 启动总览 + **踩坑日志**（把 Phase 1–5 遇到的每个坑按"现象 → 原因 → 解决"追加进去）；
3. `docs/规范.md` 追加通信命名约定：

```markdown
## 通信约定
1. 全局状态仅两层：主应用唯一写入方；子应用只读（onGlobalStateChange）；
2. 子应用反向操作一律走 setGlobalState 发起（如登出），不互相直改；
3. 事件/动作命名统一 `域:动作`，如 `auth:logout`、`ui:theme-change`。
```

### 6.5 公共依赖抽取（选学，本期只做结论）

设计文档把"基座统一提供 Vue"列为可选。本期建议**不做代码、只写结论**到根 README：
"子应用自包含依赖换来自主可控；做 externals 抽取可减少重复下载，但引入版本耦合，属双刃剑。demo 阶段保持自包含。"

### ✅ Phase 6 验收

- [ ] 三应用有各自 README；根 README 有启动总览 + 踩坑日志；
- [ ] `apps.ts` 地址全部来自 `.env`（`git grep localhost:808` 不再出现在源码里，除 .env）；
- [ ] 子应用加载有 loading、异常有 `addGlobalUncaughtErrorHandler` 兜底；
- [ ] 规范.md 含样式 + 通信两节；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 6 - env化/loading/容错/文档模板化"`

---

## Phase 7 · 本地 Nginx 部署

> 目标：把三端 `build` 产物交给 nginx 提供，验证**真实服务器**下的 history 刷新、跨域、资源路径。dev server 全停也不影响（除了验证期你想同时对比）。

### 7.1 准备 nginx（Windows）

1. 下载 Windows 版：<http://nginx.org/en/download.html>（选 `nginx/Windows-xxx`）；
2. 解压到无中文路径，如 `D:\nginx-1.27.x`；
3. 常用命令（在该目录下执行）：

```powershell
start nginx      # 启动
nginx -s reload  # 重载配置
nginx -s stop    # 停止
```

验证：浏览器访问 `http://localhost` 出现 "Welcome to nginx!"。Windows 任务管理器里看到两个 `nginx.exe` 属正常（master + worker）。

### 7.2 让三个应用的构建产物输出到 deploy/html/

> 目标：`npm run build` 后产物直接落在 `deploy/html/<app>`（已在根 .gitignore 里忽略）。

**main-app/vite.config.ts**（build 段）：

```ts
export default defineConfig({
  plugins: [vue()],
  server: { port: 8080, strictPort: true, cors: true },
  build: {
    outDir: '../deploy/html/main-app', // 相对项目根
    emptyOutDir: true,
  },
})
```

**app-vue/vite.config.ts** 同理：

```ts
export default defineConfig({
  plugins: [vue(), qiankun('app-vue', { useDevMode: true })],
  server: { port: 8081, strictPort: true, cors: true },
  build: {
    outDir: '../deploy/html/app-vue',
    emptyOutDir: true,
  },
})
```

**app-react/webpack.config.js**：把 `output.path` 改成：

```js
output: {
  path: path.resolve(__dirname, '../deploy/html/app-react'),
  // 其余字段不变（filename/clean/library/... 保留）
},
```

> ⚠️ app-vue 是"站点根部署"（独占 8081 端口），Vite `base` 保持默认 `/` 即可，产物里资源引用是 `/assets/xxx`，nginx 站根能直接命中。不要为了子路由去改 base。

三个应用分别执行 `npm run build`，确认 `deploy/html/` 下出现三个子目录。

### 7.3 编写 nginx.conf（成品文件）

新建 `deploy/nginx.conf`（直接可用；`root` 换成你的实际路径）：

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;

    # ============ 基座 main-app :8080 ============
    server {
        listen       8080;
        server_name  localhost;
        root  D:/study/qiankun/deploy/html/main-app;
        index index.html;

        # history 路由兜底：所有未命中文件的请求回退 index.html
        location / {
            try_files $uri $uri/ /index.html;
        }
    }

    # ============ 子应用 app-vue :8081 ============
    server {
        listen       8081;
        server_name  localhost;
        root  D:/study/qiankun/deploy/html/app-vue;
        index index.html;

        # 允许基座(8080)跨域 fetch 本应用资源
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";

        location / {
            try_files $uri $uri/ /index.html;
        }
    }

    # ============ 子应用 app-react :8082 ============
    server {
        listen       8082;
        server_name  localhost;
        root  D:/study/qiankun/deploy/html/app-react;
        index index.html;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

复制到 `D:\nginx-1.27.x\conf\nginx.conf` 覆盖原文件（**先备份原文件**），然后 `nginx -s reload`。

> 若提示 8080 已被 dev server 占用，先把三个 dev server 停掉再 reload。
> `add_header` 的 `*` 允许任意 origin 读取；生产更严谨可写具体 origin。

### 7.4 部署态验证清单

三个 dev server **全停**，只留 nginx：

- [ ] `http://localhost:8080` 打开基座，样式正常；
- [ ] 切「Vue 子应用」→ 进 `/vue/list` → **F5 刷新** → 仍在 `/vue/list`（try_files 生效，不 404）；
- [ ] React 子应用同样 F5 不 404；
- [ ] Network 面板：基座加载的是 `8081/8082` 端口的 HTML/JS（非 dev server）；
- [ ] Console 无跨域 / 资源 404 报错；
- [ ] `http://localhost:8081/vue`、`http://localhost:8082/react` 独立访问正常（子应用"独立可部署"属性）；
- [ ] 退出 nginx（`nginx -s stop`），恢复 dev server 日常开发。

### 7.5 选学：同域子路径部署（理解 publicPath/base/entry 三者关系）

若想子应用与基座同站不同路径（`localhost:8080/vue`），核心差异三处，改完自测：
1. nginx：`location /vue/ { alias D:/study/qiankun/deploy/html/app-vue; try_files $uri $uri/ /vue/index.html; }`；
2. 子应用资源前缀：app-vue `vite.config.ts` 加 `base: '/vue/'`；app-react `output.publicPath: '/vue/'`；
3. 基座 apps.ts `entry` 改为同源 `http://localhost:8080/vue/`，且**可去掉子应用 CORS 头**。

### ✅ Phase 7 验收（里程碑 7 全绿）

- [ ] 上表 7.4 全部通过；
- [ ] 已 `git add -A && git commit -m "feat: phase 7 - nginx 本地部署全链路"`；
- [ ] 回到设计文档 1.2，能自检回答 K1–K7。

---

## 附录 A · 报错速查（汇总全 Phase）

| 报错/现象 | 定位 | 章节 |
| --- | --- | --- |
| `__dirnamr is not defined` | webpack.config.js 拼写错误（`__dirname`） | Phase 0 |
| `Cannot find package '@babel/preset-presets-env'` | babel.config.js 拼写错误（`preset-env`） | Phase 0 |
| `Application died in status LOADING_SOURCE_CODE` | 子应用入口未正确导出生命周期/插件未生效 | 1.5 |
| `container '#xxx' not found` | 容器不在 DOM / 注册早于挂载 | 1.5 |
| fetch 子应用 HTML 失败 | 子应用 devServer 未开 cors / entry 端口不符 | 1.5 |
| `already mounted` / 双实例 | 独立运行时误调 render | 1.5 |
| `lifecycles does not export necessary lifecyle functions` | UMD 未配 / 生命周期写成 default 导出 | 2.4 |
| `window is not defined` | 缺 `output.globalObject: 'window'` | 2.4 |
| React 页面白屏无报错 | `#root` 选择器取空 / container id 不一致 | 2.4 |
| 子应用内部路由 F5 404 | 缺 router base/basename（dev）；缺 try_files（部署） | 3.1 / 7.3 |
| 子应用样式污染基座 | 未开 `experimentalStyleIsolation` | 4.2 |
| 全局变量泄漏到主应用 | 误设 `sandbox:false` | 4.1 |
| globalState 不更新 | mount 里没传 fireImmediately=true；或重复订阅未注销 | 5.3 / 5.4 |
| `import.meta.env` TS 报错 | 缺 `src/vite-env.d.ts` | 6.1 |
| build 产物里资源路径 404 | Vite base / webpack publicPath 与部署形态不符 | 7.5 |

## 附录 B · 各 Phase 提交建议（含分支可选）

| 阶段 | 提交信息 |
| --- | --- |
| Phase 0 | `chore: phase 0 - 三端独立工程基线` |
| Phase 1 | `feat: phase 1 - 基座挂载 app-vue` |
| Phase 2 | `feat: phase 2 - 接入 app-react（UMD）` |
| Phase 3 | `feat: phase 3 - 路由联动/菜单高亮` |
| Phase 4 | `feat: phase 4 - 沙箱与样式隔离实验` |
| Phase 5 | `feat: phase 5 - 跨应用通信 globalState` |
| Phase 6 | `feat: phase 6 - env化/loading/容错/文档` |
| Phase 7 | `feat: phase 7 - nginx 本地部署` |

> 想保留"纯净主干 + 阶段对照"，可每 Phase 另建分支 `phase/1`…`phase/7`，完成合并回 main。

## 附录 C · 版本与已知偏差备忘

| 项 | 值/说明 |
| --- | --- |
| Node | 需 ≥ 20（Vite 8 要求更高，建议 22 LTS） |
| React | app-react 实装 19.2.8（设计文档原规划 18，API 兼容，无碍） |
| vite-plugin-qiankun | 实施 2.1 节已锁定版本；API 若与手册不一致，以包内 README 为准（`renderWithQiankun`/`qiankunWindow` 均在 `dist/helper`） |
| qiankun | main-app 用 npm latest（2.x） |
| 部署形态 | 采用"跨端口站点"方案；同域子路径为选学 |
