module.exports = {
  apps: [{
    name: 'adhdcal',
    script: 'server/index.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      ADMIN_EMAIL: 'support@absolute0.net',
      DB_HOST: '127.0.0.1',
      DB_USER: 'kcpnvspcqx',
      DB_PASSWORD: 'vcxE76qrmR',
      DB_NAME: 'kcpnvspcqx'
    }
  }]
};
