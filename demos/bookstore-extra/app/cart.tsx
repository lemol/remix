import { defineAction, use } from '@remix-run/fetch-router-extra'
import { createRedirectResponse as redirect } from '@remix-run/response/redirect'
import { resolveService, withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { z } from 'zod'

import { routes } from './routes.ts'
import { Layout } from './layout.tsx'
import { loadAuth } from './middleware/auth.ts'
import { getCurrentCart } from './utils/context.ts'
import { render } from './utils/render.ts'
import { RestfulForm } from './components/restful-form.tsx'
import { ServiceCatalog } from '../services.ts'
import type { CartService, BookService, Cart } from '../services.ts'

// Cart Index Handler
const cartIndex = defineAction(routes.cart.index, {
  middleware: use(loadAuth(), withServices(ServiceCatalog.cartService)),
  action: async ({ extra }) => {
    let cart = getCurrentCart()
    let { services, user } = extra
    let { cartService } = services
    let total = await cartService.getCartTotal(cart)

    return render(
      <Layout>
        <h1>Shopping Cart</h1>

        <div class="card">
          {cart.items.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr>
                      <td>
                        <a href={routes.books.show.href({ slug: item.slug })}>{item.title}</a>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <RestfulForm
                          method="PUT"
                          action={routes.cart.api.update.href()}
                          style="display: inline-flex; gap: 0.5rem; align-items: center;"
                        >
                          <input type="hidden" name="bookId" value={item.bookId} />
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            min="1"
                            style="width: 70px;"
                          />
                          <button
                            type="submit"
                            class="btn btn-secondary"
                            style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                          >
                            Update
                          </button>
                        </RestfulForm>
                      </td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      <td>
                        <RestfulForm
                          method="DELETE"
                          action={routes.cart.api.remove.href()}
                          style="display: inline;"
                        >
                          <input type="hidden" name="bookId" value={item.bookId} />
                          <button
                            type="submit"
                            class="btn btn-danger"
                            style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                          >
                            Remove
                          </button>
                        </RestfulForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style="text-align: right; font-weight: bold;">
                      Total:
                    </td>
                    <td style="font-weight: bold;">${total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <a href={routes.books.index.href()} class="btn btn-secondary">
                  Continue Shopping
                </a>
                {user ? (
                  <a href={routes.checkout.index.href()} class="btn">
                    Proceed to Checkout
                  </a>
                ) : (
                  <a href={routes.auth.login.index.href()} class="btn">
                    Login to Checkout
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <p>Your cart is empty.</p>
              <p style="margin-top: 1rem;">
                <a href={routes.books.index.href()} class="btn">
                  Browse Books
                </a>
              </p>
            </>
          )}
        </div>
      </Layout>,
    )
  },
})

// Cart API Handlers
const cartAdd = defineAction(routes.cart.api.add, {
  middleware: use(
    loadAuth(),
    withServices(ServiceCatalog.bookService, ServiceCatalog.cartService),
    withFormData(
      z.object({
        bookId: z.string(),
        slug: z.string().optional(),
        redirect: z.string().optional(),
      }),
    ),
  ),
  action: async ({ session, extra }) => {
    if (process.env.NODE_ENV !== 'test') {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    let { bookId, redirect: redirectParam } = extra.formData
    let { bookService, cartService } = extra.services

    let book = await bookService.getBookById(bookId)
    if (!book) {
      return new Response('Book not found', { status: 404 })
    }

    let cart = getCurrentCart()
    let updatedCart = await cartService.addToCart(
      cart,
      book.id,
      book.slug,
      book.title,
      book.price,
      1,
    )
    session.set('cart', updatedCart)

    if (redirectParam === 'none') {
      return new Response(null, { status: 204 })
    }

    return redirect(routes.cart.index.href())
  },
})

const cartUpdate = defineAction(routes.cart.api.update, {
  middleware: use(
    loadAuth(),
    withServices(ServiceCatalog.bookService, ServiceCatalog.cartService),
    withFormData(
      z.object({
        bookId: z.string(),
        quantity: z.coerce.number().int().min(1),
        redirect: z.string().optional(),
      }),
    ),
  ),
  action: async ({ extra, session }) => {
    let { bookId, quantity, redirect: redirectParam } = extra.formData
    let { cartService } = extra.services

    let cart = getCurrentCart()
    let updatedCart = await cartService.updateCartItem(cart, bookId, quantity)
    session.set('cart', updatedCart)

    if (redirectParam === 'none') {
      return new Response(null, { status: 204 })
    }

    return redirect(routes.cart.index.href())
  },
})

const cartRemove = defineAction(routes.cart.api.remove, {
  middleware: use(
    loadAuth(),
    withServices(ServiceCatalog.cartService),
    withFormData(
      z.object({
        bookId: z.string(),
        redirect: z.string().optional(),
      }),
    ),
  ),
  action: async ({ session, extra }) => {
    if (process.env.NODE_ENV !== 'test') {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    let { bookId, redirect: redirectParam } = extra.formData
    let { cartService } = extra.services

    let cart = getCurrentCart()
    let updatedCart = await cartService.removeFromCart(cart, bookId)
    session.set('cart', updatedCart)

    if (redirectParam === 'none') {
      return new Response(null, { status: 204 })
    }

    return redirect(routes.cart.index.href())
  },
})

export default {
  index: cartIndex,
  api: {
    add: cartAdd,
    update: cartUpdate,
    remove: cartRemove,
  },
}
