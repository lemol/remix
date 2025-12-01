import { defineRouter, use } from '@remix-run/fetch-router-extra'
import { createRedirectResponse as redirect } from '@remix-run/response/redirect'
import { withServices } from '@remix-run/router-services-middleware'
import { withFormData } from '@remix-run/form-data-typed-middleware'
import { z } from 'zod'

import { routes } from './routes.ts'
import { Layout } from './layout.tsx'
import { requireAuth } from './middleware/auth.ts'
import { requireAdmin } from './middleware/admin.ts'
import { render } from './utils/render.ts'
import { RestfulForm } from './components/restful-form.tsx'
import { ServiceCatalog } from '../services.ts'
import type { Book } from '../services.ts'

// Admin Books Index
const booksIndex = defineRouter(routes.admin.books.index, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.bookService)
  ),
  handler: async ({ extra }) => {
    let { bookService } = extra.services
    let books = await bookService.getAllBooks()

    return render(
      <Layout>
        <h1>Manage Books</h1>

        <p style="margin-bottom: 1rem;">
          <a href={routes.admin.books.new.href()} class="btn">
            Add New Book
          </a>
          <a
            href={routes.admin.index.href()}
            class="btn btn-secondary"
            style="margin-left: 0.5rem;"
          >
            Back to Dashboard
          </a>
        </p>

        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book: Book) => (
                <tr>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>${book.price.toFixed(2)}</td>
                  <td>
                    <span class={`badge ${book.inStock ? 'badge-success' : 'badge-warning'}`}>
                      {book.inStock ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td class="actions">
                    <a
                      href={routes.admin.books.edit.href({ bookId: book.id })}
                      class="btn btn-secondary"
                      style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                    >
                      Edit
                    </a>
                    <RestfulForm
                      method="DELETE"
                      action={routes.admin.books.destroy.href({ bookId: book.id })}
                      style="display: inline;"
                    >
                      <button
                        type="submit"
                        class="btn btn-danger"
                        style="font-size: 0.875rem; padding: 0.25rem 0.5rem;"
                      >
                        Delete
                      </button>
                    </RestfulForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>,
    )
  },
})

// Admin Books New
const booksNew = defineRouter(routes.admin.books.new, {
  middleware: use(requireAuth(), requireAdmin()),
  handler: () => {
    return render(
      <Layout>
        <h1>Add New Book</h1>

        <div class="card">
          <form
            method="POST"
            action={routes.admin.books.create.href()}
            encType="multipart/form-data"
          >
            <div class="form-group">
              <label for="title">Title</label>
              <input type="text" id="title" name="title" required />
            </div>

            <div class="form-group">
              <label for="author">Author</label>
              <input type="text" id="author" name="author" required />
            </div>

            <div class="form-group">
              <label for="slug">Slug (URL-friendly name)</label>
              <input type="text" id="slug" name="slug" required />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" required></textarea>
            </div>

            <div class="form-group">
              <label for="price">Price</label>
              <input type="number" id="price" name="price" step="0.01" required />
            </div>

            <div class="form-group">
              <label for="genre">Genre</label>
              <input type="text" id="genre" name="genre" required />
            </div>

            <div class="form-group">
              <label for="isbn">ISBN</label>
              <input type="text" id="isbn" name="isbn" required />
            </div>

            <div class="form-group">
              <label for="publishedYear">Published Year</label>
              <input type="number" id="publishedYear" name="publishedYear" required />
            </div>

            <div class="form-group">
              <label for="inStock">In Stock</label>
              <select id="inStock" name="inStock">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div class="form-group">
              <label for="cover">Book Cover Image</label>
              <input type="file" id="cover" name="cover" accept="image/*" />
              <small style="color: #666;">Optional. Upload a cover image for this book.</small>
            </div>

            <button type="submit" class="btn">
              Create Book
            </button>
            <a
              href={routes.admin.books.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Cancel
            </a>
          </form>
        </div>
      </Layout>,
    )
  },
})

// Admin Books Create
const booksCreate = defineRouter(routes.admin.books.create, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.bookService),
    withFormData(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        price: z.coerce.number().min(0),
        genre: z.string().min(1),
        isbn: z.string().min(1),
        publishedYear: z.coerce.number().int(),
        inStock: z.enum(['true', 'false']).transform((val: string) => val === 'true'),
        cover: z.any().optional(), // File upload handling is tricky with zod + formData, using any for now or string if it's a path
      }),
    ),
  ),
  handler: async ({ extra }) => {
    let {
      title,
      author,
      slug,
      description,
      price,
      genre,
      isbn,
      publishedYear,
      inStock,
      cover,
    } = extra.formData
    let { bookService } = extra.services

    // Handle file upload if needed (simplified for now, assuming cover is string path or ignored)
    let coverUrl = typeof cover === 'string' ? cover : '/images/placeholder.jpg'

    await bookService.createBook({
      title,
      author,
      slug,
      description,
      price,
      genre,
      isbn,
      publishedYear,
      inStock,
      coverUrl,
      imageUrls: [],
    })

    return redirect(routes.admin.books.index.href())
  },
})

// Admin Books Edit
const booksEdit = defineRouter(routes.admin.books.edit, {
  middleware: use(requireAuth(), requireAdmin(), withServices(ServiceCatalog.bookService)),
  handler: async ({ params, extra }) => {
    let { bookService } = extra.services
    let book = await bookService.getBookById(params.bookId)

    if (!book) {
      return render(
        <Layout>
          <div class="card">
            <h1>Book Not Found</h1>
          </div>
        </Layout>,
        { status: 404 },
      )
    }

    return render(
      <Layout>
        <h1>Edit Book</h1>

        <div class="card">
          <RestfulForm
            method="PUT"
            action={routes.admin.books.update.href({ bookId: book.id })}
            encType="multipart/form-data"
          >
            <div class="form-group">
              <label for="title">Title</label>
              <input type="text" id="title" name="title" value={book.title} required />
            </div>

            <div class="form-group">
              <label for="author">Author</label>
              <input type="text" id="author" name="author" value={book.author} required />
            </div>

            <div class="form-group">
              <label for="slug">Slug (URL-friendly name)</label>
              <input type="text" id="slug" name="slug" value={book.slug} required />
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" required>
                {book.description}
              </textarea>
            </div>

            <div class="form-group">
              <label for="price">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                value={book.price}
                required
              />
            </div>

            <div class="form-group">
              <label for="genre">Genre</label>
              <input type="text" id="genre" name="genre" value={book.genre} required />
            </div>

            <div class="form-group">
              <label for="isbn">ISBN</label>
              <input type="text" id="isbn" name="isbn" value={book.isbn} required />
            </div>

            <div class="form-group">
              <label for="publishedYear">Published Year</label>
              <input
                type="number"
                id="publishedYear"
                name="publishedYear"
                value={book.publishedYear}
                required
              />
            </div>

            <div class="form-group">
              <label for="inStock">In Stock</label>
              <select id="inStock" name="inStock">
                <option value="true" selected={book.inStock}>
                  Yes
                </option>
                <option value="false" selected={!book.inStock}>
                  No
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="cover">Book Cover Image</label>
              {book.coverUrl !== '/images/placeholder.jpg' && (
                <div style="margin-bottom: 0.5rem;">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    style="max-width: 200px; height: auto; border-radius: 4px;"
                  />
                  <p style="font-size: 0.875rem; color: #666;">Current cover image</p>
                </div>
              )}
              <input type="file" id="cover" name="cover" accept="image/*" />
              <small style="color: #666;">
                Optional. Upload a new cover image to replace the current one.
              </small>
            </div>

            <button type="submit" class="btn">
              Update Book
            </button>
            <a
              href={routes.admin.books.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Cancel
            </a>
          </RestfulForm>
        </div>
      </Layout>,
    )
  },
})

// Admin Books Update
const booksUpdate = defineRouter(routes.admin.books.update, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.bookService),
    withFormData(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        price: z.coerce.number().min(0),
        genre: z.string().min(1),
        isbn: z.string().min(1),
        publishedYear: z.coerce.number().int(),
        inStock: z.enum(['true', 'false']).transform((val: string) => val === 'true'),
        cover: z.any().optional(),
      }),
    ),
  ),
  handler: async ({ params, extra }) => {
    let { bookService } = extra.services
    let book = await bookService.getBookById(params.bookId)

    if (!book) {
      return new Response('Book not found', { status: 404 })
    }

    let {
      title,
      author,
      slug,
      description,
      price,
      genre,
      isbn,
      publishedYear,
      inStock,
      cover,
    } = extra.formData

    let coverUrl = typeof cover === 'string' ? cover : book.coverUrl

    await bookService.updateBook(params.bookId, {
      title,
      author,
      slug,
      description,
      price,
      genre,
      isbn,
      publishedYear,
      inStock,
      coverUrl,
    })

    return redirect(routes.admin.books.index.href())
  },
})

// Admin Books Destroy
const booksDestroy = defineRouter(routes.admin.books.destroy, {
  middleware: use(
    requireAuth(),
    requireAdmin(),
    withServices(ServiceCatalog.bookService),
    withFormData(z.object({})), // Empty object just to parse form data if needed, though DELETE usually doesn't have body in this context but RestfulForm sends POST
  ),
  handler: async ({ params, extra }) => {
    let { bookService } = extra.services
    await bookService.deleteBook(params.bookId)

    return redirect(routes.admin.books.index.href())
  },
})

// Admin Books Show
const booksShow = defineRouter(routes.admin.books.show, {
  middleware: use(requireAuth(), requireAdmin(), withServices(ServiceCatalog.bookService)),
  handler: async ({ params, extra }) => {
    let { bookService } = extra.services
    let book = await bookService.getBookById(params.bookId)

    if (!book) {
      return render(
        <Layout>
          <div class="card">
            <h1>Book Not Found</h1>
          </div>
        </Layout>,
        { status: 404 },
      )
    }

    return render(
      <Layout>
        <h1>Book Details</h1>

        <div class="card">
          <p>
            <strong>Title:</strong> {book.title}
          </p>
          <p>
            <strong>Author:</strong> {book.author}
          </p>
          <p>
            <strong>Slug:</strong> {book.slug}
          </p>
          <p>
            <strong>Description:</strong> {book.description}
          </p>
          <p>
            <strong>Price:</strong> ${book.price.toFixed(2)}
          </p>
          <p>
            <strong>Genre:</strong> {book.genre}
          </p>
          <p>
            <strong>ISBN:</strong> {book.isbn}
          </p>
          <p>
            <strong>Published:</strong> {book.publishedYear}
          </p>
          <p>
            <strong>In Stock:</strong>{' '}
            <span class={`badge ${book.inStock ? 'badge-success' : 'badge-warning'}`}>
              {book.inStock ? 'Yes' : 'No'}
            </span>
          </p>

          <div style="margin-top: 2rem;">
            <a href={routes.admin.books.edit.href({ bookId: book.id })} class="btn">
              Edit
            </a>
            <a
              href={routes.admin.books.index.href()}
              class="btn btn-secondary"
              style="margin-left: 0.5rem;"
            >
              Back to List
            </a>
          </div>
        </div>
      </Layout>,
    )
  },
})

export default {
  index: booksIndex,
  show: booksShow,
  new: booksNew,
  create: booksCreate,
  edit: booksEdit,
  update: booksUpdate,
  destroy: booksDestroy,
}
