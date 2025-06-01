import * as THREE from "three";
import { SimpleNeuralNetwork } from "../models/NeuralNetworkTrainer";

/**
 * Create visualization showing ReLU decision boundaries from the first layer.
 * Each line represents where a first-layer neuron has zero activation (w*x + b = 0).
 */
export function createLinesVisualization(neuralNetwork?: SimpleNeuralNetwork): THREE.Group {
  const group = new THREE.Group();
  
  if (!neuralNetwork) {
    return group;
  }

  // Use same scaling as other visualizations for consistency
  const cellSize = 0.5;
  const spacing = 0.1;
  const gridCells = 10;
  const totalSize = gridCells * (cellSize + spacing);
  const range = totalSize / 2;
  
  // Get first layer weights and biases
  const weights = neuralNetwork.getLayerWeights(0);
  const biases = neuralNetwork.getLayerBiases(0);
  
  if (!weights || !biases || weights.length !== 2) {
    console.warn("Invalid first layer structure for lines visualization");
    return group;
  }
  
  const numNeurons = biases.length;
  
  // Create a line for each neuron in the first layer
  for (let i = 0; i < numNeurons; i++) {
    const w_row = weights[0][i];  // weight for row input (maps to y)
    const w_col = weights[1][i];  // weight for col input (maps to x)
    const bias = biases[i];
    
    // Skip degenerate cases
    if (Math.abs(w_row) < 1e-6 && Math.abs(w_col) < 1e-6) {
      continue;
    }
    
    // Apply coordinate transformation to match training data:
    // rowNormalized = (range - y) / (2 * range)
    // colNormalized = (x + range) / (2 * range)
    // So the constraint w_row * rowNormalized + w_col * colNormalized + bias = 0 becomes:
    // w_row * (range - y)/(2*range) + w_col * (x + range)/(2*range) + bias = 0
    // Rearranging: w_col * x - w_row * y + range * (w_row + w_col) + bias * 2 * range = 0
    const a = w_col;
    const b = -w_row; 
    const c = range * (w_row + w_col) + bias * 2 * range;
    
    const line = createDecisionBoundaryLine(a, b, c, range, i, numNeurons);
    if (line) {
      group.add(line);
    }
  }
  
  return group;
}

/**
 * Create a line representing where a neuron has zero activation: w_x * x + w_y * y + bias = 0
 */
function createDecisionBoundaryLine(
  w_x: number, 
  w_y: number, 
  bias: number, 
  range: number,
  neuronIndex: number,
  totalNeurons: number
): THREE.Line | null {
  
  const intersections: THREE.Vector3[] = [];
  
  // Find where the line intersects the edges of our visualization area
  // Line equation: w_x * x + w_y * y + bias = 0
  
  // Left edge (x = -range)
  if (Math.abs(w_y) > 1e-6) {
    const y = -(w_x * (-range) + bias) / w_y;
    if (y >= -range && y <= range) {
      intersections.push(new THREE.Vector3(-range, y, 0));
    }
  }
  
  // Right edge (x = range)
  if (Math.abs(w_y) > 1e-6) {
    const y = -(w_x * range + bias) / w_y;
    if (y >= -range && y <= range) {
      intersections.push(new THREE.Vector3(range, y, 0));
    }
  }
  
  // Bottom edge (y = -range)
  if (Math.abs(w_x) > 1e-6) {
    const x = -(w_y * (-range) + bias) / w_x;
    if (x >= -range && x <= range) {
      intersections.push(new THREE.Vector3(x, -range, 0));
    }
  }
  
  // Top edge (y = range)
  if (Math.abs(w_x) > 1e-6) {
    const x = -(w_y * range + bias) / w_x;
    if (x >= -range && x <= range) {
      intersections.push(new THREE.Vector3(x, range, 0));
    }
  }
  
  // Need at least 2 intersection points to draw a line
  if (intersections.length < 2) {
    return null;
  }
  
  // Create the line geometry
  const geometry = new THREE.BufferGeometry().setFromPoints([
    intersections[0], 
    intersections[1]
  ]);
  
  // Create a unique color for each neuron
  const hue = (neuronIndex * 360 / totalNeurons) % 360;
  const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
  
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
    linewidth: 2
  });
  
  const line = new THREE.Line(geometry, material);
  line.position.z = 0.02; // Slightly above the xy-plane
  
  return line;
}
