import * as THREE from 'three';

export class SkySystem {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.starLights = [];
    this.moon = null;
    this.starParticles = [];
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
    // Create multiple star layers for depth and variety
    this.createStarLayer(1500, 150, 300, 1.5, 0.8); // Distant stars
    this.createStarLayer(800, 100, 200, 2.5, 1.2);  // Medium distance stars
    this.createStarLayer(400, 80, 150, 3.5, 1.8);   // Close stars
    
    // Create individual bright stars with point lights
    this.createBrightStars();
  }
  
  createStarLayer(starCount, minRadius, maxRadius, baseSize, opacity) {
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Create stars in a more realistic distribution
      // Use spherical coordinates with bias toward horizon
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const theta = Math.random() * Math.PI * 2; // Full rotation
      
      // Bias toward horizon (more stars visible at eye level)
      let phi = Math.random() * Math.PI;
      if (Math.random() < 0.6) {
        // 60% chance for horizon-biased distribution
        phi = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
      }
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      positions[i3] = x;
      positions[i3 + 1] = Math.max(y, 5); // Keep stars above ground
      positions[i3 + 2] = z;
      
      // More realistic star colors based on stellar classification
      const colorType = Math.random();
      if (colorType < 0.4) {
        // White stars (most common)
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      } else if (colorType < 0.6) {
        // Blue-white stars
        colors[i3] = 0.7;
        colors[i3 + 1] = 0.85;
        colors[i3 + 2] = 1;
      } else if (colorType < 0.8) {
        // Yellow-white stars
        colors[i3] = 1;
        colors[i3 + 1] = 0.95;
        colors[i3 + 2] = 0.7;
      } else if (colorType < 0.95) {
        // Orange stars
        colors[i3] = 1;
        colors[i3 + 1] = 0.7;
        colors[i3 + 2] = 0.4;
      } else {
        // Red stars (rare)
        colors[i3] = 1;
        colors[i3 + 1] = 0.5;
        colors[i3 + 2] = 0.3;
      }
      
      // Vary star sizes with realistic distribution (most stars are small)
      const sizeRandom = Math.random();
      if (sizeRandom < 0.7) {
        sizes[i] = baseSize * (0.3 + Math.random() * 0.4); // Small stars
      } else if (sizeRandom < 0.9) {
        sizes[i] = baseSize * (0.7 + Math.random() * 0.6); // Medium stars
      } else {
        sizes[i] = baseSize * (1.2 + Math.random() * 0.8); // Large stars
      }
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create custom shader material for circular stars
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float time;
        
        void main() {
          vColor = color;
          vSize = size;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Add subtle twinkling by varying size
          float twinkle = sin(time * 2.0 + position.x * 0.01 + position.z * 0.01) * 0.3 + 1.0;
          gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          // Create circular stars instead of square
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) {
            discard;
          }
          
          // Create soft glow effect
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha = pow(alpha, 0.8);
          
          // Add bright center
          float centerGlow = 1.0 - smoothstep(0.0, 0.2, dist);
          alpha += centerGlow * 0.8;
          
          gl_FragColor = vec4(vColor, alpha * ${opacity});
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.starParticles.push({ points: stars, material: starMaterial });
    this.scene.add(stars);
  }
  
  createBrightStars() {
    // Create individual bright stars that emit light
    const brightStarCount = 25;
    
    for (let i = 0; i < brightStarCount; i++) {
      // Position bright stars
      const radius = 120 + Math.random() * 180;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.PI * 0.2 + Math.random() * Math.PI * 0.6; // Keep above horizon
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = Math.max(radius * Math.cos(phi), 10);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Create star colors
      const colorType = Math.random();
      let starColor;
      if (colorType < 0.3) {
        starColor = new THREE.Color(0.7, 0.85, 1.0); // Blue-white
      } else if (colorType < 0.6) {
        starColor = new THREE.Color(1.0, 1.0, 1.0); // White
      } else if (colorType < 0.85) {
        starColor = new THREE.Color(1.0, 0.95, 0.7); // Yellow-white
      } else {
        starColor = new THREE.Color(1.0, 0.7, 0.4); // Orange
      }
      
      // Create visible star geometry
      const starGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 8);
      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.9
      });
      
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(x, y, z);
      this.scene.add(starMesh);
      
      // Add point light for each bright star
      const intensity = 0.15 + Math.random() * 0.25;
      const distance = 80 + Math.random() * 40;
      
      const starLight = new THREE.PointLight(starColor, intensity, distance, 2);
      starLight.position.set(x, y, z);
      
      // Store additional properties for twinkling
      starLight.userData = {
        baseIntensity: intensity,
        twinkleSpeed: 1 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
        mesh: starMesh,
        baseMeshOpacity: starMaterial.opacity
      };
      
      this.starLights.push(starLight);
      this.scene.add(starLight);
    }
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
    const moonLight = new THREE.PointLight(0xffffcc, 0.4, 350, 2);
    moonLight.position.copy(this.moon.position);
    this.scene.add(moonLight);
  }
  
  update() {
    const time = Date.now() * 0.001;
    
    // Update shader uniforms for twinkling
    this.starParticles.forEach(starLayer => {
      if (starLayer.material.uniforms) {
        starLayer.material.uniforms.time.value = time;
      }
    });
    
    // Slowly rotate star layers for subtle movement
    this.starParticles.forEach((starLayer, index) => {
      starLayer.points.rotation.y += (0.00005 + index * 0.00002);
    });
    
    // Enhanced twinkling effect for bright stars
    this.starLights.forEach((light, index) => {
      const userData = light.userData;
      const twinkle = Math.sin(time * userData.twinkleSpeed + userData.twinkleOffset) * 0.4 + 0.6;
      const randomFlicker = Math.sin(time * 8 + index) * 0.1 + 0.9;
      
      // Apply twinkling to light intensity
      light.intensity = userData.baseIntensity * twinkle * randomFlicker;
      
      // Apply twinkling to visible star mesh
      if (userData.mesh && userData.mesh.material) {
        userData.mesh.material.opacity = userData.baseMeshOpacity * (twinkle * 0.8 + 0.2);
      }
    });
  }
}