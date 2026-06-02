import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [membershipTier, setMembershipTier] = useState('standard');
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const name = localStorage.getItem('userName');
      const role = localStorage.getItem('userRole') || 'user';
      const tier = localStorage.getItem('membership_tier') || 'standard';
      setIsLoggedIn(!!token);
      setUserName(name || '');
      setUserRole(role);
      setMembershipTier(tier);
    };
    checkAuth();

    // Init theme state
    const t = localStorage.getItem('theme') || 'dark';
    setIsLightTheme(t === 'light');

    // Set up a listener for storage shifts
    window.addEventListener('storage', checkAuth);
    // Also listen to a custom event if we want local page changes to update it immediately
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('membership_tier');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  // Scroll logic for landing page anchors
  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleTheme = () => {
    const next = !isLightTheme;
    setIsLightTheme(next);
    if (next) {
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('theme-light');
      localStorage.setItem('theme', 'dark');
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  const iconStroke = 'var(--heading-color)';

  return (
    <nav className="fixed w-full z-50 top-0 mt-4 mx-auto max-w-7xl rounded-2xl left-0 right-0 px-6 py-4 flex justify-between items-center glass-panel opacity-100 transition-all duration-300" style={{ borderColor: 'var(--surface-border)' }}>
      <Link to="/" className="text-2xl font-bold tracking-widest font-display magnetic" style={{ color: 'var(--heading-color)' }}>
        AURA<span className="text-accentCyan">.</span>
      </Link>
      
      <div className="hidden md:flex gap-8 text-xs font-semibold uppercase tracking-widest items-center" style={{ color: 'var(--text-muted)' }}>
        <button onClick={() => scrollToSection('philosophy')} className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          Philosophy
        </button>
        <button onClick={() => scrollToSection('services')} className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          Services
        </button>
        <Link to="/lookbook" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          Lookbook
        </Link>
        <Link to="/virtual-mirror" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          Virtual Mirror
        </Link>
        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--surface-border)' }}></div>
        
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-accentCyan font-mono lowercase normal-case tracking-normal">hello, {userName}</span>
              {membershipTier === 'elite' && (
                <span className="bg-yellow-400/20 text-yellow-400 text-[9px] uppercase px-2 py-0.5 rounded-full tracking-widest border border-yellow-400/50">Elite</span>
              )}
            </div>
            {userRole === 'admin' ? (
              <Link to="/admin-dashboard" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                Admin Dashboard
              </Link>
            ) : userRole === 'stylist' ? (
              <Link to="/stylist-dashboard" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                Stylist Dashboard
              </Link>
            ) : (
              <>
                <Link to="/profile" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  Profile
                </Link>
                <Link to="/payment-history" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  Payments
                </Link>
                {membershipTier !== 'elite' && (
                  <Link to="/elite" className="transition cursor-none magnetic hover:opacity-80 text-yellow-500 hover:text-yellow-400">
                    Join Elite
                  </Link>
                )}
              </>
            )}
            <button onClick={handleLogout} className="hover:text-rose-400 transition cursor-none magnetic">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              Member Login
            </Link>
            <Link to="/admin-login" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              Admin Portal
            </Link>
            <Link to="/register" className="transition cursor-none magnetic hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              Register
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme" className="theme-toggle inline-flex">
          {isLightTheme ? (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v2" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 19v2" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.2 4.2l1.4 1.4" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.4 18.4l1.4 1.4" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 12h2" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12h2" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.2 19.8l1.4-1.4" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.4 5.6l1.4-1.4" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="4" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>

        <Link to="/booking" className="btn-primary hidden md:inline-flex">
          Book Now
        </Link>
        <Link to="/booking" className="btn-primary md:hidden px-4 text-[10px]">
          Book
        </Link>
        
        <button className="md:hidden p-2 flex items-center justify-center transition-colors" style={{ color: 'var(--heading-color)' }} onClick={toggleMobileMenu}>
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 mx-6 glass-panel rounded-2xl flex flex-col p-6 gap-6 text-sm font-semibold uppercase tracking-widest md:hidden shadow-2xl transition-all" style={{ borderColor: 'var(--surface-border)' }}>
          <button onClick={() => { scrollToSection('philosophy'); setMobileMenuOpen(false); }} className="text-left" style={{ color: 'var(--heading-color)' }}>Philosophy</button>
          <button onClick={() => { scrollToSection('services'); setMobileMenuOpen(false); }} className="text-left" style={{ color: 'var(--heading-color)' }}>Services</button>
          <Link to="/lookbook" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Lookbook</Link>
          <Link to="/virtual-mirror" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Virtual Mirror</Link>
          <div className="h-px w-full" style={{ backgroundColor: 'var(--surface-border)' }}></div>
          {isLoggedIn ? (
            <>
              <div className="text-accentCyan lowercase font-mono normal-case tracking-normal">hello, {userName}</div>
              {userRole === 'admin' ? (
                <Link to="/admin-dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Admin Dashboard</Link>
              ) : userRole === 'stylist' ? (
                <Link to="/stylist-dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Stylist Dashboard</Link>
              ) : (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Profile</Link>
                  <Link to="/payment-history" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Payments</Link>
                  {membershipTier !== 'elite' && (
                    <Link to="/elite" onClick={() => setMobileMenuOpen(false)} className="text-yellow-500 hover:text-yellow-400">Join Elite</Link>
                  )}
                </>
              )}
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-rose-400 text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Member Login</Link>
              <Link to="/admin-login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Admin Portal</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--heading-color)' }}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
