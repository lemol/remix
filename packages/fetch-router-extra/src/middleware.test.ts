import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { type Middleware, use, withParent, type ExtractExtra } from './middleware.ts'

describe('use (variadic)', () => {
  it('accepts single middleware', () => {
    let mw: Middleware<{ a: 1 }> = (ctx, next) => next()
    let result = use(mw)
    assert.equal(result.length, 1)
    assert.equal(result[0], mw)
    
    // Type check
    type Expected = { a: 1 }
    let _extra: ExtractExtra<typeof result[number]> = null!

    let known: Expected = { a: 1 }
    known = _extra
  })

  it('accepts variadic middleware arguments', () => {
    let mw1: Middleware<{ a: 1 }> = (ctx, next) => {
      ;(ctx as any).extra = { ...((ctx as any).extra || {}), a: 1 }
      return next()
    }
    let mw2: Middleware<{ b: 2 }> = (ctx, next) => {
      ;(ctx as any).extra = { ...((ctx as any).extra || {}), b: 2 }
      return next()
    }

    let result = use(mw1, mw2)
    
    assert.equal(result.length, 2)
    assert.equal(result[0], mw1)
    assert.equal(result[1], mw2)
    
    // Type check (compile-time)
    type Expected = { a: 1 } & { b: 2 }
    let _extra: ExtractExtra<typeof result[number]> = null!
    
    // Type check (runtime)
    let known: Expected = { a: 1, b: 2 }
    known = _extra
  })

  it('accepts parent and variadic middleware', () => {
    let parentMw: Middleware<{ p: 'parent' }>[] = []
    let mw1: Middleware<{ a: 1 }> = (ctx, next) => next()

    let result = use(withParent<typeof parentMw>(), mw1)

    assert.equal(result.length, 1)
    assert.equal(result[0], mw1)

    // Type check
    type Expected = { p: 'parent' } & { a: 1 }
    let _extra: ExtractExtra<typeof result[number]> = null!
    
    // Type check (runtime)
    let known: Expected = { p: 'parent', a: 1 }
    known = _extra
  })

  it('supports mixed array and variadic arguments (backward compatibility)', () => {
    let mw1: Middleware<{ a: 1 }> = (ctx, next) => next()
    let mw2: Middleware<{ b: 2 }> = (ctx, next) => next()
    let mw3: Middleware<{ c: 3 }> = (ctx, next) => next()

    let result = use(mw1, [mw2, mw3])

    assert.equal(result.length, 3)
    assert.equal(result[0], mw1)
    assert.equal(result[1], mw2)
    assert.equal(result[2], mw3)
  })
  
  it('supports array argument (backward compatibility)', () => {
    let mw1: Middleware<{ a: 1 }> = (ctx, next) => next()
    let mw2: Middleware<{ b: 2 }> = (ctx, next) => next()

    let result = use([mw1, mw2])

    assert.equal(result.length, 2)
    assert.equal(result[0], mw1)
    assert.equal(result[1], mw2)
  })

  it('supports parent and array argument (backward compatibility)', () => {
    let parentMw: Middleware<{ p: 'parent' }>[] = []
    let mw1: Middleware<{ a: 1 }> = (ctx, next) => next()

    let result = use(withParent<typeof parentMw>(), [mw1])

    assert.equal(result.length, 1)
    assert.equal(result[0], mw1)
  })
})
