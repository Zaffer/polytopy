import * as THREE from "three";
import { NeuralNetworkStructure } from "../types/model";

/**
 * Helper function to create text labels as sprites with sharp text
 */
function createTextSprite(text: string, fontSize: number = 16, backgroundColor: string = "rgba(0, 0, 0, 0)"): THREE.Sprite {
  // Create high-resolution canvas for text rendering
  const canvas = document.createElement('canvas');
  const pixelRatio = window.devicePixelRatio || 2; // Use device pixel ratio or fallback to 2x
  const size = fontSize * 3; // Increase base size
  canvas.width = size * 5 * pixelRatio;  // Make canvas extra wide for text and apply pixel ratio
  canvas.height = size * 1.5 * pixelRatio;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error("Failed to get canvas context");
    // Return empty sprite if context creation fails
    return new THREE.Sprite();
  }
  
  // Scale the context by pixel ratio for high DPI displays
  ctx.scale(pixelRatio, pixelRatio);
  
  // Optional background for certain labels
  if (backgroundColor !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  }
  
  // Set text styling with sharpening techniques
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Enable font smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Support for multiline text
  if (text.includes('\n')) {
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height / pixelRatio - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / (2 * pixelRatio), startY + index * lineHeight);
    });
  } else {
    ctx.fillText(text, canvas.width / (2 * pixelRatio), canvas.height / (2 * pixelRatio));
  }
  
  // Create sprite material with the canvas texture
  const texture = new THREE.CanvasTexture(canvas);
  
  // Advanced texture settings for better distant viewing
  texture.minFilter = THREE.LinearMipmapLinearFilter; // Better mipmapping for distant viewing
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16; // Increase anisotropic filtering for sharper text at angles
  texture.needsUpdate = true; // Make sure texture updates properly
  
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    sizeAttenuation: true, // Ensure proper sizing at different distances
    depthTest: false, // Allow text to be visible in front of other objects
    depthWrite: false // Don't write to depth buffer
  });
  
  // Create sprite with the right scale based on text length and font size
  const sprite = new THREE.Sprite(material);
  const aspectRatio = canvas.width / canvas.height;
  
  // Scale sprite size based on font size and text length - adjusted for better visibility
  const baseScale = Math.min(text.length * 0.03, 0.8) * (fontSize / 16);
  sprite.scale.set(baseScale * aspectRatio, baseScale, 1);
  
  // Store original scale to allow size adjustments for zoom levels
  (sprite as any).userData = {
    originalScale: { 
      x: baseScale * aspectRatio, 
      y: baseScale 
    },
    textContent: text,
    fontSize: fontSize
  };
  
  return sprite;
}

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
    const labelSprite = createTextSprite(`${layerLabels[layerIndex]} (${nodeCount} nodes)`, 14);
    
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
  const titleSprite = createTextSprite('Neural Network', 32, "rgba(0, 0, 0, 0.5)");
  
  // Calculate max node count for positioning
  const maxNodeCount = Math.max(...layers.map(count => Math.min(count, 20)));
  titleSprite.position.y = (maxNodeCount * nodeSpacing) / 2 + 1;
  
  group.add(titleSprite);

  // Add network summary information
  const totalParams = inputSize * hiddenSize + hiddenSize * outputSize + hiddenSize + outputSize;
  const infoText = `Total Parameters: ${totalParams}\nArchitecture: ${inputSize}-${hiddenSize}-${outputSize}`;
  const infoSprite = createTextSprite(infoText, 14, "rgba(0, 0, 0, 0.5)");
  
  // Position the info below the neural network
  infoSprite.position.y = -(maxNodeCount * nodeSpacing) / 2 - 2;
  infoSprite.position.z = -layerSpacing;
  
  group.add(infoSprite);

  return group;
}