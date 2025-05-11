import * as THREE from "three";
import { NeuralNetworkStructure } from "../types/model";
import { createTextSprite } from "@/utils/TextUtils";

export function createNeuralNetworkVisualization(
  networkStructure: NeuralNetworkStructure
): THREE.Group {
  const group = new THREE.Group();
  const layerSpacing = 2;
  const nodeSpacing = 0.5;
  const nodeRadius = 0.2;
  
  // Use the actual network structure
  const { inputSize, hiddenSizes, outputSize } = networkStructure;
  
  // Define all layers of the network
  const layers = [inputSize, ...(Array.isArray(hiddenSizes) ? hiddenSizes : [hiddenSizes]), outputSize];
  
  // Create a map of node colors for different layers
  const hiddenLayerCount = Array.isArray(hiddenSizes) ? hiddenSizes.length : 1;
  const layerColors = [
    new THREE.Color(0x3498db), // Input layer - blue
    ...Array(hiddenLayerCount).fill(0).map(() => new THREE.Color(0xf1c40f)), // Hidden layers - yellow
    new THREE.Color(0xe74c3c)  // Output layer - red
  ];
  
  // Create layer labels
  const layerLabels = [
    "Input Layer", 
    ...Array(hiddenLayerCount).fill(0).map((_, i) => `Hidden Layer ${i+1}`),
    "Output Layer"
  ];
  
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
    // Use the layer labels we created earlier instead of hardcoded ones
    const labelText = layerIndex < layerLabels.length 
      ? `${layerLabels[layerIndex]} (${nodeCount} nodes)`
      : `Layer ${layerIndex} (${nodeCount} nodes)`;
    const labelSprite = createTextSprite(labelText, 14);
    
    // Position the label below the layer
    labelSprite.position.y = -(displayCount * nodeSpacing) / 2 - 0.7;
    
    layerGroup.add(labelSprite);
    
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
        // Generate a random weight value for visualization
        const weight = Math.random() * 2 - 1;
        
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
  const titleSprite = createTextSprite('Neural Network', 32, "rgba(0, 0, 0, 0.5)");
  
  // Calculate max node count for positioning
  const maxNodeCount = Math.max(...layers.map(count => Math.min(count, 20)));
  titleSprite.position.y = (maxNodeCount * nodeSpacing) / 2 + 1;
  
  group.add(titleSprite);

  // Add network summary information
  // Calculate total parameters in the network
  let totalParams = 0;
  for (let i = 0; i < layers.length - 1; i++) {
    // Weights between layers + bias for each layer
    totalParams += layers[i] * layers[i+1] + layers[i+1];
  }
  
  // Create architecture string
  const architecture = layers.join('-');
  
  const infoText = `Total Parameters: ${totalParams}\nArchitecture: ${architecture}`;
  const infoSprite = createTextSprite(infoText, 14, "rgba(0, 0, 0, 0.5)");
  
  // Position the info below the neural network
  infoSprite.position.y = -(maxNodeCount * nodeSpacing) / 2 - 2;
  infoSprite.position.z = -layerSpacing;
  
  group.add(infoSprite);

  return group;
}