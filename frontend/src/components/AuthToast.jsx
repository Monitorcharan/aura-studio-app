import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthToast({ message = 'Login required to access this feature.', show = false, onClose }) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Trigger entrance animation
      requestAnimationFrame(() => setAnimating(true));

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        setAnimating(false);
        setTimeout(() => {
          setVisible(false);
          if (onClose) onClose();
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const handleDismiss = () => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed top-24 right-4 sm:right-6 z-[100001] max-w-sm w-full transition-all duration-400 ${
        animating
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-12'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="glass-panel rounded-2xl p-5 shadow-2xl border"
        style={{
          borderColor: 'rgba(0, 240, 255, 0.25)',
          background: 'linear-gradient(135deg, rgba(0,240,255,0.08) 0%, rgba(18,18,22,0.95) 100%)',
          backdropFilter: 'blur(24px) saturate(200%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 255, 0.08)'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.2)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C9.24 2 7 4.24 7 7V10H5C3.9 10 3 10.9 3 12V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V12C21 10.9 20.1 10 19 10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4ZM12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14Z" fill="#00F0FF"/>
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--accent-cyan, #00F0FF)' }}>
              Authentication Required
            </p>
            <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-color, #F5F5F5)' }}>
              {message}
            </p>
            <div className="flex gap-3 mt-3">
              <Link
                to="/login"
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                style={{
                  backgroundColor: 'var(--accent-cyan, #00F0FF)',
                  color: '#000'
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition duration-300"
                style={{
                  border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                  color: 'var(--text-muted, #9ca3af)'
                }}
              >
                Register
              </Link>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ color: 'var(--text-subtle, #6b7280)' }}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-[2px] w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: 'var(--accent-cyan, #00F0FF)',
              animation: 'auth-toast-progress 5s linear forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes auth-toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
