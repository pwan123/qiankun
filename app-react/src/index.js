import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from "./App";
import List from './views/List';
import Detail from './views/Detail';

let root = null;
let container = null;

// 微前端下，主应用(8080)用 vue-router，它把 {back,current,forward,position}
// 等字段存在浏览器 history.state 里，导航时依赖 current 拼接 URL。
// React Router 内部导航时会把 history.state 整体替换成 {usr,key}，
// 导致主应用 vue-router 后续 push/replace 时 current 为 undefined，
// 拼出 'http://localhost:8080undefined/' 之类的非法 URL 而报 SecurityError。
// 这里在导航落定后把真实路径补回 state.current，usr/key 原样保留，
// 既不影响 React Router 自身的前进后退，也不破坏主应用的 state 结构。
function MicroHistoryGuard() {
  const location = useLocation();
  useEffect(() => {
    const s = window.history.state;
    if (!s || typeof s.current !== 'string') {
      const realPath = window.location.pathname + window.location.search;
      const temp = { ...(s || {}), current: realPath };
      window.history.replaceState(temp, '');
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
    <BrowserRouter basename = "/react">
        <MicroHistoryGuard />
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/list" element={<List />} />
            <Route path="/detail/:id" element={<Detail />} />
        </Routes>
    </BrowserRouter>
  )
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
    if(root) {
        root.unmount();
        root = null;
    }
}
// ===========================================

// 独立运行时：qiankun 沙箱未启用，window.__POWERED_BY_QIANKUN__ 为 undefined → 自己挂载
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}
