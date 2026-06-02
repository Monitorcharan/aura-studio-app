import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function Profile() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage('Login required. Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
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
      <Preloader title="AURA / PROFILE" subtitle="PERSONAL DASHBOARD" />
      <main className="min-h-screen px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-3xl p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Member Profile</p>
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--heading-color)' }}>Your account settings.</h1>
              <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Manage your profile, review payment history, and keep your contact details up to date.
              </p>
            </div>
            <div className="rounded-3xl p-6 max-w-sm" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <p className="uppercase tracking-[0.2em] text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>Role</p>
              <p className="font-semibold" style={{ color: 'var(--heading-color)' }}>{profile?.role || 'user'}</p>
              <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Use the member dashboard links to review appointments and payments.</p>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
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
      </main>
    </>
  );
}
