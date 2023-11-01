import { builtInPlatforms, platform } from '@uni-helper/uni-env'
import type { AttributeNode, DirectiveNode, ParentNode, RootNode, TemplateChildNode } from '@vue/compiler-core'
import type MagicString from 'magic-string'
import { createLogger } from 'vite'
import { pluginName } from './constants'

export type Prop = ReturnType<typeof normalizeVueProps>[0]

export const logger = createLogger(undefined, {
  prefix: pluginName,
})

export function hasPlatformModifier(modifiers: string[]) {
  return modifiers.some(m => builtInPlatforms.includes(m as any))
}

export function normalizeVueProps(props: (AttributeNode | DirectiveNode)[]) {
  return props.map((prop) => {
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
}

export function getRootTemplate(ast: RootNode) {
  return ast.children.find(node => node.type === 1 && node.tag === 'template') as ParentNode
}

export function groupPropsByName(props: Prop[]) {
  return props.reduce((acc, cur) => {
    acc[cur.name] = acc[cur.name] ? [...acc[cur.name], cur] : [cur]
    return acc
  }, {} as Record<string, typeof props[0][]>)
}

export function hasMultiplePlatformProps(props: Prop[], id: string) {
  if (props.length < 1)
    return
  const first = props[0]
  const last = props[props.length - 1]
  logger.warn(`${id}:${first.start.line}:${first.start.column}-${last.end.column} 单一属性匹配到多个 ${platform} 平台的修饰符，使用 \`${first.source}\` `)
}

export function computedPropSource(platformSource = '', defaultSource: string = '') {
  let source = defaultSource
  if (platformSource) {
    let [attr, ...value] = platformSource.split('=')
    attr = attr.replace(new RegExp(`\\.${builtInPlatforms.join('|\\.')}`, 'gm'), '')
    source = `${attr}${value.length ? '=' : ''}${value.join('=')}`
  }
  return source
}

export function transformProps(node: ParentNode | TemplateChildNode, ms: MagicString, id: string) {
  if (node.type !== 1)
    return

  node.children.forEach(n => transformProps(n, ms, id))

  if (!node.props.length)
    return

  const props = normalizeVueProps(node.props)
  const groups = groupPropsByName(props)

  Object.keys(groups).forEach((name) => {
    const group = groups[name]
    group.forEach(v => ms.remove(v.start.offset, v.end.offset))
    const defaultProp = group.find(v => v.modifiers.length === 0 || !hasPlatformModifier(v.modifiers))
    const platformProps = group.filter(v => hasPlatformModifier(v.modifiers) && v.modifiers.includes(platform))
    const platformProp = platformProps[0]
    hasMultiplePlatformProps(platformProps, id)

    const resultSource = computedPropSource(platformProp?.source, defaultProp?.source)

    if (defaultProp)
      ms.overwrite(defaultProp.start.offset, defaultProp.end.offset, resultSource)
    else if (platformProp)
      ms.overwrite(platformProp.start.offset, platformProp.end.offset, resultSource)
  })
}
