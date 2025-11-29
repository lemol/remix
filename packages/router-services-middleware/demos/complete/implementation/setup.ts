import { MemoryUserRepository, MemoryPostRepository } from "./repositories.ts";
import { ConsoleNotificationService } from "./notifications.ts";
import { ServiceCatalog, serviceProvider } from "../services.ts";

serviceProvider.provide(ServiceCatalog.userRepository, () => new MemoryUserRepository())
serviceProvider.provide(ServiceCatalog.postRepository, () => new MemoryPostRepository())
serviceProvider.provide(ServiceCatalog.notificationService, () => new ConsoleNotificationService())
serviceProvider.provide(ServiceCatalog.getCurrentUsername, () => () => {
  return "Demo User"
})
