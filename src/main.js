import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GameScene } from './GameScene.js';
import { InputHandler } from './InputHandler.js';

class NightDrivingGame {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.gameScene = null;
    this.inputHandler = null;
    this.isLoaded = false;
    
    // Camera tilt for immersion
    this.cameraTilt = 0;
    this.targetCameraTilt = 0;
    
    // Score system
    this.score = 0;
    this.scoreElement = null;
    
    this.init();
  }
  
  async init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    
    this.gameScene = new GameScene(this.scene);
    this.inputHandler = new InputHandler();
    
    await this.gameScene.init();
    
    this.hideLoading();
    this.showScore();
    this.isLoaded = true;
    
    this.animate();
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1); // Pure black background
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Closer camera position - lower and closer to the car
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 0, 0);
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 30, 150); // Black fog to match the sky
  }
  
  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }
  
  showScore() {
    this.scoreElement = document.getElementById('score');
    this.scoreElement.style.display = 'block';
    this.updateScore();
  }
  
  updateScore() {
    if (this.scoreElement) {
      this.scoreElement.textContent = `${Math.floor(this.score)}`;
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.isLoaded) {
      this.update();
      this.render();
    }
  }
  
  update() {
    const input = this.inputHandler.getInput();
    this.gameScene.update(input);
    
    // Update score - increase by distance traveled with speed multiplier
    if (!this.gameScene.isGameOver()) {
      const speedMultiplier = this.gameScene.getSpeedMultiplier();
      // Base score increase of 0.1 meters per frame, multiplied by current speed
      this.score += 0.1 * speedMultiplier;
      this.updateScore();
    }
    
    // Check for game over and handle restart
    if (this.gameScene.isGameOver()) {
      // Allow restart with spacebar
      if (input.restart) {
        this.gameScene.reset();
        this.score = 0; // Reset score on restart
        this.updateScore();
        console.log('🔄 Game restarted! Drive safely!');
      }
    }
    
    // Update camera to follow car with enhanced movement and tilt
    if (this.gameScene.car) {
      const carPosition = this.gameScene.car.position;
      
      // Get car tilt for camera immersion
      const carTilt = this.gameScene.getCarTilt();
      this.targetCameraTilt = carTilt * 0.3; // Reduce the effect for camera
      
      // Smooth camera tilt
      this.cameraTilt = THREE.MathUtils.lerp(this.cameraTilt, this.targetCameraTilt, 0.1);
      
      // Update camera position with smooth following
      const targetCameraX = carPosition.x;
      const currentCameraX = this.camera.position.x;
      
      // Smooth camera X movement
      this.camera.position.x = THREE.MathUtils.lerp(currentCameraX, targetCameraX, 0.08);
      this.camera.position.z = carPosition.z + 8;
      this.camera.position.y = 4;
      
      // Apply camera tilt for immersion
      this.camera.rotation.z = this.cameraTilt;
      
      // Look at point slightly ahead of the car
      const lookAtX = carPosition.x;
      const lookAtY = carPosition.y;
      const lookAtZ = carPosition.z - 3;
      
      this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
      
      // Reapply the tilt after lookAt (which resets rotation)
      this.camera.rotation.z = this.cameraTilt;
    }
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (window.game && window.game.camera && window.game.renderer) {
    window.game.camera.aspect = window.innerWidth / window.innerHeight;
    window.game.camera.updateProjectionMatrix();
    window.game.renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Start the game
window.game = new NightDrivingGame();