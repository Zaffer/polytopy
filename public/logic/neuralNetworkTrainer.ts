export class SimpleNeuralNetwork {
  private inputSize: number;
  private hiddenSize: number;
  private outputSize: number;
  private learningRate: number;

  private weightsInputHidden: number[][];
  private weightsHiddenOutput: number[][];

  constructor(inputSize: number, hiddenSize: number, outputSize: number, learningRate: number = 0.01) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;

    this.weightsInputHidden = this.initializeWeights(inputSize, hiddenSize);
    this.weightsHiddenOutput = this.initializeWeights(hiddenSize, outputSize);
  }

  private initializeWeights(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() - 0.5));
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }

  public forward(input: number[]): { hidden: number[]; output: number[] } {
    const hidden = this.weightsInputHidden.map(row =>
      this.sigmoid(row.reduce((sum, weight, i) => sum + weight * input[i], 0))
    );

    const output = this.weightsHiddenOutput.map(row =>
      this.sigmoid(row.reduce((sum, weight, i) => sum + weight * hidden[i], 0))
    );

    return { hidden, output };
  }

  public train(input: number[], target: number[]): void {
    const { hidden, output } = this.forward(input);

    const outputErrors = target.map((t, i) => t - output[i]);
    const outputDeltas = outputErrors.map((error, i) => error * this.sigmoidDerivative(output[i]));

    const hiddenErrors = this.weightsHiddenOutput[0].map((_, i) =>
      this.weightsHiddenOutput.reduce((sum, row, j) => sum + row[i] * outputDeltas[j], 0)
    );
    const hiddenDeltas = hiddenErrors.map((error, i) => error * this.sigmoidDerivative(hidden[i]));

    // Update weights for hidden to output
    this.weightsHiddenOutput = this.weightsHiddenOutput.map((row, i) =>
      row.map((weight, j) => weight + this.learningRate * outputDeltas[i] * hidden[j])
    );

    // Update weights for input to hidden
    this.weightsInputHidden = this.weightsInputHidden.map((row, i) =>
      row.map((weight, j) => weight + this.learningRate * hiddenDeltas[i] * input[j])
    );
  }
}