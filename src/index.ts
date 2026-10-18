import type { Plugin } from 'vite'
import { pluginName } from './constants'
import { Context } from './context'

export function VitePluginUniPlatformModifier(): Plugin {
  const ctx = new Context()
  return {
    name: pluginName,
    enforce: 'pre',
    transform(code, id) {
      if (!ctx.filter(id))
        return

      return ctx.transform(code, id)
    },
  }
}

export default VitePluginUniPlatformModifier
