import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        // Code splitting — pisahkan vendor libraries ke chunk terpisah
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // Redux
                    'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
                    // Charts (paling besar)
                    'recharts-vendor': ['recharts'],
                    // QR Code
                    'qr-vendor': ['qrcode.react'],
                    // Lucide icons
                    'icons-vendor': ['lucide-react'],
                    // Axios
                    'http-vendor': ['axios'],
                },
            },
        },
        // Kurangi ukuran chunk
        chunkSizeWarningLimit: 600,
    },
});
