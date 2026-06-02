import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Preloader from '../components/Preloader';
import DigitalTwin from '../components/DigitalTwin';
import AIConciergeOrb from '../components/AIConciergeOrb';

const stylists = [
  { id: 'marcus', name: 'Marcus Vance', title: 'Master Barber / Creative Director', rating: '4.9', bio: 'Specializes in surgical precision fades, hair tattooing, and futuristic geometry cuts.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
  { id: 'elena', name: 'Elena Rostova', title: 'Senior Chromatic Specialist', rating: '5.0', bio: 'Expert in futuristic metallic dyeing, iridescent chromatics, and advanced tone texturing.', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250' },
  { id: 'sophia', name: 'Sophia Sterling', title: 'Luxury Session Stylist', rating: '4.8', bio: 'Renowned for high-fashion runway waves, red carpet blowout shapes, and therapeutic scalp health.', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250' }
];

export default function Booking() {
  const navigate = useNavigate();
  
  // Auth Check & Setup
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  
  // Form State
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStylistId, setSelectedStylistId] = useState('');
  
  // Feedback States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // UI Modal state
  const [isMirrorOpen, setIsMirrorOpen] = useState(false);

  // Virtual Mirror Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Overlay params
  const [overlayColor, setOverlayColor] = useState('#00F0FF');
  const [overlayStyle, setOverlayStyle] = useState('bob');
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlayScale, setOverlayScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const activeToken = localStorage.getItem('authToken');
    const activeUserId = localStorage.getItem('userId');
    if (!activeToken) {
      setErrorMessage('Unauthenticated. Redirecting to login portal...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }
    setToken(activeToken);
    setUserId(activeUserId);

    // Fetch services
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || []);
      })
      .catch(() => setErrorMessage('Failed to download signature menu.'));

    // Set min date input limit to today
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.setAttribute('min', todayStr);
    }

    // Handle Lookbook deep link to Virtual Mirror
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('openMirror') === 'true') {
      const style = queryParams.get('style');
      if (style) {
        setOverlayStyle(style);
      }
      // slight delay to allow layout to mount
      setTimeout(() => {
        startCamera();
      }, 500);
    }
  }, [navigate]);

  // Load available slots when date shifts
  useEffect(() => {
    if (date) {
      fetch(`/api/appointments/available-slots?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableSlots(data.available_slots || []);
        })
        .catch(() => setErrorMessage('Failed to load slots on this timeline.'));
    }
  }, [date]);

  // Listening to AI Voice Concierge command event
  useEffect(() => {
    const handleVoiceCommand = (e) => {
      const { stylist, service, date: voiceDate } = e.detail;

      if (stylist) {
        setSelectedStylistId(stylist);
      }

      if (service && services.length > 0) {
        // Match service keyword
        const matched = services.find((s) => s.name.toLowerCase().includes(service.toLowerCase()));
        if (matched) {
          setSelectedService(matched._id);
        }
      }

      if (voiceDate) {
        setDate(voiceDate);
      }
    };

    window.addEventListener('aura-voice-command', handleVoiceCommand);
    return () => {
      window.removeEventListener('aura-voice-command', handleVoiceCommand);
    };
  }, [services]);

  // Stylist profile card GSAP transition
  useEffect(() => {
    const card = document.getElementById('stylist-card');
    if (!card) return;

    if (selectedStylistId) {
      gsap.killTweensOf(card);
      card.style.display = 'block';
      gsap.fromTo(card,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      );
    } else {
      card.style.display = 'none';
    }
  }, [selectedStylistId]);

  // Submit appointment handler
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!selectedService || !date || !selectedSlot) {
      setErrorMessage('Incomplete variables. Please select service, date, and slot.');
      return;
    }

    const finalNotes = selectedStylistId
      ? `[Stylist: ${selectedStylistId.toUpperCase()}] ${notes}`
      : notes;

    const bookingData = {
      user_id: userId,
      service_id: selectedService,
      appointment_date: date,
      appointment_time: selectedSlot,
      stylist_id: selectedStylistId,
      notes: finalNotes
    };

    fetch('/api/appointments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.appointment_id) {
          setSuccessMessage('Appointment locked. Routing details...');
          const service = services.find(s => s._id === selectedService);
          const serviceName = service?.name || '';
          const amount = service?.price || 0;
          const token = data.appointment_token || '';
          
          setTimeout(() => {
            navigate(`/payment?appointment_id=${data.appointment_id}&service=${encodeURIComponent(serviceName)}&date=${date}&time=${selectedSlot}&amount=${amount}&token=${token}`);
          }, 1000);
        } else {
          setErrorMessage(data.message || 'Booking reservation rejected.');
        }
      })
      .catch((err) => setErrorMessage('Connection error: ' + err.message));
  };

  // -------------------------------------------------------------
  // WebXR Try-On Virtual Mirror Sensor Handlers
  // -------------------------------------------------------------
  const startCamera = () => {
    setIsMirrorOpen(true);
    
    setTimeout(() => {
      // Access camera stream
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              const loader = document.getElementById('camera-loading');
              if (loader) loader.style.display = 'none';
              videoRef.current.play();
              drawOverlay();
            };
          }
        })
        .catch((err) => {
          const loader = document.getElementById('camera-loading');
          if (loader) {
            loader.innerHTML = `<span class="text-rose-400">Sensor Connection Refused</span><span class="text-[10px] mt-1 text-gray-600">${err.message}</span>`;
          }
        });
    }, 100);
  };

  const closeCamera = () => {
    setIsMirrorOpen(false);
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    const loader = document.getElementById('camera-loading');
    if (loader) loader.style.display = 'flex';
  };

  // Overlay Canvas loop
  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.srcObject) return;

    // sync sizes
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compute centers
    const cx = canvas.width / 2 + overlayPos.x;
    const cy = canvas.height / 2 - 30 + overlayPos.y;
    const r = 85 * overlayScale;

    ctx.strokeStyle = overlayColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = overlayColor;
    ctx.shadowBlur = 15;

    // Draw glowing style wireframes
    ctx.beginPath();
    if (overlayStyle === 'bob') {
      ctx.arc(cx, cy, r, Math.PI, 0);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.quadraticCurveTo(cx + r * 0.7, cy + r * 0.9, cx + r * 0.5, cy + r * 0.75);
      ctx.quadraticCurveTo(cx, cy + r * 0.45, cx - r * 0.5, cy + r * 0.75);
      ctx.quadraticCurveTo(cx - r * 0.7, cy + r * 0.9, cx - r, cy + r * 0.8);
      ctx.closePath();
    } else if (overlayStyle === 'waves') {
      ctx.arc(cx, cy - r * 0.1, r * 1.1, Math.PI * 1.05, Math.PI * 1.95);
      ctx.bezierCurveTo(cx + r * 1.3, cy + r * 0.4, cx + r * 0.8, cy + r * 1.1, cx + r * 0.4, cy + r * 0.95);
      ctx.bezierCurveTo(cx + r * 0.1, cy + r * 0.8, cx - r * 0.1, cy + r * 0.8, cx - r * 0.4, cy + r * 0.95);
      ctx.bezierCurveTo(cx - r * 0.8, cy + r * 1.1, cx - r * 1.3, cy + r * 0.4, cx - r * 1.1, cy - r * 0.1);
    } else if (overlayStyle === 'fringe') {
      ctx.moveTo(cx - r * 0.95, cy + r * 0.1);
      ctx.quadraticCurveTo(cx - r * 0.9, cy - r * 0.85, cx, cy - r * 0.95);
      ctx.quadraticCurveTo(cx + r * 0.9, cy - r * 0.85, cx + r * 0.95, cy + r * 0.1);
      for (let i = 0; i < 6; i++) {
        const px = cx - r * 0.8 + (i * r * 0.32);
        const py = cy - r * 0.3 + (i % 2 === 0 ? 12 : -4);
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Reticles
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.05, 0, Math.PI * 2);
    ctx.moveTo(cx - r * 0.15, cy); ctx.lineTo(cx + r * 0.15, cy);
    ctx.moveTo(cx, cy - r * 0.15); ctx.lineTo(cx, cy + r * 0.15);
    ctx.stroke();

    animFrameIdRef.current = requestAnimationFrame(drawOverlay);
  };

  // Dragging inside modal
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    let nextX = e.clientX - dragStartRef.current.x;
    let nextY = e.clientY - dragStartRef.current.y;
    
    // clamp positions
    nextX = Math.max(-100, Math.min(100, nextX));
    nextY = Math.max(-100, Math.min(100, nextY));
    
    setOverlayPos({ x: nextX, y: nextY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    let nextScale = overlayScale + e.deltaY * -0.001;
    nextScale = Math.max(0.6, Math.min(1.8, nextScale));
    setOverlayScale(nextScale);
  };

  // Helpers to fetch specific selected stylist profile object
  const currentStylist = stylists.find(s => s.id === selectedStylistId);

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderWidth: '1px',
    borderColor: 'var(--input-border)',
    color: 'var(--text-color)'
  };

  return (
    <>
      <Preloader title="AURA / APPOINTMENT" subtitle="RESERVATION HUB" />
      
      {/* Voice Assistant Orb */}
      <AIConciergeOrb />

      <main className="min-h-screen flex items-center justify-center px-8 md:px-24 py-28 max-w-7xl mx-auto w-full relative">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 w-full items-stretch">
          
          {/* Left Spatial Twin Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between items-stretch relative overflow-hidden min-h-[500px]" style={{ borderColor: 'var(--surface-border)' }}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-accentCyan text-xs font-mono uppercase tracking-[0.24em]">Spatial digital twin</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="glass-panel text-xs font-mono uppercase tracking-widest text-accentCyan hover:bg-accentCyan hover:text-black hover:border-accentCyan px-3.5 py-1.5 rounded-full transition duration-300 cursor-none"
                  style={{ borderColor: 'var(--surface-border)' }}
                >
                  📸 Open Virtual Mirror
                </button>
              </div>
              <h1 className="text-2xl font-bold font-display mb-2 leading-none" style={{ color: 'var(--heading-color)' }}>Select Styling Chair</h1>

              {/* Hidden A11y focus fallback links */}
              <div className="a11y-sr-only">
                <button
                  type="button"
                  onClick={() => setSelectedStylistId('marcus')}
                  onFocus={() => window.AuraDigitalTwin?.instance?.focusChairByIndex(0)}
                >
                  Select Marcus. Chair 1.
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStylistId('elena')}
                  onFocus={() => window.AuraDigitalTwin?.instance?.focusChairByIndex(1)}
                >
                  Select Elena. Chair 2.
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStylistId('sophia')}
                  onFocus={() => window.AuraDigitalTwin?.instance?.focusChairByIndex(2)}
                >
                  Select Sophia. Chair 3.
                </button>
              </div>

              {/* Digital Twin component */}
              <DigitalTwin
                selectedStylistId={selectedStylistId}
                onSelectStylist={(id) => setSelectedStylistId(id)}
              />
            </div>

            {/* Stylist Details Holographic Card */}
            <div
              id="stylist-card"
              className="glass-panel rounded-2xl p-4 mt-4 backdrop-blur-md hidden"
              style={{ borderColor: 'var(--accent-cyan, rgba(0,240,255,0.2))', backgroundColor: 'var(--surface-bg)' }}
            >
              {currentStylist && (
                <div className="flex gap-4 items-center">
                  <img
                    src={currentStylist.image}
                    alt={currentStylist.name}
                    className="w-12 h-12 rounded-full object-cover aspect-square"
                    style={{ borderWidth: '1px', borderColor: 'var(--surface-border)' }}
                  />
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-bold font-display" style={{ color: 'var(--heading-color)' }}>{currentStylist.name}</h3>
                      <span className="text-[10px] font-mono text-accentCyan flex items-center gap-1">
                        ★ {currentStylist.rating}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{currentStylist.title}</p>
                    <p className="text-[11px] font-light leading-relaxed mt-1.5" style={{ color: 'var(--text-subtle)' }}>{currentStylist.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right form submission panel */}
          <div className="glass-panel rounded-3xl p-8 shadow-2xl" style={{ borderColor: 'var(--surface-border)' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Secure Booking</p>
                <h2 className="text-2xl font-bold font-display mt-1" style={{ color: 'var(--heading-color)' }}>Reserve Session</h2>
              </div>
              <div className="w-10 h-10 rounded-full text-accentCyan flex items-center justify-center" style={{ backgroundColor: 'var(--icon-bg)' }}>
                📅
              </div>
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

            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div>
                <label htmlFor="service" className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Select Service
                </label>
                <select
                  id="service"
                  required
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                  style={inputStyle}
                >
                  <option value="">Choose a signature treatment</option>
                  {services.map((srv) => (
                    <option key={srv._id} value={srv._id}>
                      {srv.name} - ${srv.price} ({srv.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Preferred Date
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Available Sessions
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {availableSlots.map((slot) => (
                      <div
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot rounded-xl py-3 text-center text-xs font-mono cursor-none transition duration-300 ${
                              selectedSlot === slot
                                ? 'selected text-accentCyan shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                : 'hover:border-accentCyan/40'
                        }`}
                        style={{
                          backgroundColor: selectedSlot === slot ? 'rgba(0,240,255,0.1)' : 'var(--slot-bg)',
                          borderWidth: '1px',
                          borderColor: selectedSlot === slot ? 'var(--accent-cyan)' : 'var(--surface-border)',
                          color: selectedSlot === slot ? 'var(--heading-color)' : 'var(--text-color)'
                        }}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono italic" style={{ color: 'var(--text-subtle)' }}>
                    {date ? 'No sessions available on this timeline.' : 'Choose preferred date to load timelines.'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Stylist Directives
                </label>
                <textarea
                  id="notes"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify any style detail or preferences..."
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:border-accentCyan/50 focus:ring-1 focus:ring-accentCyan/30 transition cursor-none"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-accentCyan hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition duration-300 magnetic cursor-none"
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
              >
                Book Appointment
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* WebXR Try-On Virtual Mirror Modal */}
      {isMirrorOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 backdrop-blur-xl opacity-100 scale-100 transition-all duration-300" style={{ backgroundColor: 'var(--overlay-bg)' }}>
          <div className="glass-panel max-w-md w-full rounded-3xl shadow-2xl overflow-hidden relative p-6 flex flex-col items-center" style={{ borderColor: 'var(--surface-border)' }}>
            
            <div className="flex justify-between items-center w-full mb-4">
              <div>
                <p className="text-accentCyan text-[10px] font-mono uppercase tracking-[0.24em]">WebXR mirror mode</p>
                <h3 className="text-xl font-bold font-display" style={{ color: 'var(--heading-color)' }}>Style Virtual Mirror</h3>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="w-8 h-8 rounded-full flex items-center justify-center transition cursor-none hover:text-accentCyan"
                style={{ borderWidth: '1px', borderColor: 'var(--surface-border)', color: 'var(--text-color)' }}
              >
                ✕
              </button>
            </div>

            {/* Video container */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="mirror-container w-full aspect-[4/3] rounded-2xl relative overflow-hidden shadow-inner cursor-grab active:cursor-grabbing"
              style={{ borderWidth: '1px', borderColor: 'var(--surface-border)' }}
            >
              <video ref={videoRef} className="mirror-video" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="mirror-overlay-canvas" />
              <div
                id="camera-loading"
                className="absolute inset-0 flex flex-col items-center justify-center text-xs font-mono tracking-widest"
                style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-subtle)' }}
              >
                <span className="animate-spin text-accentCyan text-xl mb-2">⏳</span> CONNECTING SENSOR FEED
              </div>
            </div>
            
            <div className="text-[10px] font-mono mt-2" style={{ color: 'var(--text-subtle)' }}>
              Drag overlay to shift. Scroll inside mirror to resize style overlay.
            </div>

            {/* Filters Selection */}
            <div className="w-full mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}>Overlay Shade</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOverlayColor('#00F0FF')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition cursor-none ${
                      overlayColor === '#00F0FF' ? 'border-accentCyan text-accentCyan' : 'border-accentCyan/30 text-accentCyan/60 hover:bg-white/5'
                    }`}
                  >
                    Cyan
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayColor('#8A2BE2')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition cursor-none ${
                      overlayColor === '#8A2BE2' ? 'border-accentPurple text-accentPurple' : 'border-accentPurple/30 text-accentPurple/60 hover:bg-white/5'
                    }`}
                  >
                    Purple
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayColor('#FFFFFF')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition cursor-none ${
                      overlayColor === '#FFFFFF' ? 'border-white text-white' : 'border-white/20 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    Silver
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}>Overlay Geometry</label>
                <div className="flex gap-2 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setOverlayStyle('bob')}
                    className={`flex-1 py-2 rounded-xl border transition cursor-none ${
                      overlayStyle === 'bob' ? 'border-accentCyan/40 bg-white/5' : ''
                    }`}
                    style={{
                      borderColor: overlayStyle === 'bob' ? undefined : 'var(--surface-border)',
                      color: overlayStyle === 'bob' ? 'var(--heading-color)' : 'var(--text-muted)'
                    }}
                  >
                    Cyber Bob
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayStyle('waves')}
                    className={`flex-1 py-2 rounded-xl border transition cursor-none ${
                      overlayStyle === 'waves' ? 'border-accentCyan/40 bg-white/5' : ''
                    }`}
                    style={{
                      borderColor: overlayStyle === 'waves' ? undefined : 'var(--surface-border)',
                      color: overlayStyle === 'waves' ? 'var(--heading-color)' : 'var(--text-muted)'
                    }}
                  >
                    Volume Waves
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverlayStyle('fringe')}
                    className={`flex-1 py-2 rounded-xl border transition cursor-none ${
                      overlayStyle === 'fringe' ? 'border-accentCyan/40 bg-white/5' : ''
                    }`}
                    style={{
                      borderColor: overlayStyle === 'fringe' ? undefined : 'var(--surface-border)',
                      color: overlayStyle === 'fringe' ? 'var(--heading-color)' : 'var(--text-muted)'
                    }}
                  >
                    Neon Fringe
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
