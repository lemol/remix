import type { Book, BookService, User, AuthService, Cart, CartService, OrderService, Order, OrderItem } from '../services.ts'
import { booksData, usersData, resetTokens, ordersData } from './db.ts'

export class MemoryBookService implements BookService {
  getAllBooks(): Promise<Book[]> {
    return Promise.resolve([...booksData])
  }

  getBookBySlug(slug: string): Promise<Book | undefined> {
    return Promise.resolve(booksData.find((book) => book.slug === slug))
  }

  getBookById(id: string): Promise<Book | undefined> {
    return Promise.resolve(booksData.find((book) => book.id === id))
  }

  getBooksByGenre(genre: string): Promise<Book[]> {
    return Promise.resolve(booksData.filter((book) => book.genre.toLowerCase() === genre.toLowerCase()))
  }

  searchBooks(query: string): Promise<Book[]> {
    let lowerQuery = query.toLowerCase()
    return Promise.resolve(
      booksData.filter(
        (book) =>
          book.title.toLowerCase().includes(lowerQuery) ||
          book.author.toLowerCase().includes(lowerQuery) ||
          book.description.toLowerCase().includes(lowerQuery),
      ),
    )
  }

  getAvailableGenres(): Promise<string[]> {
    return Promise.resolve(Array.from(new Set(booksData.map((book) => book.genre))))
  }

  createBook(data: Omit<Book, 'id'>): Promise<Book> {
    let newBook: Book = {
      ...data,
      id: String(booksData.length + 1),
    }
    booksData.push(newBook)
    return Promise.resolve(newBook)
  }

  updateBook(id: string, data: Partial<Book>): Promise<Book | undefined> {
    let index = booksData.findIndex((book) => book.id === id)
    if (index === -1) return Promise.resolve(undefined)

    booksData[index] = { ...booksData[index], ...data }
    return Promise.resolve(booksData[index])
  }

  deleteBook(id: string): Promise<boolean> {
    let index = booksData.findIndex((book) => book.id === id)
    if (index === -1) return Promise.resolve(false)

    booksData.splice(index, 1)
    return Promise.resolve(true)
  }
}

export class MemoryAuthService implements AuthService {
  getAllUsers(): Promise<User[]> {
    return Promise.resolve([...usersData])
  }

  getUserById(id: string): Promise<User | undefined> {
    return Promise.resolve(usersData.find((user) => user.id === id))
  }

  getUserByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(usersData.find((user) => user.email.toLowerCase() === email.toLowerCase()))
  }

  authenticateUser(email: string, password: string): Promise<User | undefined> {
    let user = usersData.find((user) => user.email.toLowerCase() === email.toLowerCase())
    if (!user || user.password !== password) {
      return Promise.resolve(undefined)
    }
    return Promise.resolve(user)
  }

  createUser(email: string, password: string, name: string, role: 'customer' | 'admin' = 'customer'): Promise<User> {
    let newUser: User = {
      id: (usersData.length + 1).toString(),
      email,
      password, // In production, hash this!
      name,
      role,
      createdAt: new Date(),
    }
    usersData.push(newUser)
    return Promise.resolve(newUser)
  }

  updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    let index = usersData.findIndex((user) => user.id === id)
    if (index === -1) return Promise.resolve(undefined)

    usersData[index] = { ...usersData[index], ...data }
    return Promise.resolve(usersData[index])
  }

  deleteUser(id: string): Promise<boolean> {
    let index = usersData.findIndex((user) => user.id === id)
    if (index === -1) return Promise.resolve(false)

    usersData.splice(index, 1)
    return Promise.resolve(true)
  }

  createPasswordResetToken(email: string): Promise<string | undefined> {
    let user = usersData.find((user) => user.email.toLowerCase() === email.toLowerCase())
    if (!user) return Promise.resolve(undefined)

    let token = Math.random().toString(36).substring(2, 15)
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    })

    return Promise.resolve(token)
  }

  resetPassword(token: string, newPassword: string): Promise<boolean> {
    let tokenData = resetTokens.get(token)
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return Promise.resolve(false)
    }

    let user = usersData.find((user) => user.id === tokenData.userId)
    if (!user) return Promise.resolve(false)

    user.password = newPassword
    resetTokens.delete(token)
    return Promise.resolve(true)
  }
}

export class MemoryCartService implements CartService {
  getCart(value: unknown): Cart {
    // In a real app, this would validate the session data
    // For this demo, we'll just cast it or return a new cart
    if (value && typeof value === 'object' && 'items' in value) {
      return value as Cart
    }
    return { items: [] }
  }

  addToCart(
    cart: Cart,
    bookId: string,
    slug: string,
    title: string,
    price: number,
    quantity: number = 1,
  ): Cart {
    let items = [...cart.items]
    let existingItemIndex = items.findIndex((item) => item.bookId === bookId)

    if (existingItemIndex > -1) {
      let item = items[existingItemIndex]
      items[existingItemIndex] = {
        ...item,
        quantity: item.quantity + quantity,
      }
    } else {
      items.push({ bookId, slug, title, price, quantity })
    }

    return { ...cart, items }
  }

  updateCartItem(cart: Cart, bookId: string, quantity: number): Cart | undefined {
    let items = [...cart.items]
    let index = items.findIndex((item) => item.bookId === bookId)

    if (index > -1) {
      if (quantity <= 0) {
        items.splice(index, 1)
      } else {
        items[index] = { ...items[index], quantity }
      }
      return { ...cart, items }
    }

    return undefined
  }

  removeFromCart(cart: Cart, bookId: string): Cart {
    let items = cart.items.filter((item) => item.bookId !== bookId)
    return { ...cart, items }
  }

  clearCart(cart: Cart): Cart {
    return { ...cart, items: [] }
  }

  getCartTotal(cart: Cart): number {
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }
}

export class MemoryOrderService implements OrderService {
  async getAllOrders(): Promise<Order[]> {
    return [...ordersData]
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return ordersData.find((order) => order.id === id)
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return ordersData.filter((order) => order.userId === userId)
  }

  async createOrder(
    userId: string,
    items: OrderItem[],
    shippingAddress: Order['shippingAddress'],
  ): Promise<Order> {
    let total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    let newOrder: Order = {
      id: (1000 + ordersData.length + 1).toString(),
      userId,
      items,
      total,
      status: 'pending',
      shippingAddress,
      createdAt: new Date(),
    }

    ordersData.push(newOrder)
    return newOrder
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | undefined> {
    let order = ordersData.find((order) => order.id === id)
    if (!order) return undefined

    order.status = status
    return order
  }
}
