import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppState } from '../core/AppState';
import { DataManager } from './DataGenerator';
import { SimpleNeuralNetwork } from './NeuralNetworkTrainer';
import { TrainingSample } from '../types/model';

/**
 * Class responsible for managing neural network training
 */
export class TrainingManager {
  private appState: AppState;
  private neuralNetwork: SimpleNeuralNetwork;
  
  // Observable for current predictions
  private predictionsSubject = new BehaviorSubject<number[][]>([]);
  
  // Signal to stop current training
  private stopTraining$ = new Subject<void>();
  
  // Training timer
  private trainingTask: number | null = null;

  // Sample counter for loss tracking
  private sampleCounter: number = 0;
  
  constructor(private dataManager: DataManager) {
    this.appState = AppState.getInstance();
    
    // Create neural network with current configuration
    this.neuralNetwork = this.appState.createNeuralNetwork();
    
    // Generate initial predictions
    this.updatePredictions();
    
    // Subscribe to network config changes to recreate network
    this.appState.networkConfig.subscribe(config => {
      // Only recreate if not currently training
      if (!this.appState.trainingConfig.getValue().isTraining) {
        this.neuralNetwork = new SimpleNeuralNetwork(
          config.inputSize,
          config.hiddenSizes,
          config.outputSize,
          config.learningRate
        );
        this.updatePredictions();
      }
    });
  }
  
  /**
   * Get the observable for predictions
   */
  public getPredictions$(): Observable<number[][]> {
    return this.predictionsSubject.asObservable();
  }
  
  /**
   * Start the training process
   */
  public startTraining(): void {
    // Only start if not already training
    if (this.appState.trainingConfig.getValue().isTraining) {
      return;
    }
    
    // Create a fresh Subject for stop signal
    this.stopTraining$ = new Subject<void>();
    
    // Only clear loss history if starting from epoch 0 (fresh start)
    const currentEpoch = this.appState.trainingConfig.getValue().currentEpoch;
    if (currentEpoch === 0) {
      this.appState.clearLossHistory();
    }
    
    // Update state
    this.appState.updateTrainingConfig({ isTraining: true });
    this.appState.setStatus("Training...");
    
    // Start training loop
    this._runTrainingLoop();
  }
  
  /**
   * Stop the training process
   */
  public stopTraining(): void {
    // Only stop if currently training
    if (!this.appState.trainingConfig.getValue().isTraining) {
      return;
    }
    
    // Signal to stop training
    this.stopTraining$.next();
    this.stopTraining$.complete();
    
    // Clear any scheduled training tasks
    if (this.trainingTask !== null) {
      window.clearTimeout(this.trainingTask);
      this.trainingTask = null;
    }
    
    // Make sure training state is set to false
    this.appState.updateTrainingConfig({ isTraining: false });
    this.appState.setStatus("Paused");
  }
  
  /**
   * Reset the neural network and training state
   */
  public resetTraining(): void {
    // Stop any ongoing training
    if (this.appState.trainingConfig.getValue().isTraining) {
      this.stopTraining();
    }
    
    // Reset to epoch 0
    this.appState.updateTrainingConfig({ currentEpoch: 0 });
    
    // Create a new neural network
    this.neuralNetwork = this.appState.createNeuralNetwork();
    
    // Clear loss history
    this.appState.clearLossHistory();
    
    // Reset sample counter
    this.sampleCounter = 0;
    
    // Reset predictions
    this.updatePredictions();
    
    // Update state
    this.appState.setAccuracy(0);
    this.appState.setStatus("Reset");
  }
  
  /**
   * Private method to run the training loop
   */
  private _runTrainingLoop(): void {
    // Get fresh state at the start of the loop
    const trainingConfig = this.appState.trainingConfig.getValue();
    
    // Check if training is still active
    if (!trainingConfig.isTraining) {
      return; // Exit if training has been stopped
    }
    
    // Check if we've reached the target number of epochs
    if (trainingConfig.currentEpoch >= trainingConfig.epochs) {
      this.appState.updateTrainingConfig({ isTraining: false });
      this.appState.setStatus("Complete");
      return;
    }
    
    // Train for one epoch
    this._trainOneEpoch().then(() => {
      // Get fresh state after epoch completes
      const currentState = this.appState.trainingConfig.getValue();
      
      // Check if training is still active
      if (!currentState.isTraining) {
        return; // Exit if training has been stopped
      }
      
      // Increment epoch
      const newEpoch = currentState.currentEpoch + 1;
      this.appState.updateTrainingConfig({ currentEpoch: newEpoch });
      
      // Update visualizations at specified intervals or at the end
      if (newEpoch % currentState.updateInterval === 0 || newEpoch >= currentState.epochs) {
        this.updatePredictions();
      }
      
      // Check if we need to continue training
      if (newEpoch < currentState.epochs) {
        // Schedule next training loop iteration
        this.trainingTask = window.setTimeout(() => this._runTrainingLoop(), 0);
      } else {
        // We're done training
        this.appState.updateTrainingConfig({ isTraining: false });
        this.appState.setStatus("Complete");
      }
    }).catch(error => {
      console.error("Training error:", error);
      // Ensure we clean up if there's an error
      this.appState.updateTrainingConfig({ isTraining: false });
      this.appState.setStatus("Error");
    });
  }
  
  /**
   * Train the neural network for a single epoch
   */
  private async _trainOneEpoch(): Promise<void> {
    // Get training samples
    const samples = await new Promise<TrainingSample[]>(resolve => {
      this.dataManager.getSamples$().pipe(
        takeUntil(this.stopTraining$)
      ).subscribe(samples => {
        resolve(samples);
      });
    });
    
    const currentEpoch = this.appState.trainingConfig.getValue().currentEpoch;
    
    // Calculate epoch loss using all samples for accuracy
    const epochLoss = this.neuralNetwork.calculateLoss(samples);
    this.appState.addLossValue(currentEpoch, epochLoss);
    
    // Get batch size from config
    const batchSize = this.appState.networkConfig.getValue().batchSize;
    
    // Train in mini-batches
    for (let i = 0; i < samples.length; i += batchSize) {
      // Get current batch
      const batch = samples.slice(i, Math.min(i + batchSize, samples.length));
      
      // Train on each sample in the batch
      for (const sample of batch) {
        this.neuralNetwork.train(sample.input, sample.target);
        
        // Track sample loss for every single sample
        const sampleLoss = this.neuralNetwork.calculateLoss([sample]);
        this.appState.addSampleLoss(this.sampleCounter, sampleLoss);
        
        this.sampleCounter++;
      }
    }
    
    return Promise.resolve();
  }
  
  /**
   * Update predictions for the current data
   */
  private updatePredictions(): void {
    const data = this.dataManager.getCurrentData();
    const height = data.length;
    const width = data[0].length;
    
    // Generate predictions
    const predictions: number[][] = [];
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        // Get input - normalized coordinates
        const input = [i / height, j / width];
        
        // Get prediction
        try {
          const result = this.neuralNetwork.forward(input);
          // Scale to make it more visible (0-5 range)
          row.push(result.output[0] * 5);
        } catch (e) {
          console.error("Error in forward pass:", e);
          row.push(0); // Default value on error
        }
      }
      predictions.push(row);
    }
    
    // Update predictions observable
    this.predictionsSubject.next(predictions);
    
    // Calculate and update accuracy
    const accuracy = this._calculateAccuracy(predictions, data);
    this.appState.setAccuracy(accuracy);
  }
  
  /**
   * Calculate accuracy of current predictions
   */
  private _calculateAccuracy(predictions: number[][], data: number[][]): number {
    let correct = 0;
    let total = 0;
    const height = data.length;
    const width = data[0].length;
    
    // Compare predictions with input data
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        // Scale back prediction (0-5 range to 0-1)
        const scaledPrediction = predictions[i][j] / 5;
        // Calculate difference (closer to 0 means more accurate)
        const diff = Math.abs(scaledPrediction - data[i][j]);
        // Consider it correct if the difference is small
        if (diff < 0.2) {
          correct++;
        }
        total++;
      }
    }
    
    return total > 0 ? correct / total : 0;
  }
}
