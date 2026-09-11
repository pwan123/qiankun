import { createApp, type App as VueApp } from "vue";
import {
  qiankunWindow,
  renderWithQiankun,
} from "vite-plugin-qiankun/dist/helper";
import App from "./App.vue";
import router from "./router";
import { globalState, actions } from "./micro-global";
import "./style.css";

let app: VueApp | null = null;
let offGlobalListener: (() => void) | null = null;

// let leakTimer: number | null = null
// const leakStore: number[][] = []

function render(props: { container?: HTMLElement | null } = {}) {
  const { container } = props;
  // 被 qiankun 托管时：挂载点取主应用容器内部的 #app
  // 独立运行时： container 为空，直接挂到自身 index.html 的 #app
  const mountEl =
    (container?.querySelector("#app") as HTMLElement | null) ?? "#app";

  // 保存 setGlobalState，供"退出"这类反向操作使用（第一次进来注册即可）
  const injected = props as { setGlobalState?: typeof actions.setGlobalState };
  actions.setGlobalState = injected.setGlobalState;

  app = createApp(App);
  app.use(router);
  app.mount(mountEl);
}

function registerGlobalListener(props: Record<string, unknown>) {
  const injected = props as {
    onGlobalStateChange?: (
      cb: (s: { user?: string; theme?: string }) => void,
      fireNow?: boolean,
    ) => () => void;
  };
  offGlobalListener =
    injected.onGlobalStateChange?.((state) => {
      if (typeof state.user === "string") globalState.user = state.user;
      if (typeof state.theme === "string") globalState.theme = state.theme;
    }, true) ?? null; // fireImmediately=true：首次进入就同步当前值
}

// 被 qiankun 托管时，插件把这些生命周期导出给主应用调用
// 注意 update 不能省：插件的 QiankunLifeCycle 类型要求四个生命周期齐全（缺了 vue-tsc 会报 TS2345）
renderWithQiankun({
  bootstrap() {
    console.log("[app-vue] bootstrap");
  },
  mount(props) {
    //     // 故意不清理：每次 mount 都新开一个定时器，并持续往同一个数组里塞数据
    // leakTimer = window.setInterval(() => {
    //   leakStore.push(new Array(20000).fill(Math.random())) // 每次约 160KB
    // }, 200)
    console.log("[app-vue] mount");
    const p = props as { container?: HTMLElement | null } & Record<
      string,
      unknown
    >;
    if (!offGlobalListener) registerGlobalListener(p);
    render(p);
  },
  update() {
    // 主应用调用 update(props) 时触发；本项目不做增量更新，留空即可
  },
  unmount() {
    //     if (leakTimer !== null) {
    //   clearInterval(leakTimer)
    //   leakTimer = null
    // }
    console.log("[app-vue] unmount");
    offGlobalListener?.();
    offGlobalListener = null;
    app?.unmount();
    app = null;
  },
});

// 独立运行时：qiankun 沙箱没启用，不会注入__POWERED_BY_QIANKUN__变量
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}