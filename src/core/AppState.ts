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
  public lossHistory = new BehaviorSubject<Array<{epoch: number, loss: number}>>([]);
  public sampleLossHistory = new BehaviorSubject<Array<{sample: number, loss: number}>>([]);

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
   * Add a loss value to the history
   */
  public addLossValue(epoch: number, loss: number): void {
    const currentHistory = this.lossHistory.getValue();
    const newHistory = [...currentHistory, { epoch, loss }];
    this.lossHistory.next(newHistory);
  }

  /**
   * Add a sample loss value to the history
   */
  public addSampleLoss(sample: number, loss: number): void {
    const currentHistory = this.sampleLossHistory.getValue();
    const newHistory = [...currentHistory, { sample, loss }];
    this.sampleLossHistory.next(newHistory);
  }

  /**
   * Clear loss history
   */
  public clearLossHistory(): void {
    this.lossHistory.next([]);
    this.sampleLossHistory.next([]);
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
    this.clearLossHistory();
  }
}