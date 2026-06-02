import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentToken, setAppointmentToken] = useState('');
  const [amount, setAmount] = useState('0');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage('Authentication required. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    setToken(authToken);

    const query = new URLSearchParams(location.search);
    setAppointmentId(query.get('appointment_id') || '');
    setServiceName(query.get('service') || '');
    setAppointmentDate(query.get('date') || '');
    setAppointmentTime(query.get('time') || '');
    setAmount(query.get('amount') || '0');
    setAppointmentToken(query.get('token') || '');
  }, [location.search, navigate]);

  useEffect(() => {
    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
    );
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');

    if (!appointmentId) {
      setErrorMessage('Appointment ID missing.');
      return;
    }

    setStatusMessage('Processing secure payment simulation...');

    try {
      const orderRes = await fetch('/api/payments/simulate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ appointment_id: appointmentId })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to process payment');
      }

      setStatusMessage('Payment confirmed. Generating your invoice...');
      setTimeout(() => {
        navigate(`/invoice?payment_id=${orderData.payment_id}`);
      }, 900);
      
    } catch (err) {
      setErrorMessage(`Connection error: ${err.message}`);
      setStatusMessage('');
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  return (
    <>
      <Preloader title="AURA / PAYMENT" subtitle="SECURE TRANSACTION" />

      <main className="min-h-screen px-4 sm:px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-10">
            <div>
              <div className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Payment Authorization</div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--heading-color)' }}>Finish your booking with secure checkout.</h1>
              <p className="leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Confirm your appointment and open the invoice page with QR access. This system stores your receipt details and token for future verification.
              </p>

              <div className="grid gap-4 mb-8 text-sm">
                <div className="glass-panel rounded-2xl p-5" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-subtle)' }}>Appointment</p>
                  <p className="font-bold text-lg mt-1" style={{ color: 'var(--heading-color)' }}>{serviceName || 'Service selected'}</p>
                  <p className="mt-2" style={{ color: 'var(--text-muted)' }}>{appointmentDate} · {appointmentTime}</p>
                  {appointmentToken && (
                    <p className="mt-3 text-xs text-accentCyan uppercase tracking-[0.2em]">Token: {appointmentToken}</p>
                  )}
                </div>
                <div className="glass-panel rounded-2xl p-5" style={{ borderColor: 'var(--surface-border)' }}>
                  <p className="uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-subtle)' }}>Amount</p>
                  <p className="font-bold text-3xl mt-2" style={{ color: 'var(--heading-color)' }}>${parseFloat(amount || '0').toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handlePayment}
                  className="w-full rounded-full py-5 font-bold uppercase tracking-[0.2em] hover:opacity-90 transition duration-300 flex items-center justify-center gap-3"
                  style={{ backgroundColor: 'var(--accent-cyan)', color: '#000' }}
                >
                  Confirm Payment <span className="text-xl">💳</span>
                </button>
                <p className="text-center mt-4 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                  Simulated Payment Gateway
                </p>
              </div>

              {errorMessage && <p className="text-rose-400 mt-4">{errorMessage}</p>}
              {statusMessage && <p className="text-emerald-300 mt-4">{statusMessage}</p>}
            </div>

            <aside className="glass-panel rounded-3xl p-8" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <div className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-muted)' }}>Invoice helper</div>
              <p className="leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>
                After your payment clears, the invoice page will include a QR code with your appointment token and payment ID. Save it, print it, or scan it on arrival.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="rounded-3xl p-4" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)' }}>
                  <p className="uppercase tracking-[0.24em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Secure token</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--heading-color)' }}>{appointmentToken || 'Pending transaction'}</p>
                </div>
                <div className="rounded-3xl p-4" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)' }}>
                  <p className="uppercase tracking-[0.24em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Appointment ID</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--heading-color)' }}>{appointmentId || 'Loading...'}</p>
                </div>
              </div>

              <Link
                to="/booking"
                className="inline-flex items-center justify-center w-full rounded-full px-6 py-4 mt-10 text-xs uppercase tracking-[0.24em] font-semibold hover:border-accentCyan hover:text-accentCyan transition duration-300"
                style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
              >
                Back to Booking
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
