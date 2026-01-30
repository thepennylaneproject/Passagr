import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/public': 'http://localhost:3000', // Proxy API requests to backend
            '/api': 'http://localhost:3000'
        }
    }
})
