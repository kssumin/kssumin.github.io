'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { SIDEBAR_TOGGLE_EVENT, getStoredOpenState } from './sidebarState';

// Client wrapper around the server-rendered `<Sidebar />`. `Sidebar` itself
// stays a server component (it reads posts from the filesystem at build
// time) — its markup is passed in here as `children` and only its
// *visibility* is toggled, so the sidebar's links remain present in the
// static HTML for crawlers/no-JS users even when visually hidden.
//
// The base className below reproduces the *old* always-responsive behavior
// (hidden below `md`, visible at `md` and up), so a first-time visitor with
// no saved preference gets the exact same SSR output as before this
// change — no flash. Only once a preference has been explicitly saved to
// localStorage does this component override that CSS default, via an
// inline `display` style applied after mount (a brief, non-critical flash
// for returning users who already customized the setting — see report).
export function SidebarShell({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    setOverride(getStoredOpenState());

    function handleToggle(event: Event) {
      setOverride((event as CustomEvent<boolean>).detail);
    }

    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);
  }, []);

  // No explicit preference yet: fall back to the responsive CSS default
  // (hidden < md, block >= md) via className only, no inline style.
  const style: CSSProperties | undefined =
    override === null ? undefined : { display: override ? 'block' : 'none' };

  return (
    <aside
      className="hidden md:block md:w-64 md:shrink-0 md:sticky md:top-s-9"
      style={style}
    >
      {children}
    </aside>
  );
}
