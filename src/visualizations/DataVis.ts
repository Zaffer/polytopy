import * as THREE from "three";

export function generateBinaryData(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(Math.random()))
  );
}

export function createDataVisualization(scene: THREE.Scene, data: number[][]): THREE.Group {
  const group = new THREE.Group();
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
  const titleCanvas = document.createElement('canvas');
  titleCanvas.width = 512;
  titleCanvas.height = 128;
  const ctx = titleCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Training Data', 256, 64);
    
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
    titlePlane.position.y = (data.length * (cellSize + spacing)) / 2 + 1;
    group.add(titlePlane);
  }

  // Removing the scene.add(group) to prevent duplicate groups
  return group;
}