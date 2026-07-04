'use client';

import { useEffect, useState } from 'react';
import {
  SIDEBAR_TOGGLE_EVENT,
  getInitialOpenState,
  setStoredOpenState,
} from './sidebarState';

// Button that shows/hides the sidebar at every screen size (see
// `SidebarShell`, which actually owns the visibility). The two components
// are siblings in `layout.tsx`, so they coordinate via localStorage plus a
// custom window event rather than React context/state — this is a static
// export, so state also needs to survive full page navigations, which only
// localStorage does.
export function SidebarToggle() {
  // Matches `SidebarShell`'s SSR default (visible — the old desktop
  // behavior) so the initial label lines up with what's on screen before
  // `useEffect` corrects it for mobile/saved preferences.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(getInitialOpenState());
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    setStoredOpenState(next);
    window.dispatchEvent(new CustomEvent(SIDEBAR_TOGGLE_EVENT, { detail: next }));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? '사이드바 닫기' : '사이드바 열기'}
      aria-pressed={open}
      className="eyebrow rounded-full border border-ink-200 px-s-3 py-1 hover:border-blue-600 hover:text-blue-600"
    >
      {open ? '목록 닫기' : '목록 열기'}
    </button>
  );
}
