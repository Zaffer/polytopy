import { AppController } from "../../core/AppController";
import { ControlManager } from "./ControlManager";
import {
  createControlsPanel,
  addSlider,
  addCheckbox,
  addDropdown,
  addDrawingPad
} from "./ControlElements";
import { PatternType } from "../../types/model";

export function setupControls(appController: AppController): HTMLElement {
  // Create UI controls
  const controlsPanel = createControlsPanel();
  
  // Create UI manager to handle reactive updates
  const uiManager = new ControlManager(appController);

  // Create main wrapper fieldset for the entire control panel
  const mainFieldset = document.createElement('fieldset');
  const mainLegend = document.createElement('legend');
  
  // Create collapsible toggle button and title
  const toggleButton = document.createElement('span');
  toggleButton.textContent = '[-] ';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.userSelect = 'none';
  toggleButton.style.fontFamily = 'monospace';
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = 'Control Panel';
  
  mainLegend.appendChild(toggleButton);
  mainLegend.appendChild(titleSpan);
  mainLegend.style.cursor = 'pointer';
  
  // Create container for all collapsible content
  const collapsibleContent = document.createElement('div');
  
  mainFieldset.appendChild(mainLegend);
  mainFieldset.appendChild(collapsibleContent);
  controlsPanel.appendChild(mainFieldset);
  
  // Add click handler for collapse/expand
  let isCollapsed = false;
  mainLegend.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      toggleButton.textContent = '[+] ';
      collapsibleContent.style.display = 'none';
    } else {
      toggleButton.textContent = '[-] ';
      collapsibleContent.style.display = 'block';
    }
  });

  // Training controls with emoji buttons
  const controlsFieldset = document.createElement('fieldset');
  const controlsLegend = document.createElement('legend');
  controlsLegend.textContent = 'Training Controls';
  controlsFieldset.appendChild(controlsLegend);
  collapsibleContent.appendChild(controlsFieldset);
  
  // Training controls container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  controlsFieldset.appendChild(buttonContainer);
  
  // Create training control button
  const trainingButton = document.createElement('button');
  trainingButton.textContent = "▶️  Train";
  
  // Create reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = "🔄  Reset";
  resetButton.addEventListener('click', () => {
    uiManager.onResetNetwork();
    hasStartedTraining = false;
  });
  
  // Track if training has started (to distinguish between initial Train and Resume)
  let hasStartedTraining = false;
  
  trainingButton.addEventListener('click', () => {
    const currentState = appController.getAppState().trainingConfig.getValue();
    const currentStatus = appController.getAppState().status.getValue();
    
    if (currentStatus === "Complete") {
      // If completed, do nothing - user must use reset button
      return;
    } else if (currentState.isTraining) {
      // If training, pause it
      uiManager.onStopTraining();
    } else {
      // If not training, start or resume it
      uiManager.onStartTraining();
      hasStartedTraining = true;
    }
  });
  
  // Subscribe to app state changes to update button
  appController.getAppState().trainingConfig.subscribe(config => {
    const currentStatus = appController.getAppState().status.getValue();
    
    if (currentStatus === "Complete") {
      trainingButton.textContent = "⏹️  Stopped";
      trainingButton.disabled = true;
    } else if (config.isTraining) {
      trainingButton.textContent = "⏸️  Pause";
      trainingButton.disabled = false;
    } else if (hasStartedTraining && config.currentEpoch > 0) {
      trainingButton.textContent = "⏯️  Resume";
      trainingButton.disabled = false;
    } else {
      trainingButton.textContent = "▶️  Train";
      trainingButton.disabled = false;
      hasStartedTraining = false; // Reset flag when starting fresh
    }
  });
  
  // Also subscribe to status changes to handle completion
  appController.getAppState().status.subscribe(status => {
    if (status === "Complete") {
      trainingButton.textContent = "⏹️  Stopped";
      trainingButton.disabled = true;
    } else if (status === "Reset") {
      trainingButton.textContent = "▶️  Train";
      trainingButton.disabled = false;
      hasStartedTraining = false;
    }
  });
  
  buttonContainer.appendChild(trainingButton);
  buttonContainer.appendChild(resetButton);
  
  // Add network architecture sliders
  const architectureFieldset = document.createElement('fieldset');
  const architectureLegend = document.createElement('legend');
  architectureLegend.textContent = 'Network Architecture';
  architectureFieldset.appendChild(architectureLegend);
  collapsibleContent.appendChild(architectureFieldset);
  
  const networkDepthSlider = addSlider(architectureFieldset, "Network Depth", 1, 5, 2, 1, (value) => {
    uiManager.onNetworkDepthChange(value);
  });
  
  const hiddenLayerSizeSlider = addSlider(architectureFieldset, "Hidden Layer Size", 2, 20, 8, 1, (value) => {
    uiManager.onHiddenLayerSizeChange(value);
  });

  // Add parameter sliders
  const paramsFieldset = document.createElement('fieldset');
  const paramsLegend = document.createElement('legend');
  paramsLegend.textContent = 'Training Parameters';
  paramsFieldset.appendChild(paramsLegend);
  collapsibleContent.appendChild(paramsFieldset);
  
  const epochsSlider = addSlider(paramsFieldset, "Epochs", 10, 1000, 500, 10, (value) => {
    uiManager.onEpochsChange(value);
  });
  
  const learningRateSlider = addSlider(paramsFieldset, "Learning Rate", 0.001, 0.1, 0.05, 0.001, (value) => {
    uiManager.onLearningRateChange(value);
  });
  
  const updateIntervalSlider = addSlider(paramsFieldset, "Update Interval", 1, 50, 10, 1, (value) => {
    uiManager.onUpdateIntervalChange(value);
  });

  // Register sliders with the UI manager
  uiManager.registerSliders(
    learningRateSlider,
    epochsSlider,
    hiddenLayerSizeSlider,
    networkDepthSlider,
    updateIntervalSlider
  );
   // Data and visualization controls
  const dataFieldset = document.createElement('fieldset');
  const dataLegend = document.createElement('legend');
  dataLegend.textContent = 'Input Data';
  dataFieldset.appendChild(dataLegend);
  collapsibleContent.appendChild(dataFieldset);

  // Pattern selection dropdown
  const patternOptions = [
    { id: PatternType.CIRCLE, label: 'Circle', selected: true },
    { id: PatternType.CORNERS, label: 'Corners' },
    { id: PatternType.STRIPES_VERTICAL, label: 'Vertical Stripes' },
    { id: PatternType.STRIPES_FIFTY_FIFTY, label: 'Half Half' },
    { id: PatternType.CHECKERBOARD, label: 'Checkerboard' },
    { id: PatternType.RANDOM, label: 'Random' },
    { id: PatternType.DRAWING_PAD, label: 'Drawing Pad' }
  ];

  const patternDropdown = addDropdown(dataFieldset, patternOptions, (selectedId) => {
    // Handle Random pattern specially - always regenerate when clicked
    if (selectedId === PatternType.RANDOM) {
      uiManager.onRandomPatternClick();
    } else {
      uiManager.onPatternChange(selectedId as PatternType);
    }
    
    // Show/hide drawing pad based on selection
    if (selectedId === PatternType.DRAWING_PAD) {
      drawingPadContainer.style.display = 'block';
    } else {
      drawingPadContainer.style.display = 'none';
    }
  });

  // Register pattern dropdown with UI manager
  uiManager.registerPatternDropdown(patternDropdown);

  // Add drawing pad (initially hidden)
  const drawingPadResult = addDrawingPad(dataFieldset, 10, 10, (data) => {
    uiManager.onDrawingPadChange(data);
  });
  
  const drawingPadContainer = drawingPadResult.container;
  drawingPadContainer.style.display = 'none'; // Initially hidden

  // Register drawing pad with UI manager
  uiManager.registerDrawingPad(drawingPadResult.drawingPad, drawingPadContainer);

  // Network Visuals panel
  const networkVisualsFieldset = document.createElement('fieldset');
  const networkVisualsLegend = document.createElement('legend');
  networkVisualsLegend.textContent = 'Network Visuals';
  networkVisualsFieldset.appendChild(networkVisualsLegend);
  collapsibleContent.appendChild(networkVisualsFieldset);
  
  const trainingDataCheckbox = addCheckbox(networkVisualsFieldset, "Training Data", true, (checked) => {
    uiManager.onPanelVisibilityChange("trainingData", checked);
  });
  
  const neuralNetworkCheckbox = addCheckbox(networkVisualsFieldset, "Neural Network", true, (checked) => {
    uiManager.onPanelVisibilityChange("neuralNetwork", checked);
  });
  
  const predictionsCheckbox = addCheckbox(networkVisualsFieldset, "Predictions", true, (checked) => {
    uiManager.onPanelVisibilityChange("predictions", checked);
  });

  // Polytope Visuals panel
  const polytopeVisualsFieldset = document.createElement('fieldset');
  const polytopeVisualsLegend = document.createElement('legend');
  polytopeVisualsLegend.textContent = 'Polytope Visuals';
  polytopeVisualsFieldset.appendChild(polytopeVisualsLegend);
  collapsibleContent.appendChild(polytopeVisualsFieldset);
  
   const linesCheckbox = addCheckbox(polytopeVisualsFieldset, "Lines (1st Layer)", true, (checked) => {
    uiManager.onPanelVisibilityChange("lines", checked);
  });
  
  const analyticalPolytopesCheckbox = addCheckbox(polytopeVisualsFieldset, "Analytic (1st Layer)", true, (checked) => {
    uiManager.onPanelVisibilityChange("analyticalPolytopes", checked);
  });
  
  const polytopesCheckbox = addCheckbox(polytopeVisualsFieldset, "Sampled", true, (checked) => {
    uiManager.onPanelVisibilityChange("polytopes", checked);
  });
  
 
  // Register visibility checkboxes with the UI manager
  uiManager.registerVisibilityCheckboxes(
    trainingDataCheckbox,
    neuralNetworkCheckbox,
    predictionsCheckbox,
    polytopesCheckbox,
    analyticalPolytopesCheckbox,
    linesCheckbox
  );
  
  // Add cleanup handler for window unload
  window.addEventListener('beforeunload', () => {
    uiManager.dispose();
  });
  
  return controlsPanel;
}