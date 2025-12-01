import type {
  RequestContext,
  Route,
  RequestMethod,
  BuildAction,
  Controller,
} from '@remix-run/fetch-router'
import type { RouteMap } from '@remix-run/fetch-router'
import type { Params, RoutePattern } from '@remix-run/route-pattern'
import { type ExtractExtra, type Middleware } from './middleware.ts'

// prettier-ignore
type ControllerExtra<routes extends RouteMap, extra extends Record<string, any> = {}> =
  | ControllerExtraWithMiddleware<routes, extra>
  | ControllerExtraWithoutMiddleware<routes, extra>

// prettier-ignore
type ControllerExtraWithMiddleware<routes extends RouteMap, extra extends Record<string, any> = {}> = {
  middleware: Middleware[]
  actions: ControllerExtra<routes, extra>
} & (routes extends Record<string, any>
  ? {
      [name in keyof routes as routes extends any ? never : name]?: never
    }
  : {})

// prettier-ignore
type ControllerExtraWithoutMiddleware<routes extends RouteMap, extra extends Record<string, any> = {}> = routes extends any ?
  ({
    [name in keyof routes]: (
      routes[name] extends Route<infer method extends RequestMethod | 'ANY', infer pattern extends string> ? (
        | ((context: RequestContext<method, Params<pattern>> & { extra: extra }) => Response | Promise<Response>)
        | {
            middleware: Middleware[]
            action: (
              context: RequestContext<method, Params<pattern>> & { extra: extra }
            ) => Response | Promise<Response>
          }
      ) :
      routes[name] extends RouteMap ? ControllerExtra<routes[name], extra> :
      never
    )
  } & {
    middleware?: never
    actions?: never
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
 * Define a single action with type-safe middleware data.
 *
 * @example
 * ```ts
 * defineAction(routes.posts.create, {
 *   middleware: [authMiddleware],
 *   action: ({ extra }) => {
 *     // extra.user is fully typed
 *     return new Response('Post created')
 *   },
 * })
 * ```
 */
export function defineAction<
  const M extends readonly Middleware[],
  route extends string | RoutePattern | Route,
>(
  route: route,
  options: {
    middleware: M
    action: (
      context: RequestContext<GetMethod<route>, GetParams<route>> & {
        extra: ExtractExtra<M>
      },
    ) => Response | Promise<Response>
  },
): BuildAction<GetMethod<route>, route>
/**
 * Define an action with type-safe middleware data.
 *
 * Middleware data is automatically extracted and made available in the action's
 * `extra` parameter with full type safety.
 *
 * @example
 * ```ts
 * defineAction({
 *   middleware: [authMiddleware],
 *   action: ({ extra }) => {
 *     // extra.user is fully typed from authMiddleware
 *     return new Response(`Hello ${extra.user.name}`)
 *   },
 * })
 * ```
 */
export function defineAction<
  const M extends readonly Middleware[],
  method extends RequestMethod | 'ANY' = RequestMethod | 'ANY',
  pattern extends string = string,
>(options: {
  middleware: M
  action: (
    context: RequestContext<method, Params<pattern>> & { extra: ExtractExtra<M> },
  ) => Response | Promise<Response>
}): {
  middleware: M
  action: (context: RequestContext<method, Params<pattern>>) => Response | Promise<Response>
}
export function defineAction(routeOrOptions: any, options?: any) {
  return options ?? routeOrOptions
}

/**
 * Define a controller with type-safe middleware data.
 *
 * @example
 * ```ts
 * defineController(routes.posts, {
 *   middleware: [authMiddleware],
 *   actions: {
 *     index({ extra }) {
 *       // extra.user is fully typed
 *       return new Response(`Posts for ${extra.user.name}`)
 *     },
 *   },
 * })
 * ```
 */
export function defineController<const M extends readonly Middleware[], routes extends RouteMap>(
  routes: routes,
  options: {
    middleware: M
    actions: ControllerExtra<routes, ExtractExtra<M>>
  },
): Controller<routes>
/**
 * Define a controller with type-safe middleware data.
 *
 * Middleware data is automatically extracted and made available in each action's
 * `extra` parameter with full type safety.
 *
 * @example
 * ```ts
 * defineController({
 *   middleware: [authMiddleware],
 *   actions: {
 *     'GET /': ({ extra }) => {
 *       // extra.user is fully typed from authMiddleware
 *       return new Response(`Hello ${extra.user.name}`)
 *     },
 *   },
 * })
 * ```
 */
export function defineController<const M extends readonly Middleware[]>(options: {
  middleware: M
  actions: {
    [key: string]: (
      context: RequestContext & { extra: ExtractExtra<NoInfer<M>> },
    ) => Response | Promise<Response>
  }
}): {
  middleware: M
  actions: Record<string, (context: RequestContext) => Response | Promise<Response>>
}
export function defineController(routesOrOptions: any, options?: any) {
  return options ?? routesOrOptions
}
