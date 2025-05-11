import * as THREE from "three";
import { createTextSprite } from "../utils/TextUtils";

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
  const zeroMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db, side: THREE.DoubleSide });
  const oneMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide });

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

  // Add a title to the data panel
  const titleSprite = createTextSprite('Training Data', 32, "rgba(0, 0, 0, 0.5)");
  titleSprite.position.y = (data.length * (cellSize + spacing)) / 2 + 1;
  group.add(titleSprite);

  return group;
}