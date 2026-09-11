import { Link } from 'react-router-dom';

// window.__LEAK_ = 'react-app'; // 故意写全局变量，用于验证沙箱隔离；放模块顶层，加载即执行一次
export default function App() {
    
    return (
        <div>
            <h1>Hello from app-react (Webpack 5)</h1>
            <p>React 子应用业务首页</p>
            <Link to="/list">去列表页</Link>
        </div>
    );
}
