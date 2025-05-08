import * as THREE from "three";

export function createPredictionVisualization(scene: THREE.Scene, predictions: number[][]): THREE.Group {
  const group = new THREE.Group();
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
      
      // Use a fixed color scheme that ensures visibility
      let r, g, b;
      
      if (normalizedValue < 0.33) {
        // Blue for low values
        r = 0;
        g = normalizedValue;
        b = 0.7;
      } else if (normalizedValue < 0.66) {
        // Green for medium values
        r = normalizedValue * 0.7;
        g = 0.7;
        b = (1 - normalizedValue) * 0.7;
      } else {
        // Red for high values
        r = 0.7;
        g = (1 - normalizedValue) * 0.7;
        b = 0;
      }
      
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
  const titleCanvas = document.createElement('canvas');
  titleCanvas.width = 512;
  titleCanvas.height = 128;
  const ctx = titleCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Neural Network Predictions', 256, 64);
    
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
    titlePlane.position.y = (predictions.length * (cellSize + spacing)) / 2 + 1;
    group.add(titlePlane);
  }

  // Removed: scene.add(group);
  return group;
}