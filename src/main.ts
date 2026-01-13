import { Application } from "./App";

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  // Create and start the application
  const app = new Application();
  const controlsPanel = app.start();
  
  // Add UI to the document
  document.body.appendChild(controlsPanel);
}

// Start the application
main();
