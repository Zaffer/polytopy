import * as THREE from "three";

// Function to generate random binary matrix
export function generateBinaryMatrix(rows, cols) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(Math.round(Math.random())); // 0 or 1
    }
    matrix.push(row);
  }
  return matrix;
}

// Function to generate hollow circle pattern
export function generateHollowCircleMatrix(rows, cols) {
  // Initialize matrix with all zeros
  const matrix = Array(rows).fill().map(() => Array(cols).fill(0));
  
  // Calculate center of the matrix
  const centerX = Math.floor(cols / 2);
  const centerY = Math.floor(rows / 2);
  
  // Define circle parameters (radius will be % of the smallest dimension)
  const radius = Math.floor(Math.min(rows, cols) * 0.3);
  // Fill in the circle (set values to 1 for points at approximately radius distance from center)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Calculate distance from center
      const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
      
      // If distance is approximately equal to radius (with thinner line width)
      if (Math.abs(distance - radius) < 0.7) {
        matrix[i][j] = 1;
      }
    }
  }
  
  return matrix;
}

// Create a visual representation of the binary matrix
export function createMatrixVisualization(scene, matrix) {
  const gridGroup = new THREE.Group();
  
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Materials for 0 and 1
  const zeroMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db }); // Blue for 0
  const oneMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c }); // Red for 1
  
  const cellSize = 0.5;
  const spacing = 0.1;
  
  // Create a plane for each cell
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const value = matrix[i][j];
      const material = value === 0 ? zeroMaterial : oneMaterial;
      
      const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const cell = new THREE.Mesh(geometry, material);
      
      // Position the cell in the grid
      cell.position.x = j * (cellSize + spacing) - (cols * (cellSize + spacing)) / 2 + cellSize / 2;
      cell.position.y = -i * (cellSize + spacing) + (rows * (cellSize + spacing)) / 2 - cellSize / 2;
      cell.userData = { row: i, col: j }; // Store position for interactivity
      
      gridGroup.add(cell);
    }
  }
  
  // Add axes and labels
  const axisLength = Math.max(rows, cols) * (cellSize + spacing);
  
  // X-axis line
  const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength/2, -axisLength/2 - 0.5, 0),
    new THREE.Vector3(axisLength/2, -axisLength/2 - 0.5, 0)
  ]);
  const xAxis = new THREE.Line(xAxisGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  
  // Y-axis line
  const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength/2 - 0.5, -axisLength/2, 0),
    new THREE.Vector3(-axisLength/2 - 0.5, axisLength/2, 0)
  ]);
  const yAxis = new THREE.Line(yAxisGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  
  gridGroup.add(xAxis);
  gridGroup.add(yAxis);
  
  scene.add(gridGroup);
  return gridGroup;
}

// Add interactivity to toggle cell values
export function setupInteractivity(scene, camera, matrixVisualization, matrix) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  
  function onPointerClick(event) {
    // Calculate pointer position in normalized device coordinates
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(matrixVisualization.children);
    
    for (let i = 0; i < intersects.length; i++) {
      const cell = intersects[i].object;
      
      // Only toggle cells that have row/col data (not axes)
      if (cell.userData && cell.userData.hasOwnProperty('row')) {
        const row = cell.userData.row;
        const col = cell.userData.col;
        
        // Toggle the value
        matrix[row][col] = 1 - matrix[row][col];
        
        // Update the appearance
        cell.material = matrix[row][col] === 0 ? 
          new THREE.MeshBasicMaterial({ color: 0x3498db }) : 
          new THREE.MeshBasicMaterial({ color: 0xe74c3c });
          
        break;
      }
    }
  }
  
  window.addEventListener('click', onPointerClick);
  
  // Create container for UI controls
  const controlsContainer = document.createElement('div');
  controlsContainer.style.position = 'absolute';
  controlsContainer.style.bottom = '20px';
  controlsContainer.style.left = '20px';
  controlsContainer.style.zIndex = '1000';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.gap = '10px';
  
  // Add shape selector dropdown
  const shapeSelector = document.createElement('select');
  shapeSelector.style.padding = '8px';
  
  const randomOption = document.createElement('option');
  randomOption.value = 'random';
  randomOption.textContent = 'Random Data';
  shapeSelector.appendChild(randomOption);
  
  const circleOption = document.createElement('option');
  circleOption.value = 'hollowCircle';
  circleOption.textContent = 'Hollow Circle';
  shapeSelector.appendChild(circleOption);
  
  // Add a button to regenerate the matrix
  const regenerateButton = document.createElement('button');
  regenerateButton.textContent = 'Generate Shape';
  regenerateButton.style.padding = '8px 12px';
  
  regenerateButton.addEventListener('click', () => {
    scene.remove(matrixVisualization);
    
    let newMatrix;
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Generate matrix based on selected shape
    switch(shapeSelector.value) {
      case 'hollowCircle':
        newMatrix = generateHollowCircleMatrix(rows, cols);
        break;
      case 'random':
      default:
        newMatrix = generateBinaryMatrix(rows, cols);
    }
    
    const newViz = createMatrixVisualization(scene, newMatrix);
    setupInteractivity(scene, camera, newViz, newMatrix);
  });
  
  // Add UI elements to container
  controlsContainer.appendChild(shapeSelector);
  controlsContainer.appendChild(regenerateButton);
  document.body.appendChild(controlsContainer);
}