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
    this.showInstructions();
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
  
  showInstructions() {
    document.getElementById('instructions').style.display = 'block';
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
    
    // Update camera to follow car - closer and more dynamic
    if (this.gameScene.car) {
      const carPosition = this.gameScene.car.position;
      this.camera.position.x = carPosition.x;
      this.camera.position.z = carPosition.z + 8;
      this.camera.position.y = 4;
      this.camera.lookAt(carPosition.x, carPosition.y, carPosition.z - 3);
    }
    
    // Handle game over state
    if (this.gameScene.isGameOver()) {
      // You could add game over UI, pause the game, etc.
      // For now, we'll just log and continue
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