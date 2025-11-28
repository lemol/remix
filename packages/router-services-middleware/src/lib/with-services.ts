import { getContext } from '@remix-run/async-context-middleware'
import { createStorageKey } from '@remix-run/fetch-router'
import type { Middleware } from '@remix-run/fetch-router-extra'
import type { RequestContext, Route, RequestMethod } from '@remix-run/fetch-router'

import type { ServiceCatalog, ServiceTypes } from './service-provider.ts'
import { getServiceProvider } from './with-service-provider.ts'

type ServiceInstances = Map<string, unknown>

const SERVICES_INSTANCE_KEY = createStorageKey<ServiceInstances>()

/**
 * Get the service instances map from the current request context.
 * Creates a new map if one doesn't exist.
 */
function getServiceInstances(): ServiceInstances {
  let context = getContext()

  if (!context.storage.has(SERVICES_INSTANCE_KEY)) {
    let instances = new Map<string, unknown>()
    context.storage.set(SERVICES_INSTANCE_KEY, instances)
    return instances
  }

  return context.storage.get(SERVICES_INSTANCE_KEY)
}

/**
 * Create a middleware that makes services available on the request context.
 *
 * Services are initialized lazily when first accessed, and the same instance
 * is returned for the duration of the request.
 *
 * @param route The route to fetch services for
 * @param catalog A record of service names to service definitions
 * @return A middleware that adds `extra.services` to the context
 *
 * @example
 * ```ts
 * const middleware = withServices(routes.posts, {
 *   createPost: serviceOf<(args: { title: string, content: string }) => void>()
 * })
 * ```
 */
export function withServices<C extends ServiceCatalog>(
  route: Route<RequestMethod | 'ANY', string>,
  catalog: C,
): Middleware<{ services: ServiceTypes<C> }> {
  let serviceNames = Object.keys(catalog)

  return (context: RequestContext) => {
    let provider = getServiceProvider()
    let instances = getServiceInstances()

    // Create a proxy that lazily initializes services
    let services = {} as ServiceTypes<C>

    for (let name of serviceNames) {
      Object.defineProperty(services, name, {
        get() {
          // Check if already instantiated
          let key = `${route.method}:${route.pattern.source}:${name}`
          if (instances.has(key)) {
            return instances.get(key)
          }

          // Get factory and create instance
          let factory = provider.getFactory(route, name)
          if (!factory) {
            throw new Error(
              `No factory registered for service "${name}" on route "${route.method} ${route.pattern.source}". ` +
                `Did you forget to call serviceProvider.provide()?`,
            )
          }

          let instance = factory()
          instances.set(key, instance)
          return instance
        },
        enumerable: true,
      })
    }

    ;(context as any).extra ??= {}
    ;(context as any).extra.services = services
  }
}
