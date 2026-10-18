module.exports = { apps: [{ name: "mandisetu-admin", cwd: __dirname, script: "node_modules/next/dist/bin/next", args: "start -p 3002", env: { NODE_ENV: "production" } }] };
