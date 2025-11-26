import type { Middleware as MiddlewareBase, NextFunction, RequestContext, RequestMethod } from '@remix-run/fetch-router'
import type { ExtractExtra } from './define-router'

export interface Middleware<
  extra = unknown,
  method extends RequestMethod | 'ANY' = RequestMethod | 'ANY',
  params extends Record<string, any> = {},
> extends MiddlewareBase<method, params> {
  __extra?: extra
  (
      context: RequestContext<method, params>,
      next: NextFunction,
    ): Response | undefined | void | Promise<Response | undefined | void>
}

class ParentMiddleware<middlewares extends Middleware[]> {
  constructor(_parent: middlewares) {}
}

type ExtractExtraFromParentMiddleware<Parent extends ParentMiddleware<any>> =
  Parent extends ParentMiddleware<infer middlewares> ? ExtractExtra<middlewares> : never

/**
 * Use middleware that inherits extra data from parent middleware.
 *
 * Use with `withParent` to create middleware that has access to both
 * parent and local middleware data.
 *
 * @example
 * ```ts
 * let postsMiddleware = [authMiddleware]
 * let postsActionMiddleware = use(
 *   withParent<typeof postsMiddleware>(),
 *   [formDataParser(schema)]
 * )
 * // postsActionMiddleware now has both auth and formData in extra
 * ```
 */
export function use<M extends Middleware[], Parent extends ParentMiddleware<any>>(
  parent: Parent,
  middleware: M,
): Middleware<ExtractExtraFromParentMiddleware<Parent> & ExtractExtra<M>>[]
export function use<M extends Middleware[]>(middleware: M): M
export function use(parentOrMiddleware: any, middleware?: any) {
  return middleware ?? parentOrMiddleware
}

/**
 * Create a parent middleware reference for type inheritance.
 *
 * Used with `use` to pass parent middleware types without
 * requiring the runtime parent object.
 *
 * @example
 * ```ts
 * let postsMiddleware = [authMiddleware]
 * let childMiddleware = use(
 *   withParent<typeof postsMiddleware>(),
 *   [loggerMiddleware]
 * )
 * ```
 */
export function withParent<M extends Middleware[]>() {
  return new ParentMiddleware<M>(null!)
}
