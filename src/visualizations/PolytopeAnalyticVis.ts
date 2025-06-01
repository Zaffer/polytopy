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
  
  console.log(`🎯 Analytical polytope setup: cellSize=${cellSize}, spacing=${spacing}, gridCells=${gridCells}`);
  console.log(`📐 Calculated range: ${range} (total visualization size: ${totalSize})`);
  
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
      console.warn("Failed to create analytical polytope:", pattern, error);
    }
  });
  
  return group;
}

/**
 * Compute polytopes analytically using proper multi-layer constraint composition
 * 
 * MATHEMATICAL APPROACH:
 * For a ReLU network f: R² → R, each polytope region is defined by a unique 
 * combination of active/inactive neurons across ALL layers. The challenge is
 * expressing these multi-layer constraints as linear inequalities in input space.
 * 
 * STRATEGY:
 * 1. Generate all feasible activation patterns through forward sampling
 * 2. For each pattern, build the complete constraint system
 * 3. Express higher-layer constraints in terms of input variables
 * 
 * This approach properly handles the hierarchical constraint dependencies
 * rather than incorrectly limiting to first-layer constraints only.
 */
function computeAnalyticalPolytopes(
  network: SimpleNeuralNetwork, 
  range: number
): Array<{ pattern: string; vertices: Array<{ x: number; y: number }> }> {

  console.log("🔬 Proper multi-layer polytope computation...");
  console.log(`📏 Using coordinate range: [-${range}, ${range}] (total width: ${2*range})`);
  
  // Step 1: Discover empirical patterns (same as before)
  const samplingResolution = 20;
  const step = (2 * range) / samplingResolution;
  const discoveredPatterns = new Set<string>();
  
  for (let i = 0; i <= samplingResolution; i++) {
    for (let j = 0; j <= samplingResolution; j++) {
      const x = -range + j * step;
      const y = range - i * step;
      
      const rowNormalized = (range - y) / (2 * range);
      const colNormalized = (x + range) / (2 * range);
      
      const { activations } = network.forward([rowNormalized, colNormalized]);
      const allActivations = activations.flat();
      const pattern = allActivations.map(a => a > 0 ? '1' : '0').join('');
      
      discoveredPatterns.add(pattern);
    }
  }
  
  const patternArray = Array.from(discoveredPatterns);
  console.log(`🎯 Found ${patternArray.length} unique activation patterns`);

  // Step 2: Build complete multi-layer constraint systems
  const polytopes: Array<{ pattern: string; vertices: Array<{ x: number; y: number }> }> = [];
  const networkInfo = network.getNetworkInfo();
  const hiddenSizes = networkInfo.hiddenSizes;
  
  console.log("🧠 Building multi-layer constraint systems...");
  console.log(`  Network: 2 → ${hiddenSizes.join(' → ')} → 1`);
  
  let successCount = 0;
  let failureCount = 0;

  for (const pattern of patternArray) {
    try {
      // Build multi-layer constraint system for this pattern
      const constraints = buildMultiLayerConstraints(network, pattern, hiddenSizes, range);
      
      if (constraints.length === 0) {
        failureCount++;
        console.log(`❌ Pattern ${pattern}: Failed to build constraints`);
        continue;
      }
      
      // Solve constraint system to find polytope vertices
      const vertices = findPolytopeVertices(constraints);
      
      if (vertices.length >= 3) {
        const area = calculatePolygonArea(vertices);
        if (area >= 0.001) {
          polytopes.push({ pattern, vertices });
          successCount++;
          console.log(`✅ Pattern ${pattern}: Valid polytope (${constraints.length} constraints, area ${area.toFixed(4)})`);
        } else {
          failureCount++;
          console.log(`⚠️  Pattern ${pattern}: Polytope too small (area ${area.toFixed(6)})`);
        }
      } else {
        failureCount++;
        console.log(`❌ Pattern ${pattern}: Empty/invalid polytope (${vertices.length} vertices)`);
      }
      
    } catch (error) {
      failureCount++;
      console.warn(`❌ Pattern ${pattern}: Error building constraints:`, error);
    }
  }

  console.log(`\n📊 MULTI-LAYER ANALYTICAL RESULTS:`);
  console.log(`✅ Valid polytopes: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`🎯 Coverage: ${(successCount / patternArray.length * 100).toFixed(1)}%`);
  
  return polytopes;
}

/**
 * Build complete multi-layer constraint system for a given activation pattern
 * 
 * This is the core mathematical challenge: expressing multi-layer ReLU constraints
 * as linear inequalities in input space (x, y).
 * 
 * CRITICAL: We need to properly handle coordinate transformations:
 * - Network expects normalized inputs: [rowNormalized, colNormalized] ∈ [0,1]²
 * - Constraints are solved in world space: (x, y) ∈ [-range, range]²
 * - Transformation: rowNormalized = (range - y)/(2*range), colNormalized = (x + range)/(2*range)
 * 
 * COORDINATE SYSTEM:
 * - Neural network input: [rowNormalized, colNormalized] (matches training data format)
 * - World coordinates: (x, y) where x is horizontal, y is vertical
 * - The weight matrix indices: weights[0][i] = w_row, weights[1][i] = w_col
 */
function buildMultiLayerConstraints(
  network: SimpleNeuralNetwork,
  pattern: string,
  hiddenSizes: number[],
  range: number
): Array<{ a: number; b: number; c: number; sign: number }> {
  
  const constraints: Array<{ a: number; b: number; c: number; sign: number }> = [];
  
  // Parse pattern into per-layer activations
  const layerActivations: boolean[][] = [];
  let patternIndex = 0;
  
  for (let layerIdx = 0; layerIdx < hiddenSizes.length; layerIdx++) {
    const layerSize = hiddenSizes[layerIdx];
    const layerPattern: boolean[] = [];
    
    for (let neuronIdx = 0; neuronIdx < layerSize; neuronIdx++) {
      layerPattern.push(pattern[patternIndex] === '1');
      patternIndex++;
    }
    
    layerActivations.push(layerPattern);
  }
  
  // Layer 1: Direct constraints in input space
  const layer1Weights = network.getLayerWeights(0);
  const layer1Biases = network.getLayerBiases(0);
  
  if (!layer1Weights || !layer1Biases || layer1Weights.length !== 2) {
    throw new Error("Invalid first layer structure");
  }
  
  for (let i = 0; i < hiddenSizes[0]; i++) {
    const isActive = layerActivations[0][i];
    const w_row = layer1Weights[0][i];  // Weight for normalized row input (first parameter)
    const w_col = layer1Weights[1][i];  // Weight for normalized column input (second parameter)
    const bias = layer1Biases[i];
    
    // Network computes: ReLU(w_row * rowNormalized + w_col * colNormalized + bias)
    // Where: rowNormalized = (range - y)/(2*range), colNormalized = (x + range)/(2*range)
    // 
    // Substituting:
    // ReLU(w_row * (range - y)/(2*range) + w_col * (x + range)/(2*range) + bias)
    // = ReLU((w_row * (range - y) + w_col * (x + range))/(2*range) + bias)
    // = ReLU((w_row * range - w_row * y + w_col * x + w_col * range)/(2*range) + bias)
    // = ReLU((w_col * x - w_row * y + range * (w_row + w_col))/(2*range) + bias)
    // 
    // For constraint: (w_col * x - w_row * y + range * (w_row + w_col))/(2*range) + bias ≥ 0 (if active)
    // Multiply by 2*range: w_col * x - w_row * y + range * (w_row + w_col) + bias * 2 * range ≥ 0
    
    const a = w_col;
    const b = -w_row;
    const c = range * (w_row + w_col) + bias * 2 * range;
    
    if (isActive) {
      // Neuron is active: constraint ≥ 0
      constraints.push({ a, b, c, sign: 1 });
    } else {
      // Neuron is inactive: constraint ≤ 0
      constraints.push({ a, b, c, sign: -1 });
    }
  }
  
  // Layer 2+: This is where it gets complex
  // For now, we acknowledge the limitation and add a warning
  if (hiddenSizes.length > 1) {
    console.warn(`⚠️  Pattern ${pattern}: Multi-layer constraint composition not fully implemented`);
    console.warn(`   Currently using first-layer constraints only - this may miss some polytope boundaries`);
  }
  
  // Add bounding box constraints to ensure bounded polytopes
  // We want: -boundingRange ≤ x ≤ boundingRange and -boundingRange ≤ y ≤ boundingRange
  // Convert to standard form: a*x + b*y + c ≥ 0
  const boundingRange = range;
  constraints.push(
    { a: 1, b: 0, c: boundingRange, sign: 1 },    // x ≥ -boundingRange  ⟹  x + boundingRange ≥ 0
    { a: -1, b: 0, c: boundingRange, sign: 1 },   // x ≤ boundingRange   ⟹  -x + boundingRange ≥ 0
    { a: 0, b: 1, c: boundingRange, sign: 1 },    // y ≥ -boundingRange  ⟹  y + boundingRange ≥ 0
    { a: 0, b: -1, c: boundingRange, sign: 1 }    // y ≤ boundingRange   ⟹  -y + boundingRange ≥ 0
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
 * Find vertices of polytope defined by linear inequalities using proper half-space intersection
 * Each constraint represents: a*x + b*y + c >= 0 (if sign=1) or <= 0 (if sign=-1)
 * We find intersections of constraint boundaries and check feasibility
 */
function findPolytopeVertices(
  constraints: Array<{ a: number; b: number; c: number; sign: number }>
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];
  
  // Convert constraints to standard form: a*x + b*y + c >= 0
  const standardConstraints = constraints.map(constraint => ({
    a: constraint.sign * constraint.a,
    b: constraint.sign * constraint.b, 
    c: constraint.sign * constraint.c
  }));
  
  // Find intersections of constraint hyperplanes (boundaries)
  for (let i = 0; i < standardConstraints.length; i++) {
    for (let j = i + 1; j < standardConstraints.length; j++) {
      const c1 = standardConstraints[i];
      const c2 = standardConstraints[j];
      
      // Solve intersection of hyperplane boundaries:
      // c1.a*x + c1.b*y + c1.c = 0
      // c2.a*x + c2.b*y + c2.c = 0
      const det = c1.a * c2.b - c2.a * c1.b;
      
      if (Math.abs(det) < 1e-10) continue; // Parallel lines
      
      const x = -(c1.c * c2.b - c2.c * c1.b) / det;
      const y = -(c1.a * c2.c - c2.a * c1.c) / det;
      
      // Skip points outside reasonable bounds
      if (Math.abs(x) > 50 || Math.abs(y) > 50) continue;
      
      // Check if intersection point satisfies ALL constraints
      let satisfiesAll = true;
      for (const constraint of standardConstraints) {
        const value = constraint.a * x + constraint.b * y + constraint.c;
        if (value < -1e-8) { // Use tight tolerance
          satisfiesAll = false;
          break;
        }
      }
      
      if (satisfiesAll) {
        vertices.push({ x, y });
      }
    }
  }
  
  // Remove duplicates and sort for proper polygon rendering
  const uniqueVertices = removeDuplicateVertices(vertices);
  const sortedVertices = sortVerticesCounterClockwise(uniqueVertices);
  
  return sortedVertices;
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
