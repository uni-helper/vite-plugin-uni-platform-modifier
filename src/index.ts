import { type Plugin, createFilter, createLogger } from 'vite'
import type { ParentNode, TemplateChildNode } from '@vue/compiler-core'
import { builtInPlatforms, platform } from '@uni-helper/uni-env'

import { parse } from '@vue/compiler-dom'
import MagicString from 'magic-string'

function hasPlatformModifier(modifiers: string[]) {
  return modifiers.some(m => builtInPlatforms.includes(m as any))
}

const pluginName = 'vite-plugin-uni-platform-modifier'

export function VitePluginUniPlatformVOnModifier(): Plugin {
  const logger = createLogger(undefined, {
    prefix: pluginName,
  })
  return {
    name: pluginName,
    enforce: 'pre',
    transform(code, id) {
      const filter = createFilter('**/*.?(nu)vue')

      if (!filter(id))
        return

      const ast = parse(code)
      const rootTemplate = ast.children.find(node => node.type === 1 && node.tag === 'template') as ParentNode
      if (!rootTemplate)
        return
      const ms = new MagicString(code)
      function replaceProps(node: ParentNode | TemplateChildNode) {
        if (node.type !== 1)
          return

        const props = node.props.map((prop) => {
          const result = {
            ...prop.loc,
            name: '',
            modifiers: [] as string[],
          }
          if (prop.type === 6) {
            const [originalName, ...modifiers] = prop.name.split('.')
            result.name = originalName
            result.modifiers = modifiers
          }
          else {
            result.name = `v-${prop.name}${prop.arg?.loc.source ?? ''}`
            result.modifiers = prop.modifiers
          }
          return result
        })
        const groups = props.reduce((acc, cur) => {
          acc[cur.name] = acc[cur.name] ? [...acc[cur.name], cur] : [cur]
          return acc
        }, {} as Record<string, typeof props[0][]>)

        Object.keys(groups).forEach((name) => {
          const group = groups[name]
          const defaultProp = group.find(v => v.modifiers.length === 0 || !hasPlatformModifier(v.modifiers))
          const platformProps = group.filter(v => hasPlatformModifier(v.modifiers) && v.modifiers.includes(platform))
          const platformProp = platformProps[0]
          platformProps.slice(1).forEach((v) => {
            logger.warn(`${id}:${v.start.line}:${v.start.column} 属性 \`${name}\` 匹配到多个的平台修饰符，已忽略 ${v.source}`, {
              timestamp: true,
            })
          })
          const resultSource = platformProp?.source.replace(new RegExp(`\\.${builtInPlatforms.join('|\\.')}`, 'gm'), '') ?? defaultProp?.source ?? ''
          group.forEach(v => ms.remove(v.start.offset, v.start.offset))

          if (defaultProp)
            ms.overwrite(defaultProp.start.offset, defaultProp.end.offset, resultSource)
          else if (platformProp)
            ms.overwrite(platformProp.start.offset, platformProp.end.offset, resultSource)
        })

        node.children.forEach((n) => {
          replaceProps(n)
        })
      }
      replaceProps(rootTemplate)

      return {
        code: ms.toString(),
        map: ms.generateMap({
          file: id,
        }),
      }
    },
  }
}

export default VitePluginUniPlatformVOnModifier
