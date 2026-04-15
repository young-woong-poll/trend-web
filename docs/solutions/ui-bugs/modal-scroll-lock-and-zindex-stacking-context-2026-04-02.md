---
title: Modal scroll lock and z-index fail inside BundleBackground stacking context
date: 2026-04-02
category: ui-bugs
module: Compare
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - Modal overlay does not block background scrolling on mobile
  - MainHeader (z-index 1021) renders above the modal overlay
  - Modal appears trapped behind parent elements despite high z-index
root_cause: scope_issue
resolution_type: code_fix
severity: medium
tags:
  - modal
  - scroll-lock
  - z-index
  - stacking-context
  - react-portal
  - bundlebackground
  - ios-scroll
---

# Modal scroll lock and z-index fail inside BundleBackground stacking context

## Problem

The CreateCompareLink modal rendered inside `<BundleBackground>` failed to lock background scrolling and appeared behind the MainHeader. Users could scroll the page behind the modal and the header overlapped the dimmed overlay.

## Symptoms

- Background page scrolls freely when modal is open (especially on iOS)
- MainHeader (z-index: 1021) appears above the modal overlay (z-index: 1050)
- Modal dimmed overlay does not cover the full viewport visually

## What Didn't Work

- **`document.body.style.overflow = 'hidden'`**: Insufficient on iOS Safari where body overflow hidden is ignored when inner elements have their own scroll
- **Increasing z-index on the overlay**: Did not help because `BundleBackground` creates a new stacking context via `backdrop-filter: blur()` and `overflow: hidden`, trapping all child z-index values within it

## Solution

Two changes were required:

### 1. React Portal to escape stacking context

Render the modal via `createPortal` directly into `document.body`, breaking out of BundleBackground's stacking context entirely:

```tsx
// Before — trapped in BundleBackground stacking context
return (
  <div className={styles.overlay}>
    <div className={styles.modal}>...</div>
  </div>
);

// After — portal to document.body
return createPortal(
  <div className={styles.overlay}>
    <div className={styles.modal}>...</div>
  </div>,
  document.body
);
```

### 2. Position-fixed scroll lock for iOS

Replace simple `overflow: hidden` with the position-fixed pattern that works on iOS:

```tsx
useEffect(() => {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  };
}, []);
```

## Why This Works

**Stacking context**: CSS properties like `backdrop-filter`, `transform`, `filter`, and `will-change` create new stacking contexts. Any descendant's z-index is scoped within that context, regardless of value. `createPortal` renders the element outside the React tree's DOM position, placing it directly in `<body>` where it competes at the root stacking context level.

**iOS scroll lock**: iOS Safari ignores `overflow: hidden` on `<body>` when the page has already been scrolled. The `position: fixed` approach physically prevents the body from scrolling by fixing it in place, while preserving the visual scroll position via negative `top`.

## Prevention

- **Rule**: Any modal, overlay, or full-screen sheet in this project must use `createPortal(el, document.body)` — never render inline within components that have `backdrop-filter`, `overflow: hidden`, or `transform`
- **Rule**: Use the `position: fixed` scroll lock pattern (not just `overflow: hidden`) for iOS compatibility
- **Affected components**: `CreateCompareLink`, `PersonDetailSheet` — both already fixed

## Related Issues

- `BundleBackground` component uses `overflow: hidden` + floating orbs with `backdrop-filter` creating multiple stacking contexts
- `MainHeader` uses `position: fixed` with `z-index: $z-index-sticky + 1` (1021)
- Same pattern applies to any future bottom sheet or modal in the app
