// import type { MicroAppStateActions } from 'qiankun'
import { reactive } from 'vue'


// 由 qiankun 注入的全局状态（订阅回调里更新）
export const globalState = reactive({
  user: '',
  theme: 'default' as string,
})

// mount(props) 里由 main.ts 赋值
// export const actions: { setGlobalState?: MicroAppStateActions['setGlobalState'] } = {}
export const actions: { setGlobalState?: (state: Record<string, unknown>) => void } = {}