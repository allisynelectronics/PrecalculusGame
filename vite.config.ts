import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const singleFile = mode === 'singlefile'

  return {
    plugins: singleFile ? [react(), viteSingleFile()] : [react()],
    publicDir: singleFile ? false : 'public',
    build: singleFile
      ? {
          outDir: 'dist-single',
          cssCodeSplit: false,
          assetsInlineLimit: 100000000,
          chunkSizeWarningLimit: 100000000,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        }
      : undefined,
  }
})
