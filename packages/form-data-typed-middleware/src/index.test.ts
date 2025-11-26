import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { withFormData } from './index.ts'

describe('withFormData', () => {
  it('should validate form data and add it to extra', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.coerce.number(),
    })

    const middleware = withFormData(schema)
    const formData = new FormData()
    formData.append('name', 'John')
    formData.append('age', '30')

    const context: any = {
      formData,
    }

    await middleware(context, null!)

    assert.deepStrictEqual(context.extra.formData, {
      name: 'John',
      age: 30,
    })
  })

  it('should return 400 if validation fails', async () => {
    const schema = z.object({
      name: z.string(),
    })

    const middleware = withFormData(schema)
    const formData = new FormData() // Missing name

    const context: any = {
      formData,
    }

    const response = await middleware(context, null!)

    assert.ok(response instanceof Response)
    assert.strictEqual(response.status, 400)
  })
})
