
/**
 * The type of training data for a specific cell
 */
export interface TrainingSample {
  input: number[];
  target: number[];
  row: number;
  col: number;
}

/**
 * Interface for neural network structure in visualizations
 */
export interface NeuralNetworkStructure {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
}

/**
 * Interface for neural network configuration
 */
export interface NetworkConfig {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  learningRate: number;
}

/**
 * Interface for training configuration
 */
export interface TrainingConfig {
  epochs: number;
  currentEpoch: number;
  updateInterval: number;
  isTraining: boolean;
}

/**
 * Interface for visualization options
 */
export interface VisualizationOptions {
  showTrainingData: boolean;
  showNeuralNetwork: boolean;
  showPredictions: boolean;
  showPolytopes: boolean;
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  inputSize: 9, // 3x3 window
  hiddenSize: 8,
  outputSize: 1,
  learningRate: 0.05,
};

/**
 * Default training configuration
 */
export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  epochs: 100,
  currentEpoch: 0,
  updateInterval: 10,
  isTraining: false,
};

/**
 * Default visualization options
 */
export const DEFAULT_VISUALIZATION_OPTIONS: VisualizationOptions = {
  showTrainingData: true,
  showNeuralNetwork: true,
  showPredictions: true,
  showPolytopes: true,
};
