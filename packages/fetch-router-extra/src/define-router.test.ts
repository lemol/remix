import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { defineRouter } from './define-router.ts'
import { type Middleware, use, withParent } from './middleware.ts'

describe('defineRouter', () => {
  describe('single handler', () => {
    it('returns middleware and handler', () => {
      let testMiddleware: Middleware<{ user: string }>[] = [
        (context) => {
          ;(context as any).extra = { user: 'test' }
        },
      ]

      let result = defineRouter({
        middleware: testMiddleware,
        handler: ({ extra }) => {
          return new Response(`Hello ${extra.user}`)
        },
      })

      assert.ok(result.middleware)
      assert.ok(result.handler)
      assert.equal(result.middleware, testMiddleware)
    })

    it('handler receives typed extra from middleware', () => {
      let testMiddleware: Middleware<{ user: { name: string } }>[] = [
        (context) => {
          ;(context as any).extra = { user: { name: 'John' } }
        },
      ]

      let result = defineRouter({
        middleware: testMiddleware,
        handler: ({ extra }) => {
          // Type assertion to verify the type is correct
          let userName: string = extra.user.name
          return new Response(`Hello ${userName}`)
        },
      })

      assert.ok(result.handler)
    })
  })

  describe('route tree', () => {
    it('returns handlers object', () => {
      let testMiddleware: Middleware<{ auth: boolean }>[] = [
        (context) => {
          ;(context as any).extra = { auth: true }
        },
      ]

      // Test that defineRouter accepts route tree structure
      // The actual type checking is done at compile time
      let result = defineRouter({
        middleware: testMiddleware,
        handler: ({ extra }) => new Response(`Auth: ${extra.auth}`),
      })

      assert.ok(result)
      assert.ok(result.middleware)
      assert.ok(result.handler)
    })
  })

  describe('single route', () => {
    it('returns handler for specific route', () => {
      let testMiddleware: Middleware<{ userId: string }>[] = [
        (context) => {
          ;(context as any).extra = { userId: '123' }
        },
      ]

      let route = '/posts/:id'

      let result = defineRouter(route, {
        middleware: testMiddleware,
        handler: ({ extra }) => {
          return new Response(`User: ${extra.userId}`)
        },
      })

      assert.ok(result)
    })
  })
})

describe('use', () => {
  it('returns middleware array when no parent', () => {
    let testMiddleware: Middleware<{ data: string }>[] = [
      (context) => {
        ;(context as any).extra = { data: 'test' }
      },
    ]

    let result = use(testMiddleware)

    assert.equal(result, testMiddleware)
  })

  it('returns middleware with parent type when parent provided', () => {
    let parentMw: Middleware<{ user: string }>[] = [
      (context) => {
        ;(context as any).extra = { user: 'test' }
      },
    ]

    let childMw: Middleware<{ data: string }>[] = [
      (context) => {
        ;(context as any).extra = { ...((context as any).extra || {}), data: 'test' }
      },
    ]

    let result = use(withParent<typeof parentMw>(), childMw)

    assert.ok(result)
    assert.equal(result.length, childMw.length)
  })

  it('combines parent and child middleware types', () => {
    let parentMw: Middleware<{ auth: boolean }>[] = [
      (context) => {
        ;(context as any).extra = { auth: true }
      },
    ]

    let childMw: Middleware<{ formData: { title: string } }>[] = [
      (context) => {
        ;(context as any).extra = {
          ...((context as any).extra || {}),
          formData: { title: 'Test' },
        }
      },
    ]

    let combined = use(withParent<typeof parentMw>(), childMw)
    let _extra = extractExtraType(combined) satisfies { auth: boolean; formData: { title: string } }

    // Use in defineRouter to verify type safety
    let result = defineRouter({
      middleware: combined,
      handler: ({ extra }) => {
        // Both types should be available
        let auth: boolean = extra.auth
        let title: string = extra.formData.title
        return new Response(`${auth} ${title}`)
      },
    })

    assert.ok(result)
  })
})

function extractExtraType<T extends Middleware<any>[]>(
  mw: T,
): T extends Middleware<infer extra>[] ? extra : never {
  return null!
}

describe('integration', () => {
  it('works with nested routers and middleware inheritance', () => {
    // Parent middleware
    let authMiddleware: Middleware<{ user: { id: string; name: string } }>[] = [
      (context) => {
        ;(context as any).extra = { user: { id: '1', name: 'John' } }
      },
    ]

    // Child middleware inheriting from parent
    let formMiddleware: Middleware<{ formData: { title: string } }>[] = [
      (context) => {
        ;(context as any).extra = {
          ...((context as any).extra || {}),
          formData: { title: 'Test Post' },
        }
      },
    ]

    let combinedMiddleware = use(withParent<typeof authMiddleware>(), formMiddleware)

    // Inner router with combined middleware
    let innerRouter = defineRouter({
      middleware: combinedMiddleware,
      handler: ({ extra }) => {
        // Both parent and child extra should be available
        let userId: string = extra.user.id
        let userName: string = extra.user.name
        let title: string = extra.formData.title

        return new Response(`${userId} ${userName} ${title}`)
      },
    })

    assert.ok(innerRouter)
    assert.ok(innerRouter.middleware)
    assert.ok(innerRouter.handler)
  })
})
