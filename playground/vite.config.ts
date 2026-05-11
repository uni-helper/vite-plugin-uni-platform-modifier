import Uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'
import VitePluginUniPlatformVOnModifier from '../src/index'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Uni(),
    VitePluginUniPlatformVOnModifier(),
  ],
})
