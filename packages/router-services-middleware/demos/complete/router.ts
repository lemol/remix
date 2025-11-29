import { createRouter } from '@remix-run/fetch-router'
import { formData } from '@remix-run/form-data-middleware'
import { asyncContext } from '@remix-run/async-context-middleware'

import { withServiceProvider } from '@remix-run/router-services-middleware'

import { routes } from './routes.ts'
import { homeHandler } from './home/home.rotuer.ts'
import { usersIndexHandler } from './user/user.rotuer.ts'
import { postsRouter } from './post/post.router.ts'
import { serviceProvider } from './services.ts'

export let router = createRouter({
  middleware: [asyncContext(), formData(), withServiceProvider(serviceProvider)],
})

router.map(routes.home, homeHandler)
router.map(routes.users.index, usersIndexHandler)
router.map(routes.posts, postsRouter)
