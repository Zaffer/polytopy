import { Subscription } from 'rxjs';
import { SceneManager } from './SceneManager';
import { PanelType } from '../types/scene';
import { DataManager } from '../models/DataGenerator';
import { TrainingManager } from '../models/TrainingManager';
import { AppState } from '../utils/AppState';

/**
 * AppController handles application logic and communication between components
 */
export class AppController {
  private dataManager: DataManager;
  private trainingManager: TrainingManager;
  private appState: AppState;
  private sceneManager: SceneManager;
  private subscriptions: Subscription[] = [];
  
  constructor(sceneManager: SceneManager, gridWidth: number, gridHeight: number) {
    this.sceneManager = sceneManager;
    this.appState = AppState.getInstance();
    
    // Initialize data and training managers
    this.dataManager = new DataManager(gridWidth, gridHeight);
    this.trainingManager = new TrainingManager(this.dataManager);
    
    // Subscribe to visualization options to update panel visibility
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        Object.entries(options).forEach(([key, value]) => {
          const panelKey = key.replace('show', '').toLowerCase();
          const panel = Object.values(PanelType).find(p => p.toLowerCase() === panelKey);
          if (panel) {
            this.sceneManager.togglePanelVisibility(panel as PanelType, value);
          }
        });
      })
    );
  }
  
  /**
   * Start training the neural network
   */
  public startTraining(): void {
    this.trainingManager.startTraining();
  }
  
  /**
   * Stop training the neural network
   */
  public stopTraining(): void {
    this.trainingManager.stopTraining();
  }
  
  /**
   * Reset the neural network
   */
  public resetNetwork(): void {
    this.trainingManager.resetTraining();
  }
  
  /**
   * Regenerate training data
   */
  public regenerateData(width: number, height: number): void {
    // Only allow regenerating data if not currently training
    if (!this.appState.trainingConfig.getValue().isTraining) {
      this.dataManager.regenerateData(width, height);
      this.trainingManager.resetTraining();
    }
  }
  
  /**
   * Update visualization options
   */
  public setVisualizationOption(panelName: PanelType, visible: boolean): void {
    switch (panelName) {
      case PanelType.TRAINING_DATA:
        this.appState.updateVisualizationOptions({ showTrainingData: visible });
        break;
      case PanelType.NEURAL_NETWORK:
        this.appState.updateVisualizationOptions({ showNeuralNetwork: visible });
        break;
      case PanelType.PREDICTIONS:
        this.appState.updateVisualizationOptions({ showPredictions: visible });
        break;
      case PanelType.POLYTOPES:
        this.appState.updateVisualizationOptions({ showPolytopes: visible });
        break;
    }
  }
  
  /**
   * Update learning rate
   */
  public setLearningRate(value: number): void {
    this.appState.updateNetworkConfig({ learningRate: value });
  }
  
  /**
   * Update epochs
   */
  public setEpochs(value: number): void {
    this.appState.updateTrainingConfig({ epochs: value });
  }
  
  /**
   * Update hidden layer size
   */
  public setHiddenLayerSize(value: number): void {
    this.appState.updateNetworkConfig({ hiddenSize: Math.round(value) });
  }
  
  /**
   * Update interval
   */
  public setUpdateInterval(value: number): void {
    this.appState.updateTrainingConfig({ updateInterval: Math.round(value) });
  }
  
  /**
   * Register callbacks for UI updates
   */
  public registerUICallbacks(
    onTrainingStatusChange: (status: string) => void,
    onEpochChange: (epoch: number) => void,
    onAccuracyChange: (accuracy: number) => void
  ): void {
    // Subscribe to status changes
    this.subscriptions.push(
      this.appState.status.subscribe(status => {
        onTrainingStatusChange(status);
      })
    );
    
    // Subscribe to epoch changes
    this.subscriptions.push(
      this.appState.trainingConfig.subscribe(config => {
        onEpochChange(config.currentEpoch);
      })
    );
    
    // Subscribe to accuracy changes
    this.subscriptions.push(
      this.appState.accuracy.subscribe(accuracy => {
        onAccuracyChange(accuracy);
      })
    );
  }
  
  /**
   * Reset the camera to the default position
   */
  public resetCamera(): void {
    this.sceneManager.resetCamera();
  }
  
  /**
   * Get the data manager
   */
  public getDataManager(): DataManager {
    return this.dataManager;
  }
  
  /**
   * Get the training manager
   */
  public getTrainingManager(): TrainingManager {
    return this.trainingManager;
  }
  
  /**
   * Get the app state
   */
  public getAppState(): AppState {
    return this.appState;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
