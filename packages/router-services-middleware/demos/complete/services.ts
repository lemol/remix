import { defineCatalog, serviceOf, ServiceProvider } from '@remix-run/router-services-middleware'
import type { PostRepository } from './post/post.model.ts'
import type { UserRepository } from './user/user.model.ts'

export interface NotificationService {
  notify(message: string): void
}

export let ServiceCatalog = defineCatalog({
  postRepository: serviceOf<PostRepository>(),
  userRepository: serviceOf<UserRepository>(),
  notificationService: serviceOf<NotificationService>(),
  getCurrentUsername: serviceOf<() => string>(),
})

export let serviceProvider = new ServiceProvider(ServiceCatalog)
