import { formAction, route } from '@remix-run/fetch-router'

export let routes = route({
  home: formAction('/'),
  posts: {
    index: '/posts',
    action: { method: 'POST', pattern: '/posts/create' },
  },
})
