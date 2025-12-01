import type { Middleware as MiddlewareBase, NextFunction, RequestContext, RequestMethod } from '@remix-run/fetch-router'

export interface Middleware<
  extra extends Record<string, any> = {},
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

type ExtractExtras<T> = T extends Middleware<infer E> ? E : never

export type ExtractExtra<M> = [M] extends [Middleware]
  ? UnionToIntersection<ExtractExtras<M>> & {}
  : [M] extends [readonly Middleware[]]
    ? UnionToIntersection<ExtractExtras<M[number]>> & {}
    : {}

export type FlattenMiddleware<T> = T extends Middleware
  ? T
  : T extends Middleware[]
    ? T[number]
    : never

export function use<M extends (Middleware | Middleware[])[]>(
  ...middleware: M
): Middleware<ExtractExtra<FlattenMiddleware<M[number]>>>[] {
  return middleware.flat() as any
}

export function includeParentExtra<M extends Middleware[]>(
  parent: M,
): Middleware<ExtractExtra<M>> {
  return async (_, next) => {
    return next()
  }
}
