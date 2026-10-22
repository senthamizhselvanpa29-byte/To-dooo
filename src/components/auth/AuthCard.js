'use client';

// ============================================================
// THE BOX (CARD) around each account form, with the logo on top.
// On computers it tilts gently towards the mouse (3D effect).
// ============================================================

import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function AuthCard({ children }) {
  const cardRef = useRef(null);

  // ----- 3D tilt effect (computers only) -----
  useEffect(() => {
    const card = cardRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!card || reduceMotion) return;

    const onMove = (e) => {
      if (window.innerWidth <= 1024) {
        card.style.transform = '';
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      card.style.transform = `perspective(1000px) rotateX(${(-y * 5.5).toFixed(2)}deg) rotateY(${(x * 5.5).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      card.style.transform = '';
    };

    window.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={cardRef} className="login-card">
      <div className="logo-wrapper">
        <div className="logo-badge-container">
          <Image src="/logo.png" alt="VdoU" width={1024} height={921} className="vdou-card-logo" priority />
        </div>
      </div>
      {children}
    </div>
  );
}
