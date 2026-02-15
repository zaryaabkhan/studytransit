import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.VITE_ANTHROPIC_API_KEY?.trim() || "";

  return {
    plugins: [react()],
    envDir: ".",
    server: {
      port: 5173,
      proxy: apiKey
        ? {
            "/api/anthropic": {
              target: "https://api.anthropic.com",
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.setHeader("x-api-key", apiKey);
                  proxyReq.setHeader("anthropic-version", "2023-06-01");
                  proxyReq.setHeader("content-type", "application/json");
                  proxyReq.setHeader("anthropic-dangerous-direct-browser-access", "true");
                });
              },
            },
          }
        : {},
    },
  };
});

