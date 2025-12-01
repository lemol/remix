import { defineRouter } from '@remix-run/fetch-router-extra'
import { routes } from './routes.ts'
import { Layout } from './layout.tsx'
import { requireAuth } from './middleware/auth.ts'
import { requireAdmin } from './middleware/admin.ts'
import { render } from './utils/render.ts'
import adminBooksHandlers from './admin.books.tsx'
import adminOrdersHandlers from './admin.orders.tsx'
import adminUsersHandlers from './admin.users.tsx'

const adminIndex = defineRouter(routes.admin.index, {
  middleware: [requireAuth(), requireAdmin()],
  handler: () => {
    return render(
      <Layout>
        <h1>Admin Dashboard</h1>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div class="card">
            <h2>Manage Books</h2>
            <p>Add, edit, or remove books from the catalog.</p>
            <a href={routes.admin.books.index.href()} class="btn" style="margin-top: 1rem;">
              View Books
            </a>
          </div>

          <div class="card">
            <h2>Manage Users</h2>
            <p>View and manage user accounts.</p>
            <a href={routes.admin.users.index.href()} class="btn" style="margin-top: 1rem;">
              View Users
            </a>
          </div>

          <div class="card">
            <h2>View Orders</h2>
            <p>Monitor and manage customer orders.</p>
            <a href={routes.admin.orders.index.href()} class="btn" style="margin-top: 1rem;">
              View Orders
            </a>
          </div>
        </div>
      </Layout>,
    )
  },
})

export default {
  index: adminIndex,
  books: adminBooksHandlers,
  users: adminUsersHandlers,
  orders: adminOrdersHandlers,
}
