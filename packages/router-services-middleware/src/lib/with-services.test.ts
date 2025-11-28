import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createRouter, route } from '@remix-run/fetch-router'
import { asyncContext } from '@remix-run/async-context-middleware'

import { ServiceProvider, serviceOf } from './service-provider.ts'
import { withServiceProvider, getServiceProvider } from './with-service-provider.ts'
import { withServices } from './with-services.ts'

describe('withServiceProvider', () => {
  it('stores the service provider in context', async () => {
    let routes = route({
      home: '/',
    })

    let serviceProvider = new ServiceProvider()
    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    router.map(routes.home, () => {
      let provider = getServiceProvider()
      assert.equal(provider, serviceProvider)
      return new Response('Home')
    })

    let response = await router.fetch('https://remix.run/')
    assert.equal(response.status, 200)
  })

  it('throws when service provider is not installed', async () => {
    let routes = route({
      home: '/',
    })

    let router = createRouter({
      middleware: [asyncContext()],
    })

    router.map(routes.home, () => {
      assert.throws(
        () => getServiceProvider(),
        /No service provider found/,
      )
      return new Response('Home')
    })

    await router.fetch('https://remix.run/')
  })
})

describe('withServices', () => {
  it('makes services available on extra.services', async () => {
    let routes = route({
      posts: { method: 'POST', pattern: '/posts' },
    })

    let serviceProvider = new ServiceProvider()
    serviceProvider.provide(routes.posts, 'createPost', () => {
      return (title: string) => `Created: ${title}`
    })

    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    let capturedServices: any = null

    router.post(routes.posts, {
      middleware: [
        withServices(routes.posts, {
          createPost: serviceOf<(title: string) => string>(),
        }),
      ],
      handler(context: any) {
        capturedServices = context.extra.services
        return new Response('OK')
      },
    })

    await router.fetch('https://remix.run/posts', { method: 'POST' })

    assert.ok(capturedServices)
    assert.equal(typeof capturedServices.createPost, 'function')
    assert.equal(capturedServices.createPost('Hello'), 'Created: Hello')
  })

  it('lazily initializes services', async () => {
    let routes = route({
      posts: { method: 'POST', pattern: '/posts' },
    })

    let initCount = 0
    let serviceProvider = new ServiceProvider()
    serviceProvider.provide(routes.posts, 'myService', () => {
      initCount++
      return { value: 'test' }
    })

    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    router.post(routes.posts, {
      middleware: [
        withServices(routes.posts, {
          myService: serviceOf<{ value: string }>(),
        }),
      ],
      handler(context: any) {
        // Service should not be initialized yet
        assert.equal(initCount, 0)

        // Access the service
        let service = context.extra.services.myService
        assert.equal(initCount, 1)
        assert.equal(service.value, 'test')

        // Access again - should not reinitialize
        let service2 = context.extra.services.myService
        assert.equal(initCount, 1)
        assert.equal(service2, service)

        return new Response('OK')
      },
    })

    await router.fetch('https://remix.run/posts', { method: 'POST' })
  })

  it('throws when service factory is not registered', async () => {
    let routes = route({
      posts: { method: 'POST', pattern: '/posts' },
    })

    let serviceProvider = new ServiceProvider()
    // Note: not registering the service

    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    router.post(routes.posts, {
      middleware: [
        withServices(routes.posts, {
          missingService: serviceOf<string>(),
        }),
      ],
      handler(context: any) {
        assert.throws(
          () => context.extra.services.missingService,
          /No factory registered for service "missingService"/,
        )
        return new Response('OK')
      },
    })

    await router.fetch('https://remix.run/posts', { method: 'POST' })
  })

  it('provides multiple services', async () => {
    let routes = route({
      posts: { method: 'POST', pattern: '/posts' },
    })

    let serviceProvider = new ServiceProvider()
    serviceProvider.provide(routes.posts, 'serviceA', () => 'A')
    serviceProvider.provide(routes.posts, 'serviceB', () => 'B')

    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    router.post(routes.posts, {
      middleware: [
        withServices(routes.posts, {
          serviceA: serviceOf<string>(),
          serviceB: serviceOf<string>(),
        }),
      ],
      handler(context: any) {
        assert.equal(context.extra.services.serviceA, 'A')
        assert.equal(context.extra.services.serviceB, 'B')
        return new Response('OK')
      },
    })

    await router.fetch('https://remix.run/posts', { method: 'POST' })
  })

  it('isolates services between requests', async () => {
    let routes = route({
      posts: { method: 'POST', pattern: '/posts' },
    })

    let requestCount = 0
    let serviceProvider = new ServiceProvider()
    serviceProvider.provide(routes.posts, 'counter', () => {
      requestCount++
      return { id: requestCount }
    })

    let router = createRouter({
      middleware: [asyncContext(), withServiceProvider(serviceProvider)],
    })

    let capturedIds: number[] = []

    router.post(routes.posts, {
      middleware: [
        withServices(routes.posts, {
          counter: serviceOf<{ id: number }>(),
        }),
      ],
      handler(context: any) {
        capturedIds.push(context.extra.services.counter.id)
        return new Response('OK')
      },
    })

    await router.fetch('https://remix.run/posts', { method: 'POST' })
    await router.fetch('https://remix.run/posts', { method: 'POST' })
    await router.fetch('https://remix.run/posts', { method: 'POST' })

    // Each request should get a new service instance
    assert.deepEqual(capturedIds, [1, 2, 3])
  })
})
