---
title: Auth guard redirects missing ?login=true and returnUrl in Bundle/Compare flows
date: 2026-04-03
category: logic-errors
module: bundle
problem_type: logic_error
component: authentication
severity: medium
symptoms:
  - Non-logged-in users redirected from protected pages without login modal auto-opening
  - After login/signup from BundleIntro, users returned to intro page instead of play page
  - GroupResult page had no auth guard, allowing unauthenticated access
root_cause: logic_error
resolution_type: code_fix
tags:
  - auth
  - login-redirect
  - returnurl
  - bundle
  - compare
  - login-modal
  - auth-guard
---

# Auth guard redirects missing ?login=true and returnUrl in Bundle/Compare flows

## Problem

Protected pages in Bundle and Compare flows silently redirected non-logged-in users to intro/landing pages without triggering the login modal or preserving the intended destination URL, causing users to lose their place after logging in.

## Symptoms

- Visiting `/bundle/{slug}/play` while logged out redirected to `/bundle/{slug}` but no login modal appeared
- After logging in from BundleIntro's "시작하기" button, users returned to intro page instead of play page
- `/compare/{token}/result` and `/compare/{token}/group` had the same issue
- GroupResult (`/compare/{token}/group`) had **zero auth protection**
- The MyPage flow (`/my`) worked correctly — proving the infrastructure existed but was inconsistently applied

## What Didn't Work

The initial implementation used bare redirects that stripped context:

```tsx
// BundlePlay — silent redirect, no login trigger, no returnUrl
useEffect(() => {
  if (!isLoggedIn) {
    router.replace(`/bundle/${slug}`);
  }
}, [isLoggedIn, slug, router]);
```

This sent users to the intro page but: (1) didn't append `?login=true` so `LoginQueryWatcher` never fired the login modal, and (2) didn't set `returnUrl` so even if the user manually logged in, they'd land on the intro page rather than their intended destination.

## Solution

**Pattern: Auth guard redirects include `?login=true` + `returnUrl=<encoded destination>`**

Before (BundlePlay):

```tsx
useEffect(() => {
  if (!isLoggedIn) {
    router.replace(`/bundle/${slug}`);
  }
}, [isLoggedIn, slug, router]);
```

After (BundlePlay):

```tsx
useEffect(() => {
  if (!isLoggedIn) {
    router.replace(
      `/bundle/${slug}?login=true&returnUrl=${encodeURIComponent(`/bundle/${slug}/play`)}`
    );
  }
}, [isLoggedIn, slug, router]);
```

Same pattern applied to:

- BundleResult → `returnUrl=/bundle/${slug}/result`
- CompareResult → `returnUrl=/compare/${token}/result`
- GroupResult → `returnUrl=/compare/${token}/group` (also added the missing auth guard)

**BundleIntro — inject returnUrl before calling requireLogin:**

```tsx
const handleStart = () => {
  if (!isLoggedIn) {
    const dest = bundle.completed ? `/bundle/${slug}/result` : `/bundle/${slug}/play`;
    const params = new URLSearchParams(window.location.search);
    params.set('returnUrl', dest);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    requireLogin('default');
    return;
  }
  // ...
};
```

This works because `LoginModal.handleKakaoLogin()` reads `returnUrl` from the current URL's query params:

```tsx
const returnUrl = urlParams.get('returnUrl') || window.location.pathname;
```

## Why This Works

The codebase already had a complete login-and-return pipeline:

1. `LoginQueryWatcher` detects `?login=true` → opens modal
2. `LoginModal` reads `returnUrl` from query string → encodes in Kakao OAuth state
3. Kakao callback preserves `returnUrl` → passes to signup page if new user
4. Signup completion calls `router.replace(returnUrl)`

The bug was that Bundle and Compare flows were built independently and never wired into this existing mechanism. The fix appends the two query params that the pipeline expects.

## Prevention

1. **Consider creating a shared `useAuthGuard(returnUrl: string)` hook** that encapsulates the redirect-with-login-trigger pattern, so each protected page calls one function instead of reimplementing the redirect logic.
2. **When adding new protected pages**, always check that the auth guard follows the `?login=true&returnUrl=` pattern — refer to MyPage as the reference implementation.
3. **The full returnUrl chain** must be verified end-to-end: page redirect → LoginModal → Kakao OAuth state → callback → signup → final destination. New user signup adds an extra hop that's easy to miss.

## Related Issues

- [modal-scroll-lock-and-zindex-stacking-context](../ui-bugs/modal-scroll-lock-and-zindex-stacking-context-2026-04-02.md) — Login modals in Bundle/Compare pages must use `createPortal` to escape BundleBackground's stacking context
- `docs/specs/2026-03-22-kakao-auth-design.md` — Original auth design spec that defines the `requireLogin()` + `returnUrl` pattern; GroupResult was missing from the login gating table
