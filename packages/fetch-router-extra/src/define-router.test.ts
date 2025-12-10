import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { defineAction, defineController } from './define-router.ts'
import { type Middleware, use, includeParentExtra } from './middleware.ts'
import { createRouter, route } from '@remix-run/fetch-router'

describe('defineAction', () => {
  describe('single action', () => {
    it('returns middleware and action', () => {
      let testMiddleware: Middleware<{ user: string }>[] = [
        (context) => {
          ;(context as any).extra = { user: 'test' }
        },
      ]

      let result = defineAction({
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

      let result = defineAction({
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

  describe('with route', () => {
    it('returns action for specific route', () => {
      let testMiddleware: Middleware<{ userId: string }>[] = [
        (context) => {
          ;(context as any).extra = { userId: '123' }
        },
      ]

      let route = '/posts/:id'

      let result = defineAction(route, {
        middleware: testMiddleware,
        action: ({ extra }) => {
          return new Response(`User: ${extra.userId}`)
        },
      })

      assert.ok(result)
    })
  })
})

describe('defineController', () => {
  it('returns actions object', () => {
    let testMiddleware: Middleware<{ auth: boolean }>[] = [
      (context) => {
        ;(context as any).extra = { auth: true }
      },
    ]

    // Test that defineController accepts controller structure
    // The actual type checking is done at compile time
    let result = defineController({
      middleware: testMiddleware,
      actions: {
        index: ({ extra }) => new Response(`Auth: ${extra.auth}`),
      },
    })

    assert.ok(result)
    assert.ok(result.middleware)
    assert.ok(result.actions)
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

    // Use in defineAction to verify type safety
    let result = defineAction({
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
  it('works with nested controllers and middleware inheritance', () => {
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

    // Inner action with combined middleware
    let innerAction = defineAction({
      middleware: combinedMiddleware,
      action: ({ extra }) => {
        // Both parent and child extra should be available
        let userId: string = extra.user.id
        let userName: string = extra.user.name
        let title: string = extra.formData.title

        return new Response(`${userId} ${userName} ${title}`)
      },
    })

    assert.ok(innerAction)
    assert.ok(innerAction.middleware)
    assert.ok(innerAction.action)
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

    let result = defineAction({
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

  it('works with multiple actions with middleware on actions', () => {
    let authMiddleware: Middleware<{ user: { name: string } }>[] = [
      (context) => {
        ;(context as any).extra = { user: { name: 'Alice' } }
      },
    ]

    let loggingMiddleware: Middleware<{ log: (msg: string) => void }>[] = [
      (context) => {
        ;(context as any).extra = {
          ...((context as any).extra || {}),
          log: (msg: string) => console.log(msg),
        }
      },
    ]

    let action1 = defineAction({
      middleware: loggingMiddleware,
      action: ({ extra }) => {
        extra.log('Action One Executed')
        return new Response('Action One')
      },
    })

    let action2 = defineAction({
      middleware: [],
      action: () => {
        return new Response('Action Two')
      },
    })

    let controller = defineController({
      middleware: authMiddleware,
      actions: {
        actionOne: action1,
        actionTwo: action2,
      },
    })

    assert.ok(controller)
    assert.ok(controller.actions.actionOne)
    assert.ok(controller.actions.actionTwo)
  })

  it('works with multiple actions with middleware on actions - defined routes', () => {
    let routes = route({
      base: {
        actionOne: '/action-one',
        actionTwo: '/action-two/:id',
      }
    })

    let authMiddleware: Middleware<{ user: { name: string } }>[] = [
      (context) => {
        ;(context as any).extra = { user: { name: 'Alice' } }
      },
    ]

    let loggingMiddleware: Middleware<{ log: (msg: string) => void }>[] = [
      (context) => {
        ;(context as any).extra = {
          ...((context as any).extra || {}),
          log: (msg: string) => console.log(msg),
        }
      },
    ]

    let action1 = defineAction(routes.base.actionOne, {
      middleware: loggingMiddleware,
      action: ({ extra }) => {
        extra.log('Action One Executed')
        return new Response('Action One')
      },
    })

    let action2 = defineAction(routes.base.actionTwo,{
      middleware: [],
      action: () => {
        return new Response('Action Two')
      },
    })

    let controller = defineController(routes.base, {
      middleware: authMiddleware,
      actions: {
        actionOne: action1,
        actionTwo: action2,
      },
    })

    assert.ok(controller)
    assert.ok(controller.actions.actionOne)
    assert.ok(controller.actions.actionTwo)
  })

  it('works for nested controllers', () => {
    let routes = route({
      nested: {
        simple: '/nested/simple',
        deeper: {
          item1: '/nested/deeper/item1',
          item2: '/nested/deeper/:itemId',
        },
      }
    })

    let simpleAction = defineAction(routes.nested.simple, {
      middleware: [],
      action: () => {
        return new Response('Nested Simple Action')
      },
    })
    
    let deeperController = defineController(routes.nested.deeper, {
      middleware: [],
      actions: {
        item1() {
          return new Response('Nested Deeper Item 1')
        },
        item2({ params }) {
          return new Response('Nested Deeper Item 2: ' + params.itemId)
        },
      },
    })
    
    let nestedController = defineController(routes.nested, {
      middleware: [],
      actions: {
        simple: simpleAction,
        deeper: deeperController,
      },
    })

    let router = createRouter()
    router.map(routes.nested, nestedController)
    
    assert.ok(nestedController)
    assert.ok(nestedController.actions.simple)
    assert.ok(nestedController.actions.deeper)
    assert.ok(nestedController.actions.deeper.actions.item1)
    assert.ok(nestedController.actions.deeper.actions.item2)
  })
})
