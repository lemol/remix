import { MemoryUserRepository, MemoryPostRepository } from "./repositories";
import { ConsoleNotificationService } from "./notifications";
import { ServiceCatalog, serviceProvider } from "../services";

serviceProvider.provide(ServiceCatalog.userRepository, () => new MemoryUserRepository())
serviceProvider.provide(ServiceCatalog.postRepository, () => new MemoryPostRepository())
serviceProvider.provide(ServiceCatalog.notificationService, () => new ConsoleNotificationService())
