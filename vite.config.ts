import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This alias helps ensure correct path resolution for tsconfig files
      // It maps '@/' to the 'src' directory, which is a common practice
      // and might help with internal pathing issues.
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Explicitly set the root to the current directory
  // This might help if Vite is misinterpreting the project root
  root: path.resolve(__dirname, './'),
  build: {
    // Ensure that the build output directory is 'dist'
    outDir: 'dist',
    // You can add more verbose logging for the build process here if needed
    // rollupOptions: {
    //   output: {
    //     manualChunks: undefined,
    //   },
    // },
  },
  server: {
    // Ensure the server starts on port 3000
    port: 3000,
    // Host on all network interfaces to be accessible from outside the container
    host: '0.0.0.0',
  },
})