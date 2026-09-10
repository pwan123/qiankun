import { Link } from 'react-router-dom';

export default function App() {
    return (
        <div>
            <h1>Hello from app-react (Webpack 5)</h1>
            <p>React 子应用业务首页</p>
            <Link to="/list">去列表页</Link>
        </div>
    );
}
