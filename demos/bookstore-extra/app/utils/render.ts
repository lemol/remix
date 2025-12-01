import type { Remix } from '@remix-run/dom'
import { renderToStream } from '@remix-run/dom/server'
import { createHtmlResponse } from '@remix-run/response/html'

// We'll implement frame resolution later or stub it for now if needed.
// The original used './frame.tsx', let's see if we need that.
// For now, I'll just use a simple resolver or copy frame.tsx if it exists.
// Actually, let's check if frame.tsx exists in the original.
import { resolveFrame } from './frame.tsx'

export function render(element: Remix.RemixElement, init?: ResponseInit) {
  return createHtmlResponse(renderToStream(element, { resolveFrame }), init)
}
