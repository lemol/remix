import type { Middleware } from '@remix-run/fetch-router-extra'
import type { User } from '../../services.ts'

/**
 * Middleware that requires a user to have admin role.
 * Returns 403 Forbidden if user is not an admin.
 * Must be used after requireAuth middleware.
 */
export function requireAdmin(): Middleware<{ admin: true }> {
  return async (context) => {
    let user = (context as any).extra?.user as User | undefined

    if (!user || user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }

    ;(context as any).extra ??= {}
    ;(context as any).extra.admin = true
  }
}
