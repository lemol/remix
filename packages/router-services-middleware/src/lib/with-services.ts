import { getContext } from '@remix-run/async-context-middleware'
import { createStorageKey } from '@remix-run/fetch-router'
import type { Middleware } from '@remix-run/fetch-router-extra'
import type { RequestContext, Route, RequestMethod } from '@remix-run/fetch-router'

import type {
  ServiceCatalog,
  ServiceTypes,
  CatalogEntry,
  ServiceProvider,
} from './service-provider.ts'
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
 * Check if a value is a catalog entry.
 */
function isCatalogEntry(value: unknown): value is CatalogEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__name' in value &&
    typeof (value as CatalogEntry).__name === 'string'
  )
}

/**
 * Resolve a service instance from a catalog entry.
 *
 * Services are initialized lazily when first accessed, and the same instance
 * is returned for the duration of the request.
 *
 * @param catalogEntry A catalog entry from `defineCatalog()`
 * @return The service instance
 *
 * @example
 * ```ts
 * let postRepository = resolveService(ServiceCatalog.postRepository)
 * ```
 */
export function resolveService<T>(catalogEntry: CatalogEntry<T>): T

/**
 * Resolve a service instance from a route and service name.
 *
 * @param route The route the service is registered for
 * @param serviceName The name of the service
 * @return The service instance
 */
export function resolveService<T>(route: Route<RequestMethod | 'ANY', string>, serviceName: string): T

export function resolveService<T>(
  catalogEntryOrRoute: CatalogEntry<T> | Route<RequestMethod | 'ANY', string>,
  serviceName?: string,
): T {
  let instances = getServiceInstances()
  let provider = getServiceProvider()
  return resolveServiceInternal(catalogEntryOrRoute, instances, provider, serviceName)
}

function resolveServiceInternal<T>(
  catalogEntryOrRoute: CatalogEntry<T> | Route<RequestMethod | 'ANY', string>,
  instances: ServiceInstances,
  provider: ServiceProvider,
  serviceName?: string,
): T {
  if (isCatalogEntry(catalogEntryOrRoute)) {
    let name = catalogEntryOrRoute.__name
    let key = name

    if (instances.has(key)) {
      return instances.get(key) as T
    }

    let factory = provider.getFactory({ method: 'ANY', pattern: { source: '' } } as any, name)
    if (!factory) {
      throw new Error(
        `No factory registered for service "${name}". ` +
          `Did you forget to call serviceProvider.provide()?`,
      )
    }

    let instance = factory()
    instances.set(key, instance)
    return instance as T
  }

  // Route-based resolution
  let route = catalogEntryOrRoute
  let name = serviceName!
  let key = `${route.method}:${route.pattern.source}:${name}`

  if (instances.has(key)) {
    return instances.get(key) as T
  }

  let factory = provider.getFactory(route, name)
  if (!factory) {
    throw new Error(
      `No factory registered for service "${name}" on route "${route.method} ${route.pattern.source}". ` +
        `Did you forget to call serviceProvider.provide()?`,
    )
  }

  let instance = factory()
  instances.set(key, instance)
  return instance as T
}

/**
 * Create a middleware that makes a catalog entry service available on the request context.
 *
 * Services are initialized lazily when first accessed, and the same instance
 * is returned for the duration of the request.
 *
 * @param entry A catalog entry from `defineCatalog()`
 * @return A middleware that adds the service to `extra.services`
 *
 * @example
 * ```ts
 * const middleware = withServices(ServiceCatalog.postRepository)
 * // extra.services.postRepository is now available
 * ```
 */
export function withServices<T, Name extends string>(
  entry: CatalogEntry<T> & { __name: Name },
): Middleware<{ services: { [K in Name]: T } }>

/**
 * Create a middleware that makes multiple catalog entry services available on the request context.
 */
export function withServices<T1, N1 extends string, T2, N2 extends string>(
  entry1: CatalogEntry<T1> & { __name: N1 },
  entry2: CatalogEntry<T2> & { __name: N2 },
): Middleware<{ services: { [K in N1]: T1 } & { [K in N2]: T2 } }>

export function withServices<T1, N1 extends string, T2, N2 extends string, T3, N3 extends string>(
  entry1: CatalogEntry<T1> & { __name: N1 },
  entry2: CatalogEntry<T2> & { __name: N2 },
  entry3: CatalogEntry<T3> & { __name: N3 },
): Middleware<{ services: { [K in N1]: T1 } & { [K in N2]: T2 } & { [K in N3]: T3 } }>

export function withServices<
  T1,
  N1 extends string,
  T2,
  N2 extends string,
  T3,
  N3 extends string,
  T4,
  N4 extends string,
>(
  entry1: CatalogEntry<T1> & { __name: N1 },
  entry2: CatalogEntry<T2> & { __name: N2 },
  entry3: CatalogEntry<T3> & { __name: N3 },
  entry4: CatalogEntry<T4> & { __name: N4 },
): Middleware<
  { services: { [K in N1]: T1 } & { [K in N2]: T2 } & { [K in N3]: T3 } & { [K in N4]: T4 } }
>

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
): Middleware<{ services: ServiceTypes<C> }>

export function withServices(
  routeOrEntry: Route<RequestMethod | 'ANY', string> | CatalogEntry,
  catalogOrEntry?: ServiceCatalog | CatalogEntry,
  ...moreEntries: CatalogEntry[]
): Middleware {
  // Check if first argument is a catalog entry (not a route)
  if (isCatalogEntry(routeOrEntry)) {
    // Collect all catalog entries
    let entries: CatalogEntry[] = [routeOrEntry]
    if (catalogOrEntry && isCatalogEntry(catalogOrEntry)) {
      entries.push(catalogOrEntry)
    }
    entries.push(...moreEntries)

    return (context: RequestContext) => {
      // Capture instances and provider at middleware execution time
      let instances = getServiceInstances()
      let provider = getServiceProvider()

      // Merge with existing services if present
      let existingServices = (context as any).extra?.services ?? {}
      let services = { ...existingServices }

      for (let entry of entries) {
        Object.defineProperty(services, entry.__name, {
          get() {
            return resolveServiceInternal(entry, instances, provider)
          },
          enumerable: true,
          configurable: true,
        })
      }

      ;(context as any).extra ??= {}
      ;(context as any).extra.services = services
    }
  }

  // Route overload
  let route = routeOrEntry as Route<RequestMethod | 'ANY', string>
  let catalog = catalogOrEntry as ServiceCatalog
  let serviceNames = Object.keys(catalog)

  return (context: RequestContext) => {
    // Capture instances and provider at middleware execution time
    let instances = getServiceInstances()
    let provider = getServiceProvider()

    // Merge with existing services if present
    let existingServices = (context as any).extra?.services ?? {}
    let services = { ...existingServices }

    for (let name of serviceNames) {
      Object.defineProperty(services, name, {
        get() {
          return resolveServiceInternal(route, instances, provider, name)
        },
        enumerable: true,
        configurable: true,
      })
    }

    ;(context as any).extra ??= {}
    ;(context as any).extra.services = services
  }
}
