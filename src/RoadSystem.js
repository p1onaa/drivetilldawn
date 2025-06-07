import * as THREE from 'three';

export class RoadSystem {
  constructor(scene) {
    this.scene = scene;
    this.roadSegments = [];
    this.segmentLength = 50;
    this.numSegments = 6;
    this.speed = 0.3;
  }
  
  init() {
    this.createRoadSegments();
  }
  
  createRoadSegments() {
    for (let i = 0; i < this.numSegments; i++) {
      const segment = this.createRoadSegment();
      segment.position.z = -i * this.segmentLength;
      this.roadSegments.push(segment);
      this.scene.add(segment);
    }
  }
  
  createRoadSegment() {
    const group = new THREE.Group();
    
    // Road surface - wider and cleaner
    const roadGeometry = new THREE.PlaneGeometry(12, this.segmentLength);
    const roadMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2a2a2a,
      side: THREE.DoubleSide
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    group.add(road);
    
    // Lane lines
    this.addLaneLines(group);
    
    return group;
  }
  
  addLaneLines(group) {
    const lineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength);
    
    // Center divider (double yellow line)
    const centerLine1 = new THREE.Mesh(lineGeometry, new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      side: THREE.DoubleSide
    }));
    centerLine1.rotation.x = -Math.PI / 2;
    centerLine1.position.set(-0.3, 0.01, 0);
    group.add(centerLine1);
    
    const centerLine2 = new THREE.Mesh(lineGeometry, new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      side: THREE.DoubleSide
    }));
    centerLine2.rotation.x = -Math.PI / 2;
    centerLine2.position.set(0.3, 0.01, 0);
    group.add(centerLine2);
    
    // Lane dividers (dashed white lines)
    this.addDashedLine(group, -3, 0xffffff);
    this.addDashedLine(group, 3, 0xffffff);
  }
  
  addDashedLine(group, xPos, color) {
    const dashLength = 3;
    const gapLength = 2;
    const totalLength = this.segmentLength;
    
    for (let z = -totalLength/2; z < totalLength/2; z += dashLength + gapLength) {
      const dashGeometry = new THREE.PlaneGeometry(0.15, dashLength);
      const dashMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        side: THREE.DoubleSide
      });
      const dash = new THREE.Mesh(dashGeometry, dashMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(xPos, 0.01, z + dashLength/2);
      group.add(dash);
    }
  }
  
  update() {
    this.roadSegments.forEach(segment => {
      segment.position.z += this.speed;
      
      // Reset segment position when it goes behind the camera
      if (segment.position.z > this.segmentLength) {
        segment.position.z -= this.numSegments * this.segmentLength;
      }
    });
  }
}