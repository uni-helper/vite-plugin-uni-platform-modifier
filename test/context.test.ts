import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import fg from 'fast-glob'
import { Context } from '../src/context'

vi.mock('@uni-helper/uni-env', () => {
  return {
    platform: 'mp-weixin',
    builtInPlatforms: ['h5', 'mp-weixin'],
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
      expect(result?.code).toMatchSnapshot()
    })
  }
})
