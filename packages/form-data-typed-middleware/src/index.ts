import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Middleware } from '@remix-run/fetch-router-extra'
import type { RequestContext } from '@remix-run/fetch-router'

export function withFormData<T extends StandardSchemaV1>(
  schema: T,
): Middleware<{
  formData: StandardSchemaV1.InferOutput<T>
}> {
  return async (context: RequestContext) => {
    let data = context.formData ? Object.fromEntries(context.formData.entries()) : undefined
    let result = await schema['~standard'].validate(data)

    if (result.issues) {
      return new Response(null, { status: 400 })
    }

    ;(context as any).extra ??= {}
    ;(context as any).extra.formData = result.value
  }
}
