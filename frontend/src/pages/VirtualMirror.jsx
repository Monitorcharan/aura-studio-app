import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';

const OPTIONS = {
  faceShape: [
    { value: 'round', label: 'Round' },
    { value: 'square', label: 'Square' },
    { value: 'oval', label: 'Oval' },
    { value: 'heart', label: 'Heart' },
    { value: 'diamond', label: 'Diamond' }
  ],
  hairDensity: [
    { value: 'thin', label: 'Thin' },
    { value: 'medium', label: 'Medium' },
    { value: 'thick', label: 'Thick' }
  ],
  hairTexture: [
    { value: 'straight', label: 'Straight' },
    { value: 'wavy', label: 'Wavy' },
    { value: 'curly', label: 'Curly' }
  ],
  hairline: [
    { value: 'normal', label: 'Normal' },
    { value: 'receding', label: 'Receding' },
    { value: 'high', label: 'High' }
  ],
  maintenance: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ]
};

const getFaceShapeFromBox = (box) => {
  const ratio = box.height / box.width;
  if (ratio > 1.15) return 'oval';
  if (ratio >= 0.95 && ratio <= 1.15) return 'round';
  return 'square';
};

export default function VirtualMirror() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [form, setForm] = useState({
    faceShape: 'round',
    hairDensity: 'medium',
    hairTexture: 'straight',
    hairline: 'normal',
    maintenance: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedInfo, setDetectedInfo] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('Authentication required. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [navigate]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const detectFromCamera = async () => {
    const screenshot = webcamRef.current?.getScreenshot({ width: 640, height: 480 });
    if (!screenshot) {
      setError('Unable to capture image. Please allow camera access or upload a photo.');
      return;
    }

    setDetecting(true);
    setError('');
    setCapturedImage(screenshot);
    setDetectedInfo(null);

    try {
      const response = await fetch('/api/virtual-mirror/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: screenshot })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to detect face attributes');
      }

      const detected = {
        faceShape: data.faceShape || form.faceShape,
        hairline: data.hairline || form.hairline,
        hairTexture: data.hairTexture || form.hairTexture
      };
      setDetectedInfo({ ...detected, source: data.source || 'AI' });
      setForm((prev) => ({ ...prev, ...detected }));
    } catch (err) {
      setError(err.message || 'Detection failed.');
    } finally {
      setDetecting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setCapturedImage(dataUrl);
      setError('');
      setDetecting(true);
      try {
        const response = await fetch('/api/virtual-mirror/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: dataUrl })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to detect from uploaded image');
        const detected = {
          faceShape: data.faceShape || form.faceShape,
          hairline: data.hairline || form.hairline,
          hairTexture: data.hairTexture || form.hairTexture
        };
        setDetectedInfo({ ...detected, source: data.source || 'AI' });
        setForm((prev) => ({ ...prev, ...detected }));
      } catch (err) {
        setError(err.message || 'Upload detection failed.');
      } finally {
        setDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setRecommendation(null);

    try {
      const response = await fetch('/api/virtual-mirror/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load recommendation');
      }

      setRecommendation(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <main className="relative py-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
      <section className="glass-panel p-8 rounded-3xl border" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 space-y-8">
            <div>
              <div className="text-accentPurple font-mono text-xs uppercase tracking-[0.3em] mb-4">
                Virtual Mirror
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-display mb-4" style={{ color: 'var(--heading-color)' }}>
                Camera-powered style suggestions.
              </h1>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Capture a selfie, let the mirror detect your features, and receive hairstyle recommendations that consider your face shape, hairline, texture, and maintenance preferences.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative rounded-3xl overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-bg)] mirror-container">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="mirror-video w-full h-full object-cover"
                  videoConstraints={{ facingMode }}
                />
                
                {/* AI AR Scanning Overlay */}
                {detecting && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="w-full h-full relative bg-accentCyan/10 backdrop-contrast-125">
                      {/* Sweeping Laser Line */}
                      <div className="absolute left-0 right-0 h-[2px] bg-accentCyan shadow-[0_0_20px_4px_rgba(0,240,255,0.7)] animate-scan-laser"></div>
                      
                      {/* Facial Recognition Brackets */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-accentCyan/30 border-dashed rounded-3xl">
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-accentCyan"></div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-accentCyan"></div>
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-accentCyan"></div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-accentCyan"></div>
                      </div>
                      
                      {/* HUD Data Matrix */}
                      <div className="absolute bottom-6 left-6 text-accentCyan font-mono text-[10px] space-y-2 opacity-80">
                        <p className="tracking-widest">ANALYZING FACIAL TOPOGRAPHY...</p>
                        <p className="tracking-widest">MEASURING BONE STRUCTURE [||||||||  ]</p>
                        <p className="tracking-widest">CALCULATING HAIRLINE TRAJECTORY</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="mirror-controls flex gap-3">
                  <button type="button" onClick={detectFromCamera} className="btn-primary flex-1 py-3 text-lg" disabled={detecting}>
                    {detecting ? 'Detecting...' : 'Capture & Detect'}
                  </button>
                  <button type="button" onClick={toggleFacingMode} className="btn-primary py-3 px-4 text-sm">
                    Switch
                  </button>
                </div>
                <label className="block text-center text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  Or upload a photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="sr-only" />
                </label>
                {capturedImage && (
                  <div className="rounded-3xl overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-bg)]">
                    <img src={capturedImage} alt="Captured selfie" className="w-full h-auto object-cover" />
                  </div>
                )}
                {detectedInfo && (
                  <div className="rounded-3xl border border-[var(--surface-border)] p-4 text-sm" style={{ color: 'var(--text-color)' }}>
                    <p className="font-semibold mb-2">Detected features ({detectedInfo.source})</p>
                    <p>Face shape: {detectedInfo.faceShape}</p>
                    <p>Hairline: {detectedInfo.hairline}</p>
                    <p>Texture: {detectedInfo.hairTexture}</p>
                  </div>
                )}
                {error && <p className="text-sm text-rose-400">{error}</p>}
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {Object.entries(OPTIONS).map(([key, options]) => (
                <label key={key} className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                  <span className="block mb-2 uppercase tracking-[0.2em] text-[0.65rem] text-[var(--text-muted)]">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <select
                    value={form[key]}
                    onChange={(event) => handleChange(key, event.target.value)}
                    className="w-full rounded-3xl border px-4 py-3 bg-[var(--input-bg)] border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-accentCyan"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {options.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[var(--bg-color)] text-[var(--text-color)]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Analyzing...' : 'Get Recommendation'}
              </button>
            </form>

            <div className="glass-panel p-6 rounded-3xl border" style={{ borderColor: 'var(--surface-border)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--heading-color)' }}>
                How it works
              </h2>
              <ul className="list-disc pl-5 space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <li>Use your camera to capture a front-facing selfie.</li>
                <li>The mirror will detect your face characteristics and prefill your profile.</li>
                <li>Then get AI-powered haircut recommendations based on your natural features.</li>
              </ul>
            </div>

            {recommendation && (
              <div className="glass-panel p-6 rounded-3xl border" style={{ borderColor: 'var(--surface-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--heading-color)' }}>
                    Recommendations
                  </h2>
                  <span className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    {recommendation.source || 'AI'}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-6">{recommendation.summary}</p>
                <div className="space-y-5">
                  {recommendation.recommendations?.map((item, index) => (
                    <div key={index} className="rounded-3xl border border-[var(--surface-border-subtle)] p-5 bg-[var(--surface-bg)]">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--heading-color)' }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>{item.why}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--accent-cyan)' }}>Maintenance: {item.maintenance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
