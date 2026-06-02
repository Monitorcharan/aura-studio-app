import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Reveal animations
    gsap.fromTo('.fade-in-up', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out' }
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
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, password })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration rejected. Profile may exist.');
      }
      return data;
    })
    .then((data) => {
      if (data.user_id) {
        setSuccessMessage('Account registered! Diverting to login gateway...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Registration rejected. Profile may exist.');
      }
    })
    .catch((error) => {
      setErrorMessage(error.message || 'Connection error.');
    });
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  return (
    <>
      <Preloader title="AURA / CREATE" subtitle="SECURE REGISTRATION" />

      <main className="min-h-screen flex items-center justify-center px-8 md:px-24 py-28 max-w-7xl mx-auto w-full relative">
        <div className="grid lg:grid-cols-12 items-center gap-12 w-full">
          {/* Left Side: Brutalist Branding */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-[52vh] text-left select-none pointer-events-none fade-in-up">
            <div className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em]">Registration</div>
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
                Create <br /> Account.
              </h1>
              <p className="font-light max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Establish your digital footprint to schedule precision styling, curate preferences, and earn session tokens.
              </p>
            </div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>AURA / OPERATIONS DEPT.</div>
          </div>

          {/* Right Side: Glassmorphic Registration Form */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full fade-in-up">
            <div className="glass-panel rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative" style={{ borderColor: 'var(--surface-border)' }}>
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-accentCyan text-lg mb-4" style={{ backgroundColor: 'var(--icon-bg)' }}>
                  👤
                </div>
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>Occupant Enlistment</h2>
                <p className="text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>Register credentials to activate profile.</p>
              </div>

              {/* Alerts */}
              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 text-sm mb-4 font-light">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-4 text-sm mb-4 font-light">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition duration-300 magnetic cursor-none"
                  style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                >
                  Register Account
                </button>
              </form>

              <div className="mt-6 text-center text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>
                Occupying key?{' '}
                <Link to="/login" className="text-accentCyan font-bold hover:opacity-80 transition cursor-none">
                  Login here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
