import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ObstacleSystem {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.obstacles = [];
    this.carModels = [];
    this.lanes = [-4.5, -1.5, 1.5, 4.5];
    
    // Spawn settings
    this.spawnDistance = -100;
    this.despawnDistance = 50;
    this.spawnTimer = 0;
    this.spawnInterval = 2000; // milliseconds
    this.lastSpawnTime = 0;
    
    // Speed settings
    this.forwardLaneSpeed = 0.1; // Same direction as player (slower)
    this.oncomingLaneSpeed = 0.8; // Opposite direction (faster)
    
    this.isLoaded = false;
  }
  
  async init() {
    await this.loadCarModels();
    this.isLoaded = true;
    console.log('Obstacle system initialized');
  }
  
  async loadCarModels() {
    const modelPromises = [];
    
    for (let i = 1; i <= 6; i++) {
      const promise = this.loader.loadAsync(`./models/${i}.glb`)
        .then(gltf => {
          const model = gltf.scene.clone();
          model.scale.setScalar(0.024);
          
          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          return model;
        })
        .catch(error => {
          console.warn(`Failed to load model ${i}.glb:`, error);
          return this.createFallbackCar(i);
        });
      
      modelPromises.push(promise);
    }
    
    this.carModels = await Promise.all(modelPromises);
    console.log(`Loaded ${this.carModels.length} car models`);
  }
  
  createFallbackCar(index) {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshLambertMaterial({ 
      color: colors[index - 1] || 0x888888 
    });
    const car = new THREE.Mesh(geometry, material);
    car.castShadow = true;
    car.receiveShadow = true;
    return car;
  }
  
  spawnObstacle() {
    if (!this.isLoaded || this.carModels.length === 0) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastSpawnTime < this.spawnInterval) return;
    
    // Random lane selection
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const laneX = this.lanes[laneIndex];
    
    // Random car model
    const modelIndex = Math.floor(Math.random() * this.carModels.length);
    const carModel = this.carModels[modelIndex].clone();
    
    // Position the car
    carModel.position.set(laneX, 0, this.spawnDistance);
    
    // Determine direction and speed based on lane
    let speed, rotation;
    if (laneIndex < 2) {
      // Left lanes - oncoming traffic (toward player)
      speed = this.oncomingLaneSpeed;
      rotation = Math.PI; // Face toward player
    } else {
      // Right lanes - same direction traffic (away from player)
      speed = this.forwardLaneSpeed;
      rotation = 0; // Face away from player
    }
    
    carModel.rotation.y = rotation;
    
    const obstacle = {
      mesh: carModel,
      speed: speed,
      lane: laneIndex,
      isOncoming: laneIndex < 2
    };
    
    this.obstacles.push(obstacle);
    this.scene.add(carModel);
    this.lastSpawnTime = currentTime;
  }
  
  update() {
    if (!this.isLoaded) return;
    
    // Spawn new obstacles
    this.spawnObstacle();
    
    // Update existing obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      if (obstacle.isOncoming) {
        // Oncoming traffic moves toward player
        obstacle.mesh.position.z += obstacle.speed;
      } else {
        // Same direction traffic moves away from player
        obstacle.mesh.position.z -= obstacle.speed;
      }
      
      // Remove obstacles that are out of view
      if (obstacle.mesh.position.z > this.despawnDistance || 
          obstacle.mesh.position.z < this.spawnDistance - 50) {
        this.scene.remove(obstacle.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }
  
  checkCollision(playerCar) {
    if (!playerCar) return false;
    
    const playerBox = new THREE.Box3().setFromObject(playerCar);
    
    for (const obstacle of this.obstacles) {
      const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
      
      if (playerBox.intersectsBox(obstacleBox)) {
        console.log('Game Over - Collision detected!');
        return true;
      }
    }
    
    return false;
  }
  
  getObstacles() {
    return this.obstacles;
  }
}