module.exports = {
  apps: [
    {
      script: 'dist/main.js',
      watch: false,
      min_uptime: '60s',
      max_restarts: 3,
      time: true,
      error_file: './logs/err.log',
      out_file: './logs/app.log',

      // 生产环境
      env_production: {
        name: 'meimei_server_prod-3000',
        NODE_ENV: 'production',
        APP_ENV: 'production',
        TZ: 'America/Sao_Paulo',
      },
    },
  ],
}
