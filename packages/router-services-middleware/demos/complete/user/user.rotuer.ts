import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { withServices } from '@remix-run/router-services-middleware'
import { createHtmlResponse } from '@remix-run/response/html'
import { html } from '@remix-run/html-template'

import { ServiceCatalog } from '../services.ts'
import { routes } from '../routes.ts'

export let usersIndexHandler = defineRouter(routes.users.index, {
  middleware: use(withServices(ServiceCatalog.userRepository)),
  handler: async ({ extra }) => {
    let users = await extra.services.userRepository.listUsers()
    return createHtmlResponse(html`
      <html>
        <body>
          <h1>Users</h1>
          <div><a href="${routes.home.href()}">Home</a></div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Post Count</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(
                (user) => html`
                  <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.postCount}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </body>
      </html>
    `)
  },
})
