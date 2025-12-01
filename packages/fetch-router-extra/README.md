# @remix-run/fetch-router-extra

Extra features for [fetch-router](https://github.com/remix-run/remix/tree/main/packages/fetch-router) package, with a focus on enhancing type safety.

## Features

- **Type-safe middleware data**: Automatically extract and type middleware data in actions
- **Middleware composition**: Combine middleware with proper type inference using `use`

## Installation

```sh
npm install @remix-run/fetch-router-extra
```

## Usage

### defineRouter

The `defineRouter` function enhances type safety of actions by automatically extracting middleware data types and making them available in the action's `extra` parameter.

#### Single Action

```ts
import { defineRouter } from '@remix-run/fetch-router-extra'

let createPost = defineRouter({
  middleware: [authMiddleware],
  action: ({ extra }) => {
    // extra.user is fully typed from authMiddleware
    console.log(extra.user.name)
    return new Response('Success')
  },
})
```

#### Controller

Apply middleware to an entire controller:

```ts
let postsController = defineRouter(routes.posts, {
  middleware: [authMiddleware],
  actions: {
    index({ extra }) {
      // extra.user is available in all actions
      return new Response(`Posts for ${extra.user.name}`)
    },
    create({ extra }) {
      return new Response('Post created')
    },
  },
})
```

#### Single Route

```ts
let createPost = defineRouter(routes.posts.create, {
  middleware: [authMiddleware],
  action: ({ extra }) => {
    return new Response('Post created')
  },
})
```

### use

The `use` function combines multiple middleware into a single array with proper type inference for the `extra` data:

```ts
import { use } from '@remix-run/fetch-router-extra'

defineRouter({
  // Combine multiple middleware with type inference
  middleware: use(
    authMiddleware,
    loggingMiddleware,
    rateLimitMiddleware,
  ),
  action: ({ extra }) => {
    // extra contains combined types from all middleware
    console.log(extra.user.name) // from authMiddleware
    return new Response('Success')
  },
})
```

#### Inheriting Parent Middleware Types

Use `includeParentExtra` to inherit extra data types from parent middleware:

```ts
import { use, includeParentExtra } from '@remix-run/fetch-router-extra'

// Parent middleware
let postsMiddleware = use(authMiddleware)

// Child middleware inherits types from parent
let postsActionMiddleware = use(includeParentExtra(postsMiddleware), formDataParser(schema))

// Action has access to both auth and formData
defineRouter({
  middleware: postsActionMiddleware,
  action: ({ extra }) => {
    console.log(extra.user.name) // from authMiddleware
    console.log(extra.formData.title) // from formDataParser
    return new Response('Success')
  },
})
```

### Middleware Type

A `Middleware` type that extends `@remix-run/fetch-router`'s `Middleware` with support for extra data:

```ts
import type { Middleware } from '@remix-run/fetch-router-extra'

function createAuthMiddleware(): Middleware<{
  user: { id: string; name: string }
}> {
  return (context, next) => {
    ;(context as any).extra = {
      user: { id: '1', name: 'John' },
    }
    return next()
  }
}
```

## API Reference

### `defineRouter(options)`

Define an action with type-safe middleware data.

### `defineRouter(routes, options)`

Define a controller with type-safe middleware data.

### `defineRouter(route, options)`

Define a single action with type-safe middleware data.

### `use(...middleware)`

Combine multiple middleware into a single array with proper type inference for the combined `extra` data. Accepts any number of middleware or middleware arrays.

### `includeParentExtra(parentMiddleware)`

Create a pass-through middleware that inherits extra data types from a parent middleware array. Useful for composing child middleware that should include the parent's extra data types.

### `ExtractExtra<M>`

A utility type to extract the combined `extra` type from a middleware or middleware array.

## Related Work

- [@remix-run/fetch-router](../fetch-router) - Type-safe fetch-based router

## License

See [LICENSE](https://github.com/remix-run/remix/blob/main/LICENSE)
