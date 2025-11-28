import type {
  RequestContext,
  Route,
  RequestMethod,
  BuildRouteHandler,
  RouteHandlers,
} from '@remix-run/fetch-router'
import type { RouteMap } from '@remix-run/fetch-router'
import type { Params, RoutePattern } from '@remix-run/route-pattern'
import type { ExtractExtra, Middleware } from './middleware.ts'

// prettier-ignore
type RouteHandlersExtra<routes extends RouteMap, extra = unknown> =
  | RouteHandlersExtraWithMiddleware<routes, extra>
  | RouteHandlersExtraWithoutMiddleware<routes, extra>

// prettier-ignore
type RouteHandlersExtraWithMiddleware<routes extends RouteMap, extra = unknown> = {
  middleware?: Middleware[]
  handlers: RouteHandlersExtra<routes, extra>
} & (routes extends Record<string, any>
  ? {
      [name in keyof routes as routes extends any ? never : name]?: never
    }
  : {})

// prettier-ignore
type RouteHandlersExtraWithoutMiddleware<routes extends RouteMap, extra = unknown> = routes extends any ?
  ({
    [name in keyof routes]: (
      routes[name] extends Route<infer method extends RequestMethod | 'ANY', infer pattern extends string> ? (
        | ((context: RequestContext<method, Params<pattern>> & { extra: extra }) => Response | Promise<Response>)
        | {
            middleware?: Middleware[]
            handler: (
              context: RequestContext<method, Params<pattern>> & { extra: extra }
            ) => Response | Promise<Response>
          }
      ) :
      routes[name] extends RouteMap ? RouteHandlersExtra<routes[name], extra> :
      never
    )
  } & {
    middleware?: never
    handlers?: never
  }) :
  never

type GetParams<R> = R extends string
  ? Params<R>
  : R extends RoutePattern<infer P extends string>
    ? Params<P>
    : R extends Route<infer _, infer P extends string>
      ? Params<P>
      : Params<string>

type GetMethod<R> = R extends Route<infer M, infer _> ? M : 'ANY'

/**
 * Define a route handler with type-safe middleware data.
 *
 * Middleware data is automatically extracted and made available in the handler's
 * `extra` parameter with full type safety.
 *
 * @example
 * ```ts
 * defineRouter({
 *   middleware: [authMiddleware],
 *   handler: ({ extra }) => {
 *     // extra.user is fully typed from authMiddleware
 *     return new Response(`Hello ${extra.user.name}`)
 *   }
 * })
 * ```
 */
export function defineRouter<
  M extends Middleware,
  method extends RequestMethod | 'ANY' = RequestMethod | 'ANY',
  pattern extends string = string,
>(options: {
  middleware: M[]
  handler: (
    context: RequestContext<method, Params<pattern>> & { extra: ExtractExtra<M> },
  ) => Response | Promise<Response>
}): {
  middleware: M[]
  handler: (context: RequestContext<method, Params<pattern>>) => Response | Promise<Response>
}
/**
 * Define a route tree with type-safe middleware data.
 *
 * @example
 * ```ts
 * defineRouter(routes.posts, {
 *   middleware: [authMiddleware],
 *   handlers: {
 *     index({ extra }) {
 *       // extra.user is fully typed
 *       return new Response(`Posts for ${extra.user.name}`)
 *     }
 *   }
 * })
 * ```
 */
export function defineRouter<M extends Middleware, routes extends RouteMap>(
  routes: routes,
  options: {
    middleware: M[] 
    handlers: RouteHandlersExtra<routes, ExtractExtra<M>>
  },
): RouteHandlers<routes>
/**
 * Define a single route handler with type-safe middleware data.
 *
 * @example
 * ```ts
 * defineRouter(routes.posts.action, {
 *   middleware: [authMiddleware],
 *   handler: ({ extra }) => {
 *     // extra.user is fully typed
 *     return new Response('Post created')
 *   }
 * })
 * ```
 */
export function defineRouter<M extends Middleware, route extends string | RoutePattern | Route>(
  route: route,
  options: {
    middleware: M[]
    handler: (
      context: RequestContext<GetMethod<route>, GetParams<route>> & {
        extra: ExtractExtra<M>
      },
    ) => Response | Promise<Response>
  },
): BuildRouteHandler<GetMethod<route>, route>
export function defineRouter(routeOrOptions: any, options?: any) {
  return options ?? routeOrOptions
}
