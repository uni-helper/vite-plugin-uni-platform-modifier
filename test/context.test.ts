import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import fg from 'fast-glob'
import { describe, expect, it, vi } from 'vitest'
import { Context } from '../src/context'

vi.mock('@uni-helper/uni-env', () => {
  return {
    platform: 'mp-weixin',
    builtInPlatforms: ['h5', 'web', 'mp-weixin', 'app', 'app-plus'],
    appPlatform: undefined,
    utsPlatform: undefined,
    subPlatform: undefined,
  }
})

describe('context', async () => {
  const ctx = new Context()

  it('should return undefined if templateNode is not found', () => {
    const code = 'const x = 1;'
    const id = 'test.js'
    const result = ctx.transform(code, id)
    expect(result).toBeUndefined()
  })

  it('should return undefined if MagicString has not changed', () => {
    const code = '<template><div>{{ msg }}</div></template>'
    const id = 'test.vue'
    const result = ctx.transform(code, id)
    expect(result?.code).toBeUndefined()
  })

  const cwd = resolve(__dirname, './fixtures')
  const files = await fg('*.vue', {
    cwd,
    absolute: true,
  })

  // 循环测试每个文件
  for (const file of files) {
    it (`should transform ${relative(cwd, file)}`, () => {
      const code = readFileSync(file, 'utf-8')
      const id = file
      const result = ctx.transform(code, id)
      // 插件回归到不输出时 result 会是 undefined，先断言存在，避免快照把 undefined 记成通过
      expect(result).toBeDefined()
      expect(result?.code).toMatchSnapshot()
    })
  }
})
