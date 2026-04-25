module.exports = {
  apps: [{
    name: "fada",
    script: "dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: "3001",
    }
  }]
};
