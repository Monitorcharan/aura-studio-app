import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const [cursorClass, setCursorClass] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let hasMoved = false;

    const onMouseMove = (e) => {
      if (!hasMoved) {
        setIsVisible(true);
        hasMoved = true;
      }
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.02,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      if (hasMoved) {
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const hoverables = 'a, button, select, input, textarea, .slot, [role="button"]';
    
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      if (target.closest(hoverables)) {
        setCursorClass('active');
        gsap.to(dot, { scale: 0.5, duration: 0.2 });
      } else if (target.closest('#canvas-container') || target.closest('.interactive-3d') || target.closest('#digital-twin-canvas')) {
        setCursorClass('drag-mode');
      } else if (target.closest('.tilt-card')) {
        setCursorClass('view-mode');
      }
    };

    const onMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      if (target.closest(hoverables)) {
        setCursorClass('');
        gsap.to(dot, { scale: 1, duration: 0.2 });
      }
      if (target.closest('#canvas-container') || target.closest('.interactive-3d') || target.closest('#digital-twin-canvas')) {
        setCursorClass('');
      }
      if (target.closest('.tilt-card')) {
        setCursorClass('');
      }
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className={`custom-cursor ${cursorClass}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      />
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{ opacity: isVisible ? 1 : 0 }}
      />
    </>
  );
}
