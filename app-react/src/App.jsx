import { Link } from 'react-router-dom';
import { useState } from 'react';
import { globalStore } from './index';
import { useEffect } from 'react';

// window.__LEAK_ = 'react-app'; // 故意写全局变量，用于验证沙箱隔离；放模块顶层，加载即执行一次
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
