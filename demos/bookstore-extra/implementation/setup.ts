import { serviceProvider, ServiceCatalog } from '../services.ts'
import { MemoryBookService, MemoryAuthService, MemoryCartService, MemoryOrderService } from './services.ts'

serviceProvider.provide(ServiceCatalog.bookService, () => new MemoryBookService())
serviceProvider.provide(ServiceCatalog.authService, () => new MemoryAuthService())
serviceProvider.provide(ServiceCatalog.cartService, () => new MemoryCartService())
serviceProvider.provide(ServiceCatalog.orderService, () => new MemoryOrderService())
