import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoadSystem } from './RoadSystem.js';
import { SkySystem } from './SkySystem.js';
import { ObstacleSystem } from './ObstacleSystem.js';

export class GameScene {
  constructor(scene) {
    this.scene = scene;
    this.car = null;
    this.roadSystem = null;
    this.skySystem = null;
    this.obstacleSystem = null;
    this.loader = new GLTFLoader();
    
    // Lane positions (4 lanes total)
    this.lanes = [-4.5, -1.5, 1.5, 4.5];
    this.currentLane = 2; // Start in right forward lane
    this.targetLaneX = this.lanes[this.currentLane];
    this.laneChangeSpeed = 0.1;
    
    // Game state
    this.gameOver = false;
    
    // Car lights
    this.carLights = [];
  }
  
  async init() {
    this.setupLighting();
    this.skySystem = new SkySystem(this.scene);
    this.roadSystem = new RoadSystem(this.scene);
    this.obstacleSystem = new ObstacleSystem(this.scene);
    
    // Create fallback car first, then try to load the model
    this.createFallbackCar();
    this.loadCar(); // Don't await this, let it replace the fallback when ready
    
    this.skySystem.init();
    this.roadSystem.init();
    await this.obstacleSystem.init();
  }
  
  setupLighting() {
    // Ambient light for night scene
    const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
    this.scene.add(ambientLight);
    
    // Directional light (moonlight)
    const directionalLight = new THREE.DirectionalLight(0x8080ff, 0.4);
    directionalLight.position.set(-10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
  }
  
  async loadCar() {
    try {
      const gltf = await this.loader.loadAsync('./models/boltcar.glb');
      const loadedCar = gltf.scene;
      
      // Remove the fallback car and its lights
      if (this.car) {
        this.removeCarLights(this.car);
        this.scene.remove(this.car);
      }
      
      // Set up the loaded car
      this.car = loadedCar;
      this.car.scale.setScalar(0.024);
      this.car.position.set(this.targetLaneX, 0, 0);
      this.car.rotation.y = 0;
      
      // Enable shadows
      this.car.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      this.scene.add(this.car);
      this.addCarLights(this.car, false); // Player car (not oncoming)
      console.log('Car model loaded successfully');
    } catch (error) {
      console.error('Error loading car model:', error);
      console.log('Using fallback car');
    }
  }
  
  createFallbackCar() {
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
    this.car = new THREE.Mesh(geometry, material);
    this.car.position.set(this.targetLaneX, 0.5, 0);
    this.car.castShadow = true;
    this.car.receiveShadow = true;
    this.scene.add(this.car);
    this.addCarLights(this.car, false); // Player car (not oncoming)
    console.log('Fallback car created');
  }
  
  addCarLights(car, isOncoming = false) {
    const lights = [];
    
    if (isOncoming) {
      // Oncoming cars - white headlights at front
      const headlight1 = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 8, 0.5);
      headlight1.position.set(-0.5, 1, 2);
      headlight1.target.position.set(-0.5, 0, 15);
      
      const headlight2 = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 8, 0.5);
      headlight2.position.set(0.5, 1, 2);
      headlight2.target.position.set(0.5, 0, 15);
      
      car.add(headlight1);
      car.add(headlight1.target);
      car.add(headlight2);
      car.add(headlight2.target);
      
      lights.push(headlight1, headlight2);
      
      // Add glowing headlight geometry for bloom effect
      const headlightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const headlightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      
      const headlightGlow1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlightGlow1.position.set(-0.5, 1, 2);
      car.add(headlightGlow1);
      
      const headlightGlow2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlightGlow2.position.set(0.5, 1, 2);
      car.add(headlightGlow2);
      
    } else {
      // Same direction cars and player car - red taillights at back
      const taillight1 = new THREE.PointLight(0xff0000, 1, 15, 2);
      taillight1.position.set(-0.5, 1, -2);
      
      const taillight2 = new THREE.PointLight(0xff0000, 1, 15, 2);
      taillight2.position.set(0.5, 1, -2);
      
      car.add(taillight1);
      car.add(taillight2);
      
      lights.push(taillight1, taillight2);
      
      // Add glowing taillight geometry for bloom effect
      const taillightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const taillightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
      });
      
      const taillightGlow1 = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillightGlow1.position.set(-0.5, 1, -2);
      car.add(taillightGlow1);
      
      const taillightGlow2 = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillightGlow2.position.set(0.5, 1, -2);
      car.add(taillightGlow2);
    }
    
    // Store lights reference for cleanup
    car.userData.lights = lights;
    this.carLights.push(...lights);
  }
  
  removeCarLights(car) {
    if (car.userData.lights) {
      car.userData.lights.forEach(light => {
        const index = this.carLights.indexOf(light);
        if (index > -1) {
          this.carLights.splice(index, 1);
        }
      });
      car.userData.lights = [];
    }
  }
  
  update(input) {
    if (this.gameOver) return;
    
    this.handleInput(input);
    this.updateCarPosition();
    this.roadSystem.update();
    this.skySystem.update();
    this.obstacleSystem.update();
    
    // Add lights to new obstacle cars
    this.obstacleSystem.getObstacles().forEach(obstacle => {
      if (!obstacle.mesh.userData.lights) {
        this.addCarLights(obstacle.mesh, obstacle.isOncoming);
      }
    });
    
    // Check for collisions
    if (this.obstacleSystem.checkCollision(this.car)) {
      this.gameOver = true;
      console.log('GAME OVER! You crashed into another car!');
    }
  }
  
  handleInput(input) {
    if (input.left && this.currentLane > 0) {
      this.currentLane--;
      this.targetLaneX = this.lanes[this.currentLane];
    }
    
    if (input.right && this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      this.targetLaneX = this.lanes[this.currentLane];
    }
  }
  
  updateCarPosition() {
    if (this.car) {
      // Smooth lane changing
      const currentX = this.car.position.x;
      const diff = this.targetLaneX - currentX;
      
      if (Math.abs(diff) > 0.01) {
        this.car.position.x += diff * this.laneChangeSpeed;
      } else {
        this.car.position.x = this.targetLaneX;
      }
    }
  }
  
  isGameOver() {
    return this.gameOver;
  }
  
  restart() {
    this.gameOver = false;
    this.currentLane = 2;
    this.targetLaneX = this.lanes[this.currentLane];
    if (this.car) {
      this.car.position.set(this.targetLaneX, this.car.position.y, 0);
    }
    console.log('Game restarted');
  }
}