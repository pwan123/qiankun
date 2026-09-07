module.exports = {
    presets: [
        '@babel/preset-env', //转译 ES 新语法
        ['@babel/preset-react', { runtime: 'automatic'}], // React 17+ 自动 JSX 运行时，无需手动 import React
    ]
}