import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

export default function Preloader({ title = 'AURA / LABS', subtitle = 'SYSTEM INITIALIZING' }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const progressVal = { value: 0 };
    gsap.to(progressVal, {
      value: 100,
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => {
        setProgress(Math.round(progressVal.value));
      },
      onComplete: () => {
        // Zoom WebGL Centerpiece camera in if loaded
        if (window.AuraWebGL && window.AuraWebGL.cameraZoomIn) {
          window.AuraWebGL.cameraZoomIn();
        }

        const preloader = document.getElementById('preloader');
        if (preloader) {
          gsap.to(preloader, {
            yPercent: -100,
            duration: 1.2,
            ease: 'power4.inOut',
            onComplete: () => {
              preloader.style.display = 'none';
              setIsDone(true);
              
              // Trigger text reveals on the page
              document.dispatchEvent(new Event('aura-preloader-complete'));
            },
          });
        }
      },
    });
  }, []);

  if (isDone) return null;

  return (
    <div
      id="preloader"
      className="fixed inset-0 z-[99999] flex flex-col justify-between p-10 font-sans select-none"
      style={{ backgroundColor: 'var(--preloader-bg)' }}
    >
      <div className="flex justify-between items-start">
        <div className="text-xs uppercase tracking-[0.22em] font-mono" style={{ color: 'var(--preloader-text)', opacity: 0.4 }}>{title}</div>
        <div className="text-xs uppercase tracking-[0.22em] font-mono" style={{ color: 'var(--preloader-text)', opacity: 0.4 }}>{subtitle}</div>
      </div>
      <div className="my-auto">
        <div className="text-[12vw] font-bold tracking-tighter leading-none flex items-baseline font-display" style={{ color: 'var(--preloader-text)' }}>
          <span id="loader-progress">{progress.toString().padStart(3, '0')}</span>
          <span className="text-2xl tracking-normal text-accentCyan ml-4 font-mono">%</span>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div className="text-xs font-mono" style={{ color: 'var(--preloader-text)', opacity: 0.4 }}>EST. 2026</div>
        <div className="text-xs font-mono font-semibold tracking-wider text-accentCyan">CREATIVE STUDIO FOREVER</div>
      </div>
    </div>
  );
}
