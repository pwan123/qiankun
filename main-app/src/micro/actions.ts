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