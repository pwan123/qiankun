// 应用注册表: qiankun 的"路由表"
// name 必须等于子应用内配置的应用名：entry 是子应用 HTML 入口地址：
// container 是子应用挂载进的 DOM 容器（须在 DOM 中真实存在）：
// activeRule 是激活规则（路径前缀）
export interface MicroAppItem  {
    name: string
    entry: string
    container: string
    activeRule: string
    prop?: Record<string, unknown>
}

// phase 1只注册 app-vue; phase 2 再追加app-react
export const microApps: MicroAppItem[] = [
    {
        name: 'app-vue',
        entry: '//localhost:8081',
        container: '#micro-container-vue',
        activeRule: '/vue'
    },
    {
        name: 'app-react',
        entry: '//localhost:8082',
        container: '#micro-container-react',
        activeRule: '/react',
    },
]