import { describe, expect, it, vi } from 'vitest'
import { VitePluginUniPlatformModifier } from '../src/index'
import { hasMultiplePlatformProps } from '../src/utils'

vi.mock('@uni-helper/uni-env', () => {
  return {
    platform: 'mp-weixin',
    builtInPlatforms: ['h5', 'web', 'mp-weixin', 'app', 'app-plus'],
    appPlatform: undefined,
    utsPlatform: undefined,
    subPlatform: undefined,
  }
})

describe('plugin', () => {
  it('should skip files outside the vue template filter', () => {
    const plugin = VitePluginUniPlatformModifier()
    const transform = plugin.transform as (code: string, id: string) => unknown

    expect(transform('const x = 1', '/project/src/main.ts')).toBeUndefined()
  })

  it('should route warnings through the logger resolved by vite', () => {
    const plugin = VitePluginUniPlatformModifier()
    const resolvedLogger = { warn: vi.fn() }
    const configResolved = plugin.configResolved as (config: unknown) => void

    configResolved({ logger: resolvedLogger })

    const props = [
      { start: { line: 1, column: 1 }, end: { line: 1, column: 10 }, source: 'prop1' },
      { start: { line: 2, column: 1 }, end: { line: 2, column: 20 }, source: 'prop2' },
    ]
    hasMultiplePlatformProps(props as any, 'testId')

    expect(resolvedLogger.warn).toHaveBeenCalledTimes(1)
    expect(resolvedLogger.warn).toHaveBeenCalledWith('[vite-plugin-uni-platform-modifier] testId:1:1-2:20 同一属性匹配到多个当前平台的修饰符，使用 `prop1`', undefined)
  })
})
