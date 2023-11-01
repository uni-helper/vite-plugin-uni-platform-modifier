import { expect, it } from 'vitest'
import { hasPlatformModifier, normalizeVueProps } from '../src/utils'

it('should return true when array includes a platform modifier', () => {
  const modifiers = ['modifier1', 'mp-weixin', 'modifier3']
  const result = hasPlatformModifier(modifiers)
  expect(result).toBe(true)
})

it('should return false when array does not include a platform modifier', () => {
  const modifiers = ['modifier1', 'modifier2', 'modifier3']
  const result = hasPlatformModifier(modifiers)
  expect(result).toBe(false)
})

it('should normalize Vue props', () => {
  const props = [
    { type: 6, name: 'class.mp-weixin.once' },
    { type: 7, name: 'on', arg: { loc: { source: 'click' } }, modifiers: ['once', 'h5', 'mp-weixin'] },
  ]

  const result = normalizeVueProps(props as any)

  expect(result).toEqual([
    { name: 'class', modifiers: ['mp-weixin', 'once'] },
    { name: 'v-onclick', modifiers: ['once', 'h5', 'mp-weixin'] },
  ])
})
