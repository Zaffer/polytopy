export class SimpleNeuralNetwork {
  private inputSize: number;
  private hiddenSize: number;
  private outputSize: number;
  private learningRate: number;

  private weightsInputHidden: number[][];
  private weightsHiddenOutput: number[][];
  private biasHidden: number[];
  private biasOutput: number[];

  constructor(inputSize: number, hiddenSize: number, outputSize: number, learningRate: number = 0.01) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;

    this.weightsInputHidden = this.initializeWeights(inputSize, hiddenSize);
    this.weightsHiddenOutput = this.initializeWeights(hiddenSize, outputSize);
    
    // Initialize bias terms for improved stability
    this.biasHidden = Array(hiddenSize).fill(0).map(() => Math.random() * 0.2 - 0.1);
    this.biasOutput = Array(outputSize).fill(0).map(() => Math.random() * 0.2 - 0.1);
  }

  private initializeWeights(rows: number, cols: number): number[][] {
    // Use smaller initial weights to prevent explosion
    return Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  private sigmoid(x: number): number {
    // Clip to prevent overflow 
    const clipped = Math.max(-20, Math.min(20, x));
    return 1 / (1 + Math.exp(-clipped));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }

  public forward(input: number[]): { hidden: number[]; output: number[] } {
    // Safety checks
    if (!input || input.length === 0 || input.some(x => isNaN(x))) {
      console.error("Invalid input in forward pass:", input);
      return { 
        hidden: Array(this.hiddenSize).fill(0.5), 
        output: Array(this.outputSize).fill(0.5)
      };
    }

    // Calculate hidden layer with bias terms
    const hidden = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = this.biasHidden[i];
      for (let j = 0; j < this.inputSize && j < input.length; j++) {
        sum += input[j] * this.weightsInputHidden[j][i];
      }
      hidden.push(this.sigmoid(sum));
    }

    // Calculate output layer with bias terms
    const output = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.biasOutput[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += hidden[j] * this.weightsHiddenOutput[j][i];
      }
      output.push(this.sigmoid(sum));
    }

    return { hidden, output };
  }

  public train(input: number[], target: number[]): void {
    // Safety checks
    if (!input || input.length === 0 || !target || target.length === 0 || 
        input.some(x => isNaN(x)) || target.some(x => isNaN(x))) {
      console.error("Invalid input/target in training:", { input, target });
      return;
    }

    // Forward pass
    const { hidden, output } = this.forward(input);

    // Calculate output layer errors and deltas
    const outputErrors = [];
    const outputDeltas = [];
    for (let i = 0; i < this.outputSize; i++) {
      const error = target[i] - output[i];
      outputErrors.push(error);
      outputDeltas.push(error * this.sigmoidDerivative(output[i]));
    }

    // Calculate hidden layer errors and deltas
    const hiddenErrors = [];
    const hiddenDeltas = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let error = 0;
      for (let j = 0; j < this.outputSize; j++) {
        error += outputDeltas[j] * this.weightsHiddenOutput[i][j];
      }
      hiddenErrors.push(error);
      hiddenDeltas.push(error * this.sigmoidDerivative(hidden[i]));
    }

    // Update weights for hidden to output
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        const delta = this.learningRate * outputDeltas[j] * hidden[i];
        // Ensure we don't update with NaN values
        if (!isNaN(delta)) {
          this.weightsHiddenOutput[i][j] += delta;
        }
      }
    }
    
    // Update bias for output layer
    for (let i = 0; i < this.outputSize; i++) {
      const delta = this.learningRate * outputDeltas[i];
      if (!isNaN(delta)) {
        this.biasOutput[i] += delta;
      }
    }

    // Update weights for input to hidden
    for (let i = 0; i < this.inputSize && i < input.length; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const delta = this.learningRate * hiddenDeltas[j] * input[i];
        // Ensure we don't update with NaN values
        if (!isNaN(delta)) {
          this.weightsInputHidden[i][j] += delta;
        }
      }
    }
    
    // Update bias for hidden layer
    for (let i = 0; i < this.hiddenSize; i++) {
      const delta = this.learningRate * hiddenDeltas[i];
      if (!isNaN(delta)) {
        this.biasHidden[i] += delta;
      }
    }
  }
}