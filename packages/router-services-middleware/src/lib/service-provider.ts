import type { Route, RequestMethod } from '@remix-run/fetch-router'

/**
 * A service factory is a function that creates a service instance.
 * The factory is called lazily when the service is first requested.
 */
export type ServiceFactory<T> = () => T

/**
 * A service definition that captures the type of a service.
 */
export interface ServiceDef<T = unknown> {
  __serviceType?: T
}

/**
 * Create a service type that can be used to define services in a type-safe way.
 *
 * @example
 * ```ts
 * const createPost = serviceOf<(args: { title: string, content: string }) => void>()
 * ```
 */
export function serviceOf<T>(): ServiceDef<T> {
  return {}
}

/**
 * A service catalog is a record of service names to service definitions.
 */
export type ServiceCatalog = Record<string, ServiceDef>

/**
 * Extract the service type from a service definition.
 */
export type ServiceType<S extends ServiceDef> = S extends ServiceDef<infer T> ? T : never

/**
 * Extract the service types from a service catalog.
 */
export type ServiceTypes<C extends ServiceCatalog> = {
  [K in keyof C]: ServiceType<C[K]>
}

type RouteKey = string

function getRouteKey(route: Route<RequestMethod | 'ANY', string>): RouteKey {
  return `${route.method}:${route.pattern.source}`
}

/**
 * A service provider that manages service factories and instances.
 *
 * Services are registered with `provide()` and are instantiated lazily
 * when first requested within a request context.
 */
export class ServiceProvider {
  #factories = new Map<RouteKey, Map<string, ServiceFactory<unknown>>>()

  /**
   * Register a service factory for a specific route.
   *
   * @param route The route to register the service for
   * @param serviceName The name of the service
   * @param factory The factory function that creates the service instance
   */
  provide<T>(
    route: Route<RequestMethod | 'ANY', string>,
    serviceName: string,
    factory: ServiceFactory<T>,
  ): void {
    let routeKey = getRouteKey(route)
    let routeFactories = this.#factories.get(routeKey)

    if (!routeFactories) {
      routeFactories = new Map()
      this.#factories.set(routeKey, routeFactories)
    }

    routeFactories.set(serviceName, factory)
  }

  /**
   * Get a service factory for a specific route and service name.
   *
   * @param route The route to get the service factory for
   * @param serviceName The name of the service
   * @return The service factory, or undefined if not found
   */
  getFactory<T>(
    route: Route<RequestMethod | 'ANY', string>,
    serviceName: string,
  ): ServiceFactory<T> | undefined {
    let routeKey = getRouteKey(route)
    return this.#factories.get(routeKey)?.get(serviceName) as ServiceFactory<T> | undefined
  }
}
