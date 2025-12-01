import { defineCatalog, serviceOf, ServiceProvider } from '@remix-run/router-services-middleware'

export interface Book {
  id: string // unique identifier
  slug: string
  title: string
  author: string
  description: string
  price: number
  genre: string
  imageUrls: string[]
  coverUrl: string
  isbn: string
  publishedYear: number
  inStock: boolean
}

export interface User {
  id: string
  email: string
  password: string // In production, this would be hashed!
  name: string
  role: 'customer' | 'admin'
  createdAt: Date
}

export interface CartItem {
  bookId: string
  slug: string
  title: string
  price: number
  quantity: number
}

export interface Cart {
  items: CartItem[]
}

export interface BookService {
  getAllBooks(): Promise<Book[]>
  getBookBySlug(slug: string): Promise<Book | undefined>
  getBookById(id: string): Promise<Book | undefined>
  getBooksByGenre(genre: string): Promise<Book[]>
  searchBooks(query: string): Promise<Book[]>
  getAvailableGenres(): Promise<string[]>
  createBook(data: Omit<Book, 'id'>): Promise<Book>
  updateBook(id: string, data: Partial<Book>): Promise<Book | undefined>
  deleteBook(id: string): Promise<boolean>
}

export interface AuthService {
  getAllUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  authenticateUser(email: string, password: string): Promise<User | undefined>
  createUser(email: string, password: string, name: string, role?: 'customer' | 'admin'): Promise<User>
  updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User | undefined>
  deleteUser(id: string): Promise<boolean>
  createPasswordResetToken(email: string): Promise<string | undefined>
  resetPassword(token: string, newPassword: string): Promise<boolean>
}

export interface CartService {
  getCart(value: unknown): Cart
  addToCart(cart: Cart, bookId: string, slug: string, title: string, price: number, quantity?: number): Cart
  updateCartItem(cart: Cart, bookId: string, quantity: number): Cart | undefined
  removeFromCart(cart: Cart, bookId: string): Cart
  clearCart(cart: Cart): Cart
  getCartTotal(cart: Cart): number
}

export interface OrderItem {
  bookId: string
  title: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  shippingAddress: {
    street: string
    city: string
    state: string
    zip: string
  }
  createdAt: Date
}

export interface OrderService {
  getAllOrders(): Promise<Order[]>
  getOrderById(id: string): Promise<Order | undefined>
  getOrdersByUserId(userId: string): Promise<Order[]>
  createOrder(userId: string, items: OrderItem[], shippingAddress: Order['shippingAddress']): Promise<Order>
  updateOrderStatus(id: string, status: Order['status']): Promise<Order | undefined>
}

export let ServiceCatalog = defineCatalog({
  bookService: serviceOf<BookService>(),
  authService: serviceOf<AuthService>(),
  cartService: serviceOf<CartService>(),
  orderService: serviceOf<OrderService>(),
})

export let serviceProvider = new ServiceProvider(ServiceCatalog)
