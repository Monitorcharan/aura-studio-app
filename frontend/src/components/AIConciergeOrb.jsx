import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

// Simplex Noise and shader code for the AI Orb (same as main sphere but smaller scale/color variations)
const GLSL_NOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const vertexShader = GLSL_NOISE + `
uniform float uTime;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    vec3 noisePos = position * uNoiseFreq + vec3(0.0, uTime * 0.25, uTime * 0.15);
    float noiseVal = snoise(noisePos);
    
    float totalDisplacement = noiseVal * uNoiseAmp;
    vec3 displacedPosition = position + normal * totalDisplacement;
    
    vec4 modelViewPos = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -modelViewPos.xyz;
    vPosition = displacedPosition;
    vNoise = noiseVal;
    
    gl_Position = projectionMatrix * modelViewPos;
}
`;

const fragmentShader = `
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    vec3 baseColor = mix(uColor1, uColor2, sin(vPosition.y * 1.8 + uTime * 0.4) * 0.5 + 0.5);
    vec3 rimReflection = vec3(0.95, 0.98, 1.0) * fresnel * 0.85;
    float diffuse = max(dot(normal, normalize(vec3(1.0, 1.5, 0.7))), 0.0);
    
    vec3 finalColor = baseColor * (diffuse * 0.45 + 0.25) + rimReflection;
    finalColor += uColor1 * fresnel * 0.5;
    
    gl_FragColor = vec4(finalColor, 0.95);
}
`;

export default function AIConciergeOrb() {
  const containerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const recognitionRef = useRef(null);
  const audioOrbRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WebGL setup for the AI Orb
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(96, 96);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(0.85, 64, 64);
    const uniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.95 },
      uNoiseAmp: { value: 0.15 },
      uColor1: { value: new THREE.Color('#00F0FF') },
      uColor2: { value: new THREE.Color('#8A2BE2') }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const light = new THREE.PointLight(0x00F0FF, 3.5, 10);
    light.position.set(2, 2, 2);
    scene.add(light);

    // Helpers to animate orb morph values
    const setAmplitude = (amp) => {
      gsap.to(uniforms.uNoiseAmp, { value: amp, duration: 0.25, ease: 'power2.out' });
    };

    const setFrequency = (freq) => {
      gsap.to(uniforms.uNoiseFreq, { value: freq, duration: 0.25, ease: 'power2.out' });
    };

    audioOrbRef.current = { setAmplitude, setFrequency };

    let animationFrameId;
    const animate = (time) => {
      animationFrameId = requestAnimationFrame(animate);
      uniforms.uTime.value = time * 0.0015;

      mesh.rotation.y += 0.012;
      mesh.rotation.x += 0.008;

      renderer.render(scene, camera);
    };
    animate(0);

    // Initialize speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setAmplitude(0.5);
        setFrequency(1.6);
      };

      rec.onend = () => {
        setIsListening(false);
        if (!window.speechSynthesis.speaking) {
          setAmplitude(0.15);
          setFrequency(0.95);
        }
      };

      rec.onerror = () => {
        speakResponse("Vocal query degraded. Please speak clearly.");
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        parseAndFillForm(transcript);
      };

      setRecognition(rec);
      recognitionRef.current = rec;
    }

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const niceVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Samantha') || voice.lang.startsWith('en'));
    if (niceVoice) utterance.voice = niceVoice;

    utterance.pitch = 1.0;
    utterance.rate = 1.05;

    utterance.onstart = () => {
      if (audioOrbRef.current) {
        audioOrbRef.current.setAmplitude(0.7);
        audioOrbRef.current.setFrequency(2.2);
      }
    };

    utterance.onend = () => {
      if (audioOrbRef.current && !isListening) {
        audioOrbRef.current.setAmplitude(0.15);
        audioOrbRef.current.setFrequency(0.95);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const getNextDayOfWeek = (dayName) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIndex = days.indexOf(dayName.toLowerCase());
    if (targetIndex === -1) return null;
    
    const today = new Date();
    const todayIndex = today.getDay();
    let daysToAdd = targetIndex - todayIndex;
    if (daysToAdd <= 0) daysToAdd += 7;
    
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  };

  const parseAndFillForm = (transcript) => {
    const text = transcript.toLowerCase();
    let stylist = null;
    let service = null;
    let date = null;

    if (text.includes('marcus')) stylist = 'marcus';
    else if (text.includes('elena')) stylist = 'elena';
    else if (text.includes('sophia')) stylist = 'sophia';

    if (text.includes('cut') || text.includes('haircut') || text.includes('precision')) service = 'precision';
    else if (text.includes('color') || text.includes('tone') || text.includes('chroma')) service = 'color';
    else if (text.includes('spa') || text.includes('scalp') || text.includes('therapy')) service = 'spa';
    else if (text.includes('styling') || text.includes('event') || text.includes('session')) service = 'event';

    if (text.includes('today')) {
      date = new Date().toISOString().split('T')[0];
    } else if (text.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else {
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of weekdays) {
        if (text.includes(day)) {
          date = getNextDayOfWeek(day);
          break;
        }
      }
    }

    let feedback = "Concierge parsed instructions. ";
    let logItems = [];

    if (service) {
      logItems.push(service.charAt(0).toUpperCase() + service.slice(1) + " service");
    }
    if (date) {
      logItems.push("Date set to " + date);
    }
    if (stylist) {
      logItems.push("Stylist " + stylist.charAt(0).toUpperCase() + stylist.slice(1));
    }

    // Fire React Custom Event so Booking Page can intercept and update its Form hooks
    const event = new CustomEvent('aura-voice-command', {
      detail: { stylist, service, date }
    });
    window.dispatchEvent(event);

    if (logItems.length > 0) {
      feedback += "Configured " + logItems.join(', ') + ". Please verify slot availability.";
    } else {
      feedback = "I heard: '" + transcript + "'. Try booking: Precision Cut with Marcus next Friday.";
    }

    speakResponse(feedback);
  };

  // Bind Spacebar events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const activeNode = document.activeElement;
        if (activeNode && (activeNode.tagName === 'INPUT' || activeNode.tagName === 'TEXTAREA' || activeNode.tagName === 'SELECT')) {
          return;
        }

        e.preventDefault();

        if (recognitionRef.current && !isListening) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.log('Recognition error: ' + err.message);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        const activeNode = document.activeElement;
        if (activeNode && (activeNode.tagName === 'INPUT' || activeNode.tagName === 'TEXTAREA' || activeNode.tagName === 'SELECT')) {
          return;
        }

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening]);

  const handleMouseDown = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const handleMouseUp = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <>
      <div
        id="ai-orb-container"
        className="fixed bottom-6 right-6 w-24 h-24 z-[999] rounded-full border border-white/10 glass-panel flex items-center justify-center cursor-pointer group transition select-none"
        title="Hold SPACEBAR to talk to AURA Assistant"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <div className="absolute -top-10 right-0 bg-[#050505]/90 border border-white/10 px-3.5 py-1.5 rounded-full text-[9px] font-mono text-accentCyan tracking-widest uppercase opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-xl">
          Hold Space to Speak
        </div>
      </div>

      {isListening && (
        <div
          id="voice-assistant-overlay"
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center p-8 select-none bg-[#050505]/85 backdrop-blur-md pointer-events-none opacity-100 transition-opacity duration-300"
        >
          <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border-white/15 text-center flex flex-col items-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-full border border-accentCyan/30 bg-accentCyan/5 flex items-center justify-center mb-6">
              <span className="text-2xl text-accentCyan animate-pulse">🎤</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white mb-2">AURA Concierge Listening</h3>
            <p className="text-gray-400 text-sm font-light mb-5">"Book a Precision Cut with Marcus next Friday."</p>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-black/60 px-5 py-2 rounded-full border border-white/5">
              RELEASE SPACEBAR TO PROCESS
            </div>
          </div>
        </div>
      )}
    </>
  );
}
