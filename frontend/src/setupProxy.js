const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 添加详细的日志输出，帮助调试
  console.log('设置代理中间件...');
  
  // 主后端API代理
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log(`代理请求: ${req.method} ${req.path} -> http://localhost:3001${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('代理错误:', err);
        // 尝试备用端口
        console.log('尝试使用备用端口3000');
        // 注意：这里不直接进行重定向，而是通过前端代码的容错机制处理
      }
    })
  );

  // 静态资源代理（如有需要） - **注释掉此规则，避免拦截前端自身的静态文件**
  /*
  app.use(
    '/static',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
  */

  console.log('代理中间件设置完成');
}; 