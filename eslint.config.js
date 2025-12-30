//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      '.output/**',
      '.vinxi/**',
      '.nitro/**',
      '.tanstack/**',
      'generated/**',
      '*.db',
      '*.local',
      '.DS_Store',
      'src/components/ui/**',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  ...tanstackConfig,
]
