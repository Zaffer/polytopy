import * as THREE from "three";
import { createTextSprite } from "../utils/TextUtils";

export function createPredictionVisualization(predictions: number[][]): THREE.Group {
  const group = new THREE.Group();
  
  // Handle undefined or empty predictions data
  if (!predictions || predictions.length === 0) {
    console.warn("Empty or undefined predictions provided to createPredictionVisualization");
    return group; // Return empty group
  }
  
  const cellSize = 0.5;
  const spacing = 0.1;

  // Log the prediction values for debugging
  console.log("Prediction values sample:", predictions[0].slice(0, 3));
  
  // Find min and max values for better color scaling
  let minValue = Number.MAX_VALUE;
  let maxValue = Number.MIN_VALUE;
  
  // First pass - get min/max while handling NaN values
  predictions.forEach(row => {
    row.forEach(value => {
      // Skip NaN or infinite values
      if (!isNaN(value) && isFinite(value)) {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    });
  });
  
  // If we have invalid data, use defaults
  if (minValue === Number.MAX_VALUE || maxValue === Number.MIN_VALUE || minValue === maxValue) {
    console.warn("Invalid prediction data range, using defaults");
    minValue = 0;
    maxValue = 5;
  }
  
  console.log(`Prediction range: min=${minValue}, max=${maxValue}`);

  predictions.forEach((row, i) => {
    row.forEach((value, j) => {
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      
      // Replace NaN with default value for visualization purposes
      const safeValue = isNaN(value) || !isFinite(value) ? (minValue + maxValue) / 2 : value;
      
      // Force a minimum brightness difference between colors
      const range = Math.max(1, maxValue - minValue);
      const normalizedValue = Math.max(0.2, Math.min(1, (safeValue - minValue) / range));
      
      // Use a blue to red color spectrum
      const r = normalizedValue * 0.8; // Red component increases with value
      const b = (1 - normalizedValue) * 0.8; // Blue component decreases with value
      const g = 0.1; // Very small green component for better visibility
      
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(r, g, b), 
        side: THREE.DoubleSide, 
        transparent: false
      });
      
      const cell = new THREE.Mesh(geometry, material);

      cell.position.set(
        j * (cellSize + spacing) - (predictions[0].length * (cellSize + spacing)) / 2 + cellSize / 2,
        -i * (cellSize + spacing) + (predictions.length * (cellSize + spacing)) / 2 - cellSize / 2,
        0
      );

      // Add a white outline to each cell
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cell.add(edges);

      group.add(cell);
    });
  });

  // Add a title to the prediction panel
  const titleSprite = createTextSprite('Neural Network Predictions', 32, "rgba(0, 0, 0, 0.5)");
  titleSprite.position.y = (predictions.length * (cellSize + spacing)) / 2 + 1;
  group.add(titleSprite);

  return group;
}