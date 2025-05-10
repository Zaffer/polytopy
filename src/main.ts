import { SceneManager } from "./core/SceneManager";
import { AppController } from "./core/AppController";
import { setupControls } from "./components/controls";
import { DEFAULT_SCENE_CONFIG } from "./types/scene";

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  // Initialize the scene manager
  const sceneManager = new SceneManager();
  
  // Initialize the application controller 
  const appController = new AppController(
    sceneManager, 
    DEFAULT_SCENE_CONFIG.dataGridSize.width,
    DEFAULT_SCENE_CONFIG.dataGridSize.height
  );
  
  // Set the app controller in the scene manager
  sceneManager.setAppController(appController);
  
  // Create and add UI controls
  const controlsPanel = setupControls(appController);
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
