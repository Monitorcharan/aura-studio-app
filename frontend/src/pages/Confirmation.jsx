import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function Confirmation() {
  const location = useLocation();
  const [apptDetails, setApptDetails] = useState({
    id: '',
    service: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    // Parse query params
    const query = new URLSearchParams(location.search);
    setApptDetails({
      id: query.get('id') || 'N/A',
      service: query.get('service') || 'N/A',
      date: query.get('date') || 'N/A',
      time: query.get('time') || 'N/A'
    });

    // Reveal animation
    gsap.fromTo('.fade-in-up', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
    );

    // Magnetic buttons
    const magneticBtns = document.querySelectorAll('.magnetic');
    magneticBtns.forEach((btn) => {
      const onMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      };
      const onMouseLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1.1, 0.4)',
          overwrite: 'auto'
        });
      };
      btn.addEventListener('mousemove', onMouseMove);
      btn.addEventListener('mouseleave', onMouseLeave);
      btn._cleanup = () => {
        btn.removeEventListener('mousemove', onMouseMove);
        btn.removeEventListener('mouseleave', onMouseLeave);
      };
    });

    return () => {
      magneticBtns.forEach(btn => btn._cleanup && btn._cleanup());
    };
  }, [location.search]);

  const detailBoxStyle = {
    backgroundColor: 'var(--surface-bg)',
    borderWidth: '1px',
    borderColor: 'var(--surface-border-subtle)'
  };

  return (
    <>
      <Preloader title="AURA / PROTOCOL" subtitle="TRANSACTION CONFIRMED" />

      <main className="min-h-screen flex items-center justify-center px-8 md:px-24 py-28 max-w-7xl mx-auto w-full relative">
        <section className="glass-panel rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl relative text-center fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          
          {/* Success Checkmark Indicator */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-accentCyan text-2xl mx-auto mb-6 shadow-[0_0_20px_rgba(0,240,255,0.15)] border border-accentCyan/20">
            ✓
          </div>
          
          <p className="text-accentCyan uppercase tracking-[0.24em] text-xs font-mono">Appointment Secured</p>
          <h1 className="text-4xl md:text-5xl font-bold font-display mt-4 mb-4" style={{ color: 'var(--heading-color)' }}>Your visit is locked in.</h1>
          <p className="text-sm font-light max-w-md mx-auto leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
            We have synchronized your details. The studio chair and your master stylist are scheduled for your arrival.
          </p>

          {/* Details Block */}
          <div className="glass-panel rounded-2xl p-6 text-left mb-8" style={{ borderColor: 'var(--surface-border)' }}>
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="rounded-xl p-4" style={detailBoxStyle}>
                <p className="uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Session Identifier</p>
                <p className="font-bold text-sm mt-1" style={{ color: 'var(--heading-color)' }}>{apptDetails.id}</p>
              </div>
              <div className="rounded-xl p-4" style={detailBoxStyle}>
                <p className="uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>System Status</p>
                <p className="text-accentCyan font-bold text-sm mt-1">Confirmed</p>
              </div>
              <div className="rounded-xl p-4" style={detailBoxStyle}>
                <p className="uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Stylist Session</p>
                <p className="font-bold text-sm mt-1" style={{ color: 'var(--heading-color)' }}>{apptDetails.service}</p>
              </div>
              <div className="rounded-xl p-4" style={detailBoxStyle}>
                <p className="uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Timeline</p>
                <p className="font-bold text-sm mt-1" style={{ color: 'var(--heading-color)' }}>{apptDetails.time}</p>
              </div>
            </div>
            <div className="rounded-xl p-4 mt-4 text-xs font-mono" style={detailBoxStyle}>
              <p className="uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Target Date</p>
              <p className="font-bold text-sm mt-1" style={{ color: 'var(--heading-color)' }}>{apptDetails.date}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 text-center py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition duration-300 magnetic cursor-none"
              style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
            >
              Return Home
            </Link>
            <Link
              to="/booking"
              className="flex-1 text-center py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 magnetic cursor-none"
              style={{ backgroundColor: 'var(--surface-bg)', borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
            >
              Schedule Another
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
