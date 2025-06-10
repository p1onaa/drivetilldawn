import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.cars = [];
    this.carModels = [];
    this.lanes = [-4.5, -1.5, 1.5, 4.5];
    this.spawnDistance = -100; // Spawn cars far ahead of player
    this.despawnDistance = 50; // Remove cars when they pass behind player
    this.spawnTimer = 0;
    this.baseSpawnInterval = 45; // Base spawn interval
    this.isLoaded = false;
    
    // Base speeds for different traffic types
    this.baseOncomingSpeed = 0.6; // Speed of all oncoming cars
    
    // Color palette for bloom effects
    this.carColors = [
      new THREE.Color(0xff4444), // Red
      new THREE.Color(0x44ff44), // Green
      new THREE.Color(0x4444ff), // Blue
      new THREE.Color(0xffff44), // Yellow
      new THREE.Color(0xff44ff), // Magenta
      new THREE.Color(0x44ffff)  // Cyan
    ];
  }
  
  async init() {
    await this.loadCarModels();
    this.isLoaded = true;
  }
  
  async loadCarModels() {
    const modelPromises = [];
    
    for (let i = 1; i <= 6; i++) {
      const promise = this.loader.loadAsync(`./models/${i}.glb`)
        .then(gltf => {
          const car = gltf.scene.clone();
          car.scale.setScalar(0.024);
          
          // Enhanced bloom effect with car's original colors
          car.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Add bloom effect using the car's original color
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    // Store original color or use a default from our palette
                    const originalColor = mat.color ? mat.color.clone() : this.carColors[i - 1];
                    
                    // Enhance material properties for bloom
                    mat.metalness = 0.3;
                    mat.roughness = 0.7;
                    // Create bloom effect using the car's original color
                    mat.emissive = originalColor.clone().multiplyScalar(0.2);
                    mat.emissiveIntensity = 0.15; // Moderate intensity for bloom
                  });
                } else {
                  const originalColor = child.material.color ? child.material.color.clone() : this.carColors[i - 1];
                  
                  child.material.metalness = 0.3;
                  child.material.roughness = 0.7;
                  child.material.emissive = originalColor.clone().multiplyScalar(0.2);
                  child.material.emissiveIntensity = 0.15;
                }
              }
            }
          });
          
          return car;
        })
        .catch(error => {
          console.warn(`Failed to load model ${i}.glb:`, error);
          return this.createFallbackCar(i);
        });
      
      modelPromises.push(promise);
    }
    
    this.carModels = await Promise.all(modelPromises);
    console.log('Traffic car models loaded:', this.carModels.length);
  }
  
  createFallbackCar(index) {
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const carColor = this.carColors[index - 1] || new THREE.Color(0x888888);
    const material = new THREE.MeshLambertMaterial({ 
      color: carColor,
      emissive: carColor.clone().multiplyScalar(0.2),
      emissiveIntensity: 0.15
    });
    const car = new THREE.Mesh(geometry, material);
    car.castShadow = true;
    car.receiveShadow = true;
    
    return car;
  }
  
  update(speedMultiplier = 1.0) {
    if (!this.isLoaded) return;
    
    // Adjust spawn rate based on speed - faster game = more frequent spawning
    const currentSpawnInterval = Math.max(
      this.baseSpawnInterval / speedMultiplier,
      20 // Minimum spawn interval to prevent overwhelming
    );
    
    this.spawnTimer++;
    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnCar(speedMultiplier);
      this.spawnTimer = 0;
    }
    
    this.updateCars(speedMultiplier);
    this.cleanupCars();
  }
  
  spawnCar(speedMultiplier = 1.0) {
    if (Math.random() < 0.8) { // 80% chance to spawn a car
      const laneIndex = Math.floor(Math.random() * 4);
      const modelIndex = Math.floor(Math.random() * this.carModels.length);
      const carModel = this.carModels[modelIndex].clone();
      
      // Position the car
      carModel.position.x = this.lanes[laneIndex];
      carModel.position.y = 0;
      
      // All cars are now oncoming traffic - spawn far ahead and move toward player
      // Apply speed multiplier to make traffic faster as game progresses
      const baseSpeed = this.baseOncomingSpeed + (Math.random() * 0.3 - 0.15); // Slight speed variation
      const speed = baseSpeed * speedMultiplier;
      const startZ = this.spawnDistance; // Far ahead of player
      const rotation = Math.PI; // Cars face toward player (correct orientation)
      
      carModel.position.z = startZ;
      carModel.rotation.y = rotation;
      
      // Create car object with metadata
      const carData = {
        mesh: carModel,
        speed: speed,
        lane: laneIndex,
        boundingBox: new THREE.Box3().setFromObject(carModel)
      };
      
      this.cars.push(carData);
      this.scene.add(carModel);
    }
  }
  
  updateCars(speedMultiplier = 1.0) {
    this.cars.forEach(car => {
      // All cars move toward the player (positive Z direction - from far ahead to behind)
      car.mesh.position.z += car.speed;
      
      // Update bounding box
      car.boundingBox.setFromObject(car.mesh);
      
      // Add subtle movement variation for realism
      const time = Date.now() * 0.001;
      car.mesh.position.y = Math.sin(time * 2 + car.mesh.position.x) * 0.02;
    });
  }
  
  cleanupCars() {
    this.cars = this.cars.filter(car => {
      const shouldRemove = car.mesh.position.z > this.despawnDistance || 
                          car.mesh.position.z < this.spawnDistance - 20;
      
      if (shouldRemove) {
        this.scene.remove(car.mesh);
        return false;
      }
      return true;
    });
  }
  
  checkCollision(playerBoundingBox) {
    for (let car of this.cars) {
      if (playerBoundingBox.intersectsBox(car.boundingBox)) {
        return true;
      }
    }
    return false;
  }
  
  getCars() {
    return this.cars;
  }
}