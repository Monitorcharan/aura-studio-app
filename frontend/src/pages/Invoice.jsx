import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import gsap from 'gsap';
import Preloader from '../components/Preloader';
import AuthToast from '../components/AuthToast';

export default function Invoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAuthToast, setShowAuthToast] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setShowAuthToast(true);
      return;
    }
    setToken(authToken);

    const query = new URLSearchParams(location.search);
    const paymentIdQuery = query.get('payment_id') || '';
    setPaymentId(paymentIdQuery);
    if (!paymentIdQuery) {
      setErrorMessage('Invoice ID missing.');
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!paymentId || !token) return;

    fetch(`/api/payments/${paymentId}/invoice`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json().then((data) => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          setInvoice(body);
        } else {
          setErrorMessage(body.message || 'Unable to load invoice.');
        }
      })
      .catch((err) => setErrorMessage(`Connection error: ${err.message}`));
  }, [paymentId, token]);

  useEffect(() => {
    if (!invoice || !invoice.qr_payload) return;
    QRCode.toDataURL(invoice.qr_payload)
      .then((url) => setQrUrl(url))
      .catch(() => setErrorMessage('Failed to generate QR code.'));
  }, [invoice]);

  useEffect(() => {
    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
    );
  }, []);

  const downloadInvoice = () => {
    window.print();
  };

  return (
    <>
      <AuthToast show={showAuthToast} message="Login required to view invoices." onClose={() => setShowAuthToast(false)} />
      <Preloader title="AURA / INVOICE" subtitle="TRANSACTION RECORD" />

      <main className="min-h-screen px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-3xl p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10">
            <div>
              <div className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Invoice ready</div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--heading-color)' }}>Your booking receipt is live.</h1>
              <p className="leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                Scan the QR code or download the invoice for your records. It includes appointment token, payment ID, and service details.
              </p>

              {errorMessage && <p className="text-rose-400 mb-6">{errorMessage}</p>}

              {invoice ? (
                <div className="space-y-5">
                  <div className="glass-panel rounded-3xl p-6" style={{ borderColor: 'var(--surface-border)' }}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-subtle)' }}>Invoice</p>
                        <p className="font-semibold mt-2" style={{ color: 'var(--heading-color)' }}>{invoice.invoice_number}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-subtle)' }}>Status</p>
                        <p className="text-accentCyan font-semibold mt-2">{invoice.payment_status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl p-6 grid gap-4 md:grid-cols-2" style={{ backgroundColor: 'var(--surface-bg)', borderWidth: '1px', borderColor: 'var(--surface-border)' }}>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-muted)' }}>Customer</p>
                      <p className="font-bold" style={{ color: 'var(--heading-color)' }}>{invoice.user_name}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{invoice.user_email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-muted)' }}>Appointment</p>
                      <p className="font-bold" style={{ color: 'var(--heading-color)' }}>{invoice.appointment_date} · {invoice.appointment_time}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>ID: {invoice.appointment_id}</p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-6" style={{ borderColor: 'var(--surface-border)' }}>
                    <p className="uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>Service</p>
                    <p className="font-bold text-lg" style={{ color: 'var(--heading-color)' }}>{invoice.service_name}</p>
                    <p className="mt-2" style={{ color: 'var(--text-muted)' }}>{invoice.payment_method.toUpperCase()}</p>
                    {invoice.provider && (
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Gateway: {invoice.provider}</p>
                    )}
                    {invoice.last4 && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Card: **** **** **** {invoice.last4}</p>
                    )}
                  </div>

                  <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: 'var(--surface-border)' }}>
                    <div>
                      <p className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Amount Paid</p>
                      <p className="font-bold text-3xl mt-2" style={{ color: 'var(--heading-color)' }}>${invoice.service_price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={downloadInvoice}
                      className="rounded-full px-8 py-4 font-bold uppercase tracking-[0.2em] hover:opacity-90 transition duration-300"
                      style={{ backgroundColor: 'var(--accent-cyan)', color: '#000' }}
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Loading invoice details...</p>
              )}
            </div>

            <aside className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center gap-6 text-center" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              {qrUrl ? (
                <img src={qrUrl} alt="Appointment QR Code" className="w-64 h-64 rounded-3xl p-4" style={{ backgroundColor: 'var(--surface-bg)' }} />
              ) : (
                <div className="w-64 h-64 rounded-3xl flex items-center justify-center" style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)', color: 'var(--text-subtle)' }}>QR loading</div>
              )}

              <div className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                Scan to verify appointment token and payment ID instantly.
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full px-7 py-3 text-xs uppercase tracking-[0.24em] hover:border-accentCyan hover:text-accentCyan transition duration-300"
                style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
              >
                Return home
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
