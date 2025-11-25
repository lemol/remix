# @remix-run/fetch-router-extra

Extra features for [fetch-router](https://github.com/remix-run/remix/tree/main/packages/fetch-router) package, with a focus on enhancing type safety.

## Features

- **Type-safe middleware data**: Automatically extract and type middleware data in route handlers
- **Middleware composition**: Inherit middleware data from parent routes

## Installation

```sh
npm install @remix-run/fetch-router-extra
```

## Usage

### defineRouter

The `defineRouter` function enhances type safety of route handlers by automatically extracting middleware data types and making them available in the handler's `extra` parameter.

#### Single Handler

```ts
import { defineRouter } from '@remix-run/fetch-router-extra'

let action = defineRouter({
  middleware: [authMiddleware],
  handler: ({ extra }) => {
    // extra.user is fully typed from authMiddleware
    console.log(extra.user.name)
    return new Response('Success')
  }
})
```

#### Route Tree

Apply middleware to an entire route tree:

```ts
let postsRouter = defineRouter(routes.posts, {
  middleware: [authMiddleware],
  handlers: {
    index({ extra }) {
      // extra.user is available in all handlers
      return new Response(`Posts for ${extra.user.name}`)
    },
    action({ extra }) {
      return new Response('Post created')
    }
  }
})
```

#### Single Route

```ts
let action = defineRouter(routes.posts.action, {
  middleware: [authMiddleware],
  handler: ({ extra }) => {
    return new Response('Post created')
  }
})
```

### Middleware Composition

Use `defineMiddleware` and `parentMiddleware` to create middleware that inherits extra data from parent middleware:

```ts
import { defineMiddleware, parentMiddleware } from '@remix-run/fetch-router-extra'

// Parent middleware
let postsMiddleware = [authMiddleware]

// Child middleware inherits from parent
let postsActionMiddleware = defineMiddleware(
  parentMiddleware<typeof postsMiddleware>(),
  [formDataParser(schema)]
)

// Handler has access to both auth and formData
defineRouter({
  middleware: postsActionMiddleware,
  handler: ({ extra }) => {
    console.log(extra.user.name)      // from authMiddleware
    console.log(extra.formData.title) // from formDataParser
    return new Response('Success')
  }
})
```

### Middleware Type

A `Middleware` type that extends `@remix-run/fetch-router`'s `Middleware` with support for extra data:

```ts
import type { Middleware } from '@remix-run/fetch-router-extra'

function createAuthMiddleware(): Middleware<{
  user: { id: string; name: string }
}> {
  return (context) => {
    (context as any).extra = {
      user: { id: '1', name: 'John' }
    }
  }
}
```

## API Reference

### `defineRouter(options)`

Define a route handler with type-safe middleware data.

### `defineRouter(routes, options)`

Define a route tree with type-safe middleware data.

### `defineRouter(route, options)`

Define a single route handler with type-safe middleware data.

### `defineMiddleware(parent, middleware)`

Create middleware that inherits extra data from parent middleware.

### `parentMiddleware<T>()`

Create a parent middleware reference for type inheritance.

## Related Work

- [@remix-run/headers](../headers) - A library for working with HTTP headers

## License

See [LICENSE](https://github.com/remix-run/remix/blob/main/LICENSE)
