import { createRouter } from '@remix-run/fetch-router'
import { formData } from '@remix-run/form-data-middleware'
import { asyncContext } from '@remix-run/async-context-middleware'

import { withServiceProvider } from '@remix-run/router-services-middleware'

import { routes } from './routes.ts'
import { homeRouter } from './home/home.rotuer.ts'
import { usersRouter } from './user/user.rotuer.ts'
import { postsRouter } from './post/post.router.ts'
import { serviceProvider } from './services.ts'

export let router = createRouter({
  middleware: [asyncContext(), formData(), withServiceProvider(serviceProvider)],
})

router.map(routes.home, homeRouter)
router.map(routes.users, usersRouter)
router.map(routes.posts, postsRouter)
