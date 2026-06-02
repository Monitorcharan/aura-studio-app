import React from 'react';
import { useNavigate } from 'react-router-dom';
import Preloader from '../components/Preloader';

const looks = [
  {
    id: 'bob',
    name: 'Cyber Bob',
    description: 'A sharp, sleek, jaw-length cut engineered for striking symmetry and low-maintenance elegance.',
    image: 'https://images.unsplash.com/photo-1589254394857-e666a2bdf6bd?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'waves',
    name: 'Volume Waves',
    description: 'Luxurious, flowing dimensional waves that add cinematic volume and dynamic texture.',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'fringe',
    name: 'Neon Fringe',
    description: 'An edgy, avant-garde blunt bang look with textured layers designed to frame the eyes perfectly.',
    image: 'https://images.unsplash.com/photo-1518331393605-654dbda96db6?auto=format&fit=crop&q=80&w=800'
  }
];

export default function Lookbook() {
  const navigate = useNavigate();

  const handleTryLook = (styleId) => {
    navigate(`/booking?openMirror=true&style=${styleId}`);
  };

  return (
    <>
      <Preloader title="AURA / LOOKBOOK" subtitle="CURATED STYLES" />
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-accentCyan font-mono text-xs uppercase tracking-[0.3em] mb-4">Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold font-display mb-6" style={{ color: 'var(--heading-color)' }}>
            Signature Aesthetics.
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Explore our curated collection of high-fashion, futuristic cuts. See a look you like? Instantly project it onto yourself using our WebXR Try-On Mirror.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {looks.map((look) => (
            <div key={look.id} className="glass-panel rounded-3xl overflow-hidden group border transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,240,255,0.15)] hover:-translate-y-2" style={{ borderColor: 'var(--surface-border)' }}>
              {/* Image Container */}
              <div className="aspect-[4/5] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <img 
                  src={look.image} 
                  alt={look.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h2 className="text-2xl font-bold font-display mb-2 text-white">{look.name}</h2>
                  <p className="text-sm text-gray-300 font-light leading-relaxed mb-6">
                    {look.description}
                  </p>
                  
                  <button 
                    onClick={() => handleTryLook(look.id)}
                    className="w-full py-3.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition duration-300 cursor-none border border-accentCyan/50 text-accentCyan hover:bg-accentCyan hover:text-black group/btn"
                    style={{ backgroundColor: 'rgba(0,240,255,0.05)' }}
                  >
                    <span>Try This Look</span>
                    <span className="text-lg group-hover/btn:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
