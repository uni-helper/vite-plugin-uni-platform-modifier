import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['fixtures'],
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
  },
})
