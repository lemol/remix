import type { RouteHandlers } from '@remix-run/fetch-router'
import { resolveService, withServices } from '@remix-run/router-services-middleware'
import { defineRouter, use } from '@remix-run/fetch-router-extra'

import { routes } from './routes.ts'
import { BookCard } from './components/book-card.tsx'
import {getCurrentCart } from './utils/context.ts'
import { render } from './utils/render.ts'
import { ServiceCatalog } from '../services.ts'
import type { BookService } from '../services.ts'

export default {
  bookCard: defineRouter(routes.fragments.bookCard, {
    middleware: use(withServices(ServiceCatalog.bookService)),
    handler: async ({ params, extra }) => {
      let slug = params.slug
      let { bookService } = extra.services
      let book = await bookService.getBookBySlug(slug)

      if (!book) {
        return new Response('Book not found', { status: 404 })
      }

      let cart = getCurrentCart()
      let inCart = cart.items.some((item) => item.slug === slug)

      return render(<BookCard book={book} inCart={inCart} />)
    },
  }),
} satisfies RouteHandlers<typeof routes.fragments>
