import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Security-focused Vite configuration
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react()
    ],
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    // Development server configuration
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Security headers for development
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    },
    
    // Build configuration
    build: {
      // Security: Generate source maps only in development
      sourcemap: !isProduction,
      
      // Security: Minify code in production
      minify: isProduction ? 'terser' : false,
      
      // Terser options for security
      terserOptions: isProduction ? {
        compress: {
          // Remove console logs in production
          drop_console: true,
          drop_debugger: true,
          // Remove unused code
          dead_code: true
        },
        mangle: {
          // Security: Obfuscate variable names
          toplevel: true
        }
      } : {},
      
      // Rollup options for security
      rollupOptions: {
        output: {
          // Security: Obfuscate chunk names in production
          chunkFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          entryFileNames: isProduction ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
          assetFileNames: isProduction ? 'assets/[hash].[ext]' : 'assets/[name]-[hash].[ext]',
          
          // Security: Manual chunk splitting for better caching and security
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            animation: ['framer-motion', 'gsap'],
            utils: ['clsx', 'tailwind-merge']
          }
        }
      },
      
      // Security: Asset handling
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      
      // Security: Output directory
      outDir: 'dist',
      emptyOutDir: true,
      
      // Security: Chunk size warnings
      chunkSizeWarningLimit: 1000
    },
    
    // Environment variables
    envPrefix: 'VITE_',
    
    // Security: Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction
    },
    
    // CSS configuration
    css: {
      // Security: Disable CSS source maps in production
      devSourcemap: !isProduction
    },
    
    // Security: Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'framer-motion',
        'lucide-react'
      ]
    },
    
    // Security: Preview server configuration
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    },
    
    // Security: ESBuild configuration
    esbuild: {
      // Security: Remove console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
      
      // Security: Target modern browsers for better security features
      target: 'es2020'
    }
  }
})

