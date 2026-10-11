module.exports = {
  apps: [
    {
      name: "wps-backend",
      script: "dist/main.js",
      exec_mode: "cluster",
      instances: process.env.PM2_INSTANCES || 1,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
