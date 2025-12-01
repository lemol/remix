import type { Book } from '../services.ts'
import type { User } from '../services.ts'

// Sample book data
export const booksData: Book[] = [
  {
    id: '001',
    slug: 'bbq',
    title: 'Ash & Smoke',
    author: 'Rusty Char-Broil',
    description: 'The perfect gift for the BBQ enthusiast in your life!',
    price: 16.99,
    genre: 'cookbook',
    coverUrl: '/images/bbq-1.png',
    imageUrls: ['/images/bbq-1.png', '/images/bbq-2.png', '/images/bbq-3.png'],
    isbn: '978-0525559474',
    publishedYear: 2020,
    inStock: true,
  },
  {
    id: '002',
    slug: 'heavy-metal',
    title: 'Heavy Metal Guitar Riffs',
    author: 'Axe Master Krush',
    description: 'The ultimate guide to heavy metal guitar riffs!',
    price: 27.0,
    genre: 'music',
    coverUrl: '/images/heavy-metal-1.png',
    imageUrls: [
      '/images/heavy-metal-1.png',
      '/images/heavy-metal-2.png',
      '/images/heavy-metal-3.png',
    ],
    isbn: '978-0735211292',
    publishedYear: 2018,
    inStock: true,
  },
  {
    id: '003',
    slug: 'three-ways',
    title: 'Three Ways to Change Your Life',
    author: 'Britney Spears',
    description: 'A practical guide to changing your life for the better.',
    price: 28.99,
    genre: 'self-help',
    coverUrl: '/images/three-ways-1.png',
    imageUrls: ['/images/three-ways-1.png', '/images/three-ways-2.png', '/images/three-ways-3.png'],
    isbn: '978-0593135204',
    publishedYear: 2021,
    inStock: true,
  },
]

export const usersData: User[] = [
  {
    id: '1',
    email: 'admin@bookstore.com',
    password: 'admin123', // Never do this in production!
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'customer@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'customer',
    createdAt: new Date('2024-02-15'),
  },
]

// Password reset tokens (in production, use a proper token system)
export const resetTokens = new Map<string, { userId: string; expiresAt: Date }>()

export const ordersData: any[] = [
  {
    id: '1001',
    userId: '2',
    items: [
      { bookId: '1', title: 'The Midnight Library', price: 16.99, quantity: 1 },
      { bookId: '3', title: 'Project Hail Mary', price: 28.99, quantity: 1 },
    ],
    total: 45.98,
    status: 'delivered',
    shippingAddress: {
      street: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
    },
    createdAt: new Date('2024-09-15'),
  },
  {
    id: '1002',
    userId: '2',
    items: [{ bookId: '2', title: 'Atomic Habits', price: 27.0, quantity: 2 }],
    total: 54.0,
    status: 'shipped',
    shippingAddress: {
      street: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
    },
    createdAt: new Date('2024-10-01'),
  },
]
