module.exports = {
  apps: [
    {
      name: "HANS-MD",
      script: "./index.js",
      watch: false,
      autorestart: true,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
