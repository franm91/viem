import { expect, test } from 'vitest'

import * as utils from './index'

test('exports utils', () => {
  expect(utils).toMatchInlineSnapshot(`
    {
      "withRetry": [Function],
      "withTimeout": [Function],
      Symbol(Symbol.toStringTag): "Module",
    }
  `)
})