import { registerMicroApps, start } from 'qiankun'
import { microApps } from './apps'

export function microInit() {
    registerMicroApps(microApps, {
        beforeLoad: [(app) => console.log('[qiankun] beforeLoad:', app.name)],
        beforeMount: [(app) => console.log('[qiankun] beforeMount:', app.name)],
        afterMount: [(app) => console.log('[qiankun] afterMount:', app.name)],
        afterUnmount:[(app) => console.log('[qiankun] afterUnmount:', app.name)],
    })

    start({
        prefetch: 'all', //先全部预加载，便于管擦； Phase 6 再谈按需
    })
}