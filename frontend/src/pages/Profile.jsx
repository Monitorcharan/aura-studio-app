import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';
import AuthToast from '../components/AuthToast';

export default function Profile() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAuthToast, setShowAuthToast] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setShowAuthToast(true);
      return;
    }
    setToken(authToken);
    fetchProfile(authToken);

    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
    );
  }, [navigate]);

  const fetchProfile = (authToken) => {
    fetch('/api/profile', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then((res) => res.json().then((data) => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status !== 200) {
          throw new Error(body.message || 'Unable to load profile.');
        }
        setProfile(body);
        setName(body.name || '');
        setPhone(body.phone || '');
      })
      .catch((err) => setErrorMessage(err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone })
    })
      .then((res) => res.json().then((data) => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status !== 200) {
          throw new Error(body.message || 'Update failed.');
        }
        setProfile(body);
        localStorage.setItem('userName', body.name);
        setSuccessMessage('Profile updated successfully.');
      })
      .catch((err) => setErrorMessage(err.message));
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  return (
    <>
      <AuthToast show={showAuthToast} message="Login required to view your profile dashboard." onClose={() => setShowAuthToast(false)} />
      <Preloader title="AURA / PROFILE" subtitle="PERSONAL DASHBOARD" />
      <main className="min-h-screen px-4 sm:px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Client Dashboard</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
                Welcome, {profile?.name ? profile.name.split(' ')[0] : 'Guest'}.
              </h1>
              <p className="leading-relaxed text-lg" style={{ color: 'var(--text-muted)' }}>
                Your personal portal. Manage your upcoming bookings, review styling history, and upgrade your access.
              </p>
            </div>
            <div className="rounded-3xl p-6 max-w-sm flex flex-col justify-center w-full" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="uppercase tracking-[0.2em] text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <p className="font-semibold" style={{ color: 'var(--heading-color)' }}>
                    {profile?.membership_tier === 'elite' ? 'Aura Elite VIP' : 'Standard Member'}
                  </p>
                </div>
                {profile?.membership_tier === 'elite' && (
                  <span className="text-2xl text-yellow-400">👑</span>
                )}
              </div>
              {profile?.membership_tier !== 'elite' ? (
                <button onClick={() => navigate('/elite')} className="w-full text-xs font-bold uppercase tracking-widest py-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(250,204,21,0.2)] mt-2 hover:opacity-90 transition">
                  Upgrade to Elite
                </button>
              ) : (
                <p className="text-xs font-mono text-emerald-400">Active until: {new Date(profile.membership_expires_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass-panel rounded-3xl p-8" style={{ borderColor: 'var(--surface-border)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--heading-color)' }}>Profile Details</h2>
              {errorMessage && <p className="text-rose-400 mb-4">{errorMessage}</p>}
              {successMessage && <p className="text-emerald-300 mb-4">{successMessage}</p>}

              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-3xl px-4 py-3 outline-none focus:border-accentCyan"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full rounded-3xl px-4 py-3 outline-none cursor-not-allowed"
                    style={{ backgroundColor: 'var(--icon-bg)', borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.24em] mb-2" style={{ color: 'var(--text-muted)' }}>Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-3xl px-4 py-3 outline-none focus:border-accentCyan"
                    style={inputStyle}
                  />
                </div>
                <button type="submit" className="w-full rounded-full bg-accentCyan py-4 font-bold uppercase tracking-[0.2em] hover:opacity-90 transition duration-300" style={{ color: '#000' }}>
                  Save Changes
                </button>
              </form>
            </div>

            <div className="glass-panel rounded-3xl p-8" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--heading-color)' }}>Quick Actions</h2>
              <div className="space-y-4">
                <button onClick={() => navigate('/payment-history')} className="w-full rounded-3xl py-4 text-sm uppercase tracking-[0.2em] hover:border-accentCyan transition duration-300" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--icon-bg)', color: 'var(--text-color)' }}>
                  View Payment History
                </button>
                <button onClick={() => navigate('/booking')} className="w-full rounded-3xl py-4 text-sm uppercase tracking-[0.2em] hover:border-accentCyan transition duration-300" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--icon-bg)', color: 'var(--text-color)' }}>
                  Book Another Appointment
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Available Services Section (Dashboard View) */}
        <section className="mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em] mb-3">
                Quick Booking
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>Our Services</h2>
            </div>
            <button onClick={() => navigate('/booking')} className="glass-panel text-xs hover:opacity-90 transition duration-300 inline-flex items-center gap-3 w-max px-6 py-3 rounded-full font-bold uppercase tracking-wider" style={{ color: 'var(--heading-color)', borderColor: 'var(--surface-border)' }}>
              Book Appointment <span className="text-accentCyan font-semibold">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div onClick={() => navigate('/booking')} className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>✂️</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>01</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Precision Cut</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Bespoke surgical-precision haircut tailored to your head structure.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>45m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$65+</span>
              </div>
            </div>

            {/* Card 2 */}
            <div onClick={() => navigate('/booking')} className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>🎨</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>02</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Color & Tone</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  From micro highlights to futuristic metallic chromatic dye.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>90m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$120+</span>
              </div>
            </div>

            {/* Card 3 */}
            <div onClick={() => navigate('/booking')} className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>🌿</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>03</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Scalp Spa</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Hydro-massage, dynamic scalp treatment, and deep conditioning.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>60m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$85+</span>
              </div>
            </div>

            {/* Card 4 */}
            <div onClick={() => navigate('/booking')} className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>✨</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>04</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Event Styling</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Red carpet ready, high fashion shoot blowouts, or master styling sessions.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>60m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$95+</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
