import * as THREE from "three";
import { SimpleNeuralNetwork } from "../models/NeuralNetworkTrainer";

export function createPolytopeVisualization(neuralNetwork?: SimpleNeuralNetwork): THREE.Group {
  const group = new THREE.Group();
  
  if (!neuralNetwork) {
    return group;
  }

  // Use same scaling as the prediction visualization
  const cellSize = 0.5;
  const spacing = 0.1;
  
  // Assume a typical 10x10 grid for scaling (same as other visualizations)
  const gridCells = 10;
  const totalSize = gridCells * (cellSize + spacing);
  const range = totalSize / 2;
  
  // Higher resolution for smoother polytope boundaries
  const resolution = 80;
  const step = (2 * range) / resolution;
  
  // Create 2D grid of activation patterns
  const patternGrid: string[][] = [];
  
  for (let i = 0; i <= resolution; i++) {
    patternGrid[i] = [];
    for (let j = 0; j <= resolution; j++) {
      const x = -range + j * step;
      const y = range - i * step;  // Flip y-axis: top row (i=0) maps to y=+range
      
      // Convert world coordinates to normalized grid coordinates matching training data
      const rowNormalized = (range - y) / (2 * range);  // y to row: [range,-range] -> [0,1]
      const colNormalized = (x + range) / (2 * range);  // x to col: [-range,range] -> [0,1]
      
      const { activations } = neuralNetwork.forward([rowNormalized, colNormalized]);
      const allActivations = activations.flat();
      const pattern = allActivations.map(a => a > 0 ? '1' : '0').join('');
      
      patternGrid[i][j] = pattern;
    }
  }
  
  // Find regions and draw polygons
  const visited = Array(resolution + 1).fill(null).map(() => Array(resolution + 1).fill(false));
  const regions: { pattern: string; points: THREE.Vector2[] }[] = [];
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      if (!visited[i][j]) {
        const pattern = patternGrid[i][j];
        const boundary = findRegionBoundary(patternGrid, i, j, visited, resolution, range, step);
        
        if (boundary.length >= 3) {
          regions.push({ pattern, points: boundary });
        }
      }
    }
  }
  
  // Draw each region as a filled polygon
  regions.forEach(({ pattern, points }) => {
    if (points.length < 3) return; // Need at least 3 points
    
    // Validate points are not NaN or infinite
    const validPoints = points.filter(p => 
      isFinite(p.x) && isFinite(p.y) && !isNaN(p.x) && !isNaN(p.y)
    );
    
    if (validPoints.length < 3) return;
    
    try {
      // Generate unique color
      const hash = pattern.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const hue = (hash * 137.508) % 360;
      const color = new THREE.Color().setHSL(hue / 360, 0.8, 0.7);
      
      // Create polygon outline
      const shape = new THREE.Shape(validPoints);
      const geometry = new THREE.ShapeGeometry(shape);
      
      // Check if geometry is valid
      if (geometry.attributes.position.count === 0) {
        geometry.dispose();
        return;
      }
      
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      
      // Add border
      const borderGeometry = new THREE.BufferGeometry().setFromPoints(
        validPoints.map(p => new THREE.Vector3(p.x, p.y, 0.01))
      );
      const borderMaterial = new THREE.LineBasicMaterial({ 
        color: color.clone().multiplyScalar(0.6),
        linewidth: 1 
      });
      const border = new THREE.LineLoop(borderGeometry, borderMaterial);
      group.add(border);
    } catch (error) {
      console.warn("Failed to create polygon for pattern:", pattern, error);
    }
  });
  
  return group;
}

function findRegionBoundary(
  grid: string[][], 
  startI: number, 
  startJ: number, 
  visited: boolean[][], 
  gridSize: number, 
  range: number,
  step: number
): THREE.Vector2[] {
  const pattern = grid[startI][startJ];
  const stack = [[startI, startJ]];
  const regionPoints: [number, number][] = [];
  
  // Flood fill to find all points in this region
  while (stack.length > 0) {
    const [i, j] = stack.pop()!;
    
    if (i < 0 || i > gridSize || j < 0 || j > gridSize || 
        visited[i][j] || grid[i][j] !== pattern) {
      continue;
    }
    
    visited[i][j] = true;
    regionPoints.push([i, j]);
    
    // Add neighbors
    stack.push([i+1, j], [i-1, j], [i, j+1], [i, j-1]);
  }
  
  // Find convex hull of region points
  if (regionPoints.length >= 3) {
    const hull = convexHull(regionPoints.map(([i, j]) => [
      -range + j * step,
      range - i * step  // Flip y-axis: top row (i=0) maps to y=+range
    ]));
    
    return hull.map(([x, y]) => new THREE.Vector2(x, y));
  }
  
  return [];
}

function convexHull(points: number[][]): number[][] {
  if (points.length < 3) return points;
  
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  
  const cross = (o: number[], a: number[], b: number[]) => 
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  
  const lower = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}