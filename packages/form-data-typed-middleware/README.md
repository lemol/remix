# @remix-run/form-data-typed-middleware

Middleware for type-safe parsing [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) loaded from a request body via [`@remix-run/form-data-middleware`](../form-data-middleware).

## Features

- **Type-safe parsing**: Validate and type `FormData` using standard schema libraries
- **Schema agnostic**: Works with [`zod`](https://github.com/colinhacks/zod), [`arktype`](https://github.com/arktypeio/arktype), [`valibot`](https://github.com/open-circle/valibot) and any other library compatible with [`@standard-schema/spec`](https://github.com/standard-schema/spec)

## Installation

```sh
npm install @remix-run/form-data-typed-middleware @remix-run/fetch-router-extra
```

## Usage

Use the `withFormData()` middleware to parse `FormData` from the request body and make it available on the request context as `context.extra.formData`.

If the validation fails, the middleware will return a `400 Bad Request` response.

### Basic Usage

```ts
import { z } from 'zod'
import { createRouter } from '@remix-run/fetch-router'
import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { formData } from '@remix-run/form-data-middleware'

let router = createRouter({
  middleware: [formData()],
})

router.post('/posts', defineRouter({
  middleware: use(
    withFormData(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
  ),
  handler: ({ extra }) => {
    // extra.formData is now type-safe
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Posts</h1>
          <p>${extra.formData.title}</p>
          <p>${extra.formData.content}</p>
          <div>
            <a href="${routes.home.index.href()}">Back</a>
          </div>
        </body>
      </html>
    `)
  }
}))
```

## API Reference

### `withFormData(schema)`

Creates a middleware that validates the request `FormData` against the provided schema.

- `schema`: A schema compatible with `@standard-schema/spec` (e.g. Zod, ArkType, Valibot).

## Related Work

- [`@remix-run/fetch-router-extra`](../fetch-router-extra) - Extra utilities for `@remix-run/fetch-router`
- [`@remix-run/fetch-router`](../fetch-router) - Router for the web Fetch API
- [`@remix-run/form-data-middleware`](../form-data-middleware) - Middleware for parsing `FormData`

## License

See [LICENSE](https://github.com/remix-run/remix/blob/main/LICENSE)
