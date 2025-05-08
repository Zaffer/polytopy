import { SceneManager } from "./core/sceneSetup";
import { NeuralNetworkTrainerUI } from "./visualizations/neuralNetworkTrainerUI";
import { setupControls } from "./visualizations/controlsSetup";

async function main(): Promise<void> {
  // Initialize the scene manager
  const sceneManager = new SceneManager();
  
  // Initialize the neural network trainer UI
  const trainerUI = new NeuralNetworkTrainerUI(sceneManager);
  
  // Create and add UI controls
  const controlsPanel = setupControls(trainerUI);
  document.body.appendChild(controlsPanel);

  // Start the animation loop
  sceneManager.startAnimationLoop();
}

main();
