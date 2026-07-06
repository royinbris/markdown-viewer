import { defineConfig } from 'vite'

export default defineConfig({
    // Set base to './' to allow the site to be deployed to any path
    // This is the safest option for simple GitHub Pages deployment
    base: './',
    server: {
        proxy: {
            '/api': 'http://127.0.0.1:3093',
            '/audio': 'http://127.0.0.1:3093'
        }
    }
})
