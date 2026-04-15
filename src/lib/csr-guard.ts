let hydrated = false;

export function markHydrated() {
  hydrated = true;
}

export function isCSRNavigation() {
  return hydrated;
}
