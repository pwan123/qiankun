import { Link } from 'react-router-dom';

export default function List() {
  const items = [
    { id: 1, name: 'React 子应用列表项 1' },
    { id: 2, name: 'React 子应用列表项 2' },
  ];
  return (
    <div>
      <h1>React 列表页</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/detail/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
      <Link to="/">返回首页</Link>
    </div>
  );
}