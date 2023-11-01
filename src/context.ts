import { createFilter } from 'vite'

import { parse } from '@vue/compiler-dom'
import MagicString from 'magic-string'
import { getRootTemplate, transformProps } from './utils'

export class Context {
  filter: (id: unknown) => boolean
  constructor() {
    this.filter = createFilter('**/*.?(nu)vue')
  }

  transform(code: string, id: string) {
    const ast = parse(code)
    const templateNode = getRootTemplate(ast)
    if (!templateNode)
      return
    const ms = new MagicString(code)

    transformProps(templateNode, ms, id)

    if (ms.hasChanged()) {
      return {
        code: ms.toString(),
        map: ms.generateMap({
          file: id,
        }),
      }
    }
  }
}
