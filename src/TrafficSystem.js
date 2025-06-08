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
          
          // Enhanced bloom effect for better visibility
          car.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Add bloom effect instead of glow
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    // Enhance material properties for bloom
                    mat.metalness = 0.3;
                    mat.roughness = 0.7;
                    mat.emissive = new THREE.Color(0x111122); // Subtle blue emissive
                    mat.emissiveIntensity = 0.1; // Low intensity for bloom
                  });
                } else {
                  child.material.metalness = 0.3;
                  child.material.roughness = 0.7;
                  child.material.emissive = new THREE.Color(0x111122);
                  child.material.emissiveIntensity = 0.1;
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
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshLambertMaterial({ 
      color: colors[index - 1] || 0x888888,
      emissive: new THREE.Color(0x111122),
      emissiveIntensity: 0.1
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
        // Return collision info including the collision point
        const collisionPoint = new THREE.Vector3();
        playerBoundingBox.getCenter(collisionPoint);
        
        return {
          collision: true,
          collisionPoint: collisionPoint,
          car: car
        };
      }
    }
    return { collision: false };
  }
  
  getCars() {
    return this.cars;
  }
}