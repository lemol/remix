import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { defineRouter } from './define-router.ts'
import { type Middleware, use, includeParentExtra } from './middleware.ts'

describe('defineRouter', () => {
  describe('single action', () => {
    it('returns middleware and action', () => {
      let testMiddleware: Middleware<{ user: string }>[] = [
        (context) => {
          ;(context as any).extra = { user: 'test' }
        },
      ]

      let result = defineRouter({
        middleware: testMiddleware,
        action: ({ extra }) => {
          return new Response(`Hello ${extra.user}`)
        },
      })

      assert.ok(result.middleware)
      assert.ok(result.action)
      assert.equal(result.middleware, testMiddleware)
    })

    it('action receives typed extra from middleware', () => {
      let testMiddleware: Middleware<{ user: { name: string } }>[] = [
        (context) => {
          ;(context as any).extra = { user: { name: 'John' } }
        },
      ]

      let result = defineRouter({
        middleware: testMiddleware,
        action: ({ extra }) => {
          // Type assertion to verify the type is correct
          let userName: string = extra.user.name
          return new Response(`Hello ${userName}`)
        },
      })

      assert.ok(result.action)
    })
  })

  describe('controller', () => {
    it('returns actions object', () => {
      let testMiddleware: Middleware<{ auth: boolean }>[] = [
        (context) => {
          ;(context as any).extra = { auth: true }
        },
      ]

      // Test that defineRouter accepts controller structure
      // The actual type checking is done at compile time
      let result = defineRouter({
        middleware: testMiddleware,
        action: ({ extra }) => new Response(`Auth: ${extra.auth}`),
      })

      assert.ok(result)
      assert.ok(result.middleware)
      assert.ok(result.action)
    })
  })

  describe('single route', () => {
    it('returns action for specific route', () => {
      let testMiddleware: Middleware<{ userId: string }>[] = [
        (context) => {
          ;(context as any).extra = { userId: '123' }
        },
      ]

      let route = '/posts/:id'

      let result = defineRouter(route, {
        middleware: testMiddleware,
        action: ({ extra }) => {
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

    assert.equal(result.length, testMiddleware.length)
    assert.equal(result[0], testMiddleware[0])
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

    let result = use(includeParentExtra(parentMw), childMw)

    assert.ok(result)
    assert.equal(result.length, childMw.length + 1)
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

    let combined = use(includeParentExtra(parentMw), childMw)
    let _extra = extractExtraType(combined) satisfies { auth: boolean; formData: { title: string } }

    // Use in defineRouter to verify type safety
    let result = defineRouter({
      middleware: combined,
      action: ({ extra }) => {
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

    let combinedMiddleware = use(includeParentExtra(authMiddleware), formMiddleware)

    // Inner router with combined middleware
    let innerRouter = defineRouter({
      middleware: combinedMiddleware,
      action: ({ extra }) => {
        // Both parent and child extra should be available
        let userId: string = extra.user.id
        let userName: string = extra.user.name
        let title: string = extra.formData.title

        return new Response(`${userId} ${userName} ${title}`)
      },
    })

    assert.ok(innerRouter)
    assert.ok(innerRouter.middleware)
    assert.ok(innerRouter.action)
  })

  it('handles mixed middleware types correctly', () => {
    // This test simulates the user's scenario where different middleware
    // provide different extra properties, and we want to ensure they are all
    // correctly inferred and merged.
    
    // Middleware 1: Provides 'user'
    let authMiddleware: Middleware<{ user: { id: string } }> = (context) => {
      ;(context as any).extra = { ...((context as any).extra || {}), user: { id: '1' } }
    }

    // Middleware 2: Provides 'services' (simulating withServices)
    let servicesMiddleware: Middleware<{ services: { db: any } }> = (context) => {
      ;(context as any).extra = { ...((context as any).extra || {}), services: { db: {} } }
    }

    // Middleware 3: Provides 'admin'
    let adminMiddleware: Middleware<{ admin: boolean }> = (context) => {
      ;(context as any).extra = { ...((context as any).extra || {}), admin: true }
    }

    let result = defineRouter({
      middleware: [authMiddleware, servicesMiddleware, adminMiddleware],
      action: ({ extra }) => {
        // In the failing case, 'extra' might be inferred as the union of extras
        // or just one of them, rather than the intersection.
        // We want to verify that we can access properties from ALL middlewares.
        
        // These assignments serve as type checks. 
        // If inference is wrong, these might fail compilation (if we were running tsc)
        // or at runtime if we were inspecting types (which we can't easily do here).
        // But we can check if the values are present at runtime.
        
        let userId = extra.user.id
        let db = extra.services.db
        let isAdmin = extra.admin

        return new Response(`User: ${userId}, Admin: ${isAdmin}`)
      }
    })

    assert.ok(result)
  })
})
