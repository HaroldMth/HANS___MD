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
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true
    }
  ]
};
