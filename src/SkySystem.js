import * as THREE from 'three';

export class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.starLights = [];
    this.moon = null;
  }
  
  init() {
    this.createNightSky();
    this.createStars();
    this.createMoon();
  }
  
  createNightSky() {
    // Create a large sphere for the sky - pure black
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000, // Pure black
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }
  
  createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Create stars in a sphere around the scene
      const radius = 150 + Math.random() * 250;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Vary star colors - white, blue-white, yellow-white
      const colorVariation = Math.random();
      if (colorVariation < 0.7) {
        // White stars
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      } else if (colorVariation < 0.85) {
        // Blue-white stars
        colors[i3] = 0.8;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1;
      } else {
        // Yellow-white stars
        colors[i3] = 1;
        colors[i3 + 1] = 0.95;
        colors[i3 + 2] = 0.8;
      }
      
      // Vary star sizes
      sizes[i] = Math.random() * 3 + 1;
      
      // Add point lights for brighter stars (only for some stars to avoid performance issues)
      if (Math.random() < 0.05 && y > 0) { // Only 5% of stars emit light, and only above horizon
        const starLight = new THREE.PointLight(
          new THREE.Color(colors[i3], colors[i3 + 1], colors[i3 + 2]),
          0.1, // Low intensity
          100, // Distance
          2 // Decay
        );
        starLight.position.set(x, y, z);
        this.starLights.push(starLight);
        this.scene.add(starLight);
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }
  
  createMoon() {
    const moonGeometry = new THREE.SphereGeometry(12, 16, 16);
    const moonMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffee,
      emissive: 0x444433
    });
    
    this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
    this.moon.position.set(-80, 120, -150);
    this.scene.add(this.moon);
    
    // Add moonlight
    const moonLight = new THREE.PointLight(0xffffcc, 0.3, 300, 2);
    moonLight.position.copy(this.moon.position);
    this.scene.add(moonLight);
  }
  
  update() {
    // Slowly rotate stars for a subtle effect
    if (this.stars) {
      this.stars.rotation.y += 0.0001;
    }
    
    // Subtle twinkling effect for star lights
    this.starLights.forEach((light, index) => {
      const time = Date.now() * 0.001;
      const twinkle = Math.sin(time * 2 + index) * 0.05 + 0.1;
      light.intensity = Math.max(0.05, twinkle);
    });
  }
}