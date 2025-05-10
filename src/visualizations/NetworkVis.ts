import * as THREE from "three";
import { NeuralNetworkStructure } from "../types/model";

export function createNeuralNetworkVisualization(
  networkStructure: NeuralNetworkStructure
): THREE.Group {
  const group = new THREE.Group();
  const layerSpacing = 2;
  const nodeSpacing = 0.5;
  const nodeRadius = 0.2;
  
  // Use the actual network structure
  const { inputSize, hiddenSize, outputSize } = networkStructure;
  
  // Define all layers of the network
  const layers = [inputSize, hiddenSize, outputSize];
  
  // Create a map of node colors for different layers
  const layerColors = [
    new THREE.Color(0x3498db), // Input layer - blue
    new THREE.Color(0xf1c40f), // Hidden layer - yellow
    new THREE.Color(0xe74c3c)  // Output layer - red
  ];
  
  // Create edge weights for visualization (random for now)
  const inputToHiddenWeights = Array.from({ length: inputSize }, () => 
    Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1)
  );
  
  const hiddenToOutputWeights = Array.from({ length: hiddenSize }, () => 
    Array.from({ length: outputSize }, () => Math.random() * 2 - 1)
  );
  
  // Draw all layers
  layers.forEach((nodeCount, layerIndex) => {
    // Scale down if there are too many nodes to display
    let displayCount = nodeCount;
    let skipFactor = 1;
    
    if (nodeCount > 20) {
      displayCount = 20;
      skipFactor = Math.ceil(nodeCount / 20);
    }
    
    // Create a layer group
    const layerGroup = new THREE.Group();
    layerGroup.position.z = -layerIndex * layerSpacing;
    
    // Add a layer label
    const layerLabels = ["Input Layer", "Hidden Layer", "Output Layer"];
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${layerLabels[layerIndex]} (${nodeCount} nodes)`, 128, 32);
      
      const texture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      const labelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 0.5),
        labelMaterial
      );
      
      // Position the label below the layer
      labelPlane.position.y = -(displayCount * nodeSpacing) / 2 - 0.7;
      
      layerGroup.add(labelPlane);
    }
    
    // Create nodes for this layer
    for (let i = 0; i < displayCount; i++) {
      const nodeIndex = i * skipFactor;
      if (nodeIndex >= nodeCount) continue;
      
      const geometry = new THREE.SphereGeometry(nodeRadius, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: layerColors[layerIndex] });
      const node = new THREE.Mesh(geometry, material);
      
      node.position.set(
        0,
        i * nodeSpacing - (displayCount * nodeSpacing) / 2 + nodeSpacing / 2,
        0
      );
      
      layerGroup.add(node);
    }
    
    group.add(layerGroup);
  });
  
  // Draw connections between layers
  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
    const currentLayerCount = layers[layerIndex];
    const nextLayerCount = layers[layerIndex + 1];
    
    // Scale down if there are too many nodes to display
    let currentDisplayCount = currentLayerCount;
    let currentSkipFactor = 1;
    if (currentLayerCount > 20) {
      currentDisplayCount = 20;
      currentSkipFactor = Math.ceil(currentLayerCount / 20);
    }
    
    let nextDisplayCount = nextLayerCount;
    let nextSkipFactor = 1;
    if (nextLayerCount > 20) {
      nextDisplayCount = 20;
      nextSkipFactor = Math.ceil(nextLayerCount / 20);
    }
    
    // Create a group for connections between these layers
    const connectionGroup = new THREE.Group();
    
    // Draw a subset of connections to avoid visual clutter
    const connectionSubsample = Math.max(1, Math.floor(currentDisplayCount * nextDisplayCount / 100));
    
    let connectionCount = 0;
    for (let i = 0; i < currentDisplayCount; i++) {
      const sourceNodeIndex = i * currentSkipFactor;
      if (sourceNodeIndex >= currentLayerCount) continue;
      
      for (let j = 0; j < nextDisplayCount; j++) {
        const targetNodeIndex = j * nextSkipFactor;
        if (targetNodeIndex >= nextLayerCount) continue;
        
        // Only draw a subset of connections
        connectionCount++;
        if (connectionCount % connectionSubsample !== 0) continue;
        
        // Get the weight value for this connection
        let weight = 0;
        if (layerIndex === 0) {
          weight = inputToHiddenWeights[sourceNodeIndex][Math.min(targetNodeIndex, hiddenSize - 1)];
        } else if (layerIndex === 1) {
          weight = hiddenToOutputWeights[sourceNodeIndex][Math.min(targetNodeIndex, outputSize - 1)];
        }
        
        // Calculate color based on weight
        const weightColor = weight > 0 ? 
          new THREE.Color(0x00ff00).lerp(new THREE.Color(0xffffff), 1 - Math.abs(weight)) : 
          new THREE.Color(0xff0000).lerp(new THREE.Color(0xffffff), 1 - Math.abs(weight));
        
        // Calculate positions
        const startX = 0;
        const startY = i * nodeSpacing - (currentDisplayCount * nodeSpacing) / 2 + nodeSpacing / 2;
        const startZ = -layerIndex * layerSpacing;
        
        const endX = 0;
        const endY = j * nodeSpacing - (nextDisplayCount * nodeSpacing) / 2 + nodeSpacing / 2;
        const endZ = -(layerIndex + 1) * layerSpacing;
        
        // Create the line
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(startX, startY, startZ),
          new THREE.Vector3(endX, endY, endZ)
        ]);
        
        // Line thickness based on weight
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: weightColor,
          transparent: true,
          opacity: 0.5 + Math.abs(weight) * 0.5 // Stronger weights are more visible
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        connectionGroup.add(line);
      }
    }
    
    group.add(connectionGroup);
  }

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
    const maxNodeCount = Math.max(...layers.map(count => Math.min(count, 20)));
    titlePlane.position.y = (maxNodeCount * nodeSpacing) / 2 + 1;
    
    group.add(titlePlane);
  }

  // Add network summary information
  const infoCanvas = document.createElement('canvas');
  infoCanvas.width = 512;
  infoCanvas.height = 256;
  const infoCtx = infoCanvas.getContext('2d');
  if (infoCtx) {
    infoCtx.fillStyle = 'white';
    infoCtx.font = '14px Arial';
    infoCtx.textAlign = 'center';
    infoCtx.textBaseline = 'middle';
    
    const totalParams = inputSize * hiddenSize + hiddenSize * outputSize + hiddenSize + outputSize;
    infoCtx.fillText(`Total Parameters: ${totalParams}`, 256, 20);
    infoCtx.fillText(`Architecture: ${inputSize}-${hiddenSize}-${outputSize}`, 256, 40);
    
    const texture = new THREE.CanvasTexture(infoCanvas);
    const infoMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const infoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2),
      infoMaterial
    );
    
    // Position the info below the neural network
    const maxNodeCount = Math.max(...layers.map(count => Math.min(count, 20)));
    infoPlane.position.y = -(maxNodeCount * nodeSpacing) / 2 - 2;
    infoPlane.position.z = -layerSpacing;
    
    group.add(infoPlane);
  }

  return group;
}