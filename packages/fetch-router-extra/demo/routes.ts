import { form, route } from '@remix-run/fetch-router'

export let routes = route({
  home: form('/'),
  posts: {
    index: '/posts',
    create: { method: 'POST', pattern: '/posts/create' },
  },
  nested: {
    simple: '/nested/simple',
    deeper: {
      item1: '/nested/deeper/item1',
      item2: '/nested/deeper/:itemId',
    },
  }
})
