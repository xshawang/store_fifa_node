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
      
      // 指定环境变量文件（辅助加载）
      env_file: '.env.production',

      // 生产环境配置（必须在这里明确指定所有环境变量）
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        PORT: '3000',
        TZ: 'America/Sao_Paulo',
        
        // 数据库配置（从 .env.production 复制到这里）
        DB_TYPE: 'mysql',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USER: 'fifa',
        DB_PASSWORD: 'f_23223_2WEdsdfs',
        DB_DATABASE: 'ffia',
        DB_SYNCHRONIZE: 'false',
        DB_LOGGING: 'false',
        
        // Redis 配置（从 .env.production 复制到这里）
        IS_USING_REDIS: 'true',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_DB: '2',
        REDIS_PASSWORD: 'foobaredb840fc02d524045429941cc15f59',
        
        // 其他配置
        SERVER_PORT: '3000',
        API_GLOBAL_PREFIX: '/api',
        IS_OPEN_DOC: 'false',
        IS_DEMO_ENV: 'false',
        UPLOAD_PATH: './uploads',
      },
    },
  ],
}
