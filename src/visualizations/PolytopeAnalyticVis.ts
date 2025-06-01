import * as THREE from "three";
import { SimpleNeuralNetwork } from "../models/NeuralNetworkTrainer";

export function createAnalyticPolytopeVisualization(neuralNetwork?: SimpleNeuralNetwork): THREE.Group {
  const group = new THREE.Group();
  
  if (!neuralNetwork) {
    return group;
  }

  // Use same scaling as the prediction visualization
  const cellSize = 0.5;
  const spacing = 0.1;
  const gridCells = 10;
  const totalSize = gridCells * (cellSize + spacing);
  const range = totalSize / 2;
  
  // Compute polytopes analytically from ReLU network structure
  const polytopes = computeAnalyticalPolytopes(neuralNetwork, range);
  
  // Render each polytope
  polytopes.forEach(({ pattern, vertices }) => {
    if (vertices.length < 3) return;
    
    // Generate unique color for this activation pattern
    const hash = pattern.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const hue = (hash * 137.508) % 360;
    const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.7);
    
    try {
      // Create polygon from vertices
      const shape = new THREE.Shape(vertices.map(v => new THREE.Vector2(v.x, v.y)));
      const geometry = new THREE.ShapeGeometry(shape);
      
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position slightly above the xy-plane to ensure visibility
      mesh.position.z = 0.01;
      
      group.add(mesh);
    } catch (error) {
      // Silent error handling for polytope creation
    }
  });
  
  return group;
}

/**
 * Compute polytopes analytically from ReLU network first layer constraints.
 * This approach only considers first-layer activation patterns, making it
 * a true analytic solution for the first layer boundaries.
 */
function computeAnalyticalPolytopes(
  network: SimpleNeuralNetwork, 
  range: number
): Array<{ pattern: string; vertices: Array<{ x: number; y: number }> }> {
  
  // Discover activation patterns via sampling
  const patterns = discoverActivationPatterns(network, range);
  
  // Build polytopes from patterns
  const polytopes: Array<{ pattern: string; vertices: Array<{ x: number; y: number }> }> = [];
  const hiddenSizes = network.getNetworkInfo().hiddenSizes;
  
  for (const pattern of patterns) {
    try {
      const constraints = buildFirstLayerConstraints(network, pattern, hiddenSizes[0], range);
      const vertices = findPolytopeVertices(constraints);
      
      if (vertices.length >= 3 && calculatePolygonArea(vertices) >= 0.001) {
        polytopes.push({ pattern, vertices });
      }
    } catch (error) {
      // Silent error handling for polytope pattern building
    }
  }
  
  return polytopes;
}

/**
 * Discover first-layer activation patterns via sampling
 */
function discoverActivationPatterns(network: SimpleNeuralNetwork, range: number): Set<string> {
  const patterns = new Set<string>();
  const resolution = 20;
  const step = (2 * range) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = -range + j * step;
      const y = range - i * step;
      
      const rowNormalized = (range - y) / (2 * range);
      const colNormalized = (x + range) / (2 * range);
      
      const { activations } = network.forward([rowNormalized, colNormalized]);
      // Only use first layer activations
      const firstLayerActivations = activations[0];
      const pattern = firstLayerActivations.map(a => a > 0 ? '1' : '0').join('');
      patterns.add(pattern);
    }
  }
  
  return patterns;
}

/**
 * Build constraints from first layer only (simplified approach)
 */
function buildFirstLayerConstraints(
  network: SimpleNeuralNetwork,
  pattern: string,
  firstLayerSize: number,
  range: number
): Array<{ a: number; b: number; c: number; sign: number }> {
  const constraints: Array<{ a: number; b: number; c: number; sign: number }> = [];
  
  const layer1Weights = network.getLayerWeights(0);
  const layer1Biases = network.getLayerBiases(0);
  
  if (!layer1Weights || !layer1Biases || layer1Weights.length !== 2) {
    throw new Error("Invalid first layer structure");
  }
  
  for (let i = 0; i < firstLayerSize; i++) {
    const isActive = pattern[i] === '1';
    const w_row = layer1Weights[0][i];
    const w_col = layer1Weights[1][i];
    const bias = layer1Biases[i];
    
    // Transform: rowNormalized = (range - y)/(2*range), colNormalized = (x + range)/(2*range)
    // Constraint: w_col * x - w_row * y + range * (w_row + w_col) + bias * 2 * range ≥ 0
    const a = w_col;
    const b = -w_row;
    const c = range * (w_row + w_col) + bias * 2 * range;
    
    constraints.push({ a, b, c, sign: isActive ? 1 : -1 });
  }
  
  // Add bounding box
  constraints.push(
    { a: 1, b: 0, c: range, sign: 1 },    // x ≥ -range
    { a: -1, b: 0, c: range, sign: 1 },   // x ≤ range
    { a: 0, b: 1, c: range, sign: 1 },    // y ≥ -range
    { a: 0, b: -1, c: range, sign: 1 }    // y ≤ range
  );
  
  return constraints;
}

// Helper function to calculate polygon area
function calculatePolygonArea(vertices: Array<{ x: number; y: number }>): number {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Find polytope vertices by intersecting constraint boundaries
 */
function findPolytopeVertices(
  constraints: Array<{ a: number; b: number; c: number; sign: number }>
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];
  
  // Convert to standard form: a*x + b*y + c >= 0
  const standardConstraints = constraints.map(constraint => ({
    a: constraint.sign * constraint.a,
    b: constraint.sign * constraint.b, 
    c: constraint.sign * constraint.c
  }));
  
  // Find intersections of constraint boundaries
  for (let i = 0; i < standardConstraints.length; i++) {
    for (let j = i + 1; j < standardConstraints.length; j++) {
      const c1 = standardConstraints[i];
      const c2 = standardConstraints[j];
      
      const det = c1.a * c2.b - c2.a * c1.b;
      if (Math.abs(det) < 1e-10) continue; // Parallel lines
      
      const x = -(c1.c * c2.b - c2.c * c1.b) / det;
      const y = -(c1.a * c2.c - c2.a * c1.c) / det;
      
      // Check if point satisfies all constraints
      const satisfiesAll = standardConstraints.every(constraint => 
        constraint.a * x + constraint.b * y + constraint.c >= -1e-8
      );
      
      if (satisfiesAll) {
        vertices.push({ x, y });
      }
    }
  }
  
  return sortVerticesCounterClockwise(removeDuplicateVertices(vertices));
}

function removeDuplicateVertices(vertices: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const unique: Array<{ x: number; y: number }> = [];
  const tolerance = 1e-8;
  
  for (const vertex of vertices) {
    const isDuplicate = unique.some(existing => 
      Math.abs(existing.x - vertex.x) < tolerance && 
      Math.abs(existing.y - vertex.y) < tolerance
    );
    
    if (!isDuplicate) {
      unique.push(vertex);
    }
  }
  
  return unique;
}

function sortVerticesCounterClockwise(vertices: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (vertices.length < 3) return vertices;
  
  // Find centroid
  const cx = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const cy = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  
  // Sort by polar angle from centroid
  return vertices.sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });
}
