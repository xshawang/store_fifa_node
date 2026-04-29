module.exports = {
  apps: [
    {
      name: 'meimei_server_3000',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      min_uptime: '60s',
      max_restarts: 3,
      time: true,
      error_file: './logs/err.log',
      out_file: './logs/app.log',
      merge_logs: true,
      date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // 指定环境变量文件（生产环境）
      env_file: '.env.production',

      // 默认使用生产环境配置
      env: {
        name: 'meimei_server_3000',
        NODE_ENV: 'production',
        APP_ENV: 'production',
        PORT: '3000',
        TZ: 'America/Sao_Paulo',
      },

       
    },
  ],
}
