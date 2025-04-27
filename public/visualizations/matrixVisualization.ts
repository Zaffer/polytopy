import * as THREE from "three";

export function generateBinaryMatrix(rows: number, cols: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(Math.round(Math.random()));
    }
    matrix.push(row);
  }
  return matrix;
}

export function generateHollowCircleMatrix(rows: number, cols: number): number[][] {
  const matrix: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);
  const radius = Math.floor(Math.min(rows, cols) * 0.3);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
      if (Math.abs(distance - radius) < 0.7) {
        matrix[i][j] = 1;
      }
    }
  }
  return matrix;
}

export function createMatrixVisualization(scene: THREE.Scene, matrix: number[][]): THREE.Group {
  const gridGroup = new THREE.Group();
  const rows = matrix.length;
  const cols = matrix[0].length;
  const zeroMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
  const oneMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
  const cellSize = 0.5;
  const spacing = 0.1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const value = matrix[i][j];
      const material = value === 0 ? zeroMaterial : oneMaterial;
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const cell = new THREE.Mesh(geometry, material);
      cell.position.x = j * (cellSize + spacing) - (cols * (cellSize + spacing)) / 2 + cellSize / 2;
      cell.position.y = -i * (cellSize + spacing) + (rows * (cellSize + spacing)) / 2 - cellSize / 2;
      cell.userData = { row: i, col: j };
      gridGroup.add(cell);
    }
  }

  const axisLength = Math.max(rows, cols) * (cellSize + spacing);
  const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength / 2, -axisLength / 2 - 0.5, 0),
    new THREE.Vector3(axisLength / 2, -axisLength / 2 - 0.5, 0)
  ]);
  const xAxis = new THREE.Line(xAxisGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));

  const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength / 2 - 0.5, -axisLength / 2, 0),
    new THREE.Vector3(-axisLength / 2 - 0.5, axisLength / 2, 0)
  ]);
  const yAxis = new THREE.Line(yAxisGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));

  gridGroup.add(xAxis);
  gridGroup.add(yAxis);
  scene.add(gridGroup);
  return gridGroup;
}

export function setupInteractivity(scene: THREE.Scene, camera: THREE.Camera, matrixVisualization: THREE.Group, matrix: number[][]): void {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerClick(event: MouseEvent): void {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(matrixVisualization.children);

    for (let i = 0; i < intersects.length; i++) {
      const cell = intersects[i].object as THREE.Mesh;
      if (cell.userData && cell.userData.hasOwnProperty('row')) {
        const row = cell.userData.row;
        const col = cell.userData.col;
        matrix[row][col] = 1 - matrix[row][col];
        cell.material = matrix[row][col] === 0 ? 
          new THREE.MeshBasicMaterial({ color: 0x3498db }) : 
          new THREE.MeshBasicMaterial({ color: 0xe74c3c });
        break;
      }
    }
  }

  window.addEventListener('click', onPointerClick);
}