import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function AuraElite() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isElite, setIsElite] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
      return;
    }
    setToken(authToken);

    const tier = localStorage.getItem('membership_tier');
    if (tier === 'elite') {
      setIsElite(true);
    }

    gsap.fromTo('.fade-in-up',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
    );
  }, [navigate]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (isElite) return;
    setStatusMessage('');
    setErrorMessage('');

    setStatusMessage('Initializing secure gateway...');
    const res = await loadRazorpay();
    if (!res) {
      setErrorMessage('Failed to load Razorpay SDK. Check your connection.');
      setStatusMessage('');
      return;
    }

    try {
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      setStatusMessage('Waiting for payment confirmation...');

      const options = {
        key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aura Studio",
        description: `Aura Elite - 30 Day Access`,
        order_id: orderData.order_id,
        theme: {
          color: "#D4AF37" // Gold theme for Elite
        },
        handler: async function (response) {
          setStatusMessage('Verifying subscription...');
          try {
            const verifyRes = await fetch('/api/membership/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
              setStatusMessage('Welcome to Aura Elite!');
              setIsElite(true);
              localStorage.setItem('membership_tier', 'elite');
              // trigger navbar update if we listen to storage, or just simple dispatch
              window.dispatchEvent(new Event('auth-change')); 
              setTimeout(() => {
                navigate('/profile');
              }, 1500);
            } else {
              setErrorMessage(verifyData.message || 'Subscription verification failed.');
              setStatusMessage('');
            }
          } catch (err) {
            setErrorMessage('Network error during verification.');
            setStatusMessage('');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setErrorMessage(response.error.description || 'Payment failed');
        setStatusMessage('');
      });
      rzp.open();
      
    } catch (err) {
      setErrorMessage(`Connection error: ${err.message}`);
      setStatusMessage('');
    }
  };

  return (
    <>
      <Preloader title="AURA / ELITE" subtitle="VIP MEMBERSHIP" />

      <main className="min-h-screen px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        <section className="glass-panel rounded-3xl p-10 shadow-2xl fade-in-up border" style={{ borderColor: 'var(--surface-border)' }}>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10">
            <div>
              <div className="text-yellow-400 uppercase tracking-[0.3em] text-xs font-mono mb-4">Aura Elite Tier</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
                Elevate your style. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Join the Elite.</span>
              </h1>
              <p className="leading-relaxed mb-8 text-lg font-light" style={{ color: 'var(--text-muted)' }}>
                Unlock a world of unparalleled luxury. Aura Elite members enjoy exclusive perks designed to keep you looking your absolute best, every single day.
              </p>

              <div className="grid gap-6 mb-10">
                <div className="flex gap-4 items-start fade-in-up">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0 border border-yellow-400/30">
                    <span className="text-yellow-400">✨</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--heading-color)' }}>20% Off Everything</h3>
                    <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>Automatic 20% discount applied instantly to every service booking.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start fade-in-up">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0 border border-yellow-400/30">
                    <span className="text-yellow-400">👑</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--heading-color)' }}>Priority Queue</h3>
                    <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>Jump to the front of the line. Your appointments are prioritized by our master stylists.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start fade-in-up">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0 border border-yellow-400/30">
                    <span className="text-yellow-400">📸</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--heading-color)' }}>Lookbook Access</h3>
                    <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>Complimentary styling recommendations from our digital Lookbook system.</p>
                  </div>
                </div>
              </div>

            </div>

            <aside className="glass-panel rounded-3xl p-8 border flex flex-col justify-between fade-in-up" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>30-Day Pass</span>
                  {isElite && <span className="bg-yellow-400/20 text-yellow-400 text-[10px] uppercase px-3 py-1 rounded-full tracking-widest border border-yellow-400/50">Active</span>}
                </div>
                
                <div className="mb-8">
                  <span className="text-5xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>$49</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}> / month</span>
                </div>

                <ul className="space-y-3 text-sm font-mono mb-10" style={{ color: 'var(--text-subtle)' }}>
                  <li className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--surface-border)' }}><span>Access</span> <span className="text-white">30 Days</span></li>
                  <li className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--surface-border)' }}><span>Renewal</span> <span className="text-white">Manual</span></li>
                  <li className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--surface-border)' }}><span>Cancel</span> <span className="text-white">Anytime</span></li>
                </ul>
              </div>

              <div>
                {isElite ? (
                  <button
                    disabled
                    className="w-full rounded-full py-5 font-bold uppercase tracking-[0.2em] transition duration-300 border border-yellow-500/50 text-yellow-500 bg-yellow-500/10 cursor-not-allowed"
                  >
                    Membership Active
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className="w-full rounded-full py-5 font-bold uppercase tracking-[0.2em] hover:opacity-90 transition duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                  >
                    Join Aura Elite
                  </button>
                )}
                
                {errorMessage && <p className="text-rose-400 mt-4 text-center text-sm">{errorMessage}</p>}
                {statusMessage && <p className="text-emerald-300 mt-4 text-center text-sm">{statusMessage}</p>}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
