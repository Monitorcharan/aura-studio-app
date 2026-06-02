import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';

// Simplex Noise GLSL Code
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

// Vertex Shader with liquid deformation
const vertexShader = GLSL_NOISE + `
uniform float uTime;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform vec3 uMouseCoords;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying vec3 vViewPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Compute vertex displacement using 3D simplex noise
    vec3 noisePos = position * uNoiseFreq + vec3(0.0, uTime * 0.25, uTime * 0.15);
    float noiseVal = snoise(noisePos);
    
    // Dynamic interaction: ripple on cursor closeness
    float distToMouse = distance(position, uMouseCoords);
    float mouseInfluence = smoothstep(2.0, 0.0, distToMouse) * 0.45;
    
    float totalDisplacement = (noiseVal * uNoiseAmp) + (mouseInfluence * uNoiseAmp * 3.0);
    vec3 displacedPosition = position + normal * totalDisplacement;
    
    vec4 modelViewPos = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -modelViewPos.xyz;
    vPosition = displacedPosition;
    vNoise = noiseVal;
    
    gl_Position = projectionMatrix * modelViewPos;
}
`;

// Fragment Shader with iridescent outline glow
const fragmentShader = `
uniform vec3 uColor1; // Cyber Cyan (#00F0FF)
uniform vec3 uColor2; // Purple (#8A2BE2)
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel factor for outline reflection
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    
    // Iridescent base colors shifting based on y-position and noise
    vec3 baseColor = mix(uColor1, uColor2, sin(vPosition.y * 1.8 + uTime * 0.4) * 0.5 + 0.5);
    
    // Cinematic highlight
    vec3 rimReflection = vec3(0.95, 0.98, 1.0) * fresnel * 0.85;
    
    // Diffuse directional shading
    float diffuse = max(dot(normal, normalize(vec3(1.0, 1.5, 0.7))), 0.0);
    
    // Final blend
    vec3 finalColor = baseColor * (diffuse * 0.45 + 0.25) + rimReflection;
    
    // Edge neon cyan glow
    finalColor += uColor1 * fresnel * 0.5;
    
    gl_FragColor = vec4(finalColor, 0.95);
}
`;

export default function WebGLBackground() {
  const containerRef = useRef(null);
  const location = useLocation();
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Build Three Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2(-999, -999);
    const targetMouse3D = new THREE.Vector3(10, 10, 10);
    const currentMouse3D = new THREE.Vector3(10, 10, 10);

    // Geometry & Material
    const geometry = new THREE.SphereGeometry(1.6, 128, 128);
    const uniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0.55 },
      uNoiseAmp: { value: 0.28 },
      uColor1: { value: new THREE.Color('#00F0FF') },
      uColor2: { value: new THREE.Color('#8A2BE2') },
      uMouseCoords: { value: new THREE.Vector3(10, 10, 10) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: true,
      depthTest: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = window.innerWidth > 768 ? 1.6 : 0;
    mesh.position.y = 0;
    scene.add(mesh);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(-6, 6, -6);
    scene.add(rimLight);

    const cursorLight = new THREE.PointLight(0x00F0FF, 3.5, 15);
    cursorLight.position.set(10, 10, 10);
    scene.add(cursorLight);

    // Chrono-Dynamic Lighting initialization
    const hour = new Date().getHours();
    let ambColor, ambIntensity, dirColor, dirIntensity, dirPos;
    let isNight = false;
    let isMorning = false;

    if (hour >= 5 && hour < 12) {
      ambColor = '#FFF5E0';
      ambIntensity = 0.6;
      dirColor = '#FFE79A';
      dirIntensity = 3.4;
      dirPos = { x: -7, y: 6, z: -5 };
      isMorning = true;
    } else if (hour >= 12 && hour < 18) {
      ambColor = '#FFFFFF';
      ambIntensity = 0.5;
      dirColor = '#FFFFFF';
      dirIntensity = 2.5;
      dirPos = { x: 5, y: 9, z: -5 };
    } else {
      ambColor = '#12042C';
      ambIntensity = 0.3;
      dirColor = '#00F0FF';
      dirIntensity = 4.5;
      dirPos = { x: 6, y: 4, z: -8 };
      isNight = true;
    }

    gsap.to(ambient.color, { r: new THREE.Color(ambColor).r, g: new THREE.Color(ambColor).g, b: new THREE.Color(ambColor).b, duration: 2 });
    gsap.to(ambient, { intensity: ambIntensity, duration: 2 });
    
    gsap.to(rimLight.color, { r: new THREE.Color(dirColor).r, g: new THREE.Color(dirColor).g, b: new THREE.Color(dirColor).b, duration: 2 });
    gsap.to(rimLight, { intensity: dirIntensity, duration: 2 });
    gsap.to(rimLight.position, { x: dirPos.x, y: dirPos.y, z: dirPos.z, duration: 2 });

    let neonPurpleLight = null;
    if (isNight) {
      neonPurpleLight = new THREE.PointLight(0x8A2BE2, 4.0, 12);
      neonPurpleLight.position.set(-5, -2, 2);
      scene.add(neonPurpleLight);
    }

    // Morning God-Rays
    let godRayParticles = null;
    let godRayParticleVelocities = [];
    if (isMorning) {
      const particleCount = 150;
      const grGeo = new THREE.BufferGeometry();
      const grPositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        grPositions[i * 3] = (Math.random() - 0.5) * 15;
        grPositions[i * 3 + 1] = Math.random() * 10 - 3;
        grPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        godRayParticleVelocities.push({
          x: 0.003 + Math.random() * 0.008,
          y: -0.008 - Math.random() * 0.012,
          z: (Math.random() - 0.5) * 0.004
        });
      }
      grGeo.setAttribute('position', new THREE.BufferAttribute(grPositions, 3));
      const grMat = new THREE.PointsMaterial({
        color: 0xFFF9C4,
        size: 0.07,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      godRayParticles = new THREE.Points(grGeo, grMat);
      scene.add(godRayParticles);
    }

    const animateMorningGodRays = () => {
      if (!godRayParticles) return;
      const posArr = godRayParticles.geometry.attributes.position.array;
      for (let i = 0; i < godRayParticleVelocities.length; i++) {
        posArr[i * 3] += godRayParticleVelocities[i].x;
        posArr[i * 3 + 1] += godRayParticleVelocities[i].y;
        posArr[i * 3 + 2] += godRayParticleVelocities[i].z;

        if (posArr[i * 3 + 1] < -5) {
          posArr[i * 3 + 1] = 5;
          posArr[i * 3] = (Math.random() - 0.5) * 15;
        }
        if (posArr[i * 3] > 7) {
          posArr[i * 3] = -7;
        }
      }
      godRayParticles.geometry.attributes.position.needsUpdate = true;
    };

    // Persistent Background Particle Swarm
    const particleCount = 350;
    const bgGeo = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(particleCount * 3);
    const particleBases = [];
    const particleOffsets = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 8 - 2;

      bgPositions[i * 3] = x;
      bgPositions[i * 3 + 1] = y;
      bgPositions[i * 3 + 2] = z;

      particleBases.push(new THREE.Vector3(x, y, z));
      particleOffsets.push({
        speed: 0.3 + Math.random() * 0.6,
        amp: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2
      });
    }

    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0x88F0FF,
      size: 0.05,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const bgParticles = new THREE.Points(bgGeo, bgMat);
    scene.add(bgParticles);

    const animateBackgroundParticles = (timeSecs) => {
      const posArr = bgParticles.geometry.attributes.position.array;
      const cursor = cursorLight.position;

      for (let i = 0; i < particleBases.length; i++) {
        const px = posArr[i * 3];
        const py = posArr[i * 3 + 1];
        const pz = posArr[i * 3 + 2];
        const base = particleBases[i];
        const offset = particleOffsets[i];

        const driftY = Math.sin(timeSecs * offset.speed + offset.phase) * offset.amp;
        const targetX = base.x;
        const targetY = base.y + driftY;
        const targetZ = base.z;

        const dx = px - cursor.x;
        const dy = py - cursor.y;
        const dz = pz - cursor.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const repelRange = 2.4;

        let forceX = 0, forceY = 0, forceZ = 0;
        if (dist < repelRange) {
          const force = (repelRange - dist) * 0.12;
          forceX = (dx / dist) * force;
          forceY = (dy / dist) * force;
          forceZ = (dz / dist) * force;
        }

        posArr[i * 3] += (targetX + forceX - px) * 0.08;
        posArr[i * 3 + 1] += (targetY + forceY - py) * 0.08;
        posArr[i * 3 + 2] += (targetZ + forceZ - pz) * 0.08;
      }
      bgParticles.geometry.attributes.position.needsUpdate = true;
    };

    // Success Burst Shockwave variables
    let shockwaveParticles = null;
    let shockwaveDirections = [];

    const triggerSuccessShockwave = () => {
      const swCount = 300;
      const swGeo = new THREE.BufferGeometry();
      const swPositions = new Float32Array(swCount * 3);
      shockwaveDirections = [];

      const origin = mesh.position;

      for (let i = 0; i < swCount; i++) {
        swPositions[i * 3] = origin.x;
        swPositions[i * 3 + 1] = origin.y;
        swPositions[i * 3 + 2] = origin.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        const dx = Math.sin(phi) * Math.cos(theta);
        const dy = Math.sin(phi) * Math.sin(theta);
        const dz = Math.cos(phi);

        const speed = 0.04 + Math.random() * 0.08;
        shockwaveDirections.push(new THREE.Vector3(dx * speed, dy * speed, dz * speed));
      }

      swGeo.setAttribute('position', new THREE.BufferAttribute(swPositions, 3));
      const swMat = new THREE.PointsMaterial({
        color: 0x00F0FF,
        size: 0.09,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      shockwaveParticles = new THREE.Points(swGeo, swMat);
      scene.add(shockwaveParticles);
    };

    const animateSuccessShockwave = () => {
      if (!shockwaveParticles) return;
      const posArr = shockwaveParticles.geometry.attributes.position.array;
      const swMat = shockwaveParticles.material;

      for (let i = 0; i < shockwaveDirections.length; i++) {
        const dir = shockwaveDirections[i];
        posArr[i * 3] += dir.x;
        posArr[i * 3 + 1] += dir.y;
        posArr[i * 3 + 2] += dir.z;

        dir.multiplyScalar(0.96); // air resistance
      }
      shockwaveParticles.geometry.attributes.position.needsUpdate = true;

      swMat.opacity -= 0.007;
      if (swMat.opacity <= 0) {
        scene.remove(shockwaveParticles);
        shockwaveParticles = null;
      }
    };

    // Camera Zoom-In on Load
    const zoomCameraIn = () => {
      camera.position.z = 18;
      gsap.to(camera.position, {
        z: 6,
        duration: 2.2,
        ease: 'expo.out'
      });
    };

    // Page Transition layout changer
    const transitionPage = (page) => {
      let targetX = 0;
      let targetY = 0;
      let targetScale = 1;

      if (page === 'login' || page === 'register') {
        targetX = window.innerWidth > 992 ? -1.8 : 0;
        targetY = window.innerWidth > 992 ? 0.2 : 1.6;
        targetScale = window.innerWidth > 992 ? 1.05 : 0.8;
        gsap.to(uniforms.uNoiseAmp, { value: 0.35, duration: 1 });
        gsap.to(uniforms.uNoiseFreq, { value: 0.45, duration: 1 });
      } else if (page === 'booking') {
        targetX = window.innerWidth > 992 ? 1.8 : 0;
        targetY = window.innerWidth > 992 ? -0.4 : 1.8;
        targetScale = 0.9;
        gsap.to(uniforms.uNoiseAmp, { value: 0.22, duration: 1 });
      } else if (page === 'confirmation') {
        targetX = 0;
        targetY = 0;
        targetScale = 1.3;
        gsap.to(uniforms.uNoiseAmp, { value: 0.45, duration: 1.5 });
        gsap.fromTo(uniforms.uNoiseAmp, { value: 0.8 }, { value: 0.3, duration: 2.5, ease: 'power2.out' });
        
        setTimeout(() => triggerSuccessShockwave(), 500);
      } else if (page === 'admin') {
        targetX = window.innerWidth > 992 ? 2.5 : 0;
        targetY = window.innerWidth > 992 ? -1.8 : 2.2;
        targetScale = 0.6;
        gsap.to(uniforms.uNoiseAmp, { value: 0.16, duration: 1 });
      } else {
        // default / home
        targetX = window.innerWidth > 768 ? 1.6 : 0;
        targetY = 0;
        targetScale = 1;
        gsap.to(uniforms.uNoiseAmp, { value: 0.28, duration: 1 });
        gsap.to(uniforms.uNoiseFreq, { value: 0.55, duration: 1 });
      }

      gsap.to(mesh.position, { x: targetX, y: targetY, duration: 1.5, ease: 'power3.inOut' });
      gsap.to(mesh.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 1.5, ease: 'power3.inOut' });
    };

    const handleScroll = (progress) => {
      // scroll progress multiplier
      mesh.rotation.y = progress * Math.PI * 2.5;
      mesh.rotation.z = progress * Math.PI * 1.2;

      let scale = 1 - progress * 0.35;
      mesh.scale.set(scale, scale, scale);

      let targetX = window.innerWidth > 768 ? (1.6 - progress * 1.6) : 0;
      let targetY = -progress * 1.2;
      mesh.position.x = targetX;
      mesh.position.y = targetY;

      let noiseAmp = 0.28 + Math.sin(progress * Math.PI) * 0.35;
      uniforms.uNoiseAmp.value = noiseAmp;
    };

    // Events
    const onMouseMove = (e) => {
      mouse2D.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Re-trigger layout alignment on resize
      const pagePath = window.location.pathname;
      let curPage = 'home';
      if (pagePath.includes('login')) curPage = 'login';
      else if (pagePath.includes('register')) curPage = 'register';
      else if (pagePath.includes('booking')) curPage = 'booking';
      else if (pagePath.includes('admin')) curPage = 'admin';
      
      if (curPage === 'login' || curPage === 'register') {
        mesh.position.x = window.innerWidth > 992 ? -1.8 : 0;
      } else {
        mesh.position.x = window.innerWidth > 768 ? 1.6 : 0;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    // Global reference for parent or sibling controls
    window.AuraWebGL = {
      scene,
      cameraZoomIn: zoomCameraIn,
      transitionPage: transitionPage,
      handleScroll: handleScroll,
      triggerShockwave: triggerSuccessShockwave
    };

    sceneRef.current = { transitionPage, handleScroll, zoomCameraIn };

    // Initial transition based on path
    const getPageName = (path) => {
      if (path.includes('login')) return 'login';
      if (path.includes('register')) return 'register';
      if (path.includes('booking')) return 'booking';
      if (path.includes('admin')) return 'admin';
      if (path.includes('confirmation')) return 'confirmation';
      return 'home';
    };
    transitionPage(getPageName(window.location.pathname));

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const timeSecs = clock.getElapsedTime();
      uniforms.uTime.value = timeSecs;

      mesh.rotation.y += 0.0035;
      mesh.rotation.x += 0.002;

      // Mouse Raycasting
      if (mouse2D.x !== -999) {
        raycaster.setFromCamera(mouse2D, camera);
        const intersects = raycaster.intersectObject(mesh);

        if (intersects.length > 0) {
          const localPoint = mesh.worldToLocal(intersects[0].point.clone());
          targetMouse3D.copy(localPoint);
        } else {
          targetMouse3D.set(10, 10, 10);
        }
      }

      currentMouse3D.lerp(targetMouse3D, 0.08);
      uniforms.uMouseCoords.value.copy(currentMouse3D);

      // Light following mouse
      if (mouse2D.x !== -999) {
        const vector = new THREE.Vector3(mouse2D.x, mouse2D.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        cursorLight.position.lerp(new THREE.Vector3(pos.x, pos.y, 2.5), 0.1);
      }

      animateMorningGodRays();
      animateBackgroundParticles(timeSecs);
      animateSuccessShockwave();

      renderer.render(scene, camera);
    };

    renderLoop();

    // Cleanups
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (godRayParticles) {
        godRayParticles.geometry.dispose();
        godRayParticles.material.dispose();
      }
      bgParticles.geometry.dispose();
      bgParticles.material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      window.AuraWebGL = null;
    };
  }, []);

  // Update layout when route changes
  useEffect(() => {
    if (sceneRef.current) {
      const getPageName = (path) => {
        if (path.includes('login')) return 'login';
        if (path.includes('register')) return 'register';
        if (path.includes('booking')) return 'booking';
        if (path.includes('admin')) return 'admin';
        if (path.includes('confirmation')) return 'confirmation';
        return 'home';
      };
      sceneRef.current.transitionPage(getPageName(location.pathname));
    }
  }, [location.pathname]);

  return <div id="canvas-container" ref={containerRef} className="interactive-3d fixed inset-0 z-0 pointer-events-none" />;
}
