import { AppController } from "../../core/AppController";
import { UIManager } from "./UIManager";
import {
  createControlsPanel,
  addButton,
  addSlider,
  addCheckbox,
  addSeparator,
  addTextDisplay
} from "./ControlElements";

export function setupControls(appController: AppController): HTMLElement {
  // Create UI controls
  const controlsPanel = createControlsPanel();
  
  // Create UI manager to handle reactive updates
  const uiManager = new UIManager(appController);
  
  // Training status display
  const trainingStatusDisplay = addTextDisplay(controlsPanel, "Training Status");
  const epochDisplay = addTextDisplay(controlsPanel, "Current Epoch");
  const accuracyDisplay = addTextDisplay(controlsPanel, "Current Accuracy");
  
  // Register status elements with the UI manager
  uiManager.registerStatusElements(
    trainingStatusDisplay.valueElement,
    epochDisplay.valueElement,
    accuracyDisplay.valueElement
  );
  
  addSeparator(controlsPanel);
  
  // Training controls
  addButton(controlsPanel, "Start Training", () => {
    uiManager.onStartTraining();
  });
  
  addButton(controlsPanel, "Stop Training", () => {
    uiManager.onStopTraining();
  });
  
  addButton(controlsPanel, "Reset Network", () => {
    uiManager.onResetNetwork();
  });
  
  addSeparator(controlsPanel);
  
  // Add parameter sliders
  const learningRateSlider = addSlider(controlsPanel, "Learning Rate", 0.001, 0.1, 0.05, 0.001, (value) => {
    uiManager.onLearningRateChange(value);
  });
  
  const epochsSlider = addSlider(controlsPanel, "Epochs", 10, 500, 100, 10, (value) => {
    uiManager.onEpochsChange(value);
  });
  
  const hiddenLayerSizeSlider = addSlider(controlsPanel, "Hidden Layer Size", 2, 20, 8, 1, (value) => {
    uiManager.onHiddenLayerSizeChange(value);
  });
  
  const updateIntervalSlider = addSlider(controlsPanel, "Update Interval", 1, 50, 10, 1, (value) => {
    uiManager.onUpdateIntervalChange(value);
  });
  
  // Register sliders with the UI manager
  uiManager.registerSliders(
    learningRateSlider,
    epochsSlider,
    hiddenLayerSizeSlider,
    updateIntervalSlider
  );
  
  addSeparator(controlsPanel);
  
  // Data and visualization controls
  addButton(controlsPanel, "Regenerate Data", () => {
    uiManager.onRegenerateData();
  });
  
  addSeparator(controlsPanel);
  
  // Panel visibility checkboxes
  const trainingDataCheckbox = addCheckbox(controlsPanel, "Show Training Data", true, (checked) => {
    uiManager.onPanelVisibilityChange("trainingData", checked);
  });
  
  const neuralNetworkCheckbox = addCheckbox(controlsPanel, "Show Neural Network", true, (checked) => {
    uiManager.onPanelVisibilityChange("neuralNetwork", checked);
  });
  
  const predictionsCheckbox = addCheckbox(controlsPanel, "Show Predictions", true, (checked) => {
    uiManager.onPanelVisibilityChange("predictions", checked);
  });
  
  const polytopesCheckbox = addCheckbox(controlsPanel, "Show Polytopes", true, (checked) => {
    uiManager.onPanelVisibilityChange("polytopes", checked);
  });
  
  // Register visibility checkboxes with the UI manager
  uiManager.registerVisibilityCheckboxes(
    trainingDataCheckbox,
    neuralNetworkCheckbox,
    predictionsCheckbox,
    polytopesCheckbox
  );
  
  addSeparator(controlsPanel);
  
  // Camera reset button
  addButton(controlsPanel, "Reset Camera", () => {
    uiManager.onResetCamera();
  });
  
  // Add cleanup handler for window unload
  window.addEventListener('beforeunload', () => {
    uiManager.dispose();
  });
  
  return controlsPanel;
}