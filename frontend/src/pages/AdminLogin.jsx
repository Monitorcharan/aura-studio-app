import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', stagger: 0.15 }
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // send username as `email` to match backend field
      body: JSON.stringify({ email: username, password })
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Admin login failed.');
        }
        return data;
      })
      .then((data) => {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', data.role || 'admin');
        window.dispatchEvent(new Event('auth-change'));
        setSuccessMessage('Welcome, administrator. Routing to control panel...');
        setTimeout(() => {
          if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.role === 'stylist') {
          navigate('/stylist-dashboard');
        } else {
          navigate('/');
        }
        }, 1200);
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
      <Preloader title="AURA / ADMIN" subtitle="ENTER SECURE PORTAL" />
      <main className="min-h-screen flex items-center justify-center px-8 md:px-24 py-28 max-w-7xl mx-auto w-full relative">
        <div className="grid lg:grid-cols-12 items-center gap-12 w-full">
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-[45vh] text-left select-none pointer-events-none fade-in-up">
            <div className="text-accentPurple font-mono text-xs uppercase tracking-[0.3em]">Admin Portal</div>
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
                Control <br /> Access.
              </h1>
              <p className="font-light max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Authenticate using your admin credentials to manage services, appointments, and business analytics.
              </p>
            </div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>AURA / OPERATIONS</div>
          </div>

          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full fade-in-up">
            <div className="glass-panel rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative" style={{ borderColor: 'var(--surface-border)' }}>
              <div className="text-center lg:text-left mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-accentPurple text-lg mb-4" style={{ backgroundColor: 'var(--icon-bg)' }}>
                  🛡
                </div>
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>Admin Sign In</h2>
                <p className="text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>Separate credentials are required for the dashboard.</p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="username" className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentPurple/50 focus:ring-1 focus:ring-accentPurple/30 transition cursor-none"
                      style={inputStyle}
                    />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentPurple/50 focus:ring-1 focus:ring-accentPurple/30 transition cursor-none"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-accentPurple py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition duration-300 magnetic cursor-none"
                  style={{ color: '#ffffff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
                >
                  Enter Admin Portal
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
