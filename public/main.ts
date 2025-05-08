import { SceneManager } from "./core/sceneSetup";
import { createDataVisualization, generateBinaryData } from "./visualizations/dataVisualization";
import { createNeuralNetworkVisualization } from "./visualizations/neuralNetworkVisualization";
import { createPredictionVisualization } from "./visualizations/predictionVisualization";
import { createPolytopeVisualization } from "./visualizations/polytopeVisualization";
import { SimpleNeuralNetwork } from "./logic/neuralNetworkTrainer";
import { 
  createControlsPanel, 
  addButton, 
  addSlider, 
  addCheckbox,
  addSeparator,
  addTextDisplay
} from "./visualizations/uiControls";

async function main(): Promise<void> {
  const sceneManager = new SceneManager();
  
  // Neural network parameters - these will be controllable via UI
  let trainingInProgress = false;
  let epochs = 100;
  let learningRate = 0.05;
  let hiddenLayerSize = 8;
  let updateInterval = 10;
  let trainingTask: number | null = null;
  let currentEpoch = 0;
  
  // Keep track of all panels to toggle visibility
  const panels: Record<string, { group: THREE.Group, visible: boolean }> = {};

  // Generate binary training data
  const binaryData = generateBinaryData(10, 10);
  
  // Display the training data visualization
  const dataVisualization = createDataVisualization(sceneManager.getScene(), binaryData);
  sceneManager.addPanel("trainingData", dataVisualization);
  panels.trainingData = { group: dataVisualization, visible: true };

  // Create a neural network visualization
  const neuralNetworkVisualization = createNeuralNetworkVisualization(sceneManager.getScene(), binaryData, 5);
  sceneManager.addPanel("neuralNetwork", neuralNetworkVisualization);
  panels.neuralNetwork = { group: neuralNetworkVisualization, visible: true };

  // Initialize with fixed random predictions 
  const initialPredictions = binaryData.map(row => row.map(() => Math.random() * 5));
  const predictionVisualization = createPredictionVisualization(sceneManager.getScene(), initialPredictions);
  sceneManager.addPanel("predictions", predictionVisualization);
  panels.predictions = { group: predictionVisualization, visible: true };

  const polytopeVisualization = createPolytopeVisualization(sceneManager.getScene());
  sceneManager.addPanel("polytopes", polytopeVisualization);
  panels.polytopes = { group: polytopeVisualization, visible: true };

  // Create neural network
  let nn = createNeuralNetwork();

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
  
  addSeparator(controlsPanel);
  
  // Training controls
  addButton(controlsPanel, "Start Training", () => {
    if (!trainingInProgress) {
      trainingInProgress = true;
      trainingStatus.update("Training...");
      startTraining();
    }
  });
  
  addButton(controlsPanel, "Stop Training", () => {
    if (trainingInProgress && trainingTask !== null) {
      window.clearTimeout(trainingTask);
      trainingTask = null;
      trainingInProgress = false;
      trainingStatus.update("Paused");
    }
  });
  
  addButton(controlsPanel, "Reset Network", () => {
    if (trainingInProgress && trainingTask !== null) {
      window.clearTimeout(trainingTask);
      trainingTask = null;
    }
    
    nn = createNeuralNetwork();
    currentEpoch = 0;
    trainingInProgress = false;
    trainingStatus.update("Reset");
    epochDisplay.update("0");
    accuracyDisplay.update("0%");
    
    // Reset predictions visualization
    const resetPredictions = binaryData.map(row => row.map(() => Math.random() * 5));
    const newPredVis = createPredictionVisualization(sceneManager.getScene(), resetPredictions);
    sceneManager.updatePanel("predictions", newPredVis);
  });
  
  addSeparator(controlsPanel);
  
  // Add parameter sliders
  addSlider(controlsPanel, "Learning Rate", 0.001, 0.1, learningRate, 0.001, (value) => {
    learningRate = value;
    // If we already have a neural network, update its learning rate
    if (nn) {
      nn = createNeuralNetwork();
    }
  });
  
  addSlider(controlsPanel, "Epochs", 10, 500, epochs, 10, (value) => {
    epochs = value;
  });
  
  addSlider(controlsPanel, "Hidden Layer Size", 2, 20, hiddenLayerSize, 1, (value) => {
    hiddenLayerSize = Math.round(value);
    // Recreate the network with new hidden layer size
    if (!trainingInProgress) {
      nn = createNeuralNetwork();
    }
  });
  
  addSlider(controlsPanel, "Update Interval", 1, 50, updateInterval, 1, (value) => {
    updateInterval = Math.round(value);
  });
  
  addSeparator(controlsPanel);
  
  // Data and visualization controls
  addButton(controlsPanel, "Regenerate Data", () => {
    if (!trainingInProgress) {
      // Generate new data
      const newData = generateBinaryData(10, 10);
      
      // Update data visualization
      const newDataVis = createDataVisualization(sceneManager.getScene(), newData);
      sceneManager.updatePanel("trainingData", newDataVis);
      panels.trainingData.group = newDataVis;
      
      // Reset neural network
      nn = createNeuralNetwork();
      currentEpoch = 0;
      epochDisplay.update("0");
      
      // Update initial predictions
      const newPredictions = newData.map(row => row.map(() => Math.random() * 5));
      const newPredVis = createPredictionVisualization(sceneManager.getScene(), newPredictions);
      sceneManager.updatePanel("predictions", newPredVis);
      panels.predictions.group = newPredVis;
    }
  });
  
  addSeparator(controlsPanel);
  
  // Panel visibility checkboxes
  addCheckbox(controlsPanel, "Show Training Data", true, (checked) => {
    sceneManager.togglePanelVisibility("trainingData", checked);
    panels.trainingData.visible = checked;
  });
  
  addCheckbox(controlsPanel, "Show Neural Network", true, (checked) => {
    sceneManager.togglePanelVisibility("neuralNetwork", checked);
    panels.neuralNetwork.visible = checked;
  });
  
  addCheckbox(controlsPanel, "Show Predictions", true, (checked) => {
    sceneManager.togglePanelVisibility("predictions", checked);
    panels.predictions.visible = checked;
  });
  
  addCheckbox(controlsPanel, "Show Polytopes", true, (checked) => {
    sceneManager.togglePanelVisibility("polytopes", checked);
    panels.polytopes.visible = checked;
  });
  
  // Simple task to detect edges - this is our training target task
  function isEdgeCell(row: number, col: number, height: number, width: number): number {
    return (row === 0 || col === 0 || row === height - 1 || col === width - 1) ? 1 : 0;
  }
  
  // Create neural network with current parameters
  function createNeuralNetwork(): SimpleNeuralNetwork {
    const windowSize = 3; // 3x3 window
    const inputSize = windowSize * windowSize;
    const outputSize = 1; // Single output for simplicity
    return new SimpleNeuralNetwork(inputSize, hiddenLayerSize, outputSize, learningRate);
  }
  
  // Calculate accuracy of the current predictions
  function calculateAccuracy(predictions: number[][], targets: number[][]): number {
    let correct = 0;
    let total = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      for (let j = 0; j < predictions[i].length; j++) {
        // Classify: if prediction > 0.5, it's a 1, otherwise 0
        const predictedClass = predictions[i][j] / 5 > 0.5 ? 1 : 0;
        if (predictedClass === targets[i][j]) {
          correct++;
        }
        total++;
      }
    }
    
    return total > 0 ? correct / total : 0;
  }

  // Train the neural network for a single epoch
  async function trainOneEpoch() {
    const height = binaryData.length;
    const width = binaryData[0].length;
    
    // Create training data
    const trainingData = [];
    const targetData: number[][] = [];
    
    // Generate target data (edges)
    for (let i = 0; i < height; i++) {
      const targetRow: number[] = [];
      for (let j = 0; j < width; j++) {
        targetRow.push(isEdgeCell(i, j, height, width));
      }
      targetData.push(targetRow);
    }
    
    // Create input windows for training
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        // Create input window (3x3) centered at this cell
        const input = [];
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
              input.push(binaryData[ni][nj]);
            } else {
              input.push(0);
            }
          }
        }
        
        // Target is whether this is an edge cell
        const targets = [targetData[i][j]];
        
        trainingData.push({ input, targets, row: i, col: j });
      }
    }
    
    // Shuffle training data for better training
    trainingData.sort(() => Math.random() - 0.5);
    
    // Train on each sample
    for (const sample of trainingData) {
      nn.train(sample.input, sample.targets);
    }
    
    // Generate predictions for visualization
    const predictions = [];
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        // Get the same input window as used in training
        const input = [];
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
              input.push(binaryData[ni][nj]);
            } else {
              input.push(0);
            }
          }
        }
        
        // Simple prediction
        try {
          const { output } = nn.forward(input);
          // Scale to make it more visible (0-5 range)
          row.push(output[0] * 5);
        } catch (e) {
          console.error("Error in forward pass:", e);
          row.push(0); // Default value on error
        }
      }
      predictions.push(row);
    }
    
    // Calculate and display accuracy
    const accuracy = calculateAccuracy(predictions, targetData);
    accuracyDisplay.update(`${(accuracy * 100).toFixed(1)}%`);
    
    return predictions;
  }

  // Main training loop
  function startTraining() {
    if (currentEpoch >= epochs) {
      trainingStatus.update("Complete");
      trainingInProgress = false;
      return;
    }
    
    // Train for one epoch
    trainOneEpoch().then(predictions => {
      currentEpoch++;
      epochDisplay.update(currentEpoch.toString());
      
      // Update visualization at specified intervals or at the end
      if (currentEpoch % updateInterval === 0 || currentEpoch >= epochs) {
        const newPredictionVisualization = createPredictionVisualization(sceneManager.getScene(), predictions);
        sceneManager.updatePanel("predictions", newPredictionVisualization);
        panels.predictions.group = newPredictionVisualization;
      }
      
      // Continue training or finish
      if (currentEpoch < epochs && trainingInProgress) {
        trainingTask = window.setTimeout(startTraining, 0);
      } else {
        trainingStatus.update(currentEpoch >= epochs ? "Complete" : "Paused");
        trainingInProgress = currentEpoch < epochs;
      }
    });
  }

  sceneManager.startAnimationLoop();
}

main();
