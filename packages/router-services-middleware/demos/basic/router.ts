import z from 'zod'
import { html } from '@remix-run/html-template'
import { createRouter } from '@remix-run/fetch-router'
import { asyncContext } from '@remix-run/async-context-middleware'
import { formData } from '@remix-run/form-data-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { createHtmlResponse } from '@remix-run/response/html'

import {
  withServices,
  serviceOf,
  defineCatalog,
  withServiceProvider,
  ServiceProvider,
} from '@remix-run/router-services-middleware'

import { routes } from './routes.ts'

let serviceProvider = new ServiceProvider()
export let router = createRouter({
  middleware: [asyncContext(), formData(), withServiceProvider(serviceProvider)],
})

const services = defineCatalog({
  createPost: serviceOf<(args: { title: string; content: string }) => void>(),
})

let homeActionMiddleware = use(
  withFormData(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ),
  withServices(services.createPost)
)

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
  action: defineRouter({
    middleware: homeActionMiddleware,
    handler: ({ extra }) => {
      extra.services.createPost({ title: extra.formData.title, content: extra.formData.content })
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

serviceProvider.provide(services.createPost, () => {
  return ({ title, content }: { title: string; content: string }) => {
    console.log(`Creating post: ${title} - ${content}`)
  }
})
