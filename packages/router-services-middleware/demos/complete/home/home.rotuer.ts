import { defineAction } from '@remix-run/fetch-router-extra'
import { createHtmlResponse } from '@remix-run/response/html'
import { html } from '@remix-run/html-template'

import { routes } from '../routes.ts'

export let homeHandler = defineAction(routes.home, {
  middleware: [],
  action: () => {
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Home</h1>
          <p>Welcome to the home page</p>
          <div>
            <a href="${routes.posts.index.href()}">Posts</a>
            <a href="${routes.users.index.href()}">Users</a>
          </div>
        </body>
      </html>
    `)
  },
})
