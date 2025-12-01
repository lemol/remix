import type { Route } from '@remix-run/fetch-router'
import type { Middleware } from '@remix-run/fetch-router-extra'
import { createRedirectResponse as redirect } from '@remix-run/response/redirect'
import { resolveService } from '@remix-run/router-services-middleware'

import { routes } from '../routes.ts'
import { setCurrentUser } from '../utils/context.ts'
import { ServiceCatalog } from '../../services.ts'
import type { User } from '../../services.ts'

/**
 * Middleware that optionally loads the current user if authenticated.
 * Does not redirect if not authenticated.
 * Attaches user (if any) to context.storage and context.extra.
 */
export function loadAuth(): Middleware<{ user: User | null }> {
  return async (context) => {
    let { session } = context
    let userId = session.get('userId')

    let user: User | null = null
    // Only set current user if authenticated
    if (typeof userId === 'string') {
      let authService = resolveService(ServiceCatalog.authService)
      let foundUser = await authService.getUserById(userId)
      if (foundUser) {
        user = foundUser
        setCurrentUser(user)
      }
    }

    ;(context as any).extra ??= {}
    ;(context as any).extra.user = user
  }
}

export interface RequireAuthOptions {
  /**
   * Where to redirect if the user is not authenticated.
   * Defaults to the login page.
   */
  redirectTo?: Route
}

/**
 * Middleware that requires a user to be authenticated.
 * Redirects to login if not authenticated.
 * Attaches user to context.storage and context.extra.
 */
export function requireAuth(options?: RequireAuthOptions): Middleware<{ user: User }> {
  let redirectRoute = options?.redirectTo ?? routes.auth.login.index

  return async (context) => {
    let { session, url } = context
    let userId = session.get('userId')
    
    let user
    if (typeof userId === 'string') {
      let authService = resolveService(ServiceCatalog.authService)
      user = await authService.getUserById(userId)
    }

    if (!user) {
      // Capture the current URL to redirect back to after login
      return redirect(redirectRoute.href(undefined, { returnTo: url.pathname + url.search }), 302)
    }

    setCurrentUser(user)
    ;(context as any).extra ??= {}
    ;(context as any).extra.user = user
  }
}
