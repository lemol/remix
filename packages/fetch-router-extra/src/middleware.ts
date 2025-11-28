import type { Middleware as MiddlewareBase, NextFunction, RequestContext, RequestMethod } from '@remix-run/fetch-router'

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

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

type ExtractExtras<T> = T extends Middleware<infer E>
  ? E
  : T extends Middleware<infer E>[]
    ? E
    : never

export type ExtractExtra<M extends Middleware | Middleware[]> = UnionToIntersection<
  ExtractExtras<M>
>

class ParentMiddleware<middlewares extends Middleware[]> {
  constructor(_parent: middlewares) {}
}

type ExtractExtraFromParentMiddleware<Parent extends ParentMiddleware<any>> =
  Parent extends ParentMiddleware<infer middlewares> ? ExtractExtra<middlewares[number]> : never

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
type FlattenMiddleware<T> = T extends Middleware
  ? T
  : T extends Middleware[]
    ? T[number]
    : never

export function use<M extends Middleware>(middleware: M): M[]
export function use<M extends Middleware[]>(middleware: M): M
export function use<M1 extends Middleware, M2 extends Middleware>(
  middleware1: M1,
  middleware2: M2,
): Middleware<ExtractExtra<M1> & ExtractExtra<M2>>[]
export function use<
  Parent extends ParentMiddleware<any>,
  M extends (Middleware | Middleware[])[],
>(
  parent: Parent,
  ...middleware: M
): Middleware<
  ExtractExtraFromParentMiddleware<Parent> & ExtractExtra<FlattenMiddleware<M[number]>>
>[]
export function use<M extends (Middleware | Middleware[])[]>(
  ...middleware: M
): Middleware<ExtractExtra<FlattenMiddleware<M[number]>>>[]
export function use(parentOrMiddleware: any, ...middleware: any[]) {
  // If only a single array is passed, return it as-is (backward compatibility)
  if (middleware.length === 0 && Array.isArray(parentOrMiddleware)) {
    return parentOrMiddleware
  }
  return (
    parentOrMiddleware instanceof ParentMiddleware
      ? middleware
      : [parentOrMiddleware, ...middleware]
  ).flat()
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
