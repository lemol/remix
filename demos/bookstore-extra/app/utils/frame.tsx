import { resolveService } from '@remix-run/router-services-middleware'

import { routes } from '../routes.ts'
import { BookCard } from '../components/book-card.tsx'
import { getCurrentCart } from './context.ts'
import { ServiceCatalog } from '../../services.ts'
import type { BookService } from '../../services.ts'

export async function resolveFrame(frameSrc: string) {
  let url = new URL(frameSrc, 'http://localhost:44100')

  // Simulate network latency when resolving frames
  // await new Promise((resolve) => setTimeout(resolve, 500))

  let bookCardMatch = routes.fragments.bookCard.match(url)
  if (bookCardMatch) {
    let slug = bookCardMatch.params.slug
    let bookService = resolveService(ServiceCatalog.bookService)
    let book = await bookService.getBookBySlug(slug)

    if (!book) {
      throw new Error(`Book not found: ${slug}`)
    }

    let cart = getCurrentCart()
    let inCart = cart.items.some((item: any) => item.slug === slug)

    return <BookCard book={book} inCart={inCart} />
  }

  throw new Error(`Failed to fetch ${frameSrc}`)
}
