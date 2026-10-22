'use client';

// ============================================================
// GALAXY BACKGROUND
// Shows the moving 3D galaxy behind the page.
// If the device cannot draw 3D, the still galaxy picture
// (public/galaxy-bg.jpg) is shown instead.
// The galaxy drawing code lives in src/lib/galaxy.js
// ============================================================

import { useEffect, useRef, useState } from 'react';

export default function GalaxyBackground() {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop;
    let cancelled = false;

    // Load the 3D code only in the browser, after the page is shown,
    // so the login form appears quickly.
    import('@/lib/galaxy')
      .then(({ startGalaxy }) => {
        if (cancelled) return;
        stop = startGalaxy(canvasRef.current);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <>
      <div className={`galaxy-fallback${failed ? ' visible' : ''}`} aria-hidden="true" />
      <canvas ref={canvasRef} id="galaxy-canvas" aria-hidden="true" />
      <div className="cosmic-overlay" aria-hidden="true" />
    </>
  );
}
