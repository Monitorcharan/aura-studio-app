import React, { useState, useEffect, useRef } from 'react';
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

  // OTP Verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    // Reveal animations
    gsap.fromTo('.fade-in-up', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out' }
    );

    // Magnetic buttons setup
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
  }, [needsVerification]); // Re-run magnetic setup if the view switches

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      if (data.needs_verification) {
        setSuccessMessage(data.message);
        setNeedsVerification(true);
        setVerificationEmail(data.email);
      } else {
        setErrorMessage(data.message || 'Registration rejected. Profile may exist.');
      }
    })
    .catch((error) => {
      setErrorMessage(error.message || 'Connection error.');
    });
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);

    // Focus next input
    if (element.value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      otpRefs.current[5].focus();
    }
  };

  const handleVerifyOtp = (e) => {
    if (e) e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    fetch('/api/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: verificationEmail, otp: otpCode })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }
      return data;
    })
    .then((data) => {
      setSuccessMessage('Account verified successfully! Diverting to login gateway...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    })
    .catch((error) => {
      setErrorMessage(error.message || 'Connection error.');
    });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setSuccessMessage('');
    setErrorMessage('');

    fetch('/api/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: verificationEmail })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP.');
      }
      return data;
    })
    .then((data) => {
      setSuccessMessage('A new verification code has been dispatched to your inbox.');
      setResendCooldown(60);
      // Reset otp fields
      setOtp(['', '', '', '', '', '']);
      if (otpRefs.current[0]) otpRefs.current[0].focus();
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

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-8 md:px-24 py-24 sm:py-28 max-w-7xl mx-auto w-full relative">
        <div className="grid lg:grid-cols-12 items-center gap-8 sm:gap-12 w-full">
          {/* Left Side: Brutalist Branding */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-[52vh] text-left select-none pointer-events-none fade-in-up">
            <div className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em]">
              {needsVerification ? 'Authentication' : 'Registration'}
            </div>
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
                {needsVerification ? <>Verify <br /> Account.</> : <>Create <br /> Account.</>}
              </h1>
              <p className="font-light max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {needsVerification 
                  ? 'Confirm your identity node by verifying the OTP received in your inbox to establish session access.'
                  : 'Establish your digital footprint to schedule precision styling, curate preferences, and earn session tokens.'}
              </p>
            </div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>AURA / OPERATIONS DEPT.</div>
          </div>

          {/* Right Side: Glassmorphic Panel */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full fade-in-up">
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md shadow-2xl relative" style={{ borderColor: 'var(--surface-border)' }}>
              
              {/* Header */}
              <div className="text-center lg:text-left mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-accentCyan text-lg mb-4" style={{ backgroundColor: 'var(--icon-bg)' }}>
                  {needsVerification ? '🔑' : '👤'}
                </div>
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>
                  {needsVerification ? 'Identity Authentication' : 'Occupant Enlistment'}
                </h2>
                <p className="text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>
                  {needsVerification 
                    ? `Dispatched secure OTP to ${verificationEmail}.` 
                    : 'Register credentials to activate profile.'}
                </p>
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

              {/* Step 1: Registration Form */}
              {!needsVerification ? (
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
              ) : (
                /* Step 2: OTP Verification Form */
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          ref={(el) => (otpRefs.current[index] = el)}
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="w-12 h-12 rounded-xl text-center font-bold text-xl focus:outline-none focus:border-accentCyan focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                          style={inputStyle}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition duration-300 magnetic cursor-none"
                    style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                  >
                    Verify Identity
                  </button>

                  <div className="text-center text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>
                    Did not receive token?{' '}
                    {resendCooldown > 0 ? (
                      <span className="text-accentCyan font-bold">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-accentCyan font-bold hover:underline transition cursor-none bg-transparent border-none p-0 inline font-mono"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}

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
