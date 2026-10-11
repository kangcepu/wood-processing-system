module.exports = {
  apps: [
    {
      name: "wps-frontend",
      script: "server.js",
      exec_mode: "cluster",
      instances: process.env.PM2_INSTANCES || 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
