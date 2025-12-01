import { form, route } from '@remix-run/fetch-router'

export let routes = route({
  home: '/',
  posts: {
    index: '/posts',
    create: form('/posts/create'),
    detail: '/posts/:postId',
  },
  users: {
    index: '/users',
  },
})
