import { Link, useParams } from 'react-router-dom';

export default function Detail() {
  const { id } = useParams();
  return (
    <div>
      <h1>React 详情页</h1>
      <p>当前 id：{id}</p>
      <Link to="/list">返回列表</Link>
    </div>
  );
}