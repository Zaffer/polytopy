import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { initScene } from "./sceneSetup.js";
import { 
  generateBinaryMatrix,
  createMatrixVisualization, 
  setupInteractivity 
} from "./matrixVisualization.js";

async function main() {
  // Initialize scene, camera, renderer from the module
  const { scene, camera, renderer, controls, startAnimationLoop } = await initScene();

  // Define matrix dimensions
  const rows = 21;
  const cols = 21;
  
  // Default to random matrix to start
  const binaryMatrix = generateBinaryMatrix(rows, cols);
  
  // Create visualization
  const matrixVisualization = createMatrixVisualization(scene, binaryMatrix);
  
  // Setup interactivity and shape controls
  setupInteractivity(scene, camera, matrixVisualization, binaryMatrix);
  
  // Start animation loop
  startAnimationLoop();
}

main();
