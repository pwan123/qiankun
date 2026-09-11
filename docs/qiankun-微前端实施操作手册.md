# Qiankun 微前端学习项目 · 实施操作手册

> 本手册是《qiankun-微前端学习项目设计文档.md》的**配套执行手册**：把设计文档里"做什么"细化为"打开哪个文件、粘贴什么代码、执行哪条命令、看到什么算过"。
> 环境（2026-09-11 按各 `package.json` 实测）：Windows + PowerShell + Node ≥ 20.19 / Vite 8.2.2 / Vue 3.5.41 / React 19.2.8 / react-router-dom 7.18.3 / Webpack 5.110.3（webpack-dev-server 6）/ TypeScript 6.0.2 / qiankun 2.10.16 / vite-plugin-qiankun 1.0.15。

## 0. 怎么用这本手册

### 0.1 两个文档的分工

| 文档 | 作用 | 何时看 |
| --- | --- | --- |
| 设计文档 | 讲清"为什么这么设计"（架构、机制、取舍） | 动手前/卡住时补充心智模型 |
| 本操作手册 | 告诉你"每一步具体怎么操作" | 照着做、逐条打勾 |

### 0.2 项目当前进度（2026-09-11 实测）

⚠️ **先看这张表再动手**：手册是"从头做到尾"的写法，但项目已经推进到 Phase 4 —— **不要照着已完成的章节整体覆盖文件**，那会冲掉你自己的注释与实验代码。已完成章节的正确用法是"对照复核"。

| Phase | 状态 | 判断依据 |
| --- | --- | --- |
| Phase 0 · 收尾 | ✅ 完成 | 根目录已有 `.git`（分支 main，有 origin）、`.gitignore`；三端依赖已装齐 |
| Phase 1 · 基座挂 app-vue | ✅ 完成 | `main-app/src/{micro,router,views}` 与 app-vue 的 `router/views/main.ts/qiankun.d.ts` 均已在位，8080 能切到 `/vue` |
| Phase 2 · 接入 app-react | ✅ 完成 | webpack UMD 四件套、`src/views/{List,Detail}.jsx`、`MicroHistoryGuard` 均已在位 |
| Phase 3 · 路由联动 | ✅ 完成 | 主应用菜单前缀高亮已实现（`App.vue` 的 `navs` + `.nav-active`）；3.3 实验可随时重做 |
| Phase 4 · 沙箱/样式实验 | 🚧 进行中 | 4.1 JS 沙箱、4.2 CSS 隔离已做；**4.3 副作用清理、4.4 `docs/规范.md` 未做** |
| Phase 5 · 应用间通信 | ⬜ 未开始 | 无 `main-app/src/micro/actions.ts`，全局状态未接 |
| Phase 6 · 工程化 | ⬜ 未开始 | 无 `main-app/.env`、无 loading/容错、无根 README |
| Phase 7 · nginx 部署 | ⬜ 未开始 | 无 `deploy/`、无各应用 README |

现状明细（避免误判"还缺什么"）：

| 项 | 现状 |
| --- | --- |
| 根目录 | 有 `.git`、`.gitignore`；**无 `README.md`、无 `deploy/`** |
| `main-app` | 8080 + cors；qiankun 2.10.16 + vue-router 4.6.4；`src/micro/{apps.ts,index.ts}`、`src/router/index.ts`、`src/views/{HomeView,MicroSlot}.vue` 已在位；**无 `.env`** |
| `app-vue` | 8081 + cors + `vite-plugin-qiankun@1.0.15`（`useDevMode: true`）；`src/router/index.ts`、`src/views/{HomeView,ListView,DetailView}.vue`、`src/qiankun.d.ts` 已在位；**未安装 `qiankun` 本体**（Phase 5 依赖这点，见 0.5 勘误） |
| `app-react` | 8082；webpack UMD 配置、`src/views/{List,Detail}.jsx`、`MicroHistoryGuard` 已在位；**无 README**、`devServer.open: true`（每次 `npm run dev` 会自己弹浏览器） |
| `docs/` | 设计文档 + 本手册 + 第 5 章步骤文档；**无 `规范.md`** |

### 0.3 通用约定

- 每条命令都在**对应应用自己的目录**下执行（如 `cd d:\study\qiankun\app-vue`），根目录命令除外；
- 需要三个终端：分别跑 `main-app`(8080)、`app-vue`(8081)、`app-react`(8082) 的 `npm run dev`，**本文所有验证都假设三个 dev server 同时在跑**；
- 每个 Phase 完成后按第 0.4 节打一次 git 提交，方便出错回退；
- 代码块标注文件路径的，表示「用该内容整体覆盖该文件」；只给片段的是「在现有文件里插入/替换」；
- ⚠️ 但**已完成章节的代码块只作"设计态参考"**，别整体覆盖粘贴：仓库里的实际文件带着你自己的注释，还有实验开关（如 `app-react/src/App.jsx` 里被注释掉的 `window.__LEAK_`）。覆盖 = 冲掉实验现场；
- Windows PowerShell 里 `npm i -D @babel/core` 这类 `@` 开头的包名要加**双引号**（`npm i -D "@babel/core"`）。

### 0.4 版本决策（对应设计文档第 8 章开放决策点）

| # | 决策 | 本手册采用的默认 |
| --- | --- | --- |
| 1 | app-vue 接入插件 | 用 `vite-plugin-qiankun`（tengmaoqing 原版）。**实施第一步执行 1.1 节锁定版本**（已锁定 `1.0.15`），若发现该包长期停更，换活跃 fork 后仅需改 `app-vue/vite.config.ts` 与 `src/main.ts` 两处（API 兼容）。 |
| 2 | app-react 手动 Webpack | 已采用（现状就是手动工程） |
| 3 | TS 范围 | 两 Vue 应用用 TS（模板默认）；app-react 用 JSX |
| 4 | 通信场景 | 登录用户 + 主题色（Phase 5） |
| 5 | git 提交 | 每 Phase 一提交 |
| 6 | 任务卡 | 本手册即任务卡 |

### 0.5 勘误表（已逐条核对源码 / 实测，遇到"和手册对不上"先查这里）

手册早期版本有几处说法与 qiankun 2.10.16、`vite-plugin-qiankun` 1.0.15 的真实实现不符（还有几处代码片段自带类型错误，会让 `npm run build` 直接失败）。正文与仓库源码均已改，这里汇总备查。

> 截至 2026-09-11，`main-app` 与 `app-vue` 执行 `npx vue-tsc -b` 都是 **0 错误**；`app-react` 是纯 JS，无类型检查。

| 章节 | 原来的问题 | 正确结论 |
| --- | --- | --- |
| 1.2 文件 5 | `main.ts` 片段里有未使用的 `import { createRouter, type Router } from 'vue-router'` | 两个 Vue 工程的 `tsconfig.app.json` 都开了 `noUnusedLocals` / `noUnusedParameters`，**这行会让 `npm run build`（`vue-tsc -b`）直接失败**，删掉（仓库已修正） |
| 1.2 文件 5 / 5.3 | `renderWithQiankun({ bootstrap, mount, unmount })` 少给一个 `update` | 插件的 `QiankunLifeCycle` 类型**四个生命周期全是必填**，缺 `update` 报 `TS2345`；补一个空的 `update() {}` 即可（仓库已修正） |
| 1.2 文件 1 | `import qiankun from 'vite-plugin-qiankun'` 报 `TS2349: This expression is not callable` | `app-vue/tsconfig.node.json` 用的是 `"module": "nodenext"`，而该包 `types` 指向 ESM 风格的 `.d.ts`、`main` 却是 CJS 产物，nodenext 会把默认导入解析成命名空间。把它改回 `"module": "ESNext"` + `"moduleResolution": "bundler"`（原注释本来就写着 Bundler mode）—— 仓库已修正 |
| 1.3 文件 2 / 6.1 | 生命周期钩子写成 `(app) => console.log(...)` | 钩子类型是 `(app, global) => Promise<any>`，同步回调返回 `void` 报 `TS2322`；写成 `async (app) => console.log(...)`（仓库已修正） |
| 1.2 文件 4 | `qiankun.d.ts` 里的变量名 | 必须是**双下划线结尾**：`__POWERED_BY_QIANKUN__`、`__INJECTED_PUBLIC_PATH_BY_QIANKUN__`。仓库原文件写成了 `__POWERED_BY_QIANKUN_`、`__INJECTED_PUBLTC_PATH_BY_QIANKUN_`（`PUBLTC` 是拼写错误），会导致类型对不上（仓库已修正） |
| 3.3 | "保存（qiankun 会热重载）" | `apps.ts` / `micro/index.ts` 不在 Vite 的 HMR 接受链上，保存后是**整页刷新**；刷新即重新 `registerMicroApps` 并按新 `activeRule` 判定，结论不变但要知道它是刷新 |
| 4.1 实验 1-A | "代码已就位：`App.jsx` 第 3 行 `window.__LEAK_ = 'react-app'`" | 仓库里这行是**注释状态**，实验前要先取消注释 |
| 4.1 实验 2 | "对 `app-vue` 而言开/关沙箱结果完全一样" | 现象成立，但要补一层理解：`window.proxy` 是 `vite-plugin-qiankun` 的**命脉**（`helper.js` 取 `window.proxy \|\| window`，注入的脚本直接调 `window.proxy.vitemount(...)`）。关沙箱时它会退化成真 window，插件才"侥幸"还能跑 |
| 4.2 实验 3 | "容器内有且仅有一个根节点，前缀才加得上去" | 源码里**没有**这个限制。前缀是加在 **qiankun 自建的那个 wrapper div**（`<div id="__qiankun_microapp_wrapper_for_app_vue__" data-name="app-vue" …>`，它才是容器的唯一子节点）上的。真实边界是：它只改写**挂载那一刻 wrapper 内已存在的 `<style>`**（以及之后经 qiankun 补丁插入容器内的 `<style>`）；`<link>` 直接 warn 不支持；Vite 注入到 `document.head` 的样式感知不到 |
| 4.3 实验 1 | 用一个空 `setInterval(() => {}, 1000)` 观察内存 | 泄漏量太小，Performance 面板看不出来；要挂一个持续增长的大对象（正文已改） |
| 5.3 step 1 | `import type { MicroAppStateActions } from 'qiankun'` | `app-vue` **没装 `qiankun`**，这样写是 `TS2307`；正文给的是"不装依赖"的手写类型版 |
| 6.1 step 1 | "若 `src/` 下没有 `vite-env.d.ts`，新建一个" | 两个 tsconfig 已经用 `"types": ["vite/client"]` 引入了 Vite 类型，**不需要**该文件；想让自定义 `VITE_*` 有类型，要显式扩展 `ImportMetaEnv` 接口 |
| 6.3 | loading 骨架用 `setTimeout` 模拟；并说"真实接法是 `start({ loader })` 驱动" | 前者是假状态（跟 qiankun 无关）；后者也错 —— `loader` 是**每个子应用**的配置项（`registerMicroApps([{ …, loader }])`），`start()` 根本不接受它 |
| 附录 A | "子应用样式污染基座 = 未开 `experimentalStyleIsolation`" | 归因错了：根因是子应用写了**非 scoped 的全局样式**；该配置只能兜底静态 `<style>`，救不了 Vite 运行时注入 |


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

> **状态：✅ 已完成**（仓库里相关文件均已在位）。本节现在当"**复核清单**"用：对照着看自己的实现是否与设计一致，**不要整体覆盖粘贴**。
>
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

> ⚠️ **两个变量名都是"双下划线开头 + 双下划线结尾"**，手写极容易少一个下划线或拼错（仓库里现存的 `app-vue/src/qiankun.d.ts` 就写成了 `__POWERED_BY_QIANKUN_` 和 `__INJECTED_PUBLTC_PATH_BY_QIANKUN_`）。声明名与实际使用名不一致时，TS 会认为你在访问一个不存在的属性 —— 现在没报错只是因为 `main.ts` 用的是插件 helper 里的 `qiankunWindow`（自带类型），这个 `.d.ts` 实际处于"写了但没生效"的状态。**建议按上面正确的名字改掉**。

#### 文件 5：`app-vue/src/main.ts`（整体覆盖，核心改造）

```ts
import { createApp, type App as VueApp } from 'vue'
// ⚠️ 不要 import vue-router 的 createRouter / Router —— 本文件用不到它们，
// 而 tsconfig.app.json 开了 noUnusedLocals，未使用的 import 会让 `npm run build`（vue-tsc -b）直接失败
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

// 被 qiankun 托管时，插件把这些生命周期导出给主应用调用
// ⚠️ update 不能省：插件的 QiankunLifeCycle 类型要求四个生命周期齐全，缺了 vue-tsc 会报 TS2345
renderWithQiankun({
  bootstrap() {
    console.log('[app-vue] bootstrap')
  },
  mount(props) {
    console.log('[app-vue] mount')
    render(props as { container?: HTMLElement | null })
  },
  update() {
    // 主应用调 update(props) 时触发；本项目不做增量更新，留空即可
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
    // 钩子类型是 (app, global) => Promise<any>，必须返回 Promise，所以都要 async
    beforeLoad: [async (app) => console.log('[qiankun] beforeLoad:', app.name)],
    beforeMount: [async (app) => console.log('[qiankun] beforeMount:', app.name)],
    afterMount: [async (app) => console.log('[qiankun] afterMount:', app.name)],
    afterUnmount: [async (app) => console.log('[qiankun] afterUnmount:', app.name)],
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
    // 注意后面的 (.*)* 不能省：少了尾巴上的 * 就匹配不到不带斜杠的 /vue 本身
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

> **状态：✅ 已完成**（UMD 四件套、`views/{List,Detail}.jsx`、`MicroHistoryGuard` 均已在位）。同样按"复核清单"使用。
>
> 目标：主应用可在 Vue / React 两个子应用间切换；同时看懂「UMD 打包配置 ↔ qiankun 加载协议」的关系。
> app-react 当前是**普通 Webpack 工程**（8082 可独立跑），但有两个按老步骤做必踩的坑：① `App.jsx` 首页没覆盖时**只有标题、没有跳转入口**（自测第一步就卡住）；② react-router 与主应用 vue-router 共用 `history.state` 会互相覆盖，导致**列表/详情页里点导航切不走子应用**（Console 报 `SecurityError`）。本节需整体覆盖 `webpack.config.js`、`src/index.js`、`src/App.jsx`，并新建 `src/views/List.jsx`、`src/views/Detail.jsx`。

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
        // ===== qiankun UMD 协议（本 Phase 新增）=====
        // 所有静态资源都从本应用源(8082)的根路径取，避免 URL 处于 /react/xxx 时按相对基准跑到主应用(8080)找资源
        publicPath: '/',
        library: 'appReact',      // 全局变量名，qiankun 从 window.appReact 上拿生命周期
        libraryTarget: 'umd',     // 打包成 UMD：能同时兼容 全局变量/CommonJS/AMD
        globalObject: 'window',   // 关键：让 UMD 代码在沙箱里取 window 而不是 globalThis
        chunkLoadingGlobal: 'webpackJsonp_app_react', // webpack5 版 jsonpFunction，多应用防冲突
        // ============================================
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

> **停一下，理解 UMD 关键行**：webpack 打包入口 `src/index.js` 时，若该文件 `export` 了 `bootstrap/mount/unmount`，UMD 会把它们挂到 `window.appReact`；qiankun 加载这个 UMD 后从 `window['appReact']` 读生命周期调用——这就是"官方标准接入协议"的全貌。
>
> `publicPath: '/'` 让资源固定从子应用自己源（8082）的根路径加载，避免页面 URL 处于 `/react/list` 这类深路径时按相对路径到主应用（8080）找资源而 404。

#### 文件 2：`app-react/src/index.js`（整体覆盖：生命周期 + 路由）

```js
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App';
import List from './views/List';
import Detail from './views/Detail';

let root = null;
let container = null;

// 微前端下，主应用(8080)用 vue-router，它把 {back,current,forward,position}
// 等字段存在浏览器 history.state 里，导航时依赖 current 拼接 URL。
// React Router 内部导航（点 Link）会用 pushState 把 history.state 整体替换成
// {usr,key}，丢掉 vue-router 写的 current，导致主应用 vue-router 之后再
// push/replace 时拼出 'http://localhost:8080undefined/' 这类非法 URL 而报
// SecurityError —— 现象就是：在 React 列表/详情页里点主应用导航切不走子应用。
// 这里在每次 React 导航落定后，把真实路径补回 state.current（usr/key 原样保留），
// 既不影响 React Router 自身的前进后退，也不破坏主应用的 state 结构。
function MicroHistoryGuard() {
  const location = useLocation();
  useEffect(() => {
    const s = window.history.state;
    if (!s || typeof s.current !== 'string') {
      const realPath = window.location.pathname + window.location.search;
      window.history.replaceState({ ...(s || {}), current: realPath }, '');
    }
  }, [location]);
  return null;
}

function render(props = {}) {
  // props.container 由 qiankun 的 mount 传入（主应用容器）；独立运行时为空
  container = (props.container && props.container.querySelector('#root')) || document.getElementById('root');
  root = createRoot(container);
  root.render(
    // basename='/react'：与主应用 activeRule 前缀一致（Phase 3 详解）。
    // 独立运行时也用它：独立访问走 http://localhost:8082/react/...（dev server 会回退到 index.html）
    <BrowserRouter basename="/react">
      <MicroHistoryGuard />
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

> `App.jsx` 原本只是静态 `<h1>`，若照原样保留，React 首页就没有任何跳转入口——2.1 自测里"点链接跳列表页"会直接卡住（本 Phase 的第一个坑）。所以紧接着**文件 3 要整体覆盖 App.jsx** 补上入口；文件 4/5 才是列表/详情页。

#### 文件 3：`app-react/src/App.jsx`（整体覆盖：首页补跳转入口）

```jsx
import { Link } from 'react-router-dom';

export default function App() {
    return (
        <div>
            <h1>Hello from app-react (Webpack 5)</h1>
            <p>React 子应用业务首页</p>
            <Link to="/list">去列表页</Link>
        </div>
    );
}
```

> `Link` 会被 `BrowserRouter`（basename=`/react`）解析成绝对路径：独立运行点它跳到 `/react/list`；被基座托管时点击后 URL 变为 `8080/react/list`，且是 SPA 内切换、不会整页刷新。

#### 文件 4：新建 `app-react/src/views/List.jsx`

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

#### 文件 5：新建 `app-react/src/views/Detail.jsx`

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

**先自测 app-react（独立模式）**：`npm run dev` 后访问 **http://localhost:8082/react** → 出现首页，点「去列表页」→ `/react/list`，点列表项 → `/react/detail/1`，各页 F5 刷新不 404。

**再提前验证"基座托管"下的关键路径（验证文件 2 的 `MicroHistoryGuard`）**：8080 主应用切到 React → 首页点「去列表页」进 `/react/list`（再进 `/react/detail/1` 也行）→ 点主应用顶部导航「Vue 子应用」/「首页」，必须能正常切走，且 Console **不得出现** `SecurityError`/`'http://localhost:8080undefined/'`。

> ⚠️ 改动过 `index.js`（guard）后，务必**整页刷新一次 8080 主应用**再测：qiankun 在页面存活期间会缓存已加载的子应用 bundle，仅靠 webpack HMR 不会替换它。

通过后再进入 2.2 把 app-react 追加进主应用注册表。

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
2. React 首页点「去列表页」→ 再点列表项 → 详情，二级路由可跳转，URL 保持 `/react/list`、`/react/detail/1`；
3. **核心回归**：停在 React 列表/详情页时，点顶部导航「Vue 子应用」「首页」应能正常切走，Console **不得出现** `SecurityError`/`'http://localhost:8080undefined/'`（出现则说明 `MicroHistoryGuard` 没生效，多半是没整页刷新主应用）；
4. 打开 DevTools → Network 面板，切到 React 子应用，应能看到主应用对 `//localhost:8082/` 发起的 HTML 请求、以及后续的 `main.bundle.js` 资源请求（观察 qiankun 的 HTML Entry 加载过程）；
5. 两个子应用独立访问（8081/vue、8082/react）仍正常。

### 2.4 常见报错排查表

| 现象 | 原因与处理 |
| --- | --- |
| 切到 React 报 `lifecycles does not export necessary lifecyle functions` | 入口没正确导出。确认 webpack `library`/`libraryTarget:'umd'` 已加、`src/index.js` 是**具名导出** `export async function bootstrap/mount/unmount`（不要写成 `export default`） |
| 报 `window is not defined` 或 `global is not defined` | 漏了 `output.globalObject: 'window'`（UMD 在非浏览器上下文取全局变量失败） |
| 页面一片空白且 Console 无错，但子应用 HTML 已加载 | 多为 React 找不到 `#root`：`props.container.querySelector('#root')` 取到 null → 检查容器 id 与 `index.html` 是否一致 |
| 两个子应用来回切，其中 React 偶发重复渲染 | `unmount` 里漏了 `root.unmount()` + `root = null`，排查入口文件 |
| 独立访问 8082 正常，托管后子应用内部资源 404 | dev server 下一般不出现（2.1 已配 `publicPath: '/'`）；若日后给 React 引入懒加载/分包后仍出现，把 `publicPath` 换成完整子应用源 `'//localhost:8082/'` |
| React 首页只有一行标题，找不到「去列表页」等入口 | `App.jsx` 没被覆盖成带路由 `Link` 的首页（文件 2 只配了路由，首页仍需自己提供入口） | 按 2.1「文件 3」整体覆盖 App.jsx |
| 在 React 列表/详情页点主应用导航切不走，Console 报 `SecurityError ... 'http://localhost:8080undefined/'` | React Router 内部 `pushState` 会整体替换 `history.state`，丢掉 vue-router 写在其上的 `current` 等字段，vue-router 拼 URL 出错 | `index.js` 已内置 `MicroHistoryGuard`，每次 React 导航后用 `replaceState` 回填 `state.current`；改完**整页刷新主应用**再验证 |

### ✅ Phase 2 验收

- [ ] 主应用内 Vue / React 双应用来回切换互不干扰；
- [ ] React 子应用二级路由可跳转，URL 形如 `/react/list`；
- [ ] **停在 React 列表/详情页时仍可通过主应用导航切走，且无 `SecurityError`**；
- [ ] Network 能看到 `//localhost:8082` 的 HTML/JS/CSS 请求；
- [ ] 两个子应用独立访问正常；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 2 - 接入 app-react（UMD）双应用可切换"`

---

## Phase 3 · 路由联动、刷新与激活规则

> **状态：✅ 已完成**（主应用 `App.vue` 已按前缀算激活态；3.3 实验可随时重做）。
>
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

临时把 `apps.ts` 里 app-vue 的 `activeRule` 改成 `'/vue-child'`，保存。

> 注意这里**不是 HMR 热更新**：`apps.ts` / `micro/index.ts` 不在 Vite 的 HMR 接受链上，保存后浏览器会**整页刷新**；刷新即重新执行 `registerMicroApps`，并按新的 `activeRule` 重新判定谁该激活。所以结论不变，但你要知道"是刷新生效、不是热重载"。

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

> **状态：🚧 进行中** —— 4.1（JS 沙箱）、4.2（CSS 隔离）已做完；**4.3（副作用清理）、4.4（`docs/规范.md`）待做**。
>
> 目标：亲手制造污染 → 亲眼看到沙箱/隔离生效 → 沉淀样式规范。
> 全程不改业务代码结构，只做**实验 + 记录**。

**实验地图（先扫一眼，避免四个实验记串）**

| 顺序 | 实验 | 用什么做 | 预期结果 |
| --- | --- | --- | --- |
| 4.1 | JS 沙箱：全局变量会不会泄漏 | `app-react` / `app-vue` **对照** | react 不泄漏、vue 泄漏 |
| 4.2 | CSS 隔离：全局样式会不会串 | `app-vue` 写非 scoped 样式 | 会串 → 加 `scoped` 后只命中自己 |
| 4.3 | 副作用清理：定时器不清理 | `app-vue` 的 `mount` | 反复切换后内存只涨不降 |
| 4.4 | 沉淀《样式规范》 | — | `docs/规范.md` 落地 |

### 4.1 JS 沙箱实验

**先记住这两点，否则结论一定记错：**

| 子应用 | 构建形态 | 它的 JS 由谁执行 | JS 沙箱 |
| --- | --- | --- | --- |
| `app-react` | Webpack + UMD | **qiankun**（在代理 window 里执行） | ✅ 生效 |
| `app-vue` | Vite + ESM | **浏览器**原生加载 `<script type="module">` | ❌ 不生效，代码跑在真实 window 上 |

- 原因：qiankun 执行子应用脚本的方式是把它包进 `with(proxyWindow){ ... }` 里跑，而原生 ESM 的 `import` 语句在函数体里是**语法错误**、塞不进去。所以 `vite-plugin-qiankun` 把 `<script type="module" src=...>` 改写成一句 inline 的 `import('...')`（见 `app-vue/node_modules/vite-plugin-qiankun/es/index.js` 的 `module2DynamicImport`）：**动态 import 交给浏览器原生加载**，模块代码因而跑在真实全局作用域。这是 ESM 形态的既有限制、不是配置错误，也正是本项目特意做两种形态要对比出的结论。
- 主应用 Console **永远读真 window**；想偷看沙箱内部要用 `window.proxy.xxx`（`import-html-entry` 把当前沙箱 proxy 挂在了真 window 的 `window.proxy` 上）。
- 但 `window.proxy` **不只是观察窗口，它是 `vite-plugin-qiankun` 的命脉**：helper 里 `qiankunWindow = window.proxy || window`，注入的 inline 脚本写 `window.proxy.vitebootstrap = resolve`，模块加载完再靠 `window.proxy.vitemount(...)` 把生命周期接起来。app-vue 能跑起来本身就依赖 proxy 存在 —— 这也是实验 2 那个"关沙箱似乎也没事"的真相（见实验 2 末尾）。

**实验 1：全局变量会不会泄漏**

A. `app-react`（预期：**不泄漏**）

1. **先取消注释**：打开 `app-react/src/App.jsx`，把第 3 行的 `// window.__LEAK_ = 'react-app';` 去掉注释（写在模块顶层，加载即执行一次）。
   > ⚠️ 仓库里这行默认是注释状态，漏了这步实验必然读到 `undefined`，会让你误判成"沙箱隔离成功"。
2. 主应用切到「React 子应用」，再切回「首页」；
3. 主应用 Console 依次输入：

   | 输入 | 预期 | 含义 |
   | --- | --- | --- |
   | `window.__LEAK_` | `undefined` | 真 window 没被污染 |
   | `window.proxy.__LEAK_` | `'react-app'` | 值被留在了沙箱里 |

   → 结论：**写隔离生效**。

B. `app-vue`（预期：**泄漏**，与 A 形成对照）

1. 打开 `app-vue/src/views/HomeView.vue`，把第 2 行 `// window.__LEAK_ = 'vue-app';` 的注释去掉；
2. 主应用切到「Vue 子应用」，再切回「首页」；
3. 主应用 Console 输入 `window.__LEAK_` → `'vue-app'`。

   → 结论：**ESM 绕过沙箱，直接写到了真 window 上**。

**实验 2：把沙箱关掉，再跑一遍 app-react**

1. 打开 `main-app/src/micro/index.ts`，把 `start({ ... })` 里那行 `// sandbox: false` 的注释去掉（即改成 `sandbox: false,`）；
2. 重复实验 1-A → `window.__LEAK_` 变成 `'react-app'`（此时真 window 与 `window.proxy.__LEAK_` 读到的是同一个值）；
3. **撤销**：把 `sandbox: false` 注释回去，恢复默认沙箱。

> 对 `app-vue` 而言，开/关沙箱的**可见现象**几乎一样（它的业务代码本来就没进沙箱），不要拿它当"沙箱失效"的证据。但机制上有个细节值得知道：关沙箱后 `window.proxy` 会被赋成**真 window**，于是 `vite-plugin-qiankun` 那些 `window.proxy.vitebootstrap = ...` 就全写到了真 window 上（沙箱开着时它们写在沙箱里）。这也顺便解释了为什么关沙箱后 app-vue 还能起来 —— 插件只要求"`window.proxy` 这东西存在"，是真是假它并不关心。

**实验 3：`__POWERED_BY_QIANKUN__` 到底写在哪**

这个标记由 qiankun 内置的 `engineFlag` 钩子写入：`beforeLoad` / `beforeMount` 时 `global.__POWERED_BY_QIANKUN__ = true`，`beforeUnmount` 时 `delete`。关键在 `global` —— **沙箱开启时它是沙箱 proxy，关闭时才是真 window**。所以它和实验 1 是同一套结论：

| 读数位置 | 默认沙箱 | `sandbox: false` |
| --- | --- | --- |
| 主应用 Console：`window.__POWERED_BY_QIANKUN__` | `undefined` | `true`（挂载期间；切走被 `delete` 后回到 `undefined`） |
| 主应用 Console：`window.proxy.__POWERED_BY_QIANKUN__` | `true` | `true` |
| 子应用内 `console.log(window.__POWERED_BY_QIANKUN__)` | `true` | `true` |

- ⚠️ `window.proxy` **不是 qiankun 承诺的 API**，只是 `import-html-entry` 的实现细节：它在「执行子应用脚本」的那一刻做 `globalWindow.proxy = proxy`（`node_modules/import-html-entry/lib/index.js` 的 `getExecutableScript`），用来把 `with(window){...}.bind(window.proxy)` 绑到沙箱 proxy 上。因此：
  - 必须**先切到过子应用**它才有值；刷新页面后要重新切一次才再出现；
  - 它指向**最近一次执行过脚本**的那个子应用的沙箱，多应用来回切会变；
  - 报 `Cannot read properties of undefined (reading '__POWERED_BY_QIANKUN__')` 就说明当前这次页面会话里**还没有任何子应用脚本被执行过**（`typeof window.proxy` 是 `'undefined'`）；顺带一提 `sandbox: false` 时它反而会被赋成真 window，所以更不可能是 undefined；
  - 子应用**卸载后** proxy 对象本身还在，但里面的 `__POWERED_BY_QIANKUN__` 已在 `beforeUnmount` 被 `delete`，那时读到的是 `undefined` 而不是 `true`（这是"偷看"法的固有局限，不是沙箱坏了）。
- 最稳的观察方式永远是**在子应用代码里 `console.log`**，别把 `window.proxy` 当正式手段。
- 子应用入口那句 `if (!window.__POWERED_BY_QIANKUN__) render()` 就是靠它判断：**没被 qiankun 托管 = 独立运行，自己挂载；被托管 = 不自挂载，等基座调 `mount`**。
- `app-vue` 在主应用 Console 里读**同样是 `undefined`**：它的标记也是 qiankun 的 `engineFlag` 写在 proxy 上的，与 `vite-plugin-qiankun` 无关（插件只负责用动态 `import()` 把 ESM 入口接进来、并桥接生命周期，不写这个标记）。

### 4.2 CSS 隔离实验

**实验 1：制造污染（非 scoped）**

1. 打开 `app-vue/src/views/HomeView.vue`，**去掉 `scoped`**，选择器用**两个应用里都存在的标签**：

   ```vue
   <style>
   /* div 在 Vue、React 两边都有，才看得出"外泄"；
      用 outline 而不是 padding/margin，避免把别家的布局也搞乱 */
   div {
     background: #ffe6e6;
     outline: 1px solid #e11d48;
   }
   </style>
   ```

2. 切到「Vue 子应用」→ 它是粉底红边；再切到「React 子应用」→ **React 的根 `div` 也是粉底红边**（用 Elements 面板看，连主应用里的 `div` 也一起被命中）。

   → 结论：**CSS 没有沙箱兜底，任何非 scoped 的选择器都会跨应用生效**；而且 Vite dev 是运行时把 `.vue` 样式注入到真实 `document.head` 的，子应用卸载后 qiankun 也收不回它们（残留会继续串）。

**实验 2：正确解法——加 `scoped`，把选择器限制在组件模板内**

1. 只加一个 `scoped`：

   ```vue
   <style scoped>
   div {
     background: #ffe6e6;
     outline: 1px solid #e11d48;
   }
   </style>
   ```

2. 切到「Vue 子应用」→ 只有 HomeView 自己那个 `div` 是粉底红边（Elements 里能看到它带着 `data-v-*` 属性，和 CSS 里的选择器对上）；再切「React 子应用」→ 干净。

   → 结论：**样式隔离的第一责任人是子应用自己**：Vue 用 `scoped`（或 CSS Modules），React 用 CSS Module / CSS-in-JS，不写裸的全局选择器；且选择器必须落在**组件模板内的节点**上。这正是 4.4 要沉淀的规范。

> 为什么用 `div` 做对照：`.home` 只有 Vue 有、React 里根本不存在，`body` 又不在组件模板内 —— 拿它俩做对照都"看不出外泄"，只有两边都存在的选择器（`div` / `h1` / `p`）才能直观看到串色。
> 但生产中别用这么宽的标签选择器：`scoped` 下它会把本组件里**所有** `div` 都染上。落到具体 class 上作用域更小、可读性也更好（比如给根节点 `class="home"` 再用 `.home`）。

> ⚠️ **顺带记一个坑：如果把 `body`（或任何不在组件模板里的选择器）放进 `scoped` 块，会看到"Vue 自己也不显示样式了"** —— 这不是隔离成功，而是规则变成了死代码：
> - `scoped` 的原理是给选择器加属性选择器：`body {…}` → `body[data-v-3f2a1b]{…}`；
> - 而 `<body>` 在 HomeView 的模板之外，**永远不会带 `data-v-*` 属性**，所以这条规则哪都不生效；
> - 也就是说 `scoped` 限制的是"作用在哪些元素上"，**不是"把全局选择器自动变成局部"**。想生效就必须把选择器写在组件自己的节点上（如实验 2 的 `div`）。

> 另外要意识到：`app-vue` 里那份 `src/style.css`（`main.ts` 里 `import './style.css'`）本身也是**非 scoped 的全局样式**（`body`、`#app`、`h1`、`:root` 全在里面），它同样会外泄到主应用/其他子应用 —— 它是子应用自带的"全局基线"残留。理想做法是把这类样式收敛到组件根容器上，真正全局的主题（CSS 变量、body 底色）由基座统一下发（Phase 5）。

**实验 3（可选兜底）：`experimentalStyleIsolation`**

在 `main-app/src/micro/index.ts` 打开（可保留作兜底）：

```ts
start({ prefetch: 'all', sandbox: { experimentalStyleIsolation: true } })
```

它做的事很具体，看源码（`qiankun/es/loader.js` + `es/sandbox/patchers/css.js`）只有两条：

1. 子应用被挂载时，qiankun 会先把它的 HTML 套进一个**自己创建的 wrapper**：
   `<div id="__qiankun_microapp_wrapper_for_app_vue__" data-name="app-vue" data-version=… data-sandbox-cfg=…>`，
   这个 wrapper 就是 `#micro-container-vue` 里唯一那个子节点。开启该配置后，qiankun 给**这个 wrapper** 加上属性 `data-qiankun="app-vue"`；
2. 把 wrapper 内的 `<style>` 逐条改写，选择器统一加前缀 `div[data-qiankun="app-vue"]`：
   - `h1 {…}` → `div[data-qiankun="app-vue"] h1 {…}`
   - `body {…}` → `div[data-qiankun="app-vue"] {…}`（`html` / `body` / `:root` 会被直接替换成前缀）

   在 Elements 面板里搜 `data-qiankun` 就能看到这个 wrapper 和改写后的 `<style>`。

> ✅ **它能拦住的**：写在子应用 HTML `<style>` 里的样式，以及挂载后由 qiankun 补丁**插入到容器内**的 `<style>`。
> ❌ **它拦不住的**（所以别指望它解决实验 1 的污染）：
> - Vite dev 运行时注入到 `document.head` 的 `.vue` 样式 —— 在 wrapper 之外，qiankun 扫不到；
> - 外链 `<link>` —— 源码里直接 `console.warn('...is not support for link element yet.')`；
> - 已经注入 head 的历史残留 —— 子应用卸载也不会被收回。
> 一句话：它是"兜底"，真正的解法是实验 2 —— 子应用自己把样式写对。
>
> 补充：前缀是加在 qiankun 自建 wrapper 上的，**不存在"容器内必须只有一个根节点"的限制**（wrapper 本来就是唯一的那个子节点）。

**实验 4（仅了解，不做）**：`strictStyleIsolation`（shadow DOM）隔离最彻底但副作用大，读设计文档 3.6 即可。

**收尾：把实验 1 的非 scoped 写法改成实验 2 的 `scoped` 写法（保留 `div` 做对照，记得别把 `body` 之类模板外的选择器塞进 `scoped`）；`experimentalStyleIsolation` 可留作兜底。**

### 4.3 副作用清理实验（看内存）

> 目标：让"泄漏"**看得见**。只挂一个空的 `setInterval(() => {}, 1000)` 是测不出来的 —— 一个定时器才几十字节，Performance 面板的曲线不会有肉眼可见的变化。所以下面这版让它每次 `mount` 都分配一块**大对象**并持续增长。

> **为什么必须拿 `app-vue` 做这个实验？** 因为**沙箱会替子应用收尾**：qiankun 在挂载时会补丁 `setInterval` / `addEventListener`（`qiankun/es/sandbox/patchers/interval.js`、`windowListener.js`），并在卸载时自动 `clear` 掉沙箱内创建的所有定时器和监听：
> ```26:32:main-app/node_modules/qiankun/es/sandbox/patchers/interval.js
>   return function free() {
>     intervals.forEach(function (id) {
>       return global.clearInterval(id);
>     });
> ```
> 而 `app-vue` 是 Vite-ESM、业务代码跑在**真实 window** 上（4.1 的结论），原生 `setInterval` 没人帮你清 —— 泄漏才是真实的。
> 所以：① 拿 `app-react`（UMD，走沙箱）做同样的实验，qiankun 会在 unmount 时帮你把定时器清掉，你会看到"很健康"的假象；② 这也说明**上沙箱有个隐藏收益**：它不只隔离变量，还兜了定时器/事件监听的清理 —— 只是 ESM 形态的子应用享受不到。

**实验 1：制造泄漏（app-vue）**

1. 打开 `app-vue/src/main.ts`，模块顶层加两行状态：

   ```ts
   let leakTimer: number | null = null
   const leakStore: number[][] = []
   ```

   再在 `mount(props)` 里（`console.log('[app-vue] mount')` 之后）加：

   ```ts
   // 故意不清理：每次 mount 都新开一个定时器，并持续往同一个数组里塞数据
   leakTimer = window.setInterval(() => {
     leakStore.push(new Array(20000).fill(Math.random())) // 每次约 160KB
   }, 200)
   ```

2. **录一段**：
   - F12 → 切到 **Performance** 面板；
   - 在面板**顶部工具栏**那一排复选框里勾上 `Memory`（和 `Screenshots` / `Web Vitals` 同排）—— **必须在点录制之前勾**，录完再勾是没用的（若你的 Chrome 版本里已经没有这个复选框，说明默认就会采集内存，直接下一步）；
   - 点 ⏺ 开始录制 → 在主应用里反复「切到 Vue 子应用 → 停留两三秒 → 切回首页」约 5 次 → 点 ⏹ 停止。
3. **读曲线**（DevTools 版本不同，位置略有差异，**认"芯片"最快**）：
   - 录制结果里有一块 **Memory 图表**：老版在**左侧轨道名列**里叫 `Memory`（`Screenshots` 与 `Main` 之间）；新版（侧栏有 `Insights` / `Annotations` 的那些）在**轨道列表的最下方**（`GPU` 下面），图表顶部是一排彩色芯片：`JS heap(最小 – 最大)`、`Documents`、`Nodes`、`Listeners`、`GPU memory`；
   - **芯片括号里的两个数就是这段录制里该指标的最小值与最大值**，一眼能看出涨了多少（如 `JS heap(45.4 MB – 71.8 MB)` = 这段涨了约 26MB）；
   - 想知道哪条颜色线对应哪个指标：**把鼠标停在线上**看悬浮提示；也可以点芯片只显示/隐藏那一条；
   - 图表默认很矮：按 `W` 放大时间轴（`S` 缩小、`A`/`D` 平移），或拖动分隔线把它拉高；
   - ⚠️ **GC 必须在"录制过程中"按**：Performance 面板里的录制结果是历史数据，**录完再点 🗑️（Collect garbage）不会把曲线重画**。所以正确录法是：切子应用两三次 → 点 🗑️（曲线会当场掉一截）→ 再切两三次 → ⏹ 停止；然后看"每次 GC 之后的谷底有没有逐级抬高"。
     （想"先录完、再补一次 GC"的话用 **Memory 面板**的 `Allocation instrumentation on timeline`：它的 🗑️ 是停止后按的，画面会实时更新。）

   **曲线形态对照（照着判结论）：**

   | 你看到的形态 | 结论 |
   | --- | --- |
   | 阶梯**只升不降**，每次 GC 后的**谷底逐级抬高** | ✅ 泄漏（本例就是它） |
   | 开头高、一两次**竖直下跌**后长时间走平（只有小幅起伏） | 正常 —— 加载期分配一堆内存，GC 回收后进入稳态 |
   | `JS heap` 能回落，但 `Nodes` / `Listeners` **只增不减** | 也是泄漏（DOM 节点或事件监听没释放，堆反而看不出来） |

   > 所以判泄漏别只看 `JS heap` 一条：把 `Nodes`、`Listeners` 也勾上一起看（芯片前面的小方框就是开关）。很多微前端泄漏的典型表现是 **heap 能回落、但 Nodes/Listeners 一路涨**。

> 如果觉得"录一段再找轨道"太绕，这两个替代工具更直观（结论一样）：
> - **Performance monitor**（DevTools 的 `⋮` → More tools → Performance monitor）：勾上 `JS heap size`，它是**实时折线**，你一边切子应用一边看它涨，最省事；
> - **Memory 面板** → `Allocation instrumentation on timeline`：开始记录 → 切几次子应用 → 停止 → 点 🗑️，没被回收的蓝条就是泄漏，还能点开看是哪个函数分配的。

**实验 2：修复对比**

1. 在 `unmount()` 里清理：

   ```ts
   if (leakTimer !== null) {
     clearInterval(leakTimer)
     leakTimer = null
   }
   ```

   （想更彻底就连数据引用一起断：`leakStore.length = 0`）
2. 重复上面的录制 → 切走几次并 GC 后，堆能回到接近起点。

→ 结论：**`mount` 里开的东西，`unmount` 里必须清**（定时器、事件监听、`onGlobalStateChange` 订阅 —— Phase 5 会再遇到）。

> 顺带体会两件事：① 这个泄漏不只是"占内存"，还在持续烧 CPU；② 它污染的是**真实 window** —— app-vue 的代码本来就跑在沙箱之外（4.1 的结论），所以别指望沙箱帮你把定时器收走。

### 4.4 沉淀样式规范（写进 docs/规范.md）

新建 `docs/规范.md`，内容先写三条（后续 Phase 再补）：

```markdown
# 前端规范（本项目沉淀）

## 样式规范
1. 子应用一律使用局部样式：Vue 用 scoped，React 用 CSS Module / CSS-in-JS；禁止裸写全局选择器；
2. `scoped` 只对**组件模板内的元素**生效：选择器要落在自己组件的节点上（优先用根节点 class）；
   不要在 scoped 里写 `body` / `html` / `:root` —— 编译后会变成 `body[data-v-*]`，永远匹配不到，是死代码；
3. 子应用自带的"全局基线"（如 app-vue 的 `src/style.css` 里 `:root` / `body` / `h1`）同样是污染源，
   应尽量收敛到组件根容器；真正需要全局的主题（CSS 变量、body 底色）由基座统一下发（见 Phase 5）；
4. 基座可选开启 `experimentalStyleIsolation` 作兜底：它只改写**挂载时容器内已存在的 `<style>`**
   （以及之后经 qiankun 补丁插入到容器内的），`<link>` 不支持、Vite 运行时注入到 `document.head` 的样式感知不到
   —— 所以它是兜底，不能替代第 1、2 条。
```

### ✅ Phase 4 验收

- [ ] 能讲清"Proxy 沙箱下写隔离、读共享"，并演示开关沙箱的差异；
- [ ] 能演示样式污染，并用 `scoped` / CSS Module 修复；能说出 `experimentalStyleIsolation` 的适用范围（只兜底静态 `<style>`）；
- [ ] `docs/规范.md` 已建；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 4 - 沙箱与样式隔离实验并沉淀规范"`

---

## Phase 5 · 应用间通信（登录用户 + 主题联动）

> **状态：⬜ 未开始**（无 `main-app/src/micro/actions.ts`，全局状态未接）。
>
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
import { reactive } from 'vue'

// 由 qiankun 注入的全局状态（订阅回调里更新）
export const globalState = reactive({
  user: '',
  theme: 'default' as string,
})

// mount(props) 里由 main.ts 赋值
export const actions: { setGlobalState?: (state: Record<string, unknown>) => void } = {}
```

> ⚠️ 这里**故意不写** `import type { MicroAppStateActions } from 'qiankun'` —— `app-vue/package.json` 里**没有 `qiankun` 依赖**（子应用不该依赖基座框架），那样写会直接 `TS2307: Cannot find module 'qiankun'`。
> 想让类型更精确，二选一：
> 1. 用上面这种**手写函数类型**（零依赖，推荐）；
> 2. 给 app-vue 装纯类型依赖 `npm i -D qiankun`，然后才可以用 `import type { MicroAppStateActions } from 'qiankun'`（该类型确实由 qiankun 的 `interfaces` 导出）。

**step 2**：`app-vue/src/main.ts` 里，在 `renderWithQiankun.mount` 中注册订阅、在 `unmount` 中注销。

> 注意配对关系是"**每次 mount 注册一次 ↔ 对应那次 unmount 取消**"，不是"全局只注册一次"。否则第一次切走就把订阅注销了、第二次切回来就收不到状态更新（这是本 Phase 最常见的坑）。

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

  // 保存 setGlobalState，供"退出"这类反向操作使用（每次挂载都由基座重新注入）
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
  update() {}, // 四个生命周期必须齐全，否则 vue-tsc 报 TS2345（见 0.5 勘误）
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
import { computed } from 'vue'
import { globalState, actions } from './micro-global'

const userName = computed(() => globalState.user)

function logout() {
  // 反向操作：主应用是唯一写入方，这里只是"申请变更"，仍然走 setGlobalState
  actions.setGlobalState?.({ user: '' })
}
</script>

<template>
  <div class="app-vue">
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
/* 主题色不由子应用自己算：--brand-color 是基座下发、沿 DOM 继承进来的（见下方说明） */
.vue-header { display: flex; gap: 8px; align-items: center; padding: 8px; background: color-mix(in srgb, var(--brand-color) 15%, white); }
</style>
```

> **主题色为什么不走 `globalState`？** 因为 **CSS 自定义属性会沿 DOM 树继承**：子应用挂载在主应用的 `#micro-container-vue` 里，而这个容器在主应用 `.layout[data-theme]` 内部 —— 基座定义的 `--brand-color`（见 5.2）对子应用元素天然可见。于是切 `data-theme` 时子应用自动变色，一行 JS 都不用写；4.2 学的那套"样式隔离"也**并不妨碍继承**（隔离的是选择器作用范围，不是继承链）。
> 前提：子应用自己别在根节点上重定义 `--brand-color`，否则就断开继承了。
> 需要"主题值本身"参与逻辑（比如换图标、换文案）时，再读 `globalState.theme`（5.1 已定义）。

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

> ⚠️ 无论这里以何种方式接线 `index.js`，请**保留 Phase 2 加入的 `MicroHistoryGuard`**（组件及其 `<MicroHistoryGuard />` 用法），否则 Phase 2 刚解决的"列表/详情页切不走子应用"（SecurityError）会回归。

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

> ⚠️ **上面这个写法有循环依赖**：`index.js` 头部 `import App from './App'`，而 `App.jsx` 又 `import { globalStore } from './index'`。ESM 下它能跑（因为 `globalStore` 是在组件**渲染时**才被读取的），但很脆：只要你在某个模块顶层用到 `globalStore`，就会读到 `undefined`（那一刻 `index.js` 还没执行到定义处）。
> 更稳的写法是把 store 抽成独立文件：
> 1. 新建 `app-react/src/global-store.js`，内容就是上面那个 `globalStore` 对象；
> 2. `index.js` 与 `App.jsx` 都改成 `import { globalStore } from './global-store'`。
>
> 「退出」按钮如需放 React 侧，同样调用 `props.setGlobalState({ user: '' })`（在 `mount` 里把它存到 `globalStore`），参照 app-vue 的做法即可。

### 5.5 验证顺序

1. 8080 顶栏输入用户名登录 → 切到「Vue 子应用」「React 子应用」，两端页头都显示该用户名（证明跨技术栈共享）；
2. 在 app-vue 点「退出」→ 主应用顶栏与 React 端同步清空；
3. 点「切换主题」→ 主应用 `data-theme` 变化，app-vue 页头底色随之变化（靠 CSS 变量**继承**，子应用不需要订阅），且 **React 端不被串样式**；
4. 反复切走/切回子应用几次，Console 无"重复订阅"现象。

### ✅ Phase 5 验收

- [ ] 登录后两个子应用同时显示用户名；
- [ ] 任一子应用登出，三端同步；
- [ ] 主题切换三端联动且样式不互相污染；
- [ ] 规范.md 补上通信命名约定（`域:动作`，如 `auth:logout`）；
- [ ] git 提交：`git add -A && git commit -m "feat: phase 5 - 跨应用通信（用户/主题 globalState）"`

---

## Phase 6 · 工程化演进（demo → 模板）

> **状态：⬜ 未开始**（无 `main-app/.env`、无 loading/容错、无根 README）。
>
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

> **关于类型**：`main-app/tsconfig.app.json` 里已经写了 `"types": ["vite/client"]`，所以**不需要**再新建 `src/vite-env.d.ts`（这是常见误解）。
> 但 `import.meta.env.VITE_*` 默认只被推断成 `any`/`string | undefined`，想让自定义变量有准确类型，扩展 `ImportMetaEnv` 接口即可（新建 `main-app/src/env.d.ts`）：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MICRO_VUE_ENTRY?: string
  readonly VITE_MICRO_REACT_ENTRY?: string
}
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
    // 钩子类型是 (app, global) => Promise<any>，必须返回 Promise，所以都要 async
    beforeLoad: [async (app) => console.log('[qiankun] beforeLoad:', app.name)],
    beforeMount: [async (app) => console.log('[qiankun] beforeMount:', app.name)],
    afterMount: [async (app) => console.log('[qiankun] afterMount:', app.name)],
    afterUnmount: [async (app) => console.log('[qiankun] afterUnmount:', app.name)],
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

### 6.3 加载体验：loading 骨架

先说清一个**常见错误做法**：在 `MicroSlot.vue` 里 `onMounted(() => setTimeout(() => (loading.value = false), 0))` —— 这跟 qiankun 的加载进度毫无关系，它只是"把状态延后一拍关掉"，既不准确也没意义。

正确做法是让 qiankun 的 `loader` 驱动状态。**注意 `loader` 不是 `start()` 的参数，而是"每个子应用自己的配置"**：

```12:76:main-app/node_modules/qiankun/es/apis.js
    var name = app.name,
      activeRule = app.activeRule,
      _app$loader = app.loader,
      loader = _app$loader === void 0 ? _noop : _app$loader,
```

它被调用的时机也很明确（同文件）：开始加载子应用时 `loader(true)`、**每次**挂载前 `loader(true)`、挂载钩子跑完 `loader(false)`。

分三步接上：

**step 1**：新建 `main-app/src/micro/loading.ts`（一个极简共享状态，谁都能读写）：

```ts
import { ref } from 'vue'

// 正在加载的子应用名（null = 当前没有应用在加载）
export const loadingApp = ref<string | null>(null)
```

**step 2**：在 `main-app/src/micro/apps.ts` 里给每个应用配上 `loader`（`getMicroApps()` 内部）：

```ts
import { loadingApp } from './loading'

// 接口记得补上这一项
// loader?: (loading: boolean) => void

export function getMicroApps(): MicroAppItem[] {
  // ...vueEntry / reactEntry 的取值同 6.1 step 2
  return [
    {
      name: 'app-vue', entry: vueEntry, container: '#micro-container-vue', activeRule: '/vue',
      loader: (loading) => { loadingApp.value = loading ? 'app-vue' : null },
    },
    {
      name: 'app-react', entry: reactEntry, container: '#micro-container-react', activeRule: '/react',
      loader: (loading) => { loadingApp.value = loading ? 'app-react' : null },
    },
  ]
}
```

**step 3**：`main-app/src/views/MicroSlot.vue` 显示骨架：

```vue
<script setup lang="ts">
import { loadingApp } from '../micro/loading'
</script>

<template>
  <div class="micro-slot">
    <p v-if="loadingApp" class="loading">{{ loadingApp }} 加载中…</p>
  </div>
</template>

<style scoped>
.loading { color: #999; }
</style>
```

> 两个注意点：
> 1. `loader` 会被**多次调用**（一次进入子应用可能连来几个 true/false），回调里只做改 `ref` 这种轻量操作；
> 2. 因为 `prefetch: 'all'` 会提前把子应用的 HTML/JS 拉好，**首次进入时骨架可能一闪而过甚至看不到** —— 想验证效果，先把 `prefetch` 去掉对比一次。

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

> **状态：⬜ 未开始**（无 `deploy/`，各应用 README 未写）。
>
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
>
> 关于 `qiankun('app-vue', { useDevMode: true })`：**构建时它不生效，也不用改成 false**。插件源码里这个选项只用于 dev 分支（`if (microOption.useDevMode && !isProduction)`，见 `vite-plugin-qiankun/es/index.js` 的 `module2DynamicImport`）：dev 下要给动态 import 拼上 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 前缀才能找到模块，build 产物则直接用 `/assets/xxx` 的根路径。插件**始终**会把 `<script type="module">` 改写成 inline 的 `import('...')`，所以配置里一直写 `useDevMode: true` 是安全的。

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
| 从 React 列表/详情切走报 `SecurityError ... 'http://localhost:8080undefined/'` | React Router 覆盖 history.state，vue-router 拼 URL 出错 | 2.1（MicroHistoryGuard） |
| 子应用样式污染基座 | 子应用写了**非 scoped 的全局选择器**（根因）；`experimentalStyleIsolation` 只兜底静态 `<style>`，救不了 Vite 运行时注入的样式 | 4.2 |
| 全局变量泄漏到主应用 | 两种情况：① 误设 `sandbox:false`；② `app-vue` 是 Vite-ESM，业务代码本来就跑在真 window 上（不是 bug） | 4.1 |
| globalState 不更新 | 没在 `mount` 里注册订阅；或注册了、`unmount` 注销后切回来没重新注册；或重复订阅。`fireImmediately=true` 只决定"注册时是否立刻回调一次当前值" | 5.3 / 5.4 |
| 子应用加载骨架不消失 | `loader` 写成了 `start({ loader })` —— 它是**每个子应用**的配置项，不是 `start` 的参数 | 6.3 |
| `npm run build`（`vue-tsc -b`）报 TS 错误 | 四类常见：`'X' is declared but its value is never read`（未使用变量）、`TS2345`（少给 `update` 生命周期）、`TS2322`（钩子写成非 Promise）、`TS2349`（`vite-plugin-qiankun` 在 `nodenext` 下不可调用）—— 逐条对应见 0.5 勘误表 | 0.5 |
| `import.meta.env.VITE_*` 类型不准 | tsconfig 已含 `"types": ["vite/client"]`（不需要 `vite-env.d.ts`）；想要准确类型得扩展 `ImportMetaEnv` | 6.1 |
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
| Node | Vite 8.2.2 的 `engines` 要求 `^20.19.0 \|\| >=22.12.0`，建议直接用 22 LTS |
| React | app-react 实装 19.2.8（设计文档原规划 18，API 兼容，无碍） |
| vite-plugin-qiankun | 已锁定 `1.0.15`（1.1 节）；`renderWithQiankun` / `qiankunWindow` 在 `dist/helper` 与 `es/helper`，两者都带 `.d.ts`。该包本质是"HTML 改写器"：把 `<script type="module">` 换成 inline `import('...')`，并靠 `window.proxy.viteXXX` 桥接生命周期 |
| qiankun | main-app 用 npm latest（2.x） |
| 部署形态 | 采用"跨端口站点"方案；同域子路径为选学 |
