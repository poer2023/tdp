# Avatar Loading Fix

## Issue Summary

- User avatars frequently failed to render after pulling the latest code. The UI would fall back to the initials placeholder, suggesting the `<Image>` component never received a valid bitmap.
- Inspecting the network panel showed failing requests hitting `/_next/image?url=…` with 400/404 responses.

## Root Causes

1. **Missing Remote Host Configuration**  
   Only `lh3.googleusercontent.com` was allowed under `images.remotePatterns`. However, many avatars (especially test fixtures and GitHub-authenticated users) point to `https://avatars.githubusercontent.com`. When the Next.js optimizer tries to proxy a URL from an unlisted host it responds with `next/image` "Invalid src prop" errors → the request never returns an image.

2. **Custom Loader Returning Optimizer URLs**  
   The project enables a custom loader (`image-loader.ts`). Earlier iterations returned `/_next/image?...` URLs for any external source. Because the custom loader short-circuits the optimizer pipeline, those URLs have no backing route, so the request 404s even for allowed hosts.

## Fix Details

1. **Permit Real Avatar Domains**  
   Updated `next.config.ts` so `images.remotePatterns` contains both Google (`lh3.googleusercontent.com`) and GitHub (`avatars.githubusercontent.com`) hosts. This satisfies Next.js domain checks when the optimizer is involved.

2. **Bypass Optimizer for Remote Avatars**  
   Adjusted `image-loader.ts` so external URLs are returned as-is. The browser now fetches `https://avatars.githubusercontent.com/...` directly instead of relying on `/_next/image`. API-served files (`/api/uploads/*`) still attach width/quality parameters for caching.

## Verification

- Confirmed the Next.js dev server serves avatars without hitting 400/404s.
- Visual regression: header shows the expected profile photo; network tab reports direct 200 responses from GitHub/Google hosts.

## Follow-up Considerations

- If other social providers are added, mirror their hostnames in `remotePatterns` to avoid future breakage.
- When toggling `images.unoptimized`, ensure the custom loader continues returning usable URLs (either direct or matching an existing route).
