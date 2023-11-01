import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TemplateNode } from '@vue/compiler-core'
import type { Prop } from '../src/utils'
import { computedPropSource, getRootTemplate, groupPropsByName, hasMultiplePlatformProps, hasPlatformModifier, logger, normalizeVueProps } from '../src/utils'

describe('hasPlatformModifier', () => {
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
})

describe('normalizeVueProps', () => {
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
})

describe('getRootTemplate', () => {
  it('should return the template node with type 1 and tag "template"', () => {
    const ast = {
      children: [
        { type: 1, tag: 'template', children: [] },
        { type: 2, tag: 'div', children: [] },
      ],
    }

    const result = getRootTemplate(ast as any) as TemplateNode

    expect(result.type).toBe(1)
    expect(result.tag).toBe('template')
  })

  it('should return undefined if no template node is found', () => {
    const ast = {
      children: [
        { type: 2, tag: 'div', children: [] },
        { type: 3, tag: 'script', children: [] },
      ],
    }

    const result = getRootTemplate(ast as any)

    expect(result).toBeUndefined()
  })
})

describe('groupPropsByName', () => {
  it('should group props by name', () => {
    const props = [
      { name: 'prop1', value: 'value1' },
      { name: 'prop2', value: 'value2' },
      { name: 'prop1', value: 'value3' },
    ]

    const result = groupPropsByName(props as any)

    expect(result).toEqual({
      prop1: [
        { name: 'prop1', value: 'value1' },
        { name: 'prop1', value: 'value3' },
      ],
      prop2: [{ name: 'prop2', value: 'value2' }],
    })
  })

  it('should handle empty input', () => {
    const props: Prop[] = []

    const result = groupPropsByName(props)

    expect(result).toEqual({})
  })

  it('should handle input with a single prop', () => {
    const props = [{ name: 'prop1', value: 'value1' }]

    const result = groupPropsByName(props as any)

    expect(result).toEqual({
      prop1: [{ name: 'prop1', value: 'value1' }],
    })
  })
})

describe('hasMultiplePlatformProps', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('should not log a warning if the props array is empty', () => {
    const props: Prop[] = []
    const id = 'testId'
    const spy = vi.spyOn(logger, 'warn')

    hasMultiplePlatformProps(props, id)

    expect(spy).not.toHaveBeenCalled()
  })

  it('should log a warning if the props array has more than one element', () => {
    const props = [
      { start: { line: 1, column: 1 }, end: { column: 10 }, source: 'prop1' },
      { start: { line: 2, column: 1 }, end: { column: 20 }, source: 'prop2' },
    ]
    const id = 'testId'
    const spy = vi.spyOn(logger, 'warn')

    hasMultiplePlatformProps(props as any, id)

    expect(spy).toHaveBeenCalledWith('testId:1:1-20 单一属性匹配到多个 undefined 平台的修饰符，使用 `prop1` ')
  })
})

describe('computedPropSource', () => {
  it('should return defaultSource when platformSource is empty', () => {
    expect(computedPropSource('', 'default')).toBe('default')
  })

  it('should return empty string when platformSource is empty and defaultSource is empty', () => {
    expect(computedPropSource('')).toBe('')
  })

  it('should return platformSource with empty value when platformSource has a single attribute and no value', () => {
    expect(computedPropSource('attr')).toBe('attr')
  })

  it('should return platformSource with replaced attribute and value when platformSource has a single modifier and value', () => {
    expect(computedPropSource('attr.h5="h5"')).toBe('attr="h5"')
  })

  it('should return platformSource with replaced attribute and value when platformSource has multiple modifiers and values', () => {
    expect(computedPropSource('attr1.h5.mp-weixin=".app=.mp-weixin=.h5"')).toBe('attr1=".app=.mp-weixin=.h5"')
  })
})
