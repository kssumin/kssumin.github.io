// Shared constants/helpers for coordinating the sidebar's open/closed state
// between `SidebarToggle` (the button, in the top utility row) and
// `SidebarShell` (the client wrapper around the server-rendered `<Sidebar />`
// that actually shows/hides it). The two are siblings in `layout.tsx`, not
// parent/child, so state is synced via localStorage + a custom window event
// rather than React context — this is also a fully static export, so every
// page load is a fresh document and there's no long-lived provider that
// could hold this in memory across navigations anyway.

export const SIDEBAR_STORAGE_KEY = 'sidebar-open';
export const SIDEBAR_TOGGLE_EVENT = 'sidebar-toggle';

// Desktop-sized viewports default to an open sidebar; narrower viewports
// default to closed. Mirrors the `md` (768px) breakpoint the sidebar used
// to hide behind entirely.
export function getDefaultOpenState(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(min-width: 768px)').matches;
}

// Returns the explicit saved preference, or `null` if the user hasn't
// toggled the sidebar yet (i.e. nothing to override the CSS default with).
export function getStoredOpenState(): boolean | null {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  } catch {
    // localStorage unavailable (e.g. private mode) — treat as "no preference"
    return null;
  }
}

export function getInitialOpenState(): boolean {
  const stored = getStoredOpenState();
  return stored !== null ? stored : getDefaultOpenState();
}

export function setStoredOpenState(open: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
  } catch {
    // localStorage unavailable — the choice just won't persist across visits
  }
}
