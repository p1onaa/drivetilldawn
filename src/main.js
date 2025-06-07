import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GameScene } from './GameScene.js';
import { InputHandler } from './InputHandler.js';

class NightDrivingGame {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.gameScene = null;
    this.inputHandler = null;
    this.isLoaded = false;
    
    this.init();
  }
  
  async init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupPostProcessing();
    
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
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.2; // Reduced from 1.5
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 0, 0);
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 30, 150);
  }
  
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8, // Reduced strength from 1.5 to 0.8
      0.3, // Reduced radius from 0.4 to 0.3
      0.9  // Increased threshold from 0.85 to 0.9 (less bloom)
    );
    this.composer.addPass(bloomPass);
    
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
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
    
    // Update camera to follow car
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
    this.composer.render();
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (window.game) {
    window.game.onWindowResize();
  }
});

// Start the game
window.game = new NightDrivingGame();