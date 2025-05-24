import { AppController } from "../../core/AppController";
import { ControlManager } from "./ControlManager";
import {
  createControlsPanel,
  addButton,
  addSlider,
  addCheckbox,
  addTextDisplay,
  addRadioGroup,
  addDrawingPad
} from "./ControlElements";
import { PatternType } from "../../types/model";

export function setupControls(appController: AppController): HTMLElement {
  // Create UI controls
  const controlsPanel = createControlsPanel();
  
  // Create UI manager to handle reactive updates
  const uiManager = new ControlManager(appController);
  
  // Add a title for the controls
  const title = document.createElement('h2');
  title.textContent = 'Polytopy Visualiser';
  controlsPanel.appendChild(title);
  
  // Status section
  const statusFieldset = document.createElement('fieldset');
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
  const controlsLegend = document.createElement('legend');
  controlsLegend.textContent = 'Training Controls';
  controlsFieldset.appendChild(controlsLegend);
  controlsPanel.appendChild(controlsFieldset);
  
  // Training controls container
  const buttonContainer = document.createElement('div');
  controlsFieldset.appendChild(buttonContainer);
  
  // Create a play/pause toggle button
  const playPauseButton = document.createElement('button');
  playPauseButton.textContent = "▶️  Play";
  
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
  const dataLegend = document.createElement('legend');
  dataLegend.textContent = 'Data Controls';
  dataFieldset.appendChild(dataLegend);
  controlsPanel.appendChild(dataFieldset);

  // Pattern selection radio buttons
  const patternOptions = [
    { id: PatternType.RANDOM, label: 'Random', checked: true },
    { id: PatternType.CHECKERBOARD, label: 'Checkerboard' },
    { id: PatternType.STRIPES_HORIZONTAL, label: 'Horizontal Stripes' },
    { id: PatternType.STRIPES_VERTICAL, label: 'Vertical Stripes' },
    { id: PatternType.CIRCLE, label: 'Circle' },
    { id: PatternType.CORNERS, label: 'Corners' },
    { id: PatternType.DRAWING_PAD, label: 'Drawing Pad' }
  ];

  const patternRadioGroup = addRadioGroup(dataFieldset, "Pattern Type", patternOptions, (selectedId) => {
    uiManager.onPatternChange(selectedId as PatternType);
    
    // Show/hide drawing pad based on selection
    if (selectedId === PatternType.DRAWING_PAD) {
      drawingPadContainer.style.display = 'block';
    } else {
      drawingPadContainer.style.display = 'none';
    }
  });

  // Register pattern radio group with UI manager
  uiManager.registerPatternRadioGroup(patternRadioGroup.radioButtons);

  // Add drawing pad (initially hidden)
  const drawingPadResult = addDrawingPad(dataFieldset, 10, 10, (data) => {
    uiManager.onDrawingPadChange(data);
  });
  
  const drawingPadContainer = drawingPadResult.container;
  drawingPadContainer.style.display = 'none'; // Initially hidden

  // Register drawing pad with UI manager
  uiManager.registerDrawingPad(drawingPadResult.drawingPad, drawingPadContainer);

  addButton(dataFieldset, "🔄  Regenerate Data", () => {
    uiManager.onRegenerateData();
  });
  
  // Panel visibility checkboxes
  const visibilityFieldset = document.createElement('fieldset');
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