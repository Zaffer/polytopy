/**
 * Types of data patterns that can be generated
 */
export enum PatternType {
  RANDOM = 'random',
  CHECKERBOARD = 'checkerboard',
  STRIPES_FIFTY_FIFTY = 'stripes_fifty_fifty',
  STRIPES_VERTICAL = 'stripes_vertical',
  CIRCLE = 'circle',
  CORNERS = 'corners',
  DRAWING_PAD = 'drawing_pad'
}

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
  hiddenSizes: number[];
  outputSize: number;
}

/**
 * Interface for neural network configuration
 */
export interface NetworkConfig {
  inputSize: number;
  hiddenSizes: number[];
  outputSize: number;
  learningRate: number;
  batchSize: number;
}

/**
 * Interface for training configuration
 */
export interface TrainingConfig {
  epochs: number;
  currentEpoch: number;
  updateInterval: number;
  isTraining: boolean;
  patternType: PatternType;
}

/**
 * Interface for visualization options
 */
export interface VisualizationOptions {
  showTrainingData: boolean;
  showNeuralNetwork: boolean;
  showPredictions: boolean;
  showPolytopes: boolean;
  showAnalyticalPolytopes: boolean;
  showLines: boolean;
}

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  inputSize: 2, // x, y coordinates
  hiddenSizes: [4, 4], // Two hidden layers with 4 neurons each
  outputSize: 1,
  learningRate: 0.05,
  batchSize: 32,
};

/**
 * Default training configuration
 */
export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  epochs: 500,
  currentEpoch: 0,
  updateInterval: 10,
  isTraining: false,
  patternType: PatternType.CIRCLE,
};

/**
 * Default visualization options
 */
export const DEFAULT_VISUALIZATION_OPTIONS: VisualizationOptions = {
  showTrainingData: true,
  showNeuralNetwork: true,
  showPredictions: true,
  showPolytopes: true,
  showAnalyticalPolytopes: true,
  showLines: true,
};
