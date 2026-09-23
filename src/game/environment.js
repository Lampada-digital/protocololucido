import * as THREE from 'three';

export class EnvironmentBuilder {
  constructor(game) {
    this.game = game;
    this.ps1Materials = [];
  }
  
  build() {
    this.createTextures();
    this.buildFloor();
    this.buildCeiling();
    this.buildWalls();
    this.addProps();
    this.addInteractables();
  }
  
  createTextures() {
    // Create procedural horror textures
    this.wallTexture = this.createHorrorTexture('wall');
    this.floorTexture = this.createHorrorTexture('floor');
    this.ceilingTexture = this.createHorrorTexture('ceiling');
    this.metalTexture = this.createHorrorTexture('metal');
  }
  
  createHorrorTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    switch (type) {
      case 'wall':
        // Dirty concrete with blood stains - brighter base for visibility
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(0, 0, 128, 128);
        
        // Concrete texture with more variation
        for (let i = 0; i < 500; i++) {
          const shade = 35 + Math.random() * 25;
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 5})`;
          ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
        }
        
        // Blood stains
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = `rgba(80, 0, 0, ${0.3 + Math.random() * 0.4})`;
          ctx.beginPath();
          const x = Math.random() * 128;
          const y = Math.random() * 128;
          const radius = 5 + Math.random() * 15;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Drip effect
          ctx.fillRect(x - 1, y, 2, 10 + Math.random() * 20);
        }
        
        // Cracks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * 128, Math.random() * 128);
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(Math.random() * 128, Math.random() * 128);
          }
          ctx.stroke();
        }
        break;
        
      case 'floor':
        // Dirty tile floor - brighter for visibility
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(0, 0, 128, 128);
        
        // Tile pattern with more contrast
        for (let y = 0; y < 128; y += 32) {
          for (let x = 0; x < 128; x += 32) {
            const shade = 25 + Math.random() * 15;
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 3})`;
            ctx.fillRect(x + 1, y + 1, 30, 30);
          }
        }
        
        // Blood pools
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = `rgba(60, 0, 0, ${0.4 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.ellipse(
            Math.random() * 128,
            Math.random() * 128,
            10 + Math.random() * 15,
            8 + Math.random() * 10,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }
        
        // Dirt/grime
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
          ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
        }
        break;
        
      case 'ceiling':
        // Dark stained ceiling - slightly brighter
        ctx.fillStyle = '#151518';
        ctx.fillRect(0, 0, 128, 128);
        
        // Water stains
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = `rgba(30, 30, 30, ${0.3 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.ellipse(
            Math.random() * 128,
            Math.random() * 128,
            15 + Math.random() * 20,
            10 + Math.random() * 15,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }
        
        // Mold/mildew
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(20, 30, 20, ${Math.random() * 0.4})`;
          ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
        }
        break;
        
      case 'metal':
        // Rusted metal
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(0, 0, 128, 128);
        
        // Rust patches
        for (let i = 0; i < 15; i++) {
          const r = 40 + Math.random() * 30;
          const g = 20 + Math.random() * 20;
          const b = 10 + Math.random() * 10;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 128, Math.random() * 128, 5 + Math.random() * 10, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Scratches
        ctx.strokeStyle = 'rgba(50, 40, 30, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * 128, Math.random() * 128);
          ctx.lineTo(Math.random() * 128, Math.random() * 128);
          ctx.stroke();
        }
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }
  
  createPS1Material(texture) {
    const material = new THREE.ShaderMaterial({
      vertexShader: this.game.ps1VertexShader || `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vFogDepth;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: this.game.ps1FragmentShader || `
        uniform sampler2D u_texture;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vFogDepth;
        void main() {
          vec4 texColor = texture2D(u_texture, vUv);
          vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
          float diffuse = max(dot(vNormal, lightDir), 0.0);
          vec3 lit = texColor.rgb * (0.2 + diffuse * 0.5);
          float fogFactor = 1.0 - exp(-vFogDepth * 0.05);
          lit = mix(lit, vec3(0.1, 0.1, 0.1), fogFactor);
          gl_FragColor = vec4(lit, texColor.a);
        }
      `,
      uniforms: {
        u_texture: { value: texture }
      }
    });
    
    this.ps1Materials.push(material);
    return material;
  }
  
  buildFloor() {
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = this.createPS1Material(this.floorTexture);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.game.scene.add(floor);
  }
  
  buildCeiling() {
    const ceilingGeo = new THREE.PlaneGeometry(40, 40);
    const ceilingMat = this.createPS1Material(this.ceilingTexture);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    this.game.scene.add(ceiling);
  }
  
  buildWalls() {
    const wallMat = this.createPS1Material(this.wallTexture);
    
    // Outer walls
    const walls = [
      { pos: [0, 2, -20], size: [40, 4, 0.5] },
      { pos: [0, 2, 20], size: [40, 4, 0.5] },
      { pos: [-20, 2, 0], size: [0.5, 4, 40] },
      { pos: [20, 2, 0], size: [0.5, 4, 40] }
    ];
    
    // Internal maze walls
    const internalWalls = [
      { pos: [-8, 2, -5], size: [0.5, 4, 10] },
      { pos: [8, 2, 5], size: [0.5, 4, 10] },
      { pos: [0, 2, -10], size: [12, 4, 0.5] },
      { pos: [-5, 2, 8], size: [10, 4, 0.5] },
      { pos: [12, 2, -8], size: [0.5, 4, 8] },
      { pos: [-12, 2, 12], size: [8, 4, 0.5] }
    ];
    
    [...walls, ...internalWalls].forEach(w => {
      const geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]);
      const mesh = new THREE.Mesh(geo, wallMat.clone());
      mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.game.scene.add(mesh);
      this.ps1Materials.push(mesh.material);
    });
  }
  
  addProps() {
    // Abandoned furniture
    this.addTable(-5, 0, -5);
    this.addChair(-4, 0, -5);
    this.addGurney(10, 0, -10);
    this.addLocker(-15, 0, 10);
    this.addLocker(-14, 0, 10);
    
    // Medical equipment
    this.addIVStand(10, 0, -9);
    
    // Chains hanging from ceiling
    for (let i = 0; i < 5; i++) {
      this.addChain(
        -10 + Math.random() * 20,
        4,
        -10 + Math.random() * 20
      );
    }
  }
  
  addTable(x, y, z) {
    const group = new THREE.Group();
    
    // Table top
    const topGeo = new THREE.BoxGeometry(2, 0.1, 1);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.9 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.8;
    top.castShadow = true;
    group.add(top);
    
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    [[-0.9, 0.4, -0.4], [0.9, 0.4, -0.4], [-0.9, 0.4, 0.4], [0.9, 0.4, 0.4]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });
    
    group.position.set(x, y, z);
    this.game.scene.add(group);
  }
  
  addChair(x, y, z) {
    const group = new THREE.Group();
    
    // Seat
    const seatGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.5;
    group.add(seat);
    
    // Back
    const backGeo = new THREE.BoxGeometry(0.5, 0.5, 0.05);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 0.75, -0.225);
    group.add(back);
    
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    [[-0.2, 0.25, -0.2], [0.2, 0.25, -0.2], [-0.2, 0.25, 0.2], [0.2, 0.25, 0.2]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });
    
    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.game.scene.add(group);
  }
  
  addGurney(x, y, z) {
    const group = new THREE.Group();
    
    // Bed
    const bedGeo = new THREE.BoxGeometry(2, 0.1, 0.8);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.y = 0.8;
    bed.castShadow = true;
    group.add(bed);
    
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
    
    [[-0.9, 0.4, -0.3], [0.9, 0.4, -0.3], [-0.9, 0.4, 0.3], [0.9, 0.4, 0.3]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      group.add(leg);
    });
    
    group.position.set(x, y, z);
    this.game.scene.add(group);
  }
  
  addLocker(x, y, z) {
    const geo = new THREE.BoxGeometry(0.6, 2, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.6,
      roughness: 0.4
    });
    const locker = new THREE.Mesh(geo, mat);
    locker.position.set(x, y + 1, z);
    locker.castShadow = true;
    this.game.scene.add(locker);
  }
  
  addIVStand(x, y, z) {
    const group = new THREE.Group();
    
    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1;
    group.add(pole);
    
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
    const base = new THREE.Mesh(baseGeo, poleMat);
    base.position.y = 0.025;
    group.add(base);
    
    // Bag
    const bagGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.6
    });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.y = 1.9;
    group.add(bag);
    
    group.position.set(x, y, z);
    this.game.scene.add(group);
  }
  
  addChain(x, y, z) {
    const chainLength = 1 + Math.random() * 2;
    const geo = new THREE.CylinderGeometry(0.02, 0.02, chainLength, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3
    });
    const chain = new THREE.Mesh(geo, mat);
    chain.position.set(x, y - chainLength / 2, z);
    this.game.scene.add(chain);
  }
  
  addInteractables() {
    // Ammo pickup
    this.createPickup(-5, 0.5, -5, 'ammo', 6);
    this.createPickup(10, 0.5, 10, 'ammo', 4);
    
    // Health pickup
    this.createPickup(-10, 0.5, 10, 'health', 1);
    
    // Battery pickup
    this.createPickup(5, 0.5, -10, 'battery', 1);
    
    // Keycards
    this.createPickup(15, 0.5, -15, 'key_red', 1);
    this.createPickup(-15, 0.5, 15, 'key_blue', 1);
  }
  
  createPickup(x, y, z, type, count) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    
    mesh.userData.interactable = true;
    mesh.userData.onInteract = (game) => {
      const added = game.inventorySystem.addItem(type, count);
      if (added > 0) {
        game.scene.remove(mesh);
      }
    };
    
    // Floating animation
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    
    this.game.scene.add(mesh);
    
    // Animate
    const animate = () => {
      if (!mesh.parent) return;
      mesh.position.y = y + Math.sin(Date.now() * 0.002 + mesh.userData.floatOffset) * 0.1;
      mesh.rotation.y += 0.02;
      requestAnimationFrame(animate);
    };
    animate();
  }
}
