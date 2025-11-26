import type z from 'zod'
import type { RequestContext } from '@remix-run/fetch-router'
import type { Middleware } from '@remix-run/fetch-router-extra'

export function formDataParser<T extends z.ZodTypeAny>(
  parser: T,
): Middleware<{
  formData: z.infer<T>
}> {
  return (context: RequestContext) => {
    let result = parser.safeParse(Object.fromEntries(context.formData?.entries() ?? []))

    if (!result.success) {
      return new Response(null, { status: 400 })
    }

    ;(context as any).extra ??= {} as any
    ;(context as any).extra.formData = result.data
  }
}

export function loadUserInfo(): Middleware<{
  user: {
    name: string
    email: string
  }
}> {
  return (context: RequestContext) => {
    ;(context as any).extra ??= {} as any
    ;(context as any).extra.user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    }
  }
}
