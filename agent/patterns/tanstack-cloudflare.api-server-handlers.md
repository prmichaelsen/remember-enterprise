# API Server Handlers Pattern

**Category**: Architecture
**Applicable To**: TanStack Start + Cloudflare Workers applications with API routes
**Status**: Stable

---

## Overview

API routes in TanStack Start on Cloudflare Workers must use `createFileRoute` with `server: { handlers: {} }` — NOT `createAPIFileRoute` from `@tanstack/start/api`. The `createAPIFileRoute` approach doesn't register with the route tree on Cloudflare, resulting in 404s at runtime even though the build succeeds.

This pattern defines how to create API endpoints that work correctly with file-based routing and Cloudflare Workers.

---

## When to Use This Pattern

✅ **Use this pattern when:**
- Creating any server-side API endpoint (`/api/*`)
- Handling REST methods (GET, POST, PUT, DELETE)
- WebSocket upgrade endpoints
- Any route that returns `Response` instead of rendering React

❌ **Don't use this pattern when:**
- Creating page routes (use standard `createFileRoute` with `component`)
- Using `createServerFn` for server functions (those are separate)

---

## Core Principles

1. **Always `createFileRoute`**: Never use `createAPIFileRoute` — it doesn't work on Cloudflare
2. **`server.handlers` wrapper**: All HTTP method handlers go inside `server: { handlers: {} }`
3. **Type the request parameter**: Always type `{ request: Request }` (and `params` if using route params)
4. **File naming**: API route files live in `src/routes/api/` and follow TanStack Router file conventions
5. **Same export name**: Export as `Route` (not `APIRoute`)

---

## Implementation

### Basic API Route

```typescript
// src/routes/api/my-endpoint.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/my-endpoint')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return Response.json({ message: 'Hello' })
      },
      POST: async ({ request }: { request: Request }) => {
        const body = await request.json()
        return Response.json({ received: body })
      },
    },
  },
})
```

### With Route Params

```typescript
// src/routes/api/items/$id.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/items/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const item = await getItem(params.id)
        if (!item) return new Response('Not found', { status: 404 })
        return Response.json(item)
      },
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        await deleteItem(params.id)
        return Response.json({ deleted: true })
      },
    },
  },
})
```

### With Auth Guard

```typescript
// src/routes/api/protected.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getServerSession } from '@/lib/auth/session'

export const Route = createFileRoute('/api/protected')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await getServerSession(request)
        if (!session) return new Response('Unauthorized', { status: 401 })

        return Response.json({ user: session.uid })
      },
    },
  },
})
```

### WebSocket Upgrade

```typescript
// src/routes/api/ws.tsx
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/ws')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (request.headers.get('Upgrade') !== 'websocket') {
          return new Response('Expected WebSocket upgrade', { status: 426 })
        }

        const binding = (env as any).MY_DURABLE_OBJECT as DurableObjectNamespace
        const id = binding.idFromName('room-1')
        const stub = binding.get(id)

        const doUrl = new URL(request.url)
        doUrl.pathname = '/websocket'

        return stub.fetch(new Request(doUrl.toString(), { headers: request.headers }))
      },
    },
  },
})
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Using createAPIFileRoute

```typescript
// ❌ BAD: 404s on Cloudflare Workers
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/api/foo')({
  GET: async ({ request }) => { ... }
})

// ✅ GOOD: Works on Cloudflare Workers
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/foo')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => { ... }
    },
  },
})
```

### ❌ Anti-Pattern 2: Missing server.handlers wrapper

```typescript
// ❌ BAD: Handler at top level
export const Route = createFileRoute('/api/foo')({
  GET: async ({ request }) => { ... }
})

// ✅ GOOD: Wrapped in server.handlers
export const Route = createFileRoute('/api/foo')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => { ... }
    },
  },
})
```

### ❌ Anti-Pattern 3: Exporting as APIRoute

```typescript
// ❌ BAD: Wrong export name
export const APIRoute = createFileRoute(...)

// ✅ GOOD: Standard Route export
export const Route = createFileRoute(...)
```

---

## Related Patterns

- **[Library Services](./tanstack-cloudflare.library-services.md)**: API handlers should delegate to DatabaseService, never access Firestore directly
- **[SSR Preload](./tanstack-cloudflare.ssr-preload.md)**: Page routes use `beforeLoad`, API routes use `server.handlers` — don't mix them
- **[Auth Session Management](./tanstack-cloudflare.auth-session-management.md)**: Auth guard pattern for API routes

---

**Status**: Stable — Proven pattern from cleanbook-tanstack and agentbase.me
**Recommendation**: Use for ALL API routes in TanStack Start + Cloudflare projects
**Last Updated**: 2026-03-15
