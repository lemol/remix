import { formAction, route } from '@remix-run/fetch-router'

export let routes = route({
  home: '/',
  posts: {
    index: '/posts',
    create: formAction('/posts/create'),
  },
  users: '/users',
})
