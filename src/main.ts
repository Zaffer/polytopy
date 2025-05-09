import { SceneManager } from "./core/SceneManager";
import { NeuralNetworkTrainerUI } from "./core/Controller";
import { setupControls } from "./components/controls";

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
