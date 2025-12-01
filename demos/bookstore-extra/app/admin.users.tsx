import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { createRedirectResponse as redirect } from '@remix-run/response/redirect'
import { resolveService, withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { z } from 'zod'

import { routes } from './routes.ts'
import { Layout } from './layout.tsx'
import { requireAuth } from './middleware/auth.ts'
import { requireAdmin } from './middleware/admin.ts'
import { render } from './utils/render.ts'
import { RestfulForm } from './components/restful-form.tsx'
import { ServiceCatalog } from '../services.ts'
import type { AuthService, User } from '../services.ts'

// Admin Users Index
const usersIndex = defineRouter(routes.admin.users.index, {
  middleware: use(requireAuth(), requireAdmin(), withServices(ServiceCatalog.authService)),
  handler: async ({ extra }) => {
    let { user } = extra
    let { authService } = extra.services
    let users = await authService.getAllUsers()

    return render(
      <Layout>
        <h1>Manage Users</h1>

        <p style="margin-bottom: 1rem;">
          <a href={routes.admin.index.href()} class="btn btn-secondary">
            Back to Dashboard
          </a>
        </p>

        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => (
                <tr>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span class={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.createdAt.toLocaleDateString()}</td>
                  <td class="actions">
                    <a
                      href={routes.admin.users.edit.href({ userId: u.id })}
                      class="btn btn-secondary"
                      style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                    >
                      Edit
                    </a>
                    {user && u.id !== user.id ? (
                      <RestfulForm
                        method="DELETE"
                        action={routes.admin.users.destroy.href({ userId: u.id })}
                        style="display: inline;"
                      >
                        <button
                          type="submit"
                          class="btn btn-danger"
                          style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                        >
                          Delete
                        </button>
                      </RestfulForm>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>,
    )
  },
})

// Admin Users Edit
const usersEdit = defineRouter(routes.admin.users.edit, {
  middleware: use(requireAuth(), requireAdmin(), withServices(ServiceCatalog.authService)),
  handler: async ({ params, extra }) => {
    let { authService } = extra.services
    let targetUser = await authService.getUserById(params.userId)

    if (!targetUser) {
      return render(
        <Layout>
          <div class="card">
            <h1>User Not Found</h1>
          </div>
        </Layout>,
        { status: 404 },
      )
    }

    return render(
      <Layout>
        <h1>Edit User</h1>

        <div class="card">
          <RestfulForm
            method="PUT"
            action={routes.admin.users.update.href({ userId: targetUser.id })}
          >
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" value={targetUser.name} required />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" value={targetUser.email} required />
            </div>

            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" name="role">
                <option value="customer" selected={targetUser.role === 'customer'}>
                  Customer
                </option>
                <option value="admin" selected={targetUser.role === 'admin'}>
                  Admin
                </option>
              </select>
            </div>

            <button type="submit" class="btn">
              Update User
            </button>
            <a
              href={routes.admin.users.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Cancel
            </a>
          </RestfulForm>
        </div>
      </Layout>,
    )
  },
})

// Admin Users Update
const usersUpdate = defineRouter(routes.admin.users.update, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.authService),
    withFormData(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['customer', 'admin']),
      }),
    ),
  ),
  handler: async ({ params, extra }) => {
    let { name, email, role } = extra.formData
    let { authService } = extra.services

    await authService.updateUser(params.userId, {
      name,
      email,
      role,
    })

    return redirect(routes.admin.users.index.href())
  },
})

// Admin Users Destroy
const usersDestroy = defineRouter(routes.admin.users.destroy, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.authService),
    withFormData(z.object({})),
  ),
  handler: async ({ params, extra }) => {
    let { authService } = extra.services
    await authService.deleteUser(params.userId)

    return redirect(routes.admin.users.index.href())
  },
})

// Admin Users Show
const usersShow = defineRouter(routes.admin.users.show, {
  middleware: use(requireAuth(), requireAdmin(), withServices(ServiceCatalog.authService)),
  handler: async ({ params, extra }) => {
    let { authService } = extra.services
    let targetUser = await authService.getUserById(params.userId)

    if (!targetUser) {
      return render(
        <Layout>
          <div class="card">
            <h1>User Not Found</h1>
          </div>
        </Layout>,
        { status: 404 },
      )
    }

    return render(
      <Layout>
        <h1>User Details</h1>

        <div class="card">
          <p>
            <strong>Name:</strong> {targetUser.name}
          </p>
          <p>
            <strong>Email:</strong> {targetUser.email}
          </p>
          <p>
            <strong>Role:</strong>{' '}
            <span class={`badge ${targetUser.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
              {targetUser.role}
            </span>
          </p>
          <p>
            <strong>Created:</strong> {targetUser.createdAt.toLocaleDateString()}
          </p>

          <div style="margin-top: 2rem;">
            <a href={routes.admin.users.edit.href({ userId: targetUser.id })} class="btn">
              Edit
            </a>
            <a
              href={routes.admin.users.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Back to List
            </a>
          </div>
        </div>
      </Layout>,
    )
  },
})

export default {
  index: usersIndex,
  show: usersShow,
  edit: usersEdit,
  update: usersUpdate,
  destroy: usersDestroy,
}
