const HINT_KEY = 'hp:orbit-hint-dismissed';

export function wasOrbitHintDismissed(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.localStorage.getItem(HINT_KEY) === '1';
}

export function dismissOrbitHint(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(HINT_KEY, '1');
}
