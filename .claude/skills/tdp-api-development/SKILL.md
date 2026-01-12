---
name: tdp-api-development
description: Use when creating or modifying API routes. Triggers for route.ts files, NextRequest/NextResponse, auth checks, error handling, admin endpoints, or CRUD operations.
---

# TDP API Development

## Overview

100+ API endpoints following consistent patterns. This skill covers authentication, error handling, response format, admin routes, and common CRUD patterns.

## API Route Structure

```
src/app/api/
├── auth/                    # Auth endpoints (NextAuth)
├── admin/                   # Admin-only endpoints
│   ├── posts/              # Post CRUD
│   ├── gallery/            # Gallery management
│   ├── moments/            # Moment CRUD
│   └── credentials/        # External service credentials
├── posts/[slug]/           # Public post endpoints
├── moments/[id]/           # Public moment endpoints
├── cron/                   # Scheduled jobs
└── health/                 # Health checks
```

## Route Boilerplate

### Basic Route Pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Handler logic
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[API] endpoint failed", error);
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
```

### Route with Dynamic Params

```typescript
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;  // Must await in Next.js 15+

  // Use id...
}
```

## Authentication Patterns

### Public Route (no auth required)

```typescript
export async function GET() {
  const data = await fetchPublicData();
  return NextResponse.json(data);
}
```

### Authenticated Route (any user)

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // Proceed with authenticated user
}
```

### Admin-Only Route

```typescript
import { UserRole } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function GET() {
  try {
    await requireAdmin();
    // Admin-only logic
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
```

### Reusable Admin Check Pattern

```typescript
// At top of file
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

// In each handler
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    // Handle PUT
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] operation failed", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## Request Handling

### Parse JSON Body

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Validate required fields
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Process...
  } catch (error) {
    // Handle error
  }
}
```

### Parse Query Params

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const category = searchParams.get("category");

  // Use params...
}
```

### Handle Form Data (File Uploads)

```typescript
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process file...
  } catch (error) {
    // Handle error
  }
}
```

## Response Patterns

### Success Response

```typescript
// Single item
return NextResponse.json({ image: createdImage });

// List
return NextResponse.json(posts);

// With metadata
return NextResponse.json({
  data: items,
  total: count,
  hasMore: offset + items.length < count,
});

// Simple success
return NextResponse.json({ success: true });
```

### Error Responses

```typescript
// 400 Bad Request - invalid input
return NextResponse.json(
  { error: "Invalid input" },
  { status: 400 }
);

// 401 Unauthorized - not logged in
return NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 }
);

// 403 Forbidden - logged in but not permitted
return NextResponse.json(
  { error: "Forbidden" },
  { status: 403 }
);

// 404 Not Found
return NextResponse.json(
  { error: "Resource not found" },
  { status: 404 }
);

// 500 Internal Server Error
return NextResponse.json(
  { error: "Failed to process request" },
  { status: 500 }
);
```

## Cache Revalidation

### Revalidate After Mutation

```typescript
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  // Create/update resource...

  // Revalidate paths (both locales)
  revalidatePath("/gallery");
  revalidatePath("/zh/gallery");
  revalidatePath("/admin/gallery");

  // Or use tags
  revalidateTag("gallery:location");

  return NextResponse.json({ success: true });
}
```

## Error Handling Pattern

### Standard Error Handler

```typescript
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    // Main logic
    return NextResponse.json({ success: true });
  } catch (error) {
    // Check for known error types
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log with context
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Admin] operation failed:", errorMessage);
    if (errorStack) console.error("[Admin] stack:", errorStack);

    // Return generic error
    return NextResponse.json(
      { error: "Failed to complete operation", details: errorMessage },
      { status: 500 }
    );
  }
}
```

## Route Exports

### Required Exports

```typescript
// Use Node.js runtime for Prisma
export const runtime = "nodejs";

// Force dynamic for DB-dependent routes
export const dynamic = "force-dynamic";

// Or for static/ISR routes
export const revalidate = 60;  // Seconds
```

## CRUD Example: Gallery

### GET - List/Read

```typescript
// src/app/api/admin/gallery/route.ts
export async function GET() {
  try {
    await requireAdmin();
    const images = await listGalleryImages();
    return NextResponse.json(images);
  } catch (error) {
    // Error handling
  }
}
```

### POST - Create

```typescript
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const image = await addGalleryImage(body);
    revalidateGallery();
    return NextResponse.json({ image });
  } catch (error) {
    // Error handling
  }
}
```

### PUT - Update

```typescript
// src/app/api/admin/gallery/[id]/route.ts
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const image = await updateGalleryImage(id, body);
    revalidateGallery();
    return NextResponse.json({ image });
  } catch (error) {
    // Error handling
  }
}
```

### DELETE

```typescript
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteGalleryImage(id);
    revalidateGallery();
    return NextResponse.json({ success: true });
  } catch (error) {
    // Error handling
  }
}
```

## Checklist

### Creating New Route
- [ ] Add `export const runtime = "nodejs"` for Prisma
- [ ] Add `export const dynamic = "force-dynamic"` for DB routes
- [ ] Implement proper auth check
- [ ] Wrap in try/catch
- [ ] Log errors with context prefix
- [ ] Return appropriate status codes

### Admin Routes
- [ ] Use `requireAdmin()` helper
- [ ] Handle UNAUTHORIZED error
- [ ] Place in `/api/admin/` directory

### Mutations
- [ ] Validate input fields
- [ ] Call `revalidatePath` for affected paths (both locales)
- [ ] Return created/updated resource

### Error Handling
- [ ] Use `console.error` (not `console.log`)
- [ ] Include context prefix: `[Admin]`, `[API]`, etc.
- [ ] Return error message for debugging

## Quick Reference

| Task | Pattern |
|------|---------|
| Auth check | `await auth()` → check `session?.user` |
| Admin check | `session.user.role !== UserRole.ADMIN` |
| Get params | `const { id } = await params` |
| Parse body | `await request.json().catch(() => ({}))` |
| Query params | `new URL(request.url).searchParams` |
| Revalidate | `revalidatePath("/path")` for both locales |
| Error log | `console.error("[Context]", error)` |
| Runtime | `export const runtime = "nodejs"` |
