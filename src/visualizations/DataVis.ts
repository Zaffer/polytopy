import * as THREE from "three";

export function generateBinaryData(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(Math.random()))
  );
}

export function createDataVisualization(data: number[][]): THREE.Group {
  const group = new THREE.Group();
  
  // Handle undefined or empty data
  if (!data || data.length === 0) {
    console.warn("Empty or undefined data provided to createDataVisualization");
    return group; // Return empty group
  }
  
  const cellSize = 0.5;
  const spacing = 0.1;
  const zeroMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }); // Black for 0
  const oneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // White for 1

  data.forEach((row, i) => {
    row.forEach((value, j) => {
      const material = value === 0 ? zeroMaterial : oneMaterial;
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const cell = new THREE.Mesh(geometry, material);
      cell.position.set(
        j * (cellSize + spacing) - (data[0].length * (cellSize + spacing)) / 2 + cellSize / 2,
        -i * (cellSize + spacing) + (data.length * (cellSize + spacing)) / 2 - cellSize / 2,
        0
      );
      group.add(cell);
    });
  });

  return group;
}