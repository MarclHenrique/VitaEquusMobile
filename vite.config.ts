import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/auth": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", "http://localhost:8081");
          });
        },
      },
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", "http://localhost:8081");
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
