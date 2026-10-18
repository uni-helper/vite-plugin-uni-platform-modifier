import type { Plugin } from 'vite'
import { pluginName } from './constants'
import { Context } from './context'
import { setLogger } from './utils'

export function VitePluginUniPlatformModifier(): Plugin {
  const ctx = new Context()
  return {
    name: pluginName,
    enforce: 'pre',
    configResolved(resolved) {
      setLogger(resolved.logger)
    },
    transform(code, id) {
      if (!ctx.filter(id))
        return

      return ctx.transform(code, id)
    },
  }
}

export default VitePluginUniPlatformModifier
