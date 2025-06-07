export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false
    };
    
    this.keyPressed = {
      left: false,
      right: false
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });
    
    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });
  }
  
  handleKeyDown(event) {
    switch(event.code) {
      case 'KeyA':
        if (!this.keys.left) {
          this.keyPressed.left = true;
        }
        this.keys.left = true;
        event.preventDefault();
        break;
      case 'KeyD':
        if (!this.keys.right) {
          this.keyPressed.right = true;
        }
        this.keys.right = true;
        event.preventDefault();
        break;
    }
  }
  
  handleKeyUp(event) {
    switch(event.code) {
      case 'KeyA':
        this.keys.left = false;
        event.preventDefault();
        break;
      case 'KeyD':
        this.keys.right = false;
        event.preventDefault();
        break;
    }
  }
  
  getInput() {
    const input = {
      left: this.keyPressed.left,
      right: this.keyPressed.right
    };
    
    // Reset pressed states
    this.keyPressed.left = false;
    this.keyPressed.right = false;
    
    return input;
  }
}