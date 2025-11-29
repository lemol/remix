import z from 'zod'
import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { resolveService, withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { createHtmlResponse } from '@remix-run/response/html'
import { html } from '@remix-run/html-template'

import { ServiceCatalog } from '../services.ts'
import { routes } from '../routes.ts'
import { createRedirectResponse } from '@remix-run/response/redirect'

export let postsIndexHandler = defineRouter(routes.posts.index, {
  middleware: use(withServices(ServiceCatalog.postRepository)),
  handler: async ({ extra }) => {
    let posts = await extra.services.postRepository.listPosts()
    let getCurrentUsername = resolveService(ServiceCatalog.getCurrentUsername)

    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Posts</h1>
          <div>
            <a href="${routes.home.href()}">Home</a> |
            <a href="${routes.posts.create.index.href()}">Add</a> |
            <span>Welcome, ${getCurrentUsername()}!</span>
          </div>
          <ul>
            ${posts.map((post) => html`<li><a href="${routes.posts.detail.href({ postId: post.id })}">${post.title}</a></li>`)}
          </ul>
        </body>
      </html>
    `)
  },
})

export let postsCreateIndexHandler = defineRouter(routes.posts.create.index, {
  middleware: use(withServices(ServiceCatalog.userRepository)),
  handler: async ({ extra }) => {
    let users = await extra.services.userRepository.listUsers()
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Create Post</h1>
          <form method="post">
            <input type="text" name="title" />
            <input type="text" name="content" />
            <select name="authorId">
              ${users.map((user) => html`<option value="${user.id}">${user.name}</option>`)}
            </select>
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `)
  },
})

export let postsDetailHandler = defineRouter(routes.posts.detail, {
  middleware: use(withServices(ServiceCatalog.postRepository)),
  handler: async ({ params, extra }) => {
    let post = await extra.services.postRepository.getPost(Number(params.postId))
    if (!post) {
      return new Response('Post not found', { status: 404 })
    }
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>${post.title}</h1>
          <div><a href="${routes.posts.index.href()}">Back to posts</a></div>
          <article>
            <p>${post.content}</p>
          </article>
        </body>
      </html>
    `)
  },
})

export let postsCreateActionHandler = defineRouter(routes.posts.create.action, {
  middleware: use(
    withServices(
      ServiceCatalog.userRepository,
      ServiceCatalog.notificationService,
      ServiceCatalog.postRepository,
    ),
    withFormData(
      z.object({
        title: z.string(),
        content: z.string(),
        authorId: z.coerce.number(),
      }),
    ),
  ),
  handler: async ({ extra }) => {
    let createdPost = await extra.services.postRepository.createPost(extra.formData)
    await extra.services.userRepository.updateUserPostCount(extra.formData.authorId)
    
    extra.services.notificationService.notify(
      `Post "${extra.formData.title}" created`,
    )
    
    return createRedirectResponse(routes.posts.detail.href({ postId: createdPost.id }))
  },
})


export let postsRouter = {
  middleware: [withServices(ServiceCatalog.getCurrentUsername)],
  handlers: {
    index: postsIndexHandler,
    detail: postsDetailHandler,
    create: {
      index: postsCreateIndexHandler,
      action: postsCreateActionHandler,
    }
  }
}
