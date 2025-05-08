import * as THREE from "three";

export function createNeuralNetworkVisualization(scene: THREE.Scene, inputData: number[][], depth: number = 3): THREE.Group {
  const group = new THREE.Group();
  const layerSpacing = 2;
  const nodeSpacing = 0.5;
  const nodeRadius = 0.2;

  const inputLayer = inputData[0].length;
  const hiddenLayer = Math.ceil(inputLayer / 2);
  const outputLayer = 1;

  const layers = [inputLayer, ...Array(depth - 2).fill(hiddenLayer), outputLayer];

  layers.forEach((nodeCount, layerIndex) => {
    for (let i = 0; i < nodeCount; i++) {
      const geometry = new THREE.SphereGeometry(nodeRadius, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const node = new THREE.Mesh(geometry, material);

      node.position.set(
        0,
        i * nodeSpacing - (nodeCount * nodeSpacing) / 2 + nodeSpacing / 2,
        -layerIndex * layerSpacing
      );

      group.add(node);

      if (layerIndex < layers.length - 1) {
        const nextLayerNodeCount = layers[layerIndex + 1];
        for (let j = 0; j < nextLayerNodeCount; j++) {
          const startX = 0;
          const startY = i * nodeSpacing - (nodeCount * nodeSpacing) / 2 + nodeSpacing / 2;
          const startZ = -layerIndex * layerSpacing;

          const endX = 0;
          const endY = j * nodeSpacing - (nextLayerNodeCount * nodeSpacing) / 2 + nodeSpacing / 2;
          const endZ = -(layerIndex + 1) * layerSpacing;

          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(startX, startY, startZ),
            new THREE.Vector3(endX, endY, endZ)
          ]);

          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
          const line = new THREE.Line(lineGeometry, lineMaterial);

          group.add(line);
        }
      }
    }
  });

  // Add a title to the neural network panel
  const titleCanvas = document.createElement('canvas');
  titleCanvas.width = 512;
  titleCanvas.height = 128;
  const ctx = titleCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Neural Network', 256, 64);
    
    const texture = new THREE.CanvasTexture(titleCanvas);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 1.5),
      titleMaterial
    );
    
    // Position the title above the neural network
    const maxNodeCount = Math.max(...layers);
    titlePlane.position.y = (maxNodeCount * nodeSpacing) / 2 + 1;
    
    group.add(titlePlane);
  }

  // Removed scene.add(group) to prevent duplication
  return group;
}