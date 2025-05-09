import { SceneManager } from "./core/SceneManager";
import { setupControls } from "./components/controls";

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  // Initialize the scene manager
  const sceneManager = new SceneManager();
  
  // Create and add UI controls
  const controlsPanel = setupControls(sceneManager);
  document.body.appendChild(controlsPanel);

  // Start the animation loop
  sceneManager.startAnimationLoop();
  
  // Clean up on window unload
  window.addEventListener('beforeunload', () => {
    sceneManager.dispose();
  });
}

// Start the application
main();
