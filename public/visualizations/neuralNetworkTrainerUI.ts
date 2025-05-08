import * as THREE from "three";
import { SceneManager } from "../core/sceneSetup";
import { SimpleNeuralNetwork } from "../logic/neuralNetworkTrainer";
import { createDataVisualization, generateBinaryData } from "./dataVisualization";
import { createNeuralNetworkVisualization } from "./neuralNetworkVisualization";
import { createPredictionVisualization } from "./predictionVisualization";
import { createPolytopeVisualization } from "./polytopeVisualization";

export class NeuralNetworkTrainerUI {
  private sceneManager: SceneManager;
  private nn: SimpleNeuralNetwork;
  private binaryData: number[][];
  private panels: Record<string, { group: THREE.Group, visible: boolean }> = {};
  
  // Neural network parameters
  private trainingInProgress: boolean = false;
  private epochs: number = 100;
  private learningRate: number = 0.05;
  private hiddenLayerSize: number = 8;
  private updateInterval: number = 10;
  private trainingTask: number | null = null;
  private currentEpoch: number = 0;
  
  // UI callbacks
  private onTrainingStatusChange: (status: string) => void = () => {};
  private onEpochChange: (epoch: number) => void = () => {};
  private onAccuracyChange: (accuracy: number) => void = () => {};

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.binaryData = generateBinaryData(10, 10);
    this.nn = this.createNeuralNetwork();
    this.initVisualizations();
  }

  private initVisualizations(): void {
    // Display the training data visualization
    const dataVisualization = createDataVisualization(this.sceneManager.getScene(), this.binaryData);
    this.sceneManager.addPanel("trainingData", dataVisualization);
    this.panels.trainingData = { group: dataVisualization, visible: true };

    // Create a neural network visualization
    const neuralNetworkVisualization = createNeuralNetworkVisualization(
      this.sceneManager.getScene(), 
      this.binaryData, 
      5
    );
    this.sceneManager.addPanel("neuralNetwork", neuralNetworkVisualization);
    this.panels.neuralNetwork = { group: neuralNetworkVisualization, visible: true };

    // Initialize with random predictions
    const initialPredictions = this.binaryData.map(row => row.map(() => Math.random() * 5));
    const predictionVisualization = createPredictionVisualization(
      this.sceneManager.getScene(), 
      initialPredictions
    );
    this.sceneManager.addPanel("predictions", predictionVisualization);
    this.panels.predictions = { group: predictionVisualization, visible: true };

    // Create polytope visualization
    const polytopeVisualization = createPolytopeVisualization(this.sceneManager.getScene());
    this.sceneManager.addPanel("polytopes", polytopeVisualization);
    this.panels.polytopes = { group: polytopeVisualization, visible: true };
  }

  // Register callbacks for UI updates
  public registerCallbacks(
    onTrainingStatusChange: (status: string) => void,
    onEpochChange: (epoch: number) => void,
    onAccuracyChange: (accuracy: number) => void
  ): void {
    this.onTrainingStatusChange = onTrainingStatusChange;
    this.onEpochChange = onEpochChange;
    this.onAccuracyChange = onAccuracyChange;
  }

  // Start training the neural network
  public startTraining(): void {
    if (!this.trainingInProgress) {
      this.trainingInProgress = true;
      this.onTrainingStatusChange("Training...");
      this._startTraining();
    }
  }

  // Stop training the neural network
  public stopTraining(): void {
    if (this.trainingInProgress && this.trainingTask !== null) {
      window.clearTimeout(this.trainingTask);
      this.trainingTask = null;
      this.trainingInProgress = false;
      this.onTrainingStatusChange("Paused");
    }
  }

  // Reset the neural network
  public resetNetwork(): void {
    if (this.trainingInProgress && this.trainingTask !== null) {
      window.clearTimeout(this.trainingTask);
      this.trainingTask = null;
    }
    
    this.nn = this.createNeuralNetwork();
    this.currentEpoch = 0;
    this.trainingInProgress = false;
    this.onTrainingStatusChange("Reset");
    this.onEpochChange(0);
    this.onAccuracyChange(0);
    
    // Reset predictions visualization
    const resetPredictions = this.binaryData.map(row => row.map(() => Math.random() * 5));
    const newPredVis = createPredictionVisualization(this.sceneManager.getScene(), resetPredictions);
    this.sceneManager.updatePanel("predictions", newPredVis);
    this.panels.predictions.group = newPredVis;
  }

  // Regenerate data
  public regenerateData(): void {
    if (!this.trainingInProgress) {
      // Generate new data
      this.binaryData = generateBinaryData(10, 10);
      
      // Update data visualization
      const newDataVis = createDataVisualization(this.sceneManager.getScene(), this.binaryData);
      this.sceneManager.updatePanel("trainingData", newDataVis);
      this.panels.trainingData.group = newDataVis;
      
      // Reset neural network
      this.nn = this.createNeuralNetwork();
      this.currentEpoch = 0;
      this.onEpochChange(0);
      
      // Update initial predictions
      const newPredictions = this.binaryData.map(row => row.map(() => Math.random() * 5));
      const newPredVis = createPredictionVisualization(this.sceneManager.getScene(), newPredictions);
      this.sceneManager.updatePanel("predictions", newPredVis);
      this.panels.predictions.group = newPredVis;
    }
  }

  // Toggle panel visibility
  public togglePanelVisibility(panelName: string, visible: boolean): void {
    this.sceneManager.togglePanelVisibility(panelName, visible);
    if (this.panels[panelName]) {
      this.panels[panelName].visible = visible;
    }
  }

  // Update learning rate
  public setLearningRate(value: number): void {
    this.learningRate = value;
    // If we already have a neural network, update its learning rate
    if (!this.trainingInProgress) {
      this.nn = this.createNeuralNetwork();
    }
  }

  // Update epochs
  public setEpochs(value: number): void {
    this.epochs = value;
  }

  // Update hidden layer size
  public setHiddenLayerSize(value: number): void {
    this.hiddenLayerSize = Math.round(value);
    // Recreate the network with new hidden layer size
    if (!this.trainingInProgress) {
      this.nn = this.createNeuralNetwork();
    }
  }

  // Update update interval
  public setUpdateInterval(value: number): void {
    this.updateInterval = Math.round(value);
  }

  // Create neural network with current parameters
  private createNeuralNetwork(): SimpleNeuralNetwork {
    const windowSize = 3; // 3x3 window
    const inputSize = windowSize * windowSize;
    const outputSize = 1; // Single output for simplicity
    return new SimpleNeuralNetwork(inputSize, this.hiddenLayerSize, outputSize, this.learningRate);
  }

  // Private method that handles the actual training loop
  private _startTraining(): void {
    if (this.currentEpoch >= this.epochs) {
      this.onTrainingStatusChange("Complete");
      this.trainingInProgress = false;
      return;
    }
    
    // Train for one epoch
    this.trainOneEpoch().then(predictions => {
      this.currentEpoch++;
      this.onEpochChange(this.currentEpoch);
      
      // Update visualization at specified intervals or at the end
      if (this.currentEpoch % this.updateInterval === 0 || this.currentEpoch >= this.epochs) {
        const newPredictionVisualization = createPredictionVisualization(
          this.sceneManager.getScene(), 
          predictions
        );
        this.sceneManager.updatePanel("predictions", newPredictionVisualization);
        this.panels.predictions.group = newPredictionVisualization;
      }
      
      // Continue training or finish
      if (this.currentEpoch < this.epochs && this.trainingInProgress) {
        this.trainingTask = window.setTimeout(() => this._startTraining(), 0);
      } else {
        this.onTrainingStatusChange(this.currentEpoch >= this.epochs ? "Complete" : "Paused");
        this.trainingInProgress = this.currentEpoch < this.epochs;
      }
    });
  }

  // Train the neural network for a single epoch
  private async trainOneEpoch(): Promise<number[][]> {
    const height = this.binaryData.length;
    const width = this.binaryData[0].length;
    
    // Create training data
    const trainingData = [];
    const targetData: number[][] = [];
    
    // Generate target data (edges)
    for (let i = 0; i < height; i++) {
      const targetRow: number[] = [];
      for (let j = 0; j < width; j++) {
        targetRow.push(this.isEdgeCell(i, j, height, width));
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
              input.push(this.binaryData[ni][nj]);
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
      this.nn.train(sample.input, sample.targets);
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
              input.push(this.binaryData[ni][nj]);
            } else {
              input.push(0);
            }
          }
        }
        
        // Simple prediction
        try {
          const { output } = this.nn.forward(input);
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
    const accuracy = this.calculateAccuracy(predictions, targetData);
    this.onAccuracyChange(accuracy);
    
    return predictions;
  }

  // Calculate accuracy of the current predictions
  private calculateAccuracy(predictions: number[][], targets: number[][]): number {
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

  // Simple task to detect edges - this is our training target task
  private isEdgeCell(row: number, col: number, height: number, width: number): number {
    return (row === 0 || col === 0 || row === height - 1 || col === width - 1) ? 1 : 0;
  }
}