'use client';

import { useEffect, useRef } from 'react';

export default function Starfield() {
  const animIdRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    const N = 180;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      d: Math.random(), ph: Math.random() * Math.PI * 2,
    }));

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', init);
    init();

    const draw = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      for (const s of stars) {
        s.ph += 0.01 + s.d * 0.015;
        const tw = 0.6 + 0.4 * Math.sin(s.ph);
        const r = 0.35 + s.d * 1.1;
        const o = 0.2 + s.d * 0.55 * tw;
        ctx.beginPath();
        ctx.fillStyle = `rgba(230,230,230,${o})`;
        ctx.arc(s.x * width, s.y * height, r, 0, Math.PI * 2);
        ctx.fill();
        s.y -= 0.00015 + s.d * 0.0002;
        if (s.y < 0) s.y = 1;
      }
      animIdRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', init);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  return <canvas id="network-canvas" />;
}
