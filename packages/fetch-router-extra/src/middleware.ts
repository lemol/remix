import type { Middleware as MiddlewareBase, RequestMethod } from "@remix-run/fetch-router";

export interface Middleware<
  extra = unknown,
  method extends RequestMethod | 'ANY' = RequestMethod | 'ANY',
  params extends Record<string, any> = {},
> extends MiddlewareBase<method, params> {
  __extra?: extra
}
