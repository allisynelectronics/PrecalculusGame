import { useState } from 'react';
import { saveRecoveryNotice } from '../store/gameStore';

/** Shown once, if the save in localStorage couldn't be loaded and had to be reset —
 *  see `saveRecoveryNotice` in gameStore.ts for why this can happen. Captured in
 *  useState's initializer so it reflects the value at module-load time (before this
 *  component could possibly re-render) rather than re-reading a now-cleared module
 *  variable on a later render. */
export function SaveRecoveryBanner() {
  const [notice, setNotice] = useState(() => saveRecoveryNotice);
  if (!notice) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/95 border-b border-amber-400/50 text-amber-100 text-sm px-4 py-2 flex items-center justify-between gap-4">
      <span>⚠️ {notice}</span>
      <button
        onClick={() => setNotice(null)}
        className="shrink-0 px-2 py-1 rounded border border-amber-400/40 hover:bg-amber-500/20"
      >
        Dismiss
      </button>
    </div>
  );
}
