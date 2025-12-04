module.exports = {
  apps: [
    {
      name: 'trend-web',
      script: './server.js',
      instances: 1,
      cwd: '.',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      max_memory_restart: '4G',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
