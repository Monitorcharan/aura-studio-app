import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';

export default function Home() {
  useEffect(() => {
    // 1. Text reveals and fade-ins after preloader is done
    const onPreloaderComplete = () => {
      document.querySelectorAll('.reveal-text').forEach((el) => {
        const text = el.textContent.trim();
        el.innerHTML = '';
        
        const words = text.split(' ');
        words.forEach((word) => {
          const mask = document.createElement('span');
          mask.className = 'text-mask mr-3 pb-1 inline-block';
          
          const fill = document.createElement('span');
          fill.className = 'inline-block translate-y-full';
          fill.textContent = word;
          
          mask.appendChild(fill);
          el.appendChild(mask);
        });

        gsap.to(el.querySelectorAll('.translate-y-full'), {
          y: '0%',
          duration: 1.4,
          stagger: 0.06,
          ease: 'expo.out',
          delay: 0.1
        });
      });

      gsap.fromTo('nav', 
        { y: -50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
      );

      gsap.fromTo('.fade-in-up', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
      );
    };

    document.addEventListener('aura-preloader-complete', onPreloaderComplete);

    // 2. Magnetic Buttons pulls
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

      // Save references to cleanup later
      btn._cleanup = () => {
        btn.removeEventListener('mousemove', onMouseMove);
        btn.removeEventListener('mouseleave', onMouseLeave);
      };
    });

    // 3. 3D Parallax Tilt Cards
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach((card) => {
      const onMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        
        const dx = x - xc;
        const dy = y - yc;
        
        const tiltX = -(dy / yc) * 8;
        const tiltY = (dx / xc) * 8;

        gsap.to(card, {
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.025)`,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });

        card.style.boxShadow = `${-dx * 0.12}px ${-dy * 0.12}px 25px rgba(0, 240, 255, 0.22)`;
      };

      const onMouseLeave = () => {
        gsap.to(card, {
          transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        card.style.boxShadow = 'none';
      };

      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);

      card._cleanup = () => {
        card.removeEventListener('mousemove', onMouseMove);
        card.removeEventListener('mouseleave', onMouseLeave);
      };
    });

    // 4. Scroll rotation for WebGL centerpiece
    const handleScrollEvent = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = window.scrollY / scrollHeight;
      if (window.AuraWebGL && window.AuraWebGL.handleScroll) {
        window.AuraWebGL.handleScroll(progress);
      }
    };
    window.addEventListener('scroll', handleScrollEvent);

    return () => {
      document.removeEventListener('aura-preloader-complete', onPreloaderComplete);
      magneticBtns.forEach(btn => btn._cleanup && btn._cleanup());
      tiltCards.forEach(card => card._cleanup && card._cleanup());
      window.removeEventListener('scroll', handleScrollEvent);
    };
  }, []);

  return (
    <>
      <Preloader title="AURA / LABS" subtitle="SYSTEM INITIALIZING" />
      
      {/* Hero Section */}
      <header className="h-screen flex items-center justify-start px-8 md:px-24 max-w-7xl mx-auto w-full relative pointer-events-none">
        <div className="max-w-3xl mt-12 pointer-events-auto">
          <div className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em] mb-4 fade-in-up">
            Premium Grooming Experience
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 reveal-text" style={{ color: 'var(--heading-color)' }}>
            Elevate Your Aesthetic.
          </h1>
          <p className="text-base md:text-lg mb-10 max-w-md font-light leading-relaxed fade-in-up" style={{ color: 'var(--text-muted)' }}>
            Precision styling meets cinematic 3D presence. Walk in to define your future identity in a space designed for absolute details.
          </p>
          <Link
            to="/booking"
            className="glass-panel text-xs hover:opacity-90 transition duration-300 inline-flex items-center gap-3 w-max fade-in-up magnetic cursor-none px-8 py-4 rounded-full font-bold uppercase tracking-wider"
            style={{ color: 'var(--heading-color)', borderColor: 'var(--surface-border)' }}
          >
            Reserve a Chair <span className="text-accentCyan font-semibold">→</span>
          </Link>
        </div>
      </header>

      {/* Asymmetrical Philosophy Section */}
      <section id="philosophy" className="py-32 px-8 md:px-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="text-accentPurple font-mono text-xs uppercase tracking-[0.3em]">
              Our Philosophy
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-none font-display" style={{ color: 'var(--heading-color)' }}>
              Beyond Grooming, Identity.
            </h2>
            <p className="font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              AURA stands as a testament to surgical precision and luxury minimalist craft. We reject the mundane, treating grooming as an architectural sculpture built uniquely for you.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <h4 className="text-2xl font-bold text-accentCyan font-display">12+</h4>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-subtle)' }}>Master Stylists</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-accentPurple font-display">100%</h4>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-subtle)' }}>Surgical Detail</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 flex justify-end">
            <div className="glass-panel p-4 rounded-3xl max-w-md tilt-card shadow-2xl relative" style={{ borderColor: 'var(--surface-border)' }}>
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800"
                alt="Studio Detail"
                className="rounded-2xl grayscale hover:grayscale-0 transition duration-700 w-full object-cover aspect-[4/5] object-center"
              />
              <div className="absolute top-8 left-8 backdrop-blur-md px-4 py-2 rounded-full text-xs tracking-wider font-mono" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--heading-color)', opacity: 0.9, borderWidth: '1px', borderColor: 'var(--surface-border)' }}>
                AURA / STUDIO
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-32 px-8 md:px-24" style={{ background: `linear-gradient(to bottom, transparent, var(--gradient-to))` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <div className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em] mb-3">
                Signature Menu
              </div>
              <h2 className="text-4xl md:text-6xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>Curated Services</h2>
            </div>
            <p className="max-w-xs font-light text-sm" style={{ color: 'var(--text-muted)' }}>
              Every single treatment is customized and tailored specifically to your facial structure and hair profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer tilt-card flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>✂️</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>01 / Signature</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Precision Cut</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Bespoke surgical-precision haircut tailored to your head structure and daily routine.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>Duration: 45m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$65+</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer tilt-card flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>🎨</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>02 / Chroma</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Color & Tone</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  From micro highlights to futuristic metallic chromatic dye and tone correction.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>Duration: 90m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$120+</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer tilt-card flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>🌿</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>03 / Therapy</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Scalp Spa</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Hydro-massage, dynamic scalp treatment, deep conditioning, and pure relaxation.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>Duration: 60m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$85+</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-accentCyan/30 transition duration-500 cursor-pointer tilt-card flex flex-col justify-between aspect-[3/4]" style={{ borderColor: 'var(--surface-border)' }}>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl mb-6" style={{ color: 'var(--text-subtle)' }}>✨</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>04 / Session</span>
                </div>
                <h3 className="text-xl font-bold mb-3 font-display" style={{ color: 'var(--heading-color)' }}>Event Styling</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Red carpet ready, high fashion shoot blowouts, or wedding master styling sessions.
                </p>
              </div>
              <div className="flex justify-between items-baseline mt-6">
                <span className="text-sm font-mono" style={{ color: 'var(--text-subtle)' }}>Duration: 60m</span>
                <span className="text-2xl font-bold text-accentCyan font-display">$95+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <footer className="py-24 px-8 md:px-24 relative" style={{ backgroundColor: 'var(--footer-bg)', borderTop: '1px solid var(--surface-border-subtle)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter leading-none mb-4 font-display" style={{ color: 'var(--heading-color)' }}>
              Ready to elevate?
            </h2>
            <p className="font-light max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Secure your appointment time slot online instantly and skip the line.
            </p>
          </div>
          
          <Link
            to="/booking"
            className="text-sm uppercase tracking-widest font-bold px-12 py-5 rounded-full hover:bg-accentCyan hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition duration-500 magnetic cursor-none"
            style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
          >
            Book A Chair Now
          </Link>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 font-mono" style={{ borderTop: '1px solid var(--surface-border-subtle)', color: 'var(--text-subtle)' }}>
          <div>&copy; 2026 AURA PREMIUM STUDIO. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-80 transition" style={{ color: 'var(--text-subtle)' }}>Privacy Policy</a>
            <a href="#" className="hover:opacity-80 transition" style={{ color: 'var(--text-subtle)' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
}
