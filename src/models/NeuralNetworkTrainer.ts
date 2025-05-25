export class SimpleNeuralNetwork {
  private inputSize: number;
  private hiddenSizes: number[];
  private outputSize: number;
  private learningRate: number;

  private weights: number[][][]; // Array of weight matrices between layers
  private biases: number[][]; // Array of bias vectors for each layer
  
  constructor(
    inputSize: number, 
    hiddenSizes: number[], 
    outputSize: number, 
    learningRate: number = 0.01
  ) {
    this.inputSize = inputSize;
    this.hiddenSizes = hiddenSizes;
    this.outputSize = outputSize;
    this.learningRate = learningRate;
    
    // Initialize weights and biases for all layers
    this.weights = [];
    this.biases = [];
    
    // Input to first hidden layer
    this.weights.push(this.initializeWeights(inputSize, hiddenSizes[0]));
    this.biases.push(this.initializeBias(hiddenSizes[0]));
    
    // Between hidden layers
    for (let i = 0; i < hiddenSizes.length - 1; i++) {
      this.weights.push(this.initializeWeights(hiddenSizes[i], hiddenSizes[i + 1]));
      this.biases.push(this.initializeBias(hiddenSizes[i + 1]));
    }
    
    // Last hidden layer to output
    this.weights.push(this.initializeWeights(hiddenSizes[hiddenSizes.length - 1], outputSize));
    this.biases.push(this.initializeBias(outputSize));
  }

  private initializeWeights(inputDim: number, outputDim: number): number[][] {
    // He initialization (good for ReLU): sqrt(2/n)
    const scale = Math.sqrt(2 / inputDim);
    return Array.from({ length: inputDim }, () => 
      Array.from({ length: outputDim }, () => (Math.random() * 2 - 1) * scale)
    );
  }

  private initializeBias(size: number): number[] {
    // Initialize biases to zero for ReLU networks
    return Array(size).fill(0);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private sigmoid(x: number): number {
    const clipped = Math.max(-20, Math.min(20, x));
    return 1 / (1 + Math.exp(-clipped));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }

  public forward(input: number[]): { activations: number[][], output: number[] } {
    if (!input || input.length === 0 || input.some(x => isNaN(x))) {
      console.error("Invalid input in forward pass:", input);
      return { 
        activations: this.hiddenSizes.map(size => Array(size).fill(0)), 
        output: Array(this.outputSize).fill(0)
      };
    }

    // Store all activations for backpropagation
    const activations: number[][] = [];
    
    // Forward pass through hidden layers with ReLU
    let currentActivation = input;
    
    for (let i = 0; i < this.hiddenSizes.length; i++) {
      const nextActivation = [];
      
      for (let j = 0; j < this.weights[i][0].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < currentActivation.length; k++) {
          if (k < this.weights[i].length) {
            sum += currentActivation[k] * this.weights[i][k][j];
          }
        }
        nextActivation.push(this.relu(sum));
      }
      
      activations.push(nextActivation);
      currentActivation = nextActivation;
    }
    
    // Output layer with sigmoid for binary prediction
    const output = [];
    const lastLayerIdx = this.weights.length - 1;
    
    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.biases[lastLayerIdx][i];
      for (let j = 0; j < currentActivation.length; j++) {
        if (j < this.weights[lastLayerIdx].length) {
          sum += currentActivation[j] * this.weights[lastLayerIdx][j][i];
        }
      }
      output.push(this.sigmoid(sum));
    }
    
    return { activations, output };
  }

  public train(input: number[], target: number[]): void {
    // Safety checks
    if (!input || input.length === 0 || !target || target.length === 0 || 
        input.some(x => isNaN(x)) || target.some(x => isNaN(x))) {
      console.error("Invalid input/target in training:", { input, target });
      return;
    }

    // Forward pass
    const { activations, output } = this.forward(input);
    
    // Store all deltas for each layer
    const allDeltas: number[][] = [];
    
    // Calculate output layer errors
    const outputDeltas: number[] = [];
    for (let i = 0; i < this.outputSize; i++) {
      const error = target[i] - output[i];
      outputDeltas.push(error * this.sigmoidDerivative(output[i]));
    }
    allDeltas.push(outputDeltas);
    
    // Calculate hidden layer deltas (working backwards)
    for (let layerIdx = this.hiddenSizes.length - 1; layerIdx >= 0; layerIdx--) {
      const nextLayerDeltas = allDeltas[0]; // Latest deltas (at the front)
      const currentActivations = activations[layerIdx];
      const nextWeights = this.weights[layerIdx + 1];
      
      const layerDeltas: number[] = [];
      for (let i = 0; i < currentActivations.length; i++) {
        let error = 0;
        // Sum up errors from the next layer
        for (let j = 0; j < nextLayerDeltas.length; j++) {
          if (i < nextWeights.length) {
            error += nextLayerDeltas[j] * nextWeights[i][j];
          }
        }
        // Apply ReLU derivative
        layerDeltas.push(error * this.reluDerivative(currentActivations[i]));
      }
      
      // Insert at the beginning (so we maintain backward order)
      allDeltas.unshift(layerDeltas);
    }
    
    // Update weights and biases for all layers
    let layerInput = input;
    
    for (let layerIdx = 0; layerIdx < this.weights.length; layerIdx++) {
      const layerDeltas = allDeltas[layerIdx];
      
      // Update weights for this layer
      for (let i = 0; i < this.weights[layerIdx].length; i++) {
        if (i < layerInput.length) {
          for (let j = 0; j < this.weights[layerIdx][i].length; j++) {
            if (j < layerDeltas.length) {
              const delta = this.learningRate * layerDeltas[j] * layerInput[i];
              if (!isNaN(delta)) {
                this.weights[layerIdx][i][j] += delta;
              }
            }
          }
        }
      }
      
      // Update biases for this layer
      for (let i = 0; i < this.biases[layerIdx].length; i++) {
        if (i < layerDeltas.length) {
          const delta = this.learningRate * layerDeltas[i];
          if (!isNaN(delta)) {
            this.biases[layerIdx][i] += delta;
          }
        }
      }
      
      // The output of this layer becomes the input for the next layer
      layerInput = layerIdx < activations.length ? activations[layerIdx] : output;
    }
  }

  /**
   * Calculate loss (mean squared error) for a set of samples
   */
  public calculateLoss(samples: Array<{input: number[], target: number[]}>): number {
    if (!samples || samples.length === 0) {
      return 0;
    }
    
    let totalLoss = 0;
    let validSamples = 0;
    
    for (const sample of samples) {
      try {
        const { output } = this.forward(sample.input);
        
        // Calculate mean squared error for this sample
        let sampleLoss = 0;
        for (let i = 0; i < sample.target.length && i < output.length; i++) {
          const error = sample.target[i] - output[i];
          sampleLoss += error * error;
        }
        
        totalLoss += sampleLoss / sample.target.length;
        validSamples++;
      } catch (e) {
        console.error("Error calculating loss for sample:", e);
      }
    }
    
    return validSamples > 0 ? totalLoss / validSamples : 0;
  }

  /**
   * Get weight between two specific nodes
   */
  public getWeight(layerIndex: number, fromNodeIndex: number, toNodeIndex: number): number {
    if (layerIndex < 0 || layerIndex >= this.weights.length) {
      return 0;
    }
    
    const layerWeights = this.weights[layerIndex];
    if (fromNodeIndex < 0 || fromNodeIndex >= layerWeights.length ||
        toNodeIndex < 0 || toNodeIndex >= layerWeights[fromNodeIndex].length) {
      return 0;
    }
    
    return layerWeights[fromNodeIndex][toNodeIndex];
  }

  /**
   * Get all weights for a specific layer
   */
  public getLayerWeights(layerIndex: number): number[][] {
    if (layerIndex < 0 || layerIndex >= this.weights.length) {
      return [];
    }
    return this.weights[layerIndex];
  }

  /**
   * Get bias for a specific node in a layer
   */
  public getBias(layerIndex: number, nodeIndex: number): number {
    if (layerIndex < 0 || layerIndex >= this.biases.length ||
        nodeIndex < 0 || nodeIndex >= this.biases[layerIndex].length) {
      return 0;
    }
    return this.biases[layerIndex][nodeIndex];
  }

  /**
   * Get all biases for a specific layer
   */
  public getLayerBiases(layerIndex: number): number[] {
    if (layerIndex < 0 || layerIndex >= this.biases.length) {
      return [];
    }
    return this.biases[layerIndex];
  }

  /**
   * Get network structure info
   */
  public getNetworkInfo() {
    return {
      inputSize: this.inputSize,
      hiddenSizes: this.hiddenSizes,
      outputSize: this.outputSize,
      learningRate: this.learningRate,
      totalLayers: this.weights.length,
      totalParameters: this.getTotalParameters()
    };
  }

  /**
   * Calculate total number of parameters in the network
   */
  private getTotalParameters(): number {
    let total = 0;
    
    // Count weights
    for (const layerWeights of this.weights) {
      for (const nodeWeights of layerWeights) {
        total += nodeWeights.length;
      }
    }
    
    // Count biases
    for (const layerBiases of this.biases) {
      total += layerBiases.length;
    }
    
    return total;
  }

  /**
   * Get weight statistics for visualization
   */
  public getWeightStats() {
    let minWeight = Number.MAX_VALUE;
    let maxWeight = Number.MIN_VALUE;
    let totalWeights = 0;
    let sumWeights = 0;
    let sumSquaredWeights = 0;

    for (const layerWeights of this.weights) {
      for (const nodeWeights of layerWeights) {
        for (const weight of nodeWeights) {
          minWeight = Math.min(minWeight, weight);
          maxWeight = Math.max(maxWeight, weight);
          sumWeights += weight;
          sumSquaredWeights += weight * weight;
          totalWeights++;
        }
      }
    }

    const meanWeight = totalWeights > 0 ? sumWeights / totalWeights : 0;
    const variance = totalWeights > 0 ? (sumSquaredWeights / totalWeights) - (meanWeight * meanWeight) : 0;
    const stdWeight = Math.sqrt(variance);

    return {
      min: minWeight === Number.MAX_VALUE ? 0 : minWeight,
      max: maxWeight === Number.MIN_VALUE ? 0 : maxWeight,
      mean: meanWeight,
      std: stdWeight,
      total: totalWeights
    };
  }

  /**
   * Get current activations for a given input (for visualization)
   */
  public getActivations(input: number[]): number[][] {
    try {
      const { activations } = this.forward(input);
      return activations;
    } catch (e) {
      console.error("Error getting activations:", e);
      return this.hiddenSizes.map(size => Array(size).fill(0));
    }
  }

  /**
   * Get activation statistics across multiple samples
   */
  public getActivationStats(inputs: number[][]): { mean: number[][], std: number[][], max: number[][] } {
    if (!inputs || inputs.length === 0) {
      const emptyLayer = this.hiddenSizes.map(size => Array(size).fill(0));
      return { mean: emptyLayer, std: emptyLayer, max: emptyLayer };
    }

    const allActivations = inputs.map(input => this.getActivations(input));
    const numLayers = this.hiddenSizes.length;
    
    const mean: number[][] = [];
    const std: number[][] = [];
    const max: number[][] = [];

    for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
      const layerSize = this.hiddenSizes[layerIdx];
      const layerMean: number[] = [];
      const layerStd: number[] = [];
      const layerMax: number[] = [];

      for (let nodeIdx = 0; nodeIdx < layerSize; nodeIdx++) {
        const values = allActivations.map(activations => 
          activations[layerIdx] ? activations[layerIdx][nodeIdx] || 0 : 0
        );
        
        const meanVal = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / values.length;
        const stdVal = Math.sqrt(variance);
        const maxVal = Math.max(...values);

        layerMean.push(meanVal);
        layerStd.push(stdVal);
        layerMax.push(maxVal);
      }

      mean.push(layerMean);
      std.push(layerStd);
      max.push(layerMax);
    }

    return { mean, std, max };
  }
}