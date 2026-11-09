const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://bs1.ntigskovde.se',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );
};
