import { BehaviorSubject } from 'rxjs';
import { SimpleNeuralNetwork } from '../models/NeuralNetworkTrainer';
import { 
  NetworkConfig, 
  TrainingConfig, 
  VisualizationOptions,
  DEFAULT_NETWORK_CONFIG,
  DEFAULT_TRAINING_CONFIG,
  DEFAULT_VISUALIZATION_OPTIONS
} from '../types/model';

/**
 * Central state management for the application using RxJS
 */
export class AppState {
  private static instance: AppState;
  
  // State subjects
  public networkConfig = new BehaviorSubject<NetworkConfig>(DEFAULT_NETWORK_CONFIG);
  public trainingConfig = new BehaviorSubject<TrainingConfig>(DEFAULT_TRAINING_CONFIG);
  public visualizationOptions = new BehaviorSubject<VisualizationOptions>(DEFAULT_VISUALIZATION_OPTIONS);
  public accuracy = new BehaviorSubject<number>(0);
  public status = new BehaviorSubject<string>('Ready');

  private constructor() {}

  /**
   * Get the singleton instance of AppState
   */
  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  /**
   * Create a new neural network with current configuration
   */
  public createNeuralNetwork(): SimpleNeuralNetwork {
    const config = this.networkConfig.getValue();
    return new SimpleNeuralNetwork(
      config.inputSize,
      config.hiddenSizes,
      config.outputSize,
      config.learningRate
    );
  }

  /**
   * Update the network configuration
   */
  public updateNetworkConfig(config: Partial<NetworkConfig>): void {
    this.networkConfig.next({
      ...this.networkConfig.getValue(),
      ...config
    });
  }

  /**
   * Update the training configuration
   */
  public updateTrainingConfig(config: Partial<TrainingConfig>): void {
    this.trainingConfig.next({
      ...this.trainingConfig.getValue(),
      ...config
    });
  }

  /**
   * Update visualization options
   */
  public updateVisualizationOptions(options: Partial<VisualizationOptions>): void {
    this.visualizationOptions.next({
      ...this.visualizationOptions.getValue(),
      ...options
    });
  }

  /**
   * Update training status
   */
  public setStatus(status: string): void {
    this.status.next(status);
  }

  /**
   * Update accuracy
   */
  public setAccuracy(accuracy: number): void {
    this.accuracy.next(accuracy);
  }

  /**
   * Reset application state
   */
  public reset(): void {
    this.trainingConfig.next({
      ...this.trainingConfig.getValue(),
      currentEpoch: 0,
      isTraining: false,
    });
    this.accuracy.next(0);
    this.status.next('Reset');
  }
}