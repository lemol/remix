import { form, route } from '@remix-run/fetch-router'

export let routes = route({
  home: form('/'),
  posts: {
    index: '/posts',
    create: { method: 'POST', pattern: '/posts/create' },
  },
})
