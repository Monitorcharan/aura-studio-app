import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function DigitalTwin({ selectedStylistId, onSelectStylist }) {
  const containerRef = useRef(null);
  const twinRef = useRef(null);

  const stylists = [
    { id: 'marcus', name: 'Marcus Vance', title: 'Master Barber / Creative Director', rating: '4.9', bio: 'Specializes in surgical precision fades, hair tattooing, and futuristic geometry cuts.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', chairX: -1.4 },
    { id: 'elena', name: 'Elena Rostova', title: 'Senior Chromatic Specialist', rating: '5.0', bio: 'Expert in futuristic metallic dyeing, iridescent chromatics, and advanced tone texturing.', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250', chairX: 0 },
    { id: 'sophia', name: 'Sophia Sterling', title: 'Luxury Session Stylist', rating: '4.8', bio: 'Renowned for high-fashion runway waves, red carpet blowout shapes, and therapeutic scalp health.', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250', chairX: 1.4 }
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 3.5, 6.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const chairs = [];
    let hoveredChair = null;
    let selectedChair = null;

    // Floor Plate
    const floorGeo = new THREE.BoxGeometry(4.5, 0.05, 3.2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.15,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Overlay
    const grid = new THREE.GridHelper(4.5, 12, 0x333333, 0x222222);
    grid.position.y = 0.01;
    scene.add(grid);

    // Focus Ring for A11y
    const ringGeo = new THREE.RingGeometry(0.38, 0.42, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const focusRing = new THREE.Mesh(ringGeo, ringMat);
    focusRing.rotation.x = -Math.PI / 2;
    focusRing.position.y = 0.02;
    focusRing.visible = false;
    scene.add(focusRing);

    // Build Stations
    stylists.forEach((stylist, index) => {
      const group = new THREE.Group();
      group.position.x = stylist.chairX;
      group.position.z = -0.4;

      // Mirror vertical panel
      const mirrorGeo = new THREE.BoxGeometry(0.8, 1.6, 0.05);
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.05,
        metalness: 0.95
      });
      const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirror.position.set(0, 0.8, -0.8);
      group.add(mirror);

      // Backlight
      const backLightColor = index === 0 ? 0x00F0FF : (index === 1 ? 0x8A2BE2 : 0x00FFFF);
      const backLight = new THREE.PointLight(backLightColor, 2.5, 4);
      backLight.position.set(0, 0.8, -0.9);
      group.add(backLight);

      // Styling chair group
      const chairGroup = new THREE.Group();
      chairGroup.name = `chair-${stylist.id}`;
      chairGroup.userData = { stylist, index };

      // Chrome base
      const baseGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.03, 24);
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 });
      const base = new THREE.Mesh(baseGeo, chromeMat);
      base.position.y = 0.015;
      chairGroup.add(base);

      // Support pole
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
      const pole = new THREE.Mesh(poleGeo, chromeMat);
      pole.position.y = 0.175;
      chairGroup.add(pole);

      // Cushion Seat
      const seatGeo = new THREE.BoxGeometry(0.48, 0.08, 0.46);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.1 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.38;
      seat.castShadow = true;
      chairGroup.add(seat);

      // Curved Backrest
      const backGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 24, Math.PI);
      const back = new THREE.Mesh(backGeo, seatMat);
      back.position.set(0, 0.58, 0.2);
      back.rotation.x = Math.PI * 0.15;
      chairGroup.add(back);

      group.add(chairGroup);
      chairs.push(chairGroup);
      scene.add(group);
    });

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const point1 = new THREE.PointLight(0xffffff, 1.8, 12);
    point1.position.set(-2, 3.5, 3);
    scene.add(point1);

    const point2 = new THREE.PointLight(0xffffff, 1.2, 12);
    point2.position.set(2, 3.5, 3);
    scene.add(point2);

    // Select chair logic
    const selectChair = (chair, skipCallback = false) => {
      if (selectedChair === chair) return;
      selectedChair = chair;
      const stylist = chair.userData.stylist;

      // Animate selection with GSAP
      chairs.forEach(c => {
        const isTarget = c === chair;
        gsap.to(c.position, {
          y: isTarget ? 0.28 : 0,
          duration: 0.6,
          ease: 'power3.out'
        });

        c.children.forEach(child => {
          if (child.material && child.material !== ringMat) {
            const isCushion = child.geometry.type === 'BoxGeometry' || child.geometry.type === 'TorusGeometry';
            if (isCushion) {
              gsap.to(child.material.color, {
                r: isTarget ? 0.0 : 0.13,
                g: isTarget ? 0.94 : 0.13,
                b: isTarget ? 1.0 : 0.13,
                duration: 0.4
              });
              child.material.emissive = new THREE.Color(isTarget ? 0x002233 : 0x000000);
            }
          }
        });
      });

      focusRing.visible = false;

      if (!skipCallback && onSelectStylist) {
        onSelectStylist(stylist.id);
      }
    };

    const selectChairByName = (name, skipCallback = false) => {
      const target = chairs.find(c => c.userData.stylist.id === name.toLowerCase());
      if (target) {
        selectChair(target, skipCallback);
        focusRing.position.set(target.parent.position.x, 0.02, target.parent.position.z + target.position.z);
        focusRing.visible = true;
      }
    };

    const focusChairByIndex = (idx) => {
      const chair = chairs[idx];
      if (chair) {
        focusRing.position.set(chair.parent.position.x, 0.02, chair.parent.position.z + chair.position.z);
        focusRing.visible = true;
        selectChair(chair);
      }
    };

    // Events
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };

    const onMouseLeave = () => {
      mouse.set(-999, -999);
    };

    const onClick = () => {
      if (hoveredChair) {
        selectChair(hoveredChair);
      }
    };

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    // Expose select by index/name to window or refs
    window.AuraDigitalTwin = {
      instance: { focusChairByIndex },
      selectChairByName
    };

    twinRef.current = { selectChairByName };

    // Select initial stylist if matches
    if (selectedStylistId) {
      selectChairByName(selectedStylistId, true);
    }

    // Animation Loop
    let animId;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      // Raycast hover
      if (mouse.x !== -999) {
        raycaster.setFromCamera(mouse, camera);
        let foundHover = null;
        for (let chair of chairs) {
          const intersects = raycaster.intersectObjects(chair.children, true);
          if (intersects.length > 0) {
            foundHover = chair;
            break;
          }
        }

        if (foundHover !== hoveredChair) {
          if (hoveredChair && hoveredChair !== selectedChair) {
            hoveredChair.children.forEach(child => {
              const isCushion = child.geometry && (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'TorusGeometry');
              if (isCushion && child.material) {
                gsap.to(child.material.color, { r: 0.13, g: 0.13, b: 0.13, duration: 0.3 });
              }
            });
          }

          hoveredChair = foundHover;

          if (hoveredChair && hoveredChair !== selectedChair) {
            hoveredChair.children.forEach(child => {
              const isCushion = child.geometry && (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'TorusGeometry');
              if (isCushion && child.material) {
                gsap.to(child.material.color, { r: 0.4, g: 0.2, b: 0.6, duration: 0.2 });
              }
            });
          }
        }
      } else if (hoveredChair && hoveredChair !== selectedChair) {
        hoveredChair.children.forEach(child => {
          const isCushion = child.geometry && (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'TorusGeometry');
          if (isCushion && child.material) {
            gsap.to(child.material.color, { r: 0.13, g: 0.13, b: 0.13, duration: 0.3 });
          }
        });
        hoveredChair = null;
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    // Cleanups
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      chairs.forEach(c => {
        c.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      window.AuraDigitalTwin = null;
    };
  }, [onSelectStylist]);

  // Handle selectedStylistId updates from parent (e.g. from state or AI event)
  useEffect(() => {
    if (selectedStylistId && twinRef.current) {
      twinRef.current.selectChairByName(selectedStylistId, true);
    }
  }, [selectedStylistId]);

  return <div ref={containerRef} className="w-full h-[280px] rounded-2xl bg-black/20 border border-white/5 relative overflow-hidden mt-3" />;
}
