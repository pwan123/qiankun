# Qiankun 微前端学习项目 · 详细设计文档

> 文档目的：为「从零搭建一套 Qiankun 微前端」提供一份**可一步一步照着执行**的路线图与设计说明。
> 本文只做设计与规划，不写业务代码；实施时按阶段产出代码。
> 读者画像：前端工程师，熟悉 Vue/React，对 Qiankun 仅有大致的宏观了解，希望**先理解原理、再演进为可落地工程模板**。

---

## 目录

- [0. 文档信息与约定](#0-文档信息与约定)
- [1. 项目背景与目标](#1-项目背景与目标)
- [2. 总体架构设计](#2-总体架构设计)
- [3. Qiankun 核心机制预习（动手前必读）](#3-qiankun-核心机制预习动手前必读)
- [4. 分阶段实施路线（主干）](#4-分阶段实施路线主干)
- [5. 关键设计蓝图（各应用改造要点）](#5-关键设计蓝图各应用改造要点)
- [6. 本地 Nginx 部署方案（如何本地部署）](#6-本地-nginx-部署方案如何本地部署)
- [7. 里程碑验收清单](#7-里程碑验收清单)
- [8. 开放决策点（实施前请拍板）](#8-开放决策点实施前请拍板)
- [9. 参考资源](#9-参考资源)
- [附录 A：Phase 0 手动初始化 app-react 操作手册](#附录-a-phase-0-手动初始化-app-react-操作手册)

---

## 0. 文档信息与约定

| 项目 | 内容 |
| --- | --- |
| 日期 | 2026-09 |
| 状态 | 待评审（评审通过后按 Phase 推进） |
| 包管理器 | pnpm 或 npm 均可（三个应用**互相独立安装依赖**，不使用 workspace hoisting，理由见 2.3） |
| Node | 20 LTS 及以上 |
| 版本策略 | 文档标注“以 npm latest / 官方模板为准”，避免固化过时版本号 |

### 阅读与使用约定

1. 每个 **Phase** 都是一个可独立验证的里程碑，建议每完成一个 Phase 打一次 git commit。
2. 每个 Phase 末尾有「✅ 本阶段验收点」，全部满足才算完成。
3. 文中所有「关键代码示意」仅为设计蓝图的速写，正式实现时由实施文档给出可运行版本。

---

## 1. 项目背景与目标

### 1.1 动机

- 通过亲手搭建，搞懂微前端解决什么问题、Qiankun 在其间扮演什么角色；
- 通过「最小 demo → 工程化演进」两条腿走路：先用最小成本理解原理，再把架子长成可复用的工程模板。

### 1.2 学习目标（学完应能回答）

| 编号 | 目标 |
| --- | --- |
| K1 | 能讲清微前端 vs iframe、qiankun vs single-spa 的关系 |
| K2 | 能说清 HTML Entry、JS Entry 的加载过程，并解释为什么子应用要暴露生命周期 |
| K3 | 能说出 `bootstrap / mount / unmount` 被调用的时机与责任 |
| K4 | 能解释 JS 沙箱原理（Proxy 沙箱）与 CSS 隔离两种策略的取舍 |
| K5 | 能独立完成：给任意一个既有 Webpack 工程 / Vite 工程接入 Qiankun |
| K6 | 掌握主应用与子应用之间路由联动、数据通信的标准做法 |
| K7 | 能完成本地 Nginx 部署，处理 history 路由刷新 404、跨域、publicPath 三类问题 |

### 1.3 交付物

1. 三套可独立运行、可被主应用挂载的应用：`main-app`（Vue3+Vite）、`app-vue`（Vue3 子应用）、`app-react`（React 子应用）；
2. 一套覆盖「注册 / 路由联动 / 沙箱 / 样式隔离 / 通信 / 加载态 / 预加载 / 错误处理」的完整 demo；
3. 一份本地 Nginx 部署配置模板与部署说明（`deploy/` 目录）；
4. 全程沉淀的踩坑记录（每个 Phase 附「常见坑」，实施后补充到项目 README）。

### 1.4 设计原则

1. **先跑通、再抠细节**：每个子应用先保证「独立运行 OK」，再谈被挂载；
2. **两种接入形态都演示**：Webpack-UMD（Qiankun 官方标准，原理最透明）与 Vite+插件（现代工程形态）各用一个子应用覆盖，见 2.4；
3. **代码可回退**：阶段推进以 git 分支/提交为界；
4. **隔离与共享并重**：demo 场景同时覆盖「必须隔离」的样式/全局变量与「必须共享」的用户态/主题。

---

## 2. 总体架构设计

### 2.1 系统架构

```text
┌────────────────────────────────────────────────────────────┐
│                    浏览器  (http://localhost:8080)          │
│                                                            │
│  main-app  Vue3 + Vite  (基座)                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ 主应用布局：顶部导航 / 侧边菜单 / 内容容器        │          │
│  │   │  /home       主应用自身页面                    │          │
│  │   │  /vue/*      → 挂载容器 <div id="micro-...">   │          │
│  │   │  /react/*    → 挂载容器                        │          │
│  │   │  ┌────────────  qiankun runtime ───────────┐  │          │
│  │   │  │ registerMicroApps + start(...)          │  │          │
│  │   │  │ HTML Entry fetch → 沙箱 → 生命周期       │  │          │
│  │   │  │ initGlobalState(通信) / prefetch / 容错   │  │          │
│  │   │  └──────────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────────┘          │
└───────────────────────────┬────────────────────────────────┘
                路由匹配 | fetch HTML/JS
        ┌───────────────────┴────────────────────┐
        ▼                                        ▼
┌────────────────────┐              ┌────────────────────────┐
│ app-vue   Vue3+Vite │              │ app-react  React18+Webpack5│
│ dev:8081  /vue 前缀  │              │ dev:8082  /react 前缀      │
│ Vite+插件形态(ESM)    │              │ UMD 形态(官方标准)          │
│ 生命周期 + 独立运行    │              │ 生命周期 + 独立运行         │
└────────────────────┘              └────────────────────────┘
        ▲                                        ▲
        └──────────── 本地 Nginx 部署（第 6 章）────┘
        deploy/html/{main-app,app-vue,app-react}
```

### 2.2 应用清单与端口 / 路由规划

| 应用 | 技术栈 | 角色 | dev 端口 | 部署端口(nginx) | 路由前缀 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| `main-app` | Vue3 + Vite + vue-router + qiankun | 基座 | 8080 | 8080 | `/`（自身页面用 `/home` 等） | 持有注册表、全局状态 |
| `app-vue` | Vue3 + Vite + vite-plugin-qiankun + vue-router | 子应用① | 8081 | 8081 | `/vue` | 演示 Vite-ESM 接入形态 |
| `app-react` | React18 + Webpack5（手动配置）+ react-router | 子应用② | 8082 | 8082 | `/react` | 演示官方 UMD 接入形态 |

端口约定说明：

- dev 端口与部署端口**复用同一组**，便于记忆；若需「dev 与部署同时跑」对比，临时改动任一端口即可；
- 子应用 dev server 一律开启 `cors: true`（原因：基座运行时通过 fetch 拉取子应用 HTML Entry，属跨域请求）。

### 2.3 目录结构规划

```text
d:\study\qiankun\
├─ docs\
│  └─ qiankun-微前端学习项目设计文档.md      ← 本文档
├─ main-app\            # 基座（独立工程）
│  ├─ src\
│  │  ├─ main.ts                 # 创建 Vue 实例；启动 qiankun
│  │  ├─ App.vue                 # 布局骨架
│  │  ├─ router\index.ts         # 主应用路由
│  │  ├─ micro\
│  │  │  ├─ index.ts             # registerMicroApps / start
│  │  │  ├─ apps.ts              # 应用注册表（名称/entry/container/activeRule）
│  │  │  ├─ actions.ts           # initGlobalState 封装
│  │  │  └─ loader.vue           # 子应用挂载容器页（含 loading 态）
│  │  └─ styles\
│  └─ vite.config.ts
├─ app-vue\             # Vue3 子应用（独立工程）
│  ├─ src\
│  │  ├─ main.ts                 # 导出 bootstrap/mount/unmount
│  │  ├─ App.vue
│  │  ├─ router\index.ts         # base = '/vue'
│  │  └─ qiankun.d.ts            # 类型声明
│  └─ vite.config.ts             # vite-plugin-qiankun 接入
├─ app-react\           # React 子应用（独立工程）
│  ├─ src\
│  │  ├─ index.js                # 导出 bootstrap/mount/unmount
│  │  ├─ App.jsx
│  │  └─ router\                 # base = '/react'
│  ├─ webpack.config.js          # UMD 输出 + devServer
│  └─ babel.config.js
└─ deploy\
   ├─ html\
   │  ├─ main-app\               # 构建产物（gitignore）
   │  ├─ app-vue\
   │  └─ app-react\
   └─ nginx.conf                 # 本地部署配置模板（第 6 章）
```

**为什么不做 monorepo/workspace？**

- 真实微前端中，各应用常由不同团队、不同仓库独立交付；依赖提升（hoisting）会让「某个包被意外共享」而掩盖问题；
- 学习阶段，三个工程互相独立（各自 `node_modules`、各自 `dev/build` 命令），能让你亲身体会「子应用必须是自包含产物」这一约束；
- 后续若想演进为 pnpm workspace，仅改动目录组织即可，不影响本文设计。

### 2.4 技术选型与决策记录（DR）

| 决策点 | 选择 | 理由 | 备选 |
| --- | --- | --- | --- |
| 基座 | Vue3 + Vite | 用户指定；主应用构建无特殊约束，Vite 体验好 | — |
| 子应用① | Vue3 + Vite + `vite-plugin-qiankun` 系插件 | 现代工程形态；演示“非 Webpack 子应用也能接入” | 若插件不满足生产要求，可退化为 Webpack 构建（见 4.Phase7 风险预案） |
| 子应用② | React18 + Webpack5 手动配置 | Qiankun 官方标准是 **UMD 全局变量** 形态；亲手写一遍 `output.library` 才能真懂加载协议 | CRA + craco；React19（示例偏少，本期不用） |
| 子应用构建形态 | ①ESM+插件  ②UMD 各一 | 覆盖社区两大主流接入姿势，教学收益最大 | 两个都 Webpack |
| 应用通信 | `initGlobalState`（官方）+ props 注入 | 官方能力、有响应式、有显式 API | 自定义事件/消息总线（文档 5.6 给约定） |
| 沙箱 | 默认开启（Proxy 沙箱） | 不关闭沙箱，才能学到沙箱行为 | 实验阶段可临时 `sandbox:false` 对比 |
| 样式隔离 | 先不开启 → 演示冲突 → 再开 `experimentalStyleIsolation` | 教学顺序：先看到问题，再引入方案 | `strictStyleIsolation`（shadow DOM，副作用大，仅了解） |
| 部署 | 跨端口部署（每个应用一个独立站点 + CORS） | 更接近真实「不同服务」部署；同域子路径部署作为选学进阶 | 同域子路径 + nginx alias |

> ⚠️ 版本时效提示：本方案涉及的第三方插件（`vite-plugin-qiankun`）维护活跃度波动大，2026-09 时点请优先选择 npm 上「最近发布且 issues 响应正常」的 fork/替代包（搜索关键词：`vite-plugin-qiankun`，可对比 `tengmaoqing/vite-plugin-qiankun`、`@tiny-codes/vite-plugin-qiankun`、`shijistar/vite-plugin-qiankun` 等）。**实施第一步就是锁定并记录所选插件的版本**。

### 2.5 关键技术风险与对策

| 风险 | 说明 | 对策 |
| --- | --- | --- |
| Vite 子应用是 ESM，qiankun 原生加载 IIFE/UMD | 直接打包 ESM 会加载失败 | 用 `vite-plugin-qiankun`；vite 配置 `build.target`、入口不输出 `type=module` 等细节在 Phase 2 细化 |
| history 路由刷新 404 | dev server 会自动回退，真实服务器不一定 | 第 6 章 nginx `try_files`；子应用 router `base` 必须正确 |
| 子应用样式污染基座 | 未隔离时全局样式互相影响 | 教学故意暴露，再开隔离；约定子应用样式全部写在局部作用域（scoped / css-module） |
| 公共依赖被重复下载 | 每个子应用自包含 node_modules | 可接受；Phase 7 讨论 externals/预共享策略（选学） |
| 插件维护风险 | vite-plugin-qiankun 停更 | 锁版本、留 Webpack 退路、把「插件接入」收敛到子应用单文件，便于替换 |

---

## 3. Qiankun 核心机制预习（动手前必读）

> 设计理念：**先有正确的心智模型，再动手写代码**。本节只讲概念，第 4 章逐步落地时逐条对应。

### 3.1 为什么需要微前端？为什么不是 iframe？

- iframe 的问题：上下文隔离（通信别扭）、URL 不同步（刷新/前进后退丢失）、弹窗/遮罩层跑偏、性能与首屏成本、SEO 差。
- 微前端（single-spa / qiankun）的思路：**浏览器里只有一个真正的应用在跑**（当前激活的子应用），它由主应用负责调度，通过约定的生命周期协议接入，从而获得近乎原生 SPA 的体验 + 跨技术栈 + 独立开发部署。

### 3.2 Qiankun 与 single-spa

- qiankun 是基于 single-spa 的上层封装，内置了 single-spa 没解决的痛点：
  1. **HTML Entry**（single-spa 用 JS Entry，需手写一堆配置）；
  2. **样式隔离**（single-spa 不管 CSS）；
  3. **JS 沙箱**（single-spa 不管全局变量污染）；
  4. 通信（`initGlobalState`）、预加载等。
- 一句话：qiankun = single-spa 的“开箱即用版”，理解 qiankun 时可以直接复用 single-spa 的加载模型心智。

### 3.3 HTML Entry 与 JS Entry

- **JS Entry**：注册时给一个 JS 地址，应用框架自己约定全局生命周期。缺点：主应用要知道子应用的打包细节（webpack externals、vendor 拆分等）。
- **HTML Entry（qiankun 默认）**：给一个 **HTML 地址**（如 `//localhost:8081`），qiankun 启动时：
  1. fetch 该 HTML；
  2. 解析出里面的 `<script>`、`<link>`、`<style>`；
  3. 把 JS/CSS 拉下来后**在沙箱里按顺序执行**；
  4. 若该应用暴露了全局生命周期（`bootstrap/mount/unmount`），就把它们注册到调度器。
- 心智模型：**子应用在 qiankun 眼里就是一个“HTML URL”，主应用负责 fetch + 解析 + 沙箱执行**。

### 3.4 生命周期协议（子应用必须暴露）

```text
bootstrap(主应用首次加载子应用时执行一次)
   → mount(每次激活/切回时执行，负责挂载 DOM、启动路由)
   → unmount(每次切走时执行，负责卸载 DOM、销毁实例、清理副作用)
```

- Webpack-UMD 子应用：把三个函数挂到 `window[子应用名]` 上（由 `output.library` 产生）；
- Vite+插件子应用：由插件把入口导出改造成生命周期导出；
- 基座通过 `props` 把主应用上下文（含 `setGlobalState` 等）注入给子应用生命周期。

### 3.5 JS 沙箱

- 目的：让子应用运行期间的 `window.xxx = ...` 不影响基座与其他子应用。
- 单实例沙箱（`legacySandbox`）：进入时基于 `window` 快照，退出时还原；
- **多实例代理沙箱（默认 `ProxySandbox`）**：每个子应用拿到一个 **proxy 化的假 window**，读操作代理到真 window，写操作落在自己上下文里，切走后不污染全局；
- 实验抓手：`window.__POWERED_BY_QIANKUN__`（标识当前是否被 qiankun 托管）也来自沙箱环境。

### 3.6 CSS 隔离

| 策略 | 做法 | 代价 |
| --- | --- | --- |
| 不隔离（默认） | 子应用 `<style>` 直接注入 | 可能互相污染 |
| `experimentalStyleIsolation` | 给子应用样式选择器加 `div[data-qiankun="app名"]` 前缀 | 需要子应用挂载在单根节点下；运行时前缀处理有开销 |
| `strictStyleIsolation` | 每个子应用一个 shadow DOM | 隔离最彻底，但弹窗/子应用间共享样式、字体图标受影响 |

### 3.7 应用间通信（GlobalState）

```text
主应用 initGlobalState(state) → actions
  ├─ actions.setGlobalState(patch)        // 推送变更（单向数据流）
  ├─ actions.onGlobalStateChange(cb, fireImmediately)  // 订阅
  └─ 子应用在 mount(props) 里拿到 props.onGlobalStateChange / setGlobalState
```

设计要点：**数据收敛在主应用**，子应用只通过回调/事件“申请变更”，避免互相直改。

### 3.8 路由集成（History 模式）

- 基座：`activeRule` 用路径前缀匹配（`/vue`、`/react`），命中则激活对应子应用；
- 子应用：独立维护自己的 vue-router/react-router，`base` 必须等于其在基座中的前缀；
- 整站只有一个 URL（history API），刷新时由服务端把路径回退到 `index.html`（第 6 章）；
- 心智模型：**子应用的路由是“挂在”基座路径前缀之下的子树**。

---

## 4. 分阶段实施路线（主干）

> 每个 Phase 给出：目的 / 覆盖的知识点(对应 K1–K7) / 实施步骤 / 验收点 / 常见坑 / 预估耗时。
> 预估耗时按「有 Vue/React 基础、边查边做」估算。

### Phase 0 · 环境准备与三套独立工程（约 1–2 小时）

**目的**：先把三个“互不相干”的工程跑起来，为后面接入建立基线。

覆盖知识点：无（纯基建）。

实施步骤：

1. 检查环境：`node -v`（≥20）、包管理器版本；
2. 建目录骨架（按 2.3），根目录初始化 git；
3. 创建 `main-app`：`pnpm create vite main-app --template vue`（选用 TS 以贴近工程化）；
4. 创建 `app-vue`：`pnpm create vite app-vue --template vue`；
5. 创建 `app-react`：**不用 CRA**，手动初始化 `package.json` + Webpack5 + babel（依赖清单见 5.3，完整操作手册见附录 A），先让它独立跑通一个 React 页面；
6. 三个应用分别固定端口（见 2.2），子应用 devServer 开启 `cors: true`；
7. 各自补最小路由：`app-vue` 的 router 先不加 `base`（独立运行阶段不需要），`app-react` 同理。

✅ 验收点：

- [ ] 8080 / 8081 / 8082 三个地址独立打开均正常；
- [ ] 任意一个应用热更新正常；
- [ ] 根目录已 git init，且已准备 `.gitignore`（含 `node_modules`、`dist`、`deploy/html`）。

常见坑：

- Vite 新模板默认端口为 5173，需在 `vite.config.ts` 固定 `server.port`；
- Windows 下若端口被占用，`netstat -ano | findstr 端口` 排查。

### Phase 1 · 最小接入：基座挂载 Vue 子应用（核心，约 2–3 小时）

**目的**：实现第一个「Hello Qiankun」——从主应用点菜单，在容器里渲染出 `app-vue`。这是理解整套加载协议的关键一战。

覆盖知识点：K2、K3。

实施步骤：

1. **子应用侧（app-vue）**
   - 安装并启用 `vite-plugin-qiankun`（先锁定版本）；
   - 改造 `src/main.ts`：导出 `bootstrap/mount/unmount`；用 `__POWERED_BY_QIANKUN__` 判断：被托管时**不自动 `app.mount`**，由 qiankun 的 `mount` 里调用；`unmount` 里调用 `app.unmount()`；
   - vite 配置：`base` 设为本应用地址形态（dev 阶段保持默认，后续第 6 章再统一）；插件与 devServer `cors`；
   - 写一个业务页面 + 一个子页面，用于后续验证子路由。
2. **基座侧（main-app）**
   - 安装 `qiankun`；
   - 写 `micro/apps.ts`：注册表第一行——`{ name: 'app-vue', entry: '//localhost:8081', container: '#micro-container-vue', activeRule: '/vue' }`；
   - 写 `micro/index.ts`：`registerMicroApps(apps)` + `start()`；
   - 基座路由加一条 `/vue/:pathMatch(.*)*` 渲染挂载容器页（否则主应用路由会 404）；
   - 布局里加导航：首页 / Vue 子应用。
3. 在生命周期三个函数里打 `console.log`，用于观察时序。

✅ 验收点：

- [ ] 从 8080 点「Vue 子应用」，容器内出现 app-vue 首页；
- [ ] 控制台依次出现 `bootstrap → mount` 日志（首次），切走再切回只有 `mount`；
- [ ] 切走后 DOM 被卸载（Elements 面板里容器为空）；
- [ ] 子应用仍可独立访问 8081 正常使用。

常见坑：

- 子应用忘了「托管时不自动挂载」→ 出现双实例 / “already mounted” 报错；
- Vite 子应用入口 ESM 问题 → 检查插件是否生效、入口是否正确导出生命周期；
- `container` 写错 → 报找不到挂载节点；
- 端口/跨域 → 子应用 devServer 未开 `cors` 导致 fetch HTML 失败。

### Phase 2 · 接入第二个子应用：React（Webpack-UMD）（约 2–3 小时）

**目的**：用官方标准姿势再走一遍接入流程，同时把「webpack 打包配置与 qiankun 加载协议」的关系看透。

覆盖知识点：K2、K3、K5。

实施步骤：

1. **子应用侧（app-react）**
   - 在 Phase 0 的手动 Webpack 工程上改造 `webpack.config.js`（要点见 5.3）：`output.library`、`libraryTarget: 'umd'`、`globalObject`、`chunkLoadingGlobal`、`publicPath`、devServer 跨域；
   - `src/index.js`：入口**先判断独立运行**（`__POWERED_BY_QIANKUN__`），是则自行 `createRoot().render()`；再按需导出 `bootstrap/mount/unmount`，`mount` 里挂载 React 应用，`unmount` 里 `root.unmount()`；
   - 子路由加 `base: '/react'`。
2. **基座侧（main-app）**
   - `apps.ts` 增加第二行注册（`entry: '//localhost:8082'`，`activeRule: '/react'`）；
   - 主布局新增 React 子应用入口；路由表新增 `/react/:pathMatch(.*)*` 容器页；
   - 让两个子应用同时可切换。
3. 打开 Network 面板，观察：切到 app-react 时基座 fetch 了哪些 HTML/JS/CSS。

✅ 验收点：

- [ ] 基座内可来回切换 Vue / React 两个子应用且互不干扰；
- [ ] 子应用内部二级路由可跳转（如 `/vue/child`）；
- [ ] Network 中能看到 `//localhost:8082` 的 HTML/资源请求；
- [ ] 两个子应用独立访问仍然正常。

常见坑：

- UMD 包在沙箱下拿不到 `window` → 需要 `output.globalObject: 'window'`（否则 SSR 相关代码会炸）；
- html-webpack-plugin 把入口又打进了 HTML → 需排除（该 HTML 只作为独立运行时用）；
- 生命周期函数名被压缩 → 不要压缩这些导出（或用约定名精确导出）。

### Phase 3 · 路由联动与激活规则深挖（约 2 小时）

**目的**：搞清楚「谁在控制 URL」「刷新 / 前进后退 / 子应用内部跳转」如何协同。

覆盖知识点：K3、K8（路由心智模型）。

实施步骤：

1. 给 `app-vue` 增加二级路由（如 `/vue/list`、`/vue/detail/:id`），在子应用内部互相跳转；
2. 测试并记录：子应用内跳转后主应用地址栏变化；在 `/vue/list` 直接刷新；
3. 在主应用「菜单高亮」与「激活路由」联动（用 `useRoute` 监听当前路径判断激活项）；
4. 实验对比：把某个子应用的 `activeRule` 临时改成 `/vue` 以外的规则，观察不匹配时的行为；
5. 用 `addGlobalUncaughtErrorHandler` 或 `micro/index.ts` 中的 `loader` 回调打印加载/挂载进度，理解调度时序。

✅ 验收点：

- [ ] 子应用内前进/后退/刷新全部正常，URL 始终符合 `/vue/...`、`/react/...` 形态；
- [ ] 主应用菜单高亮与子应用路由联动；
- [ ] 能解释：为什么子应用 router `base` 必须等于 activeRule 前缀。

常见坑：

- 子应用 router 忘了 `base` → 子应用内跳转路径变成根路径，刷新后 404；
- 主应用路由与子应用 activeRule 冲突 → 主应用不要再为 `/vue/xxx` 定义自己的页面组件。

### Phase 4 · 沙箱与样式隔离实验（约 2 小时）

**目的**：用可观测的实验把 K4 变成“亲眼所见”，并建立工程规范。

覆盖知识点：K4。

实施步骤：

1. **JS 沙箱实验**
   - 在 app-vue 的某个页面 `window.__LEAK_ = 'vue-app'`，切到主应用/React 子应用后检查 `window.__LEAK_` 是否存在；
   - 开启/关闭沙箱对比（`start({ sandbox: false })`），记录差异；
   - 观察 `window.__POWERED_BY_QIANKUN__`、`window.proxy` 等沙箱产物。
2. **CSS 隔离实验**
   - 故意在 app-vue 写一条全局样式（如 `body { background: red }`），切到 React 子应用看是否被污染；
   - 再开启 `experimentalStyleIsolation: true`（`start({ sandbox: { experimentalStyleIsolation: true } })`），验证元素上出现 `data-qiankun` 前缀；
   - 讨论 `strictStyleIsolation`（shadow DOM）的适用与代价（可仅阅读文档，不必真开）。
3. **副作用清理实验**
   - 在子应用 mount 里开 `setInterval`，在 unmount 里不清，切走切回观察；再补上清理，验证内存不再累积（可用 Performance > Memory 录制）。

✅ 验收点：

- [ ] 能向他人讲清 Proxy 沙箱下「写隔离、读共享」的行为；
- [ ] 能演示样式污染发生与隔离后的差异；
- [ ] 全项目形成规范：子应用样式使用 scoped/CSS Module，禁止裸写全局样式。

常见坑：

- `experimentalStyleIsolation` 要求子应用挂载容器内**有且仅有一个根节点**，否则前缀加不上；
- 沙箱开启时，子应用若用 `document.write` 或同步加载外部脚本可能异常（本 demo 不会用到，知道即可）。

### Phase 5 · 应用间通信（约 2–3 小时）

**目的**：实现一个「登录用户 + 主题」的跨应用联动场景，吃透官方通信 API 与单向数据流约定。

覆盖知识点：K6。

场景设计：

- 主应用顶栏：模拟登录框（输入用户名 → 登录）→ 写入 globalState；
- app-vue：页头显示当前用户名；提供一个「退出」按钮；
- app-react：展示同一用户名（证明跨技术栈共享数据）；
- 主题联动：主应用切换主题色 → 通过 globalState 下发 → 各子应用用 **CSS 变量**（`--brand-color`）响应变化（同时体现「样式隔离下的样式共享」正道）。

实施步骤：

1. 基座封装 `micro/actions.ts`：`initGlobalState({ user, theme })`，暴露 `getActions()`；
2. 子应用在 `mount(props)` 中：
   - 初次渲染用 `props` 传入的用户/主题初始化；
   - 用 `props.onGlobalStateChange(cb, true)` 订阅变更；
3. 子应用内修改（如登出）：**回调主应用的动作**或直接 `setGlobalState`（遵循 5.6 的命名/流向约定）；
4. 主应用把 `setGlobalState / onGlobalStateChange` 通过 `props` 显式下传，同时演示「props 传静态配置」（如子应用名、环境标识）。

✅ 验收点：

- [ ] 主应用登录后，两个子应用顶栏同时出现该用户名；
- [ ] 任一子应用点「退出」，主应用与其他子应用同步更新；
- [ ] 切换主题色，三端视觉同步变化且互不串样式。

常见坑：

- 子应用在 `mount` 里才应订阅/读取全局状态，不要在模块顶层读取（首帧可能还没拿到 props）；
- `onGlobalStateChange` 不注销会导致重复订阅 → 在 `unmount` 时调用返回的 `off`。

### Phase 6 · 工程化演进（从 demo → 模板）（约 3–4 小时）

**目的**：把「能跑的 demo」整理成「敢拿去做真实项目」的架子，并补齐容错、加载体验、依赖治理。

覆盖知识点：K5、K7。

实施步骤：

1. **双模式开发约定**：每个子应用定义 `.env.micro` / `.env`（Vite）区分「独立运行」与「被托管」，入口文件统一走「先判断 `__POWERED_BY_QIANKUN__` 再决定是否自挂载」的写法；建立每个应用的 README，写明启动命令；
2. **加载体验**：基座 `start` 时传 `loader` 或容器页内做 loading 骨架；`prefetch: 'all'` 先打开，观察网络请求差异；
3. **容错**：`addGlobalUncaughtErrorHandler`（如子应用挂掉提示重试）；`start({ singular: false })` 与多实例 `loadMicroApp` 的对比实验（选学：了解非路由级手动加载）；
4. **注册表管理**：`apps.ts` 的 entry 地址改为读环境变量（dev 指向 localhost，部署指向第 6 章地址），避免硬编码；
5. **公共依赖治理（选学/可做最小演示）**：
   - 现状：Vue/React 及 UI 库被每个子应用重复打包 → 讨论用 Webpack `externals` + CDN 或 Vite 手动 `rollupOptions.external` 把公共库剔除，由基座提供；
   - 注意：这是双刃剑（版本耦合），本期只演示「Vue 由基座统一提供」在 app-vue 上的一种做法并记录结论，不强求两子应用都做；
6. **代码组织固化**：上文 Phase 4 形成的样式规范、Phase 5 的通信命名约定、错误码规范写进 `docs/规范.md`（或 README）；
7. 全程沉淀的踩坑记录统一收敛到根 README「踩坑日志」。

✅ 验收点：

- [ ] 三应用各自有清晰的 README 与启动/构建命令；
- [ ] 子应用加载有 loading、异常有兜底提示；
- [ ] 注册表 entry 通过环境变量切换 dev/部署地址；
- [ ] 能说出「公共依赖抽取」的收益与风险结论。

### Phase 7 · 本地 Nginx 部署（约 2–3 小时）

**目的**：验证生产构建 + 真实服务器行为（history 刷新、跨域、资源路径），并回答“本地部署怎么实现”这一问题。

覆盖知识点：K7（详细方案见第 6 章）。

实施步骤（详见第 6 章）：

1. 安装/启动本地 nginx；
2. 三个应用 `npm run build`，产物按 2.3 约定落入 `deploy/html/`；
3. 按 6.4 编写 nginx 配置（三个 server 块 + 跨域 + history 回退），reload；
4. 主应用注册表切到部署地址（环境变量）后，走全流程验证；
5. （选学）同域子路径部署对照实验。

✅ 验收点：

- [ ] 通过 nginx 访问主应用，切换两个子应用正常；
- [ ] 子应用二级路由下按 F5 刷新不 404；
- [ ] 控制台无跨域报错；
- [ ] 直接访问子应用站点独立可用。

---

## 5. 关键设计蓝图（各应用改造要点）

> 本节给出各应用的核心设计，均为“配置要点 + 速写”，不含完整业务代码。

### 5.1 基座 `main-app`

**依赖**：`vue`、`vue-router`、`qiankun`。

| 文件 | 职责与要点 |
| --- | --- |
| `src/micro/apps.ts` | 注册表数组。每个 item：`{ name, entry, container, activeRule, props? }`。entry 来自环境变量（见 5.5） |
| `src/micro/index.ts` | `registerMicroApps(apps, lifeCycles?)` → `start({ sandbox: { experimentalStyleIsolation }, prefetch })`；导出注册与启动为独立函数，由 `main.ts` 调用 |
| `src/micro/actions.ts` | 封装 `initGlobalState`；返回 `{ setGlobalState, onGlobalStateChange }` |
| `src/micro/loader.vue` | 子应用容器页：一个 `<div>` 容器 + loading 插槽；基座路由把 `/vue/:pathMatch(.*)*`、`/react/:pathMatch(.*)*` 指向它（内部再根据路径决定渲染哪个 container id） |
| `src/main.ts` | 创建 Vue 应用 → 挂 router → `microInit()`。注意：**主应用路由匹配到子应用前缀时，把导航从“页面”降级为“容器”** |

**基座路由设计速写**

```ts
// 意图说明：主应用只拥有 /home、/about 等自身页面；
// /vue、/react 前缀一律交给 qiankun（渲染容器页，由 activeRule 触发子应用）。
// 实现上：容器页组件内判断 route.path 前缀，仅渲染对应 container div。
const routes = [
  { path: '/home', component: Home },
  { path: '/vue/:pathMatch(.*)*', component: MicroContainer }, // 不写业务组件
  { path: '/react/:pathMatch(.*)*', component: MicroContainer },
];
```

### 5.2 子应用 `app-vue`（Vite + 插件形态）

**依赖**：`vue`、`vue-router`、`vite-plugin-qiankun`（锁定版本）。

| 文件 | 要点 |
| --- | --- |
| `vite.config.ts` | `server: { port: 8081, cors: true }`；启用插件并传入与基座注册一致的 **app 名**；入口改造由插件提供（`renderWithQiankun` 或等价的导出改造） |
| `src/main.ts` | 导出 `bootstrap/mount/unmount`（细节以所选插件 API 为准，一般形态：`mount(props)` 内 `createApp(...).use(router).mount(props.container)`）；`unmount` 内 `app.unmount()`；**独立运行时**（非 `__POWERED_BY_QIANKUN__`）走正常 `createApp().mount('#app')` |
| `src/router/index.ts` | `createWebHistory(import.meta.env.BASE_URL)`，其中 BASE_URL 最终为 `/vue/`；子应用内跳转与 `base` 配合（Phase 3 验证） |
| `src/qiankun.d.ts` | 声明 `window.__POWERED_BY_QIANKUN__` 等全局，便于 TS 编译 |

**插件选择清单（实施第一步）**：在 `tengmaoqing/vite-plugin-qiankun`（原版，发布停滞风险）与其活跃替代品之间对比 npm last publish、issues、README 示例的 Vue3 写法后锁定一个，并把版本写入 `package.json`。若最终发现插件无法满足部署形态要求，风险预案见 5.4 注。

### 5.3 子应用 `app-react`（Webpack5 + UMD 形态）

**依赖**：`react`、`react-dom`、`react-router-dom`（v6）+ 构建链：`webpack`、`webpack-cli`、`webpack-dev-server`、`babel-loader`、`@babel/core`、`@babel/preset-env`、`@babel/preset-react`、`html-webpack-plugin`、`css-loader`、`style-loader`。

`webpack.config.js` 要点（这是理解“官方标准接入协议”的核心，务必亲手配置）：

```js
// 要点速写（正式实现时给出完整可运行版本）
module.exports = {
  entry: { main: './src/index.js' },
  output: {
    path: distPath,
    filename: '[name].js',
    library: 'appReact',          // 全局变量名，也是基座识别生命周期的载体
    libraryTarget: 'umd',         // qiankun 期望的 UMD 形态
    globalObject: 'window',       // 防止 UMD 代码在非 window 环境下取 globalThis 出错
    jsonpFunction: 'webpackJsonp_app_react', // webpack5 已弃用，改用 chunkLoadingGlobal，需在 webpack5 下确认
  },
  devServer: {
    port: 8082,
    historyApiFallback: true,     // 支持子应用内二级路由刷新
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
};
```

`src/index.js` 生命周期速写：

```js
// 独立运行：直接挂载
if (!window.__POWERED_BY_QIANKUN__) { render(); }
// 被托管：导出生命周期，由 qiankun 调用
export async function bootstrap() {}
export async function mount(props) { render(props); }
export async function unmount() { root.unmount(); }
```

> 注：html-webpack-plugin 生成的 HTML 仅供“独立运行”使用；被 qiankun 托管时，基座 fetch 的是这个 HTML，但真正执行的是其引用的 UMD JS（也可按官方 demo 将生命周期入口与渲染入口分离为两个文件，避免把入口 JS 打进 HTML —— 实施时二选一并说明理由）。

### 5.4 风险预案：若 Vite 插件不可用

若 `app-vue` 所用插件在 Phase 2/7 暴露无法接受的缺陷：

1. 首选：换维护活跃的替代插件（同一套代码，仅改 vite 插件配置与入口改造方式）；
2. 兜底：`app-vue` 改造为 Webpack 构建（与 app-react 同一套 UMD 模式），把「接入差异」压缩在构建层；
3. 结论沉淀进根 README，便于以后真正做技术选型。

### 5.5 环境变量设计

| 变量 | 所属 | dev | 部署 | 说明 |
| --- | --- | --- | --- | --- |
| `MICRO_MODE` | 各子应用 | `standalone` / 空 | `micro` | 控制入口是否走生命周期导出（也可直接用 `__POWERED_BY_QIANKUN__` 判断，二者取其一，本期推荐运行时判断） |
| `MICRO_VUE_ENTRY` | 主应用 | `http://localhost:8081` | `http://localhost:8081` | 部署后由 6.4 的站点地址决定，统一放 `.env` 由 `import.meta.env` 读取 |
| `MICRO_REACT_ENTRY` | 主应用 | `http://localhost:8082` | `http://localhost:8082` | 同上 |

### 5.6 通信与事件命名约定（沉淀为规范）

- 全局状态只允许两层：主应用为**唯一写入方**（用户/主题），子应用通过「派发动作」请求变更；
- 状态变更由主应用统一 `setGlobalState`，子应用只 `onGlobalStateChange`；
- 若需要子应用主动上报，通过 props 注入的 `emit` 回调（基座注册时定义），事件名统一 `域:动作`，如 `auth:logout`、`ui:theme-change`。

---

## 6. 本地 Nginx 部署方案（如何本地部署）

> 回答：**不加服务器的“前端演示”无法暴露 history 刷新 404、真实跨域、资源前缀三类问题**；在 Windows 上起一个本地 nginx 即可完整体验，成本约一顿饭的时间。

### 6.1 为什么值得在本阶段做本地部署

| 开发态（vite/webpack-dev-server） | 真实服务器（nginx） |
| --- | --- |
| 自动把所有路径回退到 index.html | 需要显式配置 `try_files`，否则刷新 404 |
| 自动处理跨域头（配置后） | 需要显式加 CORS 头（子应用） |
| 资源按 dev server 地址拼接 | publicPath/base 直接影响产物能否被正确加载 |
| 端口随意 | 要规划「基座站点 + 每个子应用站点」 |

### 6.2 环境准备（Windows）

1. 下载 Nginx 稳定版 zip：<http://nginx.org/en/download.html>（选择 `nginx/Windows-xxx`）；
2. 解压到无中文、无空格路径，如 `D:\nginx-1.26.x`；
3. 常用命令（在解压目录执行）：
   - 启动：`start nginx`
   - 重载配置：`nginx -s reload`
   - 停止：`nginx -s stop`
   - 验证：浏览器访问 `http://localhost` 出现 Welcome to nginx；Windows 下任务管理器可见两个 `nginx.exe`（master + worker），属正常现象；
   - 端口占用排查：`netstat -ano | findstr :8080`
4. 若 80 被占用，本方案统一改用 8080/8081/8082，不影响。

### 6.3 构建与产物约定

- 三个应用执行 `npm run build`；
- 产物路径统一到 `deploy/html/{main-app,app-vue,app-react}`（用构建配置的 outDir/path 直接输出，或写个 copy 脚本，二选一，建议直接配 outDir 减少拷贝出错）；
- 构建后子应用的资源引用方式必须与「部署到站点根路径」一致：本方案子应用各自独占一个端口（站点根），因此 Vite `base` / Webpack `output.publicPath` 保持 `/` 即可；
- `deploy/html` 整体加入 `.gitignore`。

### 6.4 nginx 配置模板与逐段解释

> 思路：三个独立 server = 三个“线上站点”；子应用站点加 CORS 头以允许基座跨域 fetch；每个站点都配 history 路由回退。
> 注：本节给出的是**模板骨架**，实际填入路径即可使用；正式实施时同步提供 `deploy/nginx.conf` 成品文件。

```nginx
# ============ 基座 main-app ============
server {
    listen       8080;
    server_name  localhost;

    root  D:/study/qiankun/deploy/html/main-app;
    index index.html;

    # history 路由：所有未命中文件的请求回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============ 子应用 app-vue ============
server {
    listen       8081;
    server_name  localhost;

    root  D:/study/qiankun/deploy/html/app-vue;
    index index.html;

    # 允许基座(8080)跨域 fetch 本应用 HTML/JS/CSS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============ 子应用 app-react ============
server {
    listen       8082;
    server_name  localhost;

    root  D:/study/qiankun/deploy/html/app-react;
    index index.html;

    add_header Access-Control-Allow-Origin *;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

逐段解释（配合记忆）：

- `listen`：每个应用一个站点（模拟真实「各子应用独立服务」），端口对应 2.2 规划；
- `try_files $uri $uri/ /index.html`：**history 路由刷新兜底**。浏览器访问 `/vue/list` 时服务器没有该文件 → 回退到 `index.html` → 前端路由接管 → 子应用路由命中 `/vue/list`；
- `add_header Access-Control-Allow-Origin *`：让基座页面（origin 为 8080）能 fetch 子应用（8081/8082）的 HTML 与资源；这是 qiankun 部署形态最常见的跨域解法；
- 注意：`add_header` 在 nginx 中只在特定响应生效，若子应用资源请求仍需自定义静态资源 MIME，按需补充 `location /assets/ { ... }`（一般默认即可）。

### 6.5 部署态切换

- 主应用注册表 entry 通过环境变量（5.5）切换 dev/部署地址。部署后 base 站点与子应用端口与 dev 相同，故本例 dev/部署 entry 天然一致；若未来端口分化，只需改 `.env`；
- 可把子应用在部署态设置 `base` 为站点根 `/`，独立站点直接访问 `/vue/list` 也能用（因该站点只有这一个应用）。

### 6.6 验证清单

- [ ] `http://localhost:8080` 打开基座，页面样式正常（无子应用样式污染基座）；
- [ ] 切到 Vue 子应用 → 进入 `/vue/list` → **按 F5 刷新** → 仍在 `/vue/list`（不 404）；
- [ ] React 子应用做同样操作；
- [ ] DevTools Console 无跨域 / 资源 404 报错；
- [ ] `http://localhost:8081` 单独打开 app-vue、`http://localhost:8082` 单独打开 app-react，均正常（验证子应用“独立可部署”属性）；
- [ ] Network 面板：基座页面加载的是 8081/8082 上的 HTML（而不是 dev server）。

### 6.7 进阶（选学）：同域子路径部署

当子应用与基座部署在**同一站点、不同路径**（如基座 `localhost:8080`，app-vue 挂在 `localhost:8080/vue`）时：

- nginx 需 `location /vue/ { alias <app-vue 产物绝对路径>; try_files $uri $uri/ /vue/index.html; }`；
- 子应用 Vite `base: '/vue/'`、Webpack `output.publicPath: '/vue/'`，产物内资源引用带上前缀；
- 子应用路由 base 与路径前缀对齐；
- 因同源，可去掉 CORS 头。

> 学习价值：对比跨端口与子路径两种形态，能彻底理解 **publicPath/base/entry 三者的关系**。

---

## 7. 里程碑验收清单

| Phase | 内容 | 是否通过 |
| --- | --- | --- |
| 0 | 三套独立工程可运行 | ☐ |
| 1 | 基座挂载 app-vue，生命周期时序正确 | ☐ |
| 2 | 基座挂载 app-react（UMD），双应用可切换 | ☐ |
| 3 | 子应用路由联动/刷新/高亮正确 | ☐ |
| 4 | 沙箱与样式隔离实验有结论并形成规范 | ☐ |
| 5 | 用户/主题跨应用通信 demo 完成 | ☐ |
| 6 | demo 演进为工程模板（loading/容错/env 化/规范） | ☐ |
| 7 | nginx 本地部署全链路验收通过 | ☐ |

完成 Phase 7 时，可回到 1.2 的学习目标逐条自检 K1–K7。

---

## 8. 开放决策点（实施前请拍板）

以下事项在正式动手前需要你确认（默认值已给，不同意可改）：

| # | 问题 | 默认方案 |
| --- | --- | --- |
| 1 | app-vue 的 Vite 接入插件选哪个（原版 vs 活跃 fork） | 实施 Phase 1 时先花 20 分钟对比 npm 状态后定版并记录 |
| 2 | app-react 是否接受「手动搭建 Webpack5」 | 接受（教学收益最大）；也可换 CRA+craco |
| 3 | 主/子应用是否用 TypeScript | 默认：Vue 侧用 TS（模板默认），React 侧 JSX 即可（减少配置），如有偏好可改 |
| 4 | demo 通信场景是否就用「登录用户 + 主题色」 | 默认是；可换成购物车/权限等其他场景 |
| 5 | 每个 Phase 是否要求 git 提交 | 默认每 Phase 一个 commit + 简短说明 |
| 6 | 是否需要我把本文档拆成「每 Phase 一份任务卡」 | 若需要，进入实施后按 Phase 产出细化任务卡 |

---

## 9. 参考资源

- Qiankun 官方文档（中文）：<https://qiankun.umijs.org/zh/>
- Qiankun GitHub（含 examples）：<https://github.com/umijs/qiankun>
- single-spa 官方：<https://single-spa.js.org/>
- Vite 子应用接入插件（对比候选，实施时锁定）：
  - <https://github.com/tengmaoqing/vite-plugin-qiankun>
  - npm 检索 `vite-plugin-qiankun`（观察活跃替代包）
- Nginx for Windows 下载：<http://nginx.org/en/download.html>

---

> 本文档评审通过后，即可从 **Phase 0** 开始实施。

---

## 附录 A：Phase 0 手动初始化 app-react 操作手册

> 本附录展开自正文 **Phase 0 第 5 步**：**不用 CRA，手动初始化一个 React18 + Webpack5 工程**。
> 目标：先得到一个**不含任何 qiankun 痕迹**、能用 `npm run dev` 跑在 8082 端口的独立 React 页面，作为 Phase 2「官方 UMD 接入」演示的底子。
> 环境：Windows + PowerShell。

### A.1 为什么不用 CRA，而是手动搭建

1. CRA 的 react-scripts 把 webpack 配置封装死了；Phase 2 要改 `output.library / libraryTarget: 'umd'` 这类 qiankun 必需字段时，还得再引入 craco / react-app-rewired 去 hack，绕路且看不到配置本身；
2. 手动搭时亲手写一遍 `webpack.config.js`，到 Phase 2 **只改几个字段**就能完成「普通工程 → qiankun 子应用」的转变，"原来就差这几行"的顿悟正是这套学习路线想给你的；
3. 依赖与配置完全透明，方便边做边查官方文档、边提问。

### A.2 本节产出文件清单

```text
app-react\
├─ package.json          # npm init -y 生成，补 scripts
├─ babel.config.js
├─ webpack.config.js     # Phase 0 版本，暂不加任何 UMD 字段
├─ index.html            # html-webpack-plugin 的模板
└─ src\
   ├─ index.js           # React 渲染入口
   ├─ App.jsx
   └─ styles.css         # 可选，先留空
```

### A.3 第 1 步：初始化并安装依赖

在 `app-react/` 目录下执行：

```powershell
npm init -y
# 运行时依赖
npm i react react-dom
# 构建期依赖（Webpack5 全家桶 + Babel 转译链）
npm i -D webpack webpack-cli webpack-dev-server html-webpack-plugin `
  "@babel/core" babel-loader "@babel/preset-env" "@babel/preset-react" `
  style-loader css-loader
```

注意事项：

- `@babel/*` 这类以 `@` 开头的包名在 PowerShell 中**要用双引号包裹**，避免被 PowerShell 当成数组/展开语法；
- 反引号 `` ` `` 是 PowerShell 续行符，也可以写成一行；
- 装完执行 `npm ls webpack`，确认安装的是 **5.x**（本手册基于 Webpack5，勿用 4.x）。

### A.4 第 2 步：创建配置文件与源码（5 个文件）

**babel.config.js** —— 让 Babel 认识 JSX 与 ES 新语法：

```js
module.exports = {
  presets: [
    '@babel/preset-env',                               // 转译 ES 新语法
    ['@babel/preset-react', { runtime: 'automatic' }], // React 17+ 自动 JSX 运行时，无需手动 import React
  ],
};
```

**webpack.config.js** —— Phase 0 版本，先保持朴素：

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// mode 由命令行 --mode 注入（见 A.5 的 scripts），config 里不用写
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
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
    // 以根目录 index.html 为模板，自动注入打包后的 <script>
    new HtmlWebpackPlugin({ template: './index.html' }),
  ],
  devServer: {
    port: 8082,
    open: true,
    hot: true,
    historyApiFallback: true, // 先埋好：Phase 3 起子应用二级路由刷新要靠它
  },
};
```

**index.html**（项目根目录，作 HtmlWebpackPlugin 模板）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>app-react</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

**src/App.jsx**：

```jsx
export default function App() {
  return <h1>Hello from app-react (Webpack 5)</h1>;
}
```

**src/index.js**：

```js
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### A.5 第 3 步：配置 scripts 并验证

修改 `package.json` 的 `scripts`：

```json
"scripts": {
  "dev": "webpack serve --mode development",
  "build": "webpack --mode production"
}
```

执行 `npm run dev`，浏览器自动打开 **http://localhost:8082**，看到 "Hello from app-react" 即通过 ✅。

对应 Phase 0 验收点：

- [ ] 8082 独立访问正常；
- [ ] 改 `App.jsx` 文案触发热更新（HMR）；
- [ ] 与 main-app（8080）、app-vue（8081）共同满足「三端独立运行」。

### A.6 与后续 Phase 的衔接（先别提前优化）

本阶段的文件越朴素越好，**不要提前加任何 qiankun / UMD 相关代码**。后续变化点预告：

| Phase | 改哪里 | 怎么改 |
| --- | --- | --- |
| Phase 1（跑通概念） | 只需让 main-app 挂载 app-vue，本工程暂不动 | — |
| Phase 2 | `webpack.config.js` | `output` 增加 `library: 'appReact'`、`libraryTarget: 'umd'`、`globalObject: 'window'`、`chunkLoadingGlobal`；devServer 加 CORS 头；如采用「入口与生命周期分离」再拆 entry |
| Phase 2 | `src/index.js` | 用 `window.__POWERED_BY_QIANKUN__` 判断托管/独立两种模式；导出 `bootstrap / mount / unmount` |
| Phase 2 | 新增路由 | 安装 react-router-dom，router `base` 设为 `/react` |

> 到时你会发现：Phase 0 到 Phase 2 之间的"接入魔法"，本质只差 `webpack.config.js` 里那几行 UMD 配置 + 入口文件里三个生命周期函数。
