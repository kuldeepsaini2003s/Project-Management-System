// vite.config.js
import { defineConfig } from "file:///sessions/trusting-elegant-dirac/mnt/Linear%20App/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/trusting-elegant-dirac/mnt/Linear%20App/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///sessions/trusting-elegant-dirac/mnt/Linear%20App/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/sessions/trusting-elegant-dirac/mnt/Linear App/frontend";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
}; 
