import { builtInPlatforms } from '@uni-helper/uni-env'
import type { AttributeNode, DirectiveNode, ParentNode, RootNode } from '@vue/compiler-core'

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
