import * as THREE from "three";

export function createPredictionVisualization(scene: THREE.Scene, predictions: number[][]): THREE.Group {
  const group = new THREE.Group();
  const cellSize = 0.5;
  const spacing = 0.1;

  predictions.forEach((row, i) => {
    row.forEach((value, j) => {
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const colorValue = Math.min(Math.max(value / 5, 0), 1); // Normalize value between 0 and 1
      const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(colorValue, colorValue, colorValue), 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.7 
      });
      const cell = new THREE.Mesh(geometry, material);

      cell.position.set(
        j * (cellSize + spacing) - (predictions[0].length * (cellSize + spacing)) / 2 + cellSize / 2,
        -i * (cellSize + spacing) + (predictions.length * (cellSize + spacing)) / 2 - cellSize / 2,
        0
      );

      group.add(cell);
    });
  });

  scene.add(group);
  return group;
}