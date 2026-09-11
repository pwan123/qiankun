import { registerMicroApps, start } from 'qiankun'
import { microApps } from './apps'

export function microInit() {
    // 生命周期钩子的类型是 (app, global) => Promise<any>，必须返回 Promise，
    // 所以用 async；写成同步的 (app) => console.log(...) 会让 vue-tsc 报 TS2322
    registerMicroApps(microApps, {
        beforeLoad: [async (app) => console.log('[qiankun] beforeLoad:', app.name)],
        beforeMount: [async (app) => console.log('[qiankun] beforeMount:', app.name)],
        afterMount: [async (app) => console.log('[qiankun] afterMount:', app.name)],
        afterUnmount: [async (app) => console.log('[qiankun] afterUnmount:', app.name)],
    })

    start({
        prefetch: 'all', //先全部预加载，便于管擦； Phase 6 再谈按需
        // sandbox: false
        sandbox: { experimentalStyleIsolation: true }
    })
}