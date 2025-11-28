import { defineCatalog, serviceOf, ServiceProvider } from '@remix-run/router-services-middleware'
import type { PostRepository } from './post/post.model'
import type { UserRepository } from './user/user.model'

export interface NotificationService {
  notify(message: string): void
}

export let ServiceCatalog = defineCatalog({
  postRepository: serviceOf<PostRepository>(),
  userRepository: serviceOf<UserRepository>(),
  notificationService: serviceOf<NotificationService>(),
})

export let serviceProvider = new ServiceProvider(ServiceCatalog)
