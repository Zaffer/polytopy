import * as THREE from "three";
import { NeuralNetworkStructure } from "../types/model";
import { SimpleNeuralNetwork } from "../models/NeuralNetworkTrainer";
import { InteractableType } from "../core/InteractionManager";

export function createNeuralNetworkVisualization(
  networkStructure: NeuralNetworkStructure,
  networkInstance?: SimpleNeuralNetwork
): THREE.Group {
  const group = new THREE.Group();
  const layerSpacing = 2;
  const nodeSpacing = 0.5;
  const nodeRadius = 0.2;
  
  // Use the actual network structure
  const { inputSize, hiddenSizes, outputSize } = networkStructure;
  
  // Define all layers of the network
  const layers = [inputSize, ...(Array.isArray(hiddenSizes) ? hiddenSizes : [hiddenSizes]), outputSize];
  
  // Green to red color scheme for all layers
  const lowActivationColor = new THREE.Color(0x27ae60); // Green for low activation
  const highActivationColor = new THREE.Color(0xe74c3c); // Red for high activation

  // Get sample activations for dynamic node coloring (if network instance available)
  let sampleActivations: number[][] = [];
  if (networkInstance) {
    try {
      // Use a sample input (center of grid) to get current activations
      const sampleInput = [0.5, 0.5];
      sampleActivations = networkInstance.getActivations(sampleInput);
    } catch (e) {
      console.warn("Could not get sample activations:", e);
    }
  }
  
  // Draw all layers with enhanced node visualization
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
    
    // Create nodes for this layer with dynamic coloring
    for (let i = 0; i < displayCount; i++) {
      const nodeIndex = i * skipFactor;
      if (nodeIndex >= nodeCount) continue;
      
      // Green to red node visualization based on activation
      let nodeColor = lowActivationColor.clone();
      let nodeSize = nodeRadius;
      
      // Color based on activation if available
      if (sampleActivations.length > 0) {
        let activation = 0;
        
        if (layerIndex === 0) {
          // Input layer - use a default moderate activation
          activation = 0.5;
        } else if (layerIndex === layers.length - 1) {
          // Output layer - use output activation if available
          if (sampleActivations.length > 0) {
            const outputLayerIdx = sampleActivations.length - 1;
            if (nodeIndex < sampleActivations[outputLayerIdx].length) {
              activation = sampleActivations[outputLayerIdx][nodeIndex];
            }
          }
        } else {
          // Hidden layers
          const activationLayerIdx = layerIndex - 1; // Adjust for input layer
          if (activationLayerIdx < sampleActivations.length && nodeIndex < sampleActivations[activationLayerIdx].length) {
            activation = sampleActivations[activationLayerIdx][nodeIndex];
          }
        }
        
        // Color interpolation from green (low) to red (high)
        const intensity = Math.min(Math.max(activation, 0), 1); // Clamp to [0,1]
        nodeColor = new THREE.Color().lerpColors(lowActivationColor, highActivationColor, intensity);
        
        // Node size based on activation (subtle effect)
        nodeSize = nodeRadius * (0.7 + 0.3 * intensity);
      }
      
      const geometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: nodeColor,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(geometry, material);
      
      // Add interaction metadata
      node.userData = {
        type: InteractableType.NETWORK_NODE,
        layerIndex: layerIndex,
        nodeIndex: nodeIndex
      };
      
      node.position.set(
        0,
        i * nodeSpacing - (displayCount * nodeSpacing) / 2 + nodeSpacing / 2,
        0
      );
      
      layerGroup.add(node);
    }
    
    group.add(layerGroup);
  });
  
  // Enhanced connection visualization with smart filtering
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
    
    // Draw all connections using tube geometry
    for (let i = 0; i < currentDisplayCount; i++) {
      const sourceNodeIndex = i * currentSkipFactor;
      if (sourceNodeIndex >= currentLayerCount) continue;
      
      for (let j = 0; j < nextDisplayCount; j++) {
        const targetNodeIndex = j * nextSkipFactor;
        if (targetNodeIndex >= nextLayerCount) continue;
        // Get the actual weight (with sign) for coloring
        let actualWeight: number;
        if (networkInstance) {
          actualWeight = networkInstance.getWeight(layerIndex, sourceNodeIndex, targetNodeIndex);
        } else {
          actualWeight = Math.random() * 2 - 1;
        }
        
        // Enhanced color calculation with better contrast
        const absWeight = Math.abs(actualWeight);
        let weightColor: THREE.Color;
        
        if (actualWeight > 0) {
          // Positive weights: Green to bright green
          weightColor = new THREE.Color(0x27ae60).lerp(new THREE.Color(0x2ecc71), absWeight);
        } else {
          // Negative weights: Red to bright red  
          weightColor = new THREE.Color(0xc0392b).lerp(new THREE.Color(0xe74c3c), absWeight);
        }
        
        // Calculate positions
        const startX = 0;
        const startY = i * nodeSpacing - (currentDisplayCount * nodeSpacing) / 2 + nodeSpacing / 2;
        const startZ = -layerIndex * layerSpacing;
        
        const endX = 0;
        const endY = j * nodeSpacing - (nextDisplayCount * nodeSpacing) / 2 + nodeSpacing / 2;
        const endZ = -(layerIndex + 1) * layerSpacing;
        
        // Create tube geometry for the connection
        const start = new THREE.Vector3(startX, startY, startZ);
        const end = new THREE.Vector3(endX, endY, endZ);
        
        // Create a curve from start to end
        const curve = new THREE.LineCurve3(start, end);
        
        // Tube radius based on weight magnitude (smaller scale)
        const tubeRadius = Math.max(0.005, absWeight * 0.02);
        
        // Create tube geometry
        const tubeGeometry = new THREE.TubeGeometry(curve, 8, tubeRadius, 6, false);
        
        // Enhanced tube material with dynamic opacity
        const tubeMaterial = new THREE.MeshBasicMaterial({ 
          color: weightColor,
          transparent: true,
          opacity: 0.4 + absWeight * 0.6 // Stronger weights are more visible
        });
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Add interaction metadata
        tube.userData = {
          type: InteractableType.NETWORK_EDGE,
          layerIndex: layerIndex,
          sourceNodeIndex: sourceNodeIndex,
          targetNodeIndex: targetNodeIndex,
          weight: actualWeight
        };
        
        connectionGroup.add(tube);
      }
    }
    
    group.add(connectionGroup);
  }

  return group;
}