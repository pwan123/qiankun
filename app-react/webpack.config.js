const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// mode 由命令行 --mode 注入，config 里不用写
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        clean: true,
    },
    module: {
        rules: [
            { test: /\.(js|jsx)$/, exclude: /node_modules/, use: 'babel-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        // 以根目录 index.html 为模板， 自动注入打包后的 <script>
        new HtmlWebpackPlugin({ template: './index.html' }),
    ],
    devServer: {
        port: 8082,
        open: true,
        hot: true,
        historyApiFallback: true, //先买好： phase 3起子应用二级路由刷新要靠它
    },
};