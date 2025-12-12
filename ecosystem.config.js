module.exports = {
  apps: [
    {
      name: 'trend-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      cwd: '.',
      exec_mode: 'cluster',
      max_memory_restart: '4G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
