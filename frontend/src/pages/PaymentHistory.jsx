import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [payments, setPayments] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
      return;
    }
    setToken(authToken);
    fetchHistory(authToken);

    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
    );
  }, [navigate]);

  const fetchHistory = (authToken) => {
    fetch('/api/payments/history', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then((res) => res.json().then((data) => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status !== 200) {
          throw new Error(body.message || 'Unable to load payment history.');
        }
        setPayments(body.payments || []);
      })
      .catch((err) => setErrorMessage(err.message));
  };

  if (!token) return null;

  return (
    <>
      <Preloader title="AURA / PAYMENTS" subtitle="HISTORY LOG" />
      <main className="min-h-screen px-8 md:px-24 py-24 max-w-7xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-3xl p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Payment Record</p>
              <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--heading-color)' }}>Your payment history.</h1>
              <p className="leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                Review every completed transaction, download invoices, and verify QR access for upcoming appointments.
              </p>
            </div>
            <button onClick={() => navigate('/profile')} className="rounded-full px-8 py-3 text-xs uppercase tracking-[0.2em] hover:border-accentCyan hover:text-accentCyan transition duration-300" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--icon-bg)', color: 'var(--text-color)' }}>
              Back to profile
            </button>
          </div>

          {errorMessage && <p className="text-rose-400 mt-6">{errorMessage}</p>}

          <div className="mt-8 space-y-6">
            {payments.length === 0 ? (
              <div className="rounded-3xl p-8 text-center" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)', color: 'var(--text-muted)' }}>
                No payment history yet. Complete a booking to see receipts here.
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.payment_id} className="glass-panel rounded-3xl p-6 grid gap-4 md:grid-cols-2" style={{ borderColor: 'var(--surface-border)' }}>
                  <div>
                    <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Invoice ID</p>
                    <p className="font-semibold mt-2" style={{ color: 'var(--heading-color)' }}>{payment.invoice_number}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Payment ID: {payment.payment_id}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Service</p>
                    <p className="font-semibold mt-2" style={{ color: 'var(--heading-color)' }}>{payment.service_name}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Status: {payment.status}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Amount</p>
                    <p className="font-semibold mt-2" style={{ color: 'var(--heading-color)' }}>${payment.amount.toFixed(2)}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Payment Method: {payment.payment_method}</p>
                  </div>
                  <div className="flex flex-col gap-3 justify-between">
                    <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Created</p>
                    <p className="font-semibold mt-2" style={{ color: 'var(--heading-color)' }}>{new Date(payment.created_at).toLocaleString()}</p>
                    <div className="mt-4">
                      <button
                        onClick={() => window.open(`/invoice?payment_id=${payment.payment_id}`, '_blank')}
                        className="rounded-full bg-accentCyan px-6 py-3 font-semibold uppercase tracking-[0.2em] hover:opacity-90 transition duration-300"
                        style={{ color: '#000' }}
                      >
                        Open Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
