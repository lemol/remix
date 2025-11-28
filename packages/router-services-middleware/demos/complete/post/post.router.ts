import z from 'zod'
import { defineRouter } from '@remix-run/fetch-router-extra'
import { withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { createHtmlResponse } from '@remix-run/response/html'
import { html } from '@remix-run/html-template'

import { ServiceCatalog } from '../services'
import { routes } from '../routes'

export let postsRouter = defineRouter(routes.posts, {
  index: defineRouter({
    middleware: [
      withServices(ServiceCatalog.postRepository),
    ],
    handler: async ({ extra }) => {
      let posts = await extra.services.postRepository.listPosts()
      return createHtmlResponse(html`
        <html>
          <body>
            <h1>Posts</h1>
            <ul>
              ${posts.map(post => html`<li>${post.title}</li>`)}
            </ul>
          </body>
        </html>
      `)
    }
  }),
  create: {
    index: defineRouter({
      middleware: [
        withServices(ServiceCatalog.userRepository),
      ],
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
                  ${users.map(user => html`<option value="${user.id}">${user.name}</option>`)}
                </select>
                <button type="submit">Submit</button>
              </form>
            </body>
          </html>
        `)
      }
    }),
    action: defineRouter({
      middleware: [
        withServices(ServiceCatalog.userRepository),
        withServices(ServiceCatalog.notificationService),
        withServices(ServiceCatalog.postRepository),
        withFormData(z.object({
          title: z.string(),
          content: z.string(),
          authorId: z.coerce.number(),
        }))
      ],
      handler: async ({ extra }) => {
        await extra.services.postRepository.createPost(extra.formData)
        await extra.services.userRepository.updateUserPostCount(extra.formData.authorId)
        await extra.services.notificationService.notify(`Post "${extra.formData.title}", ID: ${extra.formData.authorId} created`)
        return createHtmlResponse(html`
          <html>
            <body>
              <h1>Post created</h1>
              <p>Post "${extra.formData.title}", ID: ${extra.formData.authorId} created</p>
              <div>
                <a href="${routes.posts.index.href()}">Back</a>
              </div>
            </body>
          </html>
        `)
      }
    })
  }
})
