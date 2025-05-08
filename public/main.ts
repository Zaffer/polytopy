import { SceneManager } from "./core/sceneSetup";
import { NeuralNetworkTrainerUI } from "./visualizations/neuralNetworkTrainerUI";
import {
  createControlsPanel,
  addButton,
  addSlider,
  addCheckbox,
  addSeparator,
  addTextDisplay
} from "./visualizations/uiControls";

async function main(): Promise<void> {
  // Initialize the scene manager
  const sceneManager = new SceneManager();
  
  // Initialize the neural network trainer UI
  const trainerUI = new NeuralNetworkTrainerUI(sceneManager);
  
  // Create UI controls
  const controlsPanel = createControlsPanel();
  document.body.appendChild(controlsPanel);
  
  // Training status display
  const trainingStatus = addTextDisplay(controlsPanel, "Training Status");
  trainingStatus.update("Not Started");
  
  const epochDisplay = addTextDisplay(controlsPanel, "Current Epoch");
  epochDisplay.update("0");
  
  const accuracyDisplay = addTextDisplay(controlsPanel, "Current Accuracy");
  accuracyDisplay.update("0%");
  
  // Register callbacks for UI updates
  trainerUI.registerCallbacks(
    (status) => trainingStatus.update(status),
    (epoch) => epochDisplay.update(epoch.toString()),
    (accuracy) => accuracyDisplay.update(`${(accuracy * 100).toFixed(1)}%`)
  );
  
  addSeparator(controlsPanel);
  
  // Training controls
  addButton(controlsPanel, "Start Training", () => {
    trainerUI.startTraining();
  });
  
  addButton(controlsPanel, "Stop Training", () => {
    trainerUI.stopTraining();
  });
  
  addButton(controlsPanel, "Reset Network", () => {
    trainerUI.resetNetwork();
  });
  
  addSeparator(controlsPanel);
  
  // Add parameter sliders
  addSlider(controlsPanel, "Learning Rate", 0.001, 0.1, 0.05, 0.001, (value) => {
    trainerUI.setLearningRate(value);
  });
  
  addSlider(controlsPanel, "Epochs", 10, 500, 100, 10, (value) => {
    trainerUI.setEpochs(value);
  });
  
  addSlider(controlsPanel, "Hidden Layer Size", 2, 20, 8, 1, (value) => {
    trainerUI.setHiddenLayerSize(value);
  });
  
  addSlider(controlsPanel, "Update Interval", 1, 50, 10, 1, (value) => {
    trainerUI.setUpdateInterval(value);
  });
  
  addSeparator(controlsPanel);
  
  // Data and visualization controls
  addButton(controlsPanel, "Regenerate Data", () => {
    trainerUI.regenerateData();
  });
  
  addSeparator(controlsPanel);
  
  // Panel visibility checkboxes
  addCheckbox(controlsPanel, "Show Training Data", true, (checked) => {
    trainerUI.togglePanelVisibility("trainingData", checked);
  });
  
  addCheckbox(controlsPanel, "Show Neural Network", true, (checked) => {
    trainerUI.togglePanelVisibility("neuralNetwork", checked);
  });
  
  addCheckbox(controlsPanel, "Show Predictions", true, (checked) => {
    trainerUI.togglePanelVisibility("predictions", checked);
  });
  
  addCheckbox(controlsPanel, "Show Polytopes", true, (checked) => {
    trainerUI.togglePanelVisibility("polytopes", checked);
  });

  // Start the animation loop
  sceneManager.startAnimationLoop();
}

main();
