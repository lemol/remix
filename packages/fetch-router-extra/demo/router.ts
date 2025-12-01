import z from 'zod'
import { html } from '@remix-run/html-template'
import { createRouter } from '@remix-run/fetch-router'
import { formData } from '@remix-run/form-data-middleware'
import { defineAction, defineController, use, includeParentExtra } from '@remix-run/fetch-router-extra'
import { createHtmlResponse } from '@remix-run/response/html'
import { formDataParser, loadUserInfo, sampleMiddleware } from './sample-middlewares.ts'

import { routes } from './routes.ts'

export let router = createRouter({
  middleware: [formData()],
})

let parser = z.object({
  title: z.string(),
  content: z.string(),
})

const homeActionMiddleware = [formDataParser(parser)]

router.map(routes.home, {
  index() {
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Home</h1>
          <form method="post">
            <input type="text" name="title" />
            <input type="text" name="content" />
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `)
  },
  action: defineAction({
    middleware: homeActionMiddleware,
    action: ({ extra }) => {
      return createHtmlResponse(html`
        <html>
          <body>
            <h1>Home</h1>
            <p>${extra.formData.title}</p>
            <p>${extra.formData.content}</p>
            <div>
              <a href="${routes.home.index.href()}">Back</a>
            </div>
          </body>
        </html>
      `)
    },
  }),
})

let postsMiddleware = use(loadUserInfo())

let postsController = defineController(routes.posts, {
  middleware: postsMiddleware,
  actions: {
    index({ extra }) {
      return createHtmlResponse(html`
        <html>
          <body>
            <h1>Posts</h1>
            <p>User: ${extra.user.name}</p>
            <div>
              <a href="${routes.home.index.href()}">Back</a>
            </div>
            <form action="${routes.posts.create.href()}" method="post">
              <input type="text" name="title" />
              <input type="text" name="content" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `)
    },
    create: defineAction({
      middleware: use(
        includeParentExtra(postsMiddleware),
        sampleMiddleware(),
        formDataParser(parser),
      ),
      action: ({ extra }) => {
        console.log(extra.user)
        console.log(extra.sample)
        return createHtmlResponse(html`
          <html>
            <body>
              <h1>Create Post</h1>
              <p>${extra.formData.title}</p>
              <p>${extra.formData.content}</p>
              <div>
                <a href="${routes.home.index.href()}">Back</a>
              </div>
            </body>
          </html>
        `)
      },
    }),
  },
})

router.map(routes.posts, postsController)
