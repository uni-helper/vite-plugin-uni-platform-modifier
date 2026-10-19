import type { AttributeNode, DirectiveNode, ElementNode, ParentNode, RootNode, SourceLocation, TemplateChildNode } from '@vue/compiler-core'
import type MagicString from 'magic-string'
import type { Logger, LogOptions } from 'vite'
import { appPlatform, builtInPlatforms, platform, subPlatform, utsPlatform } from '@uni-helper/uni-env'
import { NodeTypes } from '@vue/compiler-core'
import { createLogger } from 'vite'
import { pluginName } from './constants'

export interface NormalizedProp extends SourceLocation {
  name: string
  modifiers: string[]
}

export type Prop = NormalizedProp

// 缺省 logger 只兜底单测和直接调用 utils 的场景；插件运行时由 configResolved 换成 vite 解析后的实例，
// 用户的 logLevel / customLogger 才能生效。多个 vite 实例共存时后解析的会覆盖前者。
let loggerInstance: Logger = createLogger(undefined, { prefix: pluginName })

export function setLogger(next: Logger): void {
  loggerInstance = next
}

// 只转发插件实际用到的方法；常量门面让测试可以直接 spyOn(logger, 'warn')
export const logger = {
  warn(message: string, options?: LogOptions): void {
    loggerInstance.warn(message, options)
  },
}

// builtInPlatforms 的元素类型是平台字面量联合，对 string 查成员用 Set 避免 any 断言
const builtInPlatformSet = new Set<string>(builtInPlatforms)

export interface PlatformEnv {
  platform?: string
  appPlatform?: string
  utsPlatform?: string
  subPlatform?: string
}

/**
 * 收集当前构建实际对应的平台标识。
 *
 * uni-app x 的 App 构建里 `UNI_PLATFORM` 是 `app`，android/ios 写在
 * `UNI_APP_PLATFORM`/`UNI_UTS_PLATFORM`；快应用子平台写在 `UNI_SUB_PLATFORM`。
 * 只看 `UNI_PLATFORM` 会把这些修饰符当成其它平台删掉。
 */
export function createActivePlatforms(env: PlatformEnv): Set<string> {
  const active = new Set<string>()
  if (env.platform)
    active.add(env.platform)
  if (env.appPlatform)
    active.add(`app-${env.appPlatform}`)
  if (env.utsPlatform)
    active.add(env.utsPlatform)
  if (env.subPlatform)
    active.add(env.subPlatform)
  // uni-env 的 isH5 同时判断 h5 和 web，两者是同一类浏览器目标
  if (active.has('h5') || active.has('web')) {
    active.add('h5')
    active.add('web')
  }
  return active
}

const activePlatforms = createActivePlatforms({ platform, appPlatform, utsPlatform, subPlatform })

export function hasPlatformModifier(modifiers: string[]): boolean {
  return modifiers.some(m => builtInPlatformSet.has(m))
}

export function matchesPlatform(modifiers: string[]): boolean {
  return modifiers.some(m => activePlatforms.has(m))
}

export function normalizeVueProps(props: (AttributeNode | DirectiveNode)[]): NormalizedProp[] {
  return props.map((prop) => {
    const result = {
      ...prop.loc,
      name: '',
      modifiers: [] as string[],
    }
    if (prop.type === NodeTypes.ATTRIBUTE) {
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

export function getRootTemplate(ast: RootNode): ParentNode | undefined {
  return ast.children.find((node): node is ElementNode => node.type === NodeTypes.ELEMENT && node.tag === 'template')
}

export function groupPropsByName(props: Prop[]): Record<string, Prop[]> {
  return props.reduce<Record<string, Prop[]>>((acc, cur) => {
    acc[cur.name] = acc[cur.name] ? [...acc[cur.name], cur] : [cur]
    return acc
  }, {})
}

function warnForMultipleProps(props: Prop[], id: string, reason: string): void {
  if (props.length < 2)
    return
  const first = props[0]
  const last = props[props.length - 1]
  logger.warn(`${id}:${first.start.line}:${first.start.column}-${last.end.column} 同一属性${reason}，使用 \`${first.source}\``)
}

export function hasMultiplePlatformProps(props: Prop[], id: string): void {
  warnForMultipleProps(props, id, '匹配到多个当前平台的修饰符')
}

export function hasMultipleDefaultProps(props: Prop[], id: string): void {
  warnForMultipleProps(props, id, '存在多个默认值')
}

// 平台修饰符只会出现在点分段的末尾；前瞻防止误删以平台名开头但不是平台的段（如 `.h5x`、`.webview`），以及互为前缀的平台名（`app` vs `app-plus`）
const platformModifierRegex = new RegExp(`\\.(?:${builtInPlatforms.join('|')})(?=\\.|$)`, 'g')

export function computedPropSource(platformSource = '', defaultSource: string = ''): string {
  let source = defaultSource
  if (platformSource) {
    const [attr, ...value] = platformSource.split('=')
    source = `${attr.replace(platformModifierRegex, '')}${value.length ? '=' : ''}${value.join('=')}`
  }
  return source
}

export function transformProps(node: ParentNode | TemplateChildNode, ms: MagicString, id: string): void {
  if (node.type !== NodeTypes.ELEMENT)
    return

  node.children.forEach(n => transformProps(n, ms, id))

  if (!node.props.length)
    return

  const props = normalizeVueProps(node.props)
  const groups = groupPropsByName(props)

  Object.keys(groups).forEach((name) => {
    const group = groups[name]
    group.forEach(v => ms.remove(v.start.offset, v.end.offset))
    const defaultProps = group.filter(v => v.modifiers.length === 0 || !hasPlatformModifier(v.modifiers))
    const defaultProp = defaultProps[0]
    const platformProps = group.filter(v => hasPlatformModifier(v.modifiers) && matchesPlatform(v.modifiers))
    const platformProp = platformProps[0]
    hasMultipleDefaultProps(defaultProps, id)
    hasMultiplePlatformProps(platformProps, id)

    const resultSource = computedPropSource(platformProp?.source, defaultProp?.source)

    if (defaultProp)
      ms.overwrite(defaultProp.start.offset, defaultProp.end.offset, resultSource)
    else if (platformProp)
      ms.overwrite(platformProp.start.offset, platformProp.end.offset, resultSource)
  })
}
