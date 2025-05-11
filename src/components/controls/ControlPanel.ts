import { AppController } from "../../core/AppController";
import { ControlManager } from "./ControlManager";
import {
  createControlsPanel,
  addButton,
  addSlider,
  addCheckbox,
  addTextDisplay
} from "./ControlElements";

export function setupControls(appController: AppController): HTMLElement {
  // Create UI controls
  const controlsPanel = createControlsPanel();
  
  // Create UI manager to handle reactive updates
  const uiManager = new ControlManager(appController);
  
  // Add a title for the controls
  const title = document.createElement('h2');
  title.textContent = 'Neural Network Controls';
  title.style.color = 'black';
  title.style.margin = '0 0 10px 0';
  controlsPanel.appendChild(title);
  
  // Status section
  const statusFieldset = document.createElement('fieldset');
  statusFieldset.style.margin = '5px 0';
  statusFieldset.style.padding = '8px';
  const statusLegend = document.createElement('legend');
  statusLegend.textContent = 'Training Status';
  statusFieldset.appendChild(statusLegend);
  controlsPanel.appendChild(statusFieldset);
  
  // Training status display
  const trainingStatusDisplay = addTextDisplay(statusFieldset, "Status");
  const epochDisplay = addTextDisplay(statusFieldset, "Current Epoch");
  const accuracyDisplay = addTextDisplay(statusFieldset, "Current Accuracy");
  
  // Register status elements with the UI manager
  uiManager.registerStatusElements(
    trainingStatusDisplay.valueElement,
    epochDisplay.valueElement,
    accuracyDisplay.valueElement
  );
  
  // Training controls with emoji buttons
  const controlsFieldset = document.createElement('fieldset');
  controlsFieldset.style.margin = '5px 0';
  controlsFieldset.style.padding = '8px';
  const controlsLegend = document.createElement('legend');
  controlsLegend.textContent = 'Training Controls';
  controlsFieldset.appendChild(controlsLegend);
  controlsPanel.appendChild(controlsFieldset);
  
  // Training controls container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'grid';
  buttonContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  buttonContainer.style.gap = '5px';
  controlsFieldset.appendChild(buttonContainer);
  
  // Create a play/pause toggle button
  const playPauseButton = document.createElement('button');
  playPauseButton.textContent = "▶️  Play";
  playPauseButton.style.margin = '2px';
  playPauseButton.style.padding = '4px 8px';
  
  // Simple toggle implementation that directly checks the app state
  playPauseButton.addEventListener('click', () => {
    const currentState = appController.getAppState();
    if (currentState.trainingConfig.getValue().isTraining) {
      // If training, then stop
      uiManager.onStopTraining();
    } else {
      // If not training, then start
      uiManager.onStartTraining();
    }
  });
  
  // Subscribe to app state changes to update button text
  appController.getAppState().trainingConfig.subscribe(config => {
    playPauseButton.textContent = config.isTraining ? "⏸️  Pause" : "▶️  Play";
  });
  
  buttonContainer.appendChild(playPauseButton);
  
  addButton(buttonContainer, "🔄  Reset", () => {
    uiManager.onResetNetwork();
  });
  
  // Add parameter sliders
  const paramsFieldset = document.createElement('fieldset');
  paramsFieldset.style.margin = '5px 0';
  paramsFieldset.style.padding = '8px';
  const paramsLegend = document.createElement('legend');
  paramsLegend.textContent = 'Parameters';
  paramsFieldset.appendChild(paramsLegend);
  controlsPanel.appendChild(paramsFieldset);
  
  const learningRateSlider = addSlider(paramsFieldset, "Learning Rate", 0.001, 0.1, 0.05, 0.001, (value) => {
    uiManager.onLearningRateChange(value);
  });
  
  const epochsSlider = addSlider(paramsFieldset, "Epochs", 10, 500, 100, 10, (value) => {
    uiManager.onEpochsChange(value);
  });
  
  const hiddenLayerSizeSlider = addSlider(paramsFieldset, "Hidden Layer Size", 2, 20, 8, 1, (value) => {
    uiManager.onHiddenLayerSizeChange(value);
  });
  
  const updateIntervalSlider = addSlider(paramsFieldset, "Update Interval", 1, 50, 10, 1, (value) => {
    uiManager.onUpdateIntervalChange(value);
  });
  
  // Register sliders with the UI manager
  uiManager.registerSliders(
    learningRateSlider,
    epochsSlider,
    hiddenLayerSizeSlider,
    updateIntervalSlider
  );
  
  // Data and visualization controls
  const dataFieldset = document.createElement('fieldset');
  dataFieldset.style.margin = '5px 0';
  dataFieldset.style.padding = '8px';
  const dataLegend = document.createElement('legend');
  dataLegend.textContent = 'Data Controls';
  dataFieldset.appendChild(dataLegend);
  controlsPanel.appendChild(dataFieldset);
  
  addButton(dataFieldset, "🔄  Regenerate Data", () => {
    uiManager.onRegenerateData();
  });
  
  // Panel visibility checkboxes
  const visibilityFieldset = document.createElement('fieldset');
  visibilityFieldset.style.margin = '5px 0';
  visibilityFieldset.style.padding = '8px';
  const visibilityLegend = document.createElement('legend');
  visibilityLegend.textContent = 'Visibility Settings';
  visibilityFieldset.appendChild(visibilityLegend);
  controlsPanel.appendChild(visibilityFieldset);
  
  const trainingDataCheckbox = addCheckbox(visibilityFieldset, "Training Data", true, (checked) => {
    uiManager.onPanelVisibilityChange("trainingData", checked);
  });
  
  const neuralNetworkCheckbox = addCheckbox(visibilityFieldset, "Neural Network", true, (checked) => {
    uiManager.onPanelVisibilityChange("neuralNetwork", checked);
  });
  
  const predictionsCheckbox = addCheckbox(visibilityFieldset, "Predictions", true, (checked) => {
    uiManager.onPanelVisibilityChange("predictions", checked);
  });
  
  const polytopesCheckbox = addCheckbox(visibilityFieldset, "Polytopes", true, (checked) => {
    uiManager.onPanelVisibilityChange("polytopes", checked);
  });
  
  // Register visibility checkboxes with the UI manager
  uiManager.registerVisibilityCheckboxes(
    trainingDataCheckbox,
    neuralNetworkCheckbox,
    predictionsCheckbox,
    polytopesCheckbox
  );
  
  // Camera controls
  const cameraFieldset = document.createElement('fieldset');
  cameraFieldset.style.margin = '5px 0';
  cameraFieldset.style.padding = '8px';
  const cameraLegend = document.createElement('legend');
  cameraLegend.textContent = 'Camera Controls';
  cameraFieldset.appendChild(cameraLegend);
  controlsPanel.appendChild(cameraFieldset);
  
  addButton(cameraFieldset, "🎥  Reset Camera", () => {
    uiManager.onResetCamera();
  });
  
  // Add cleanup handler for window unload
  window.addEventListener('beforeunload', () => {
    uiManager.dispose();
  });
  
  return controlsPanel;
}