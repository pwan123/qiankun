const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// mode 由命令行 --mode 注入，config 里不用写
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        clean: true,
        // ==== qiankun UMD 协议四件套 ====
        // 关键：资源地址用绝对根路径，避免被 /react/xxx 的相对基准带偏
        publicPath: '/',
        library: 'appReact', //全局变量名，qiankun 从 window.appReact 上拿生命周期
        libraryTarget: 'umd', //打包成UMD：能同时兼容 全局变量/CommonJS/AMD
        globalObject: 'window', //关键：让 UMD 代码在沙箱里取 window 而不是 globalThis
        chunkLoadingGlobal: 'webpackJsonp_app_react', //webpack5 版 jsonpFunction, 多应用防冲突
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
        // 该 HTML 只服务于"独立运行"；被 qiankun 托管时真正执行的是它引用的 UMD JS
        new HtmlWebpackPlugin({ template: './index.html' }),
    ],
    devServer: {
        port: 8082,
        open: true,
        hot: true,
        historyApiFallback: true, // 子应用二级路由刷新兜底（Phase 3 验证）
        // ===== 本 Phase 新增：允许主应用(8080)跨域 fetch 本应用 =====
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
};