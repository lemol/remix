import { defineAction, use } from '@remix-run/fetch-router-extra'
import { createRedirectResponse as redirect } from '@remix-run/response/redirect'
import { resolveService, withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { z } from 'zod'

import { routes } from './routes.ts'
import { Layout } from './layout.tsx'
import { requireAuth } from './middleware/auth.ts'
import { getCurrentCart } from './utils/context.ts'
import { render } from './utils/render.ts'
import { ServiceCatalog } from '../services.ts'
import type { CartService, OrderService, Cart, OrderItem } from '../services.ts'

// Checkout Index Handler
const checkoutIndex = defineAction(routes.checkout.index, {
  middleware: use(requireAuth(), withServices(ServiceCatalog.cartService)),
  action: async ({ extra }) => {
    let { user } = extra

    let cart = getCurrentCart()
    let { cartService } = extra.services as { cartService: CartService }
    let total = await cartService.getCartTotal(cart) // Keeping await as getCartTotal is async

    if (cart.items.length === 0) {
      return render(
        <Layout>
          <div class="card">
            <h1>Checkout</h1>
            <p>Your cart is empty. Add some books before checking out.</p>
            <p style="margin-top: 1rem;">
              <a href={routes.books.index.href()} class="btn">
                Browse Books
              </a>
            </p>
          </div>
        </Layout>,
      )
    }

    return render(
      <Layout>
        <h1>Checkout</h1>

        <div class="card">
          <h2>Order Summary</h2>
          <table style="margin-top: 1rem;">
            <thead>
              <tr>
                <th>Book</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style="text-align: right; font-weight: bold;">
                  Total:
                </td>
                <td style="font-weight: bold;">${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="card" style="margin-top: 1.5rem;">
          <h2>Shipping Information</h2>
          <form method="POST" action={routes.checkout.action.href()}>
            <div class="form-group">
              <label for="street">Street Address</label>
              <input type="text" id="street" name="street" required />
            </div>

            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" name="city" required />
            </div>

            <div class="form-group">
              <label for="state">State</label>
              <input type="text" id="state" name="state" required />
            </div>

            <div class="form-group">
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" name="zip" required />
            </div>

            <button type="submit" class="btn">
              Place Order
            </button>
            <a
              href={routes.cart.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Back to Cart
            </a>
          </form>
        </div>
      </Layout>,
    )
  },
})

// Checkout Action Handler
const checkoutAction = defineAction(routes.checkout.action, {
  middleware: use(
    requireAuth(),
    withServices(ServiceCatalog.orderService, ServiceCatalog.cartService),
    withFormData(
      z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zip: z.string().min(1),
      }),
    ),
  ),
  action: async ({ session, extra }) => {
    let { user } = extra

    let cart = getCurrentCart()
    if (cart.items.length === 0) {
      return redirect(routes.cart.index.href())
    }

    let { street, city, state, zip } = extra.formData
    let { orderService, cartService } = extra.services as { orderService: OrderService, cartService: CartService }

    let orderItems: OrderItem[] = cart.items.map((item) => ({
      bookId: item.bookId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
    }))

    let order = await orderService.createOrder(
      user.id,
      orderItems,
      { street, city, state, zip },
    )

    let clearedCart = await cartService.clearCart(cart)
    session.set('cart', clearedCart)

    return redirect(routes.checkout.confirmation.href({ orderId: order.id }))
  },
})

// Checkout Confirmation Handler
const checkoutConfirmation = defineAction(routes.checkout.confirmation, {
  middleware: use(requireAuth(), withServices(ServiceCatalog.orderService)),
  action: async ({ params, extra }) => {
    let { user } = extra

    let { orderService } = extra.services as { orderService: OrderService }
    let order = await orderService.getOrderById(params.orderId)

    if (!order || order.userId !== user.id) {
      return render(
        <Layout>
          <div class="card">
            <h1>Order Not Found</h1>
            <p>
              <a href={routes.account.orders.index.href()} class="btn">
                View My Orders
              </a>
            </p>
          </div>
        </Layout>,
        { status: 404 },
      )
    }

    return render(
      <Layout>
        <div class="alert alert-success">
          <h1 style="margin-bottom: 0.5rem;">Order Confirmed!</h1>
          <p>Thank you for your purchase. Your order has been placed successfully.</p>
        </div>

        <div class="card">
          <h2>Order #{order.id}</h2>
          <p>
            <strong>Order Date:</strong> {order.createdAt.toLocaleDateString()}
          </p>
          <p>
            <strong>Total:</strong> ${order.total.toFixed(2)}
          </p>
          <p>
            <strong>Status:</strong> <span class="badge badge-info">{order.status}</span>
          </p>

          <p style="margin-top: 2rem;">
            We'll send you a confirmation email shortly. You can track your order status in your
            account.
          </p>

          <div style="margin-top: 2rem;">
            <a href={routes.account.orders.show.href({ orderId: order.id })} class="btn">
              View Order Details
            </a>
            <a
              href={routes.books.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </Layout>,
    )
  },
})

export default {
  index: checkoutIndex,
  action: checkoutAction,
  confirmation: checkoutConfirmation,
}
