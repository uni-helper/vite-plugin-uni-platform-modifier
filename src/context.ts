import type { Logger } from 'vite'
import { createFilter, createLogger } from 'vite'

import type { ParentNode, TemplateChildNode } from '@vue/compiler-core'
import { builtInPlatforms, platform } from '@uni-helper/uni-env'

import { parse } from '@vue/compiler-dom'
import MagicString from 'magic-string'
import { pluginName } from './constants'
import { getRootTemplate, hasPlatformModifier, normalizeVueProps } from './utils'

export class Context {
  logger: Logger
  filter: (id: unknown) => boolean
  constructor() {
    this.logger = createLogger(undefined, {
      prefix: pluginName,
    })

    this.filter = createFilter('**/*.?(nu)vue')
  }

  transform(code: string, id: string) {
    const ast = parse(code)
    const rootTemplate = getRootTemplate(ast)
    if (!rootTemplate)
      return
    const ms = new MagicString(code)
    const replaceProps = (node: ParentNode | TemplateChildNode) => {
      if (node.type !== 1)
        return

      const props = normalizeVueProps(node.props)
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
          this.logger.warn(`${id}:${v.start.line}:${v.start.column} 属性 \`${name}\` 匹配到多个的平台修饰符，已忽略 ${v.source}`, {
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
  }
}
