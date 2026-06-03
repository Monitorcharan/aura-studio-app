import React, { useEffect, useState, useRef } from 'react';
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
  const [errorMessage, setErrorMessage] = useState('');

  // Interactive Card Form States
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // Gateway Simulation States
  // Stages: 'form' | 'processing' | 'success' | 'error'
  const [payStage, setPayStage] = useState('form');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('Initiating secure gateway...');
  const progressTimerRef = useRef(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
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
    if (payStage === 'form') {
      gsap.fromTo('.fade-in-up',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }
      );
    }
  }, [payStage]);

  // Card Formatting Helpers
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) {
        formatted += '/' + value.substring(2, 4);
      }
    }
    setCardExpiry(formatted.substring(0, 5));
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    setCardCvv(value.substring(0, 4));
  };

  const triggerPaymentSimulation = async () => {
    if (!appointmentId) {
      setErrorMessage('Appointment ID missing.');
      setPayStage('form');
      return;
    }

    setPayStage('processing');
    setProcessingProgress(0);
    setProcessingStatus('Decrypting card payloads...');

    let progress = 0;
    let paymentIdResult = '';
    let apiCompleted = false;
    let apiError = '';

    // Start progress counter animation
    progressTimerRef.current = setInterval(async () => {
      progress += Math.floor(Math.random() * 5) + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressTimerRef.current);
        
        if (apiError) {
          setErrorMessage(apiError);
          setPayStage('error');
        } else if (paymentIdResult) {
          setPayStage('success');
          // Pulse the success screen and redirect
          setTimeout(() => {
            navigate(`/invoice?payment_id=${paymentIdResult}`);
          }, 2600);
        } else {
          // Await API completion if it lags
          setProcessingStatus('Waiting for blockchain confirmation...');
        }
      }

      setProcessingProgress(progress);

      // Update status copy at stages
      if (progress < 25) {
        setProcessingStatus('Decrypting card payloads...');
      } else if (progress >= 25 && progress < 50) {
        setProcessingStatus('Routing through secure tokens...');
        
        // Trigger API fetch once when progress reaches 30%
        if (!apiCompleted && progress > 32) {
          apiCompleted = true;
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
              throw new Error(orderData.message || 'Verification rejected');
            }
            paymentIdResult = orderData.payment_id;
          } catch (err) {
            apiError = err.message;
          }
        }
      } else if (progress >= 50 && progress < 80) {
        setProcessingStatus('Confirming block reservation on MongoDB...');
      } else {
        setProcessingStatus('Signing receipt and generating QR payload...');
      }
    }, 120);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    triggerPaymentSimulation();
  };

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  if (!token) return null;

  return (
    <>
      <Preloader title="AURA / GATEWAY" subtitle="SECURE NODE ACTIVE" />

      {/* Embedded styles for 3D card layout and checkmark drawing animations */}
      <style>{`
        .credit-card-container {
          perspective: 1000px;
          width: 100%;
          max-width: 380px;
          height: 220px;
          margin: 0 auto 2rem auto;
        }
        .credit-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .credit-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .credit-card-front, .credit-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 20px;
          border: 1px solid var(--surface-border);
          background: linear-gradient(135deg, rgba(20,20,30,0.85) 0%, rgba(10,10,15,0.95) 100%);
          backdrop-filter: blur(20px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .credit-card-back {
          transform: rotateY(180deg);
          padding: 24px 0;
          justify-content: flex-start;
          gap: 1.5rem;
        }
        .chip {
          width: 48px;
          height: 36px;
          background: linear-gradient(135deg, #fce0ad 0%, #dfac6c 100%);
          border-radius: 6px;
          position: relative;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        .chip::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 6px;
          margin: 4px;
        }
        .glow-accent-dot {
          width: 12px;
          height: 12px;
          border-radius: 55px;
          background-color: var(--accent-cyan);
          box-shadow: 0 0 12px var(--accent-cyan);
        }
        .success-checkmark-wrapper {
          width: 100px;
          height: 100px;
          margin: 0 auto 2rem auto;
          position: relative;
        }
        .success-circle {
          stroke-dasharray: 315;
          stroke-dashoffset: 315;
          stroke-width: 4;
          stroke: #10b981;
          fill: none;
          animation: draw-circle 0.8s ease-out forwards;
        }
        .success-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          stroke-width: 5;
          stroke: #10b981;
          stroke-linecap: round;
          fill: none;
          animation: draw-check 0.5s 0.6s ease-out forwards;
        }
        @keyframes draw-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <main className="min-h-screen px-4 sm:px-8 md:px-24 py-24 max-w-6xl mx-auto relative z-10" style={{ color: 'var(--text-color)' }}>
        
        {/* PAYMENT STAGE: FORM ENTRY */}
        {payStage === 'form' && (
          <section className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl fade-in-up" style={{ borderColor: 'var(--surface-border)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-10">
              
              <div>
                <div className="text-accentCyan uppercase tracking-[0.3em] text-xs font-mono mb-4">Payment Authorization</div>
                <h1 className="text-4xl font-bold mb-4 font-display" style={{ color: 'var(--heading-color)' }}>Secure Gateway Checkout</h1>
                <p className="leading-relaxed mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Complete your booking reservation below. Submit your card credentials to authorize transaction processing through our cryptographic gateway.
                </p>

                {/* 3D Simulated Interactive Card */}
                <div className="credit-card-container">
                  <div className={`credit-card-inner ${isFlipped ? 'flipped' : ''}`}>
                    
                    {/* Card Front */}
                    <div className="credit-card-front">
                      <div className="flex justify-between items-start">
                        <div className="chip" />
                        <div className="flex items-center gap-2">
                          <div className="glow-accent-dot" />
                          <span className="text-[10px] font-mono tracking-widest text-white/60">AURA SECURE</span>
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-mono tracking-[0.18em] text-white my-4 font-display">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end font-mono">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-white/40">Cardholder</p>
                          <p className="text-xs uppercase text-white/80 font-bold tracking-widest truncate max-w-[180px]">
                            {cardName || 'JOHN DOE'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-white/40">Expires</p>
                          <p className="text-xs text-white/80 font-bold tracking-widest">
                            {cardExpiry || 'MM/YY'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Back */}
                    <div className="credit-card-back">
                      <div className="w-full h-10 bg-black mt-2" />
                      <div className="px-6 flex justify-between items-center w-full">
                        <div className="bg-white/10 h-8 flex-1 rounded-sm flex items-center justify-end px-3 select-none">
                          <span className="text-xs text-white/30 italic font-mono">auth sign</span>
                        </div>
                        <div className="bg-accentCyan text-black font-mono font-bold text-sm px-4 py-1.5 rounded-r-sm min-w-[50px] text-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                          {cardCvv || '•••'}
                        </div>
                      </div>
                      <p className="text-[8px] text-white/30 font-mono tracking-wider px-6 text-left mt-2">
                        This card is simulated for checkout presentation. No actual charges are made.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Form Input fields */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="cardName" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="JOHN DOE"
                      className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 2222 3333 4444"
                      className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                      style={inputStyle}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cardExpiry" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        id="cardExpiry"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="12/29"
                        className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="cardCvv" className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        CVV Code
                      </label>
                      <input
                        type="password"
                        id="cardCvv"
                        required
                        value={cardCvv}
                        onChange={handleCvvChange}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        placeholder="•••"
                        className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full rounded-full py-5 font-bold uppercase tracking-[0.2em] hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:text-black transition duration-300 flex items-center justify-center gap-3 cursor-none"
                      style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                    >
                      Authorize Transaction · ${parseFloat(amount || '0').toFixed(2)}
                    </button>
                  </div>
                </form>

                {errorMessage && <p className="text-rose-400 mt-4 text-center">{errorMessage}</p>}
              </div>

              {/* Sidebar Booking Summary Info */}
              <aside className="glass-panel rounded-3xl p-8 flex flex-col justify-between" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-muted)' }}>Session Detail</div>
                  
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4 border border-white/5 bg-black/10">
                      <p className="uppercase tracking-[0.24em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Service Selection</p>
                      <p className="mt-2 font-bold text-lg" style={{ color: 'var(--heading-color)' }}>{serviceName || 'Standard Precision Cut'}</p>
                    </div>
                    <div className="rounded-2xl p-4 border border-white/5 bg-black/10">
                      <p className="uppercase tracking-[0.24em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Schedule Time</p>
                      <p className="mt-2 font-bold" style={{ color: 'var(--heading-color)' }}>{appointmentDate} · {appointmentTime}</p>
                    </div>
                    <div className="rounded-2xl p-4 border border-white/5 bg-black/10">
                      <p className="uppercase tracking-[0.24em] text-[10px]" style={{ color: 'var(--text-muted)' }}>Secure Token</p>
                      <p className="mt-2 font-mono text-xs text-accentCyan uppercase">{appointmentToken || 'Pending Validation'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    to="/booking"
                    className="inline-flex items-center justify-center w-full rounded-full px-6 py-4 text-xs uppercase tracking-[0.24em] font-semibold hover:border-accentCyan hover:text-accentCyan transition duration-300 cursor-none"
                    style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
                  >
                    Reschedule booking
                  </Link>
                </div>
              </aside>

            </div>
          </section>
        )}

        {/* PAYMENT STAGE: PROCESSING LOADER OVERLAY */}
        {payStage === 'processing' && (
          <section className="glass-panel rounded-3xl p-16 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto border-white/10" style={{ borderColor: 'var(--surface-border)' }}>
            
            {/* Rotating holographic ring */}
            <div className="relative w-36 h-36 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="var(--accent-cyan)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="390"
                  strokeDashoffset={390 - (390 * processingProgress) / 100}
                  className="transition-all duration-150 ease-out"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))' }}
                />
              </svg>
              {/* Central Progress Percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold font-mono text-white tracking-widest">{processingProgress}%</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 font-display uppercase tracking-[0.1em]" style={{ color: 'var(--heading-color)' }}>
              Gateway Authorization
            </h2>
            <div className="w-8 h-1 bg-accentCyan mb-6" style={{ boxShadow: '0 0 8px var(--accent-cyan)' }} />
            <p className="font-mono text-xs text-accentCyan animate-pulse mb-2 uppercase tracking-widest">
              {processingStatus}
            </p>
            <p className="text-xs max-w-sm mt-3" style={{ color: 'var(--text-muted)' }}>
              Do not close this window or navigate away. Encrypted node signatures are confirming with our booking cluster.
            </p>
          </section>
        )}

        {/* PAYMENT STAGE: SUCCESS */}
        {payStage === 'success' && (
          <section className="glass-panel rounded-3xl p-16 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto border-white/10" style={{ borderColor: 'var(--surface-border)' }}>
            
            {/* SVG Animated Draw Checkmark */}
            <div className="success-checkmark-wrapper">
              <svg viewBox="0 0 106 106" className="w-full h-full">
                <circle cx="53" cy="53" r="50" className="success-circle" />
                <path d="M28 53 l17 17 l33 -33" className="success-check" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-3 font-display text-emerald-400 uppercase tracking-[0.12em]">
              Authorization Cleared
            </h2>
            <div className="w-12 h-1 bg-emerald-500 mb-6 shadow-[0_0_10px_#10b981]" />
            
            <p className="font-mono text-xs uppercase text-white/60 tracking-wider mb-6">
              Payment complete. Generating booking invoice...
            </p>

            <div className="glass-panel rounded-2xl p-5 w-full text-left mb-6 max-w-xs" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
              <div className="flex justify-between items-center text-[10px] uppercase font-mono text-white/40">
                <span>Receipt Status</span>
                <span className="text-emerald-400 font-bold">Confirmed</span>
              </div>
              <div className="mt-3 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-mono text-white/60 uppercase">Amount Paid</p>
                  <p className="text-2xl font-bold text-white mt-1">${parseFloat(amount || '0').toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-white/60 uppercase">Token</p>
                  <p className="text-xs text-accentCyan mt-1 font-mono">{appointmentToken || 'AURA-OK'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Redirecting to invoice dashboard</span>
            </div>
          </section>
        )}

        {/* PAYMENT STAGE: ERROR */}
        {payStage === 'error' && (
          <section className="glass-panel rounded-3xl p-16 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto border-white/10" style={{ borderColor: 'var(--surface-border)' }}>
            
            {/* Warning Sign */}
            <div className="w-20 h-20 rounded-full border-2 border-rose-500 flex items-center justify-center text-4xl mb-6 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              ⚠️
            </div>

            <h2 className="text-2xl font-bold mb-3 font-display text-rose-400 uppercase tracking-[0.1em]">
              Gateway Rejected
            </h2>
            <div className="w-8 h-1 bg-rose-500 mb-6 shadow-[0_0_8px_#f43f5e]" />
            
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
              {errorMessage || 'The payment signature failed verification. Please confirm your details.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                type="button"
                onClick={() => setPayStage('form')}
                className="rounded-full px-8 py-4 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition duration-300 bg-white text-black cursor-none"
              >
                Re-enter Card
              </button>
              <Link
                to="/booking"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-8 py-4 font-bold text-xs uppercase tracking-wider hover:border-rose-400 hover:text-rose-300 transition duration-300 cursor-none"
                style={{ color: 'var(--text-color)' }}
              >
                Modify Booking
              </Link>
            </div>
          </section>
        )}

      </main>
    </>
  );
}

