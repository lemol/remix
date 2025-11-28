import { defineRouter } from '@remix-run/fetch-router-extra'
import { createHtmlResponse } from '@remix-run/response/html'
import { html } from '@remix-run/html-template'

import { routes } from '../routes'

export let homeRouter = defineRouter(routes.home, {
  middleware: [],
  handler: () => {
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Home</h1>
          <p>Welcome to the home page</p>
          <div>
            <a href="${routes.posts.index.href()}">Posts</a>
            <a href="${routes.users.href()}">Users</a>
          </div>
        </body>
      </html>
    `)
  },
})
