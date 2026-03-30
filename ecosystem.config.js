module.exports = {
    apps: [
        {
            name: "hermeswa-api",
            script: "./hermeswa", // Use hermeswa.exe on Windows
            watch: false,
            env_file: ".env",
            instances: 1,
            exec_mode: "fork",
            max_memory_restart: "500M",
            autorestart: true,
            time: true, // Add timestamp to PM2 terminal logs
            env: {
                NODE_ENV: "production"
            }
        },
        {
            name: "hermeswa-worker",
            script: "./worker", // Output binary from cmd/worker/main.go
            watch: false,
            env_file: ".env",
            instances: 1, // 1 instance is enough since the internal Manager handles multiple goroutines
            exec_mode: "fork",
            max_memory_restart: "500M", // Go workers are very memory-efficient, 500M is very safe
            autorestart: true,
            time: true,
            env: {
                NODE_ENV: "production"
            }
        }
    ]
}