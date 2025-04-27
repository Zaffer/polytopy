import { SceneManager } from "./core/sceneSetup";
import { createDataVisualization, generateBinaryData } from "./visualizations/dataVisualization";
import { createNeuralNetworkVisualization } from "./visualizations/neuralNetworkVisualization";
import { createPredictionVisualization } from "./visualizations/predictionVisualization";

async function main(): Promise<void> {
  const sceneManager = new SceneManager();

  const binaryData = generateBinaryData(10,  10);

  const panelVisualization = createDataVisualization(sceneManager.getScene(), binaryData);
  sceneManager.addPanel("trainingData", panelVisualization, 0);

  const neuralNetworkVisualization = createNeuralNetworkVisualization(sceneManager.getScene(), binaryData);
  sceneManager.addPanel("neuralNetwork", neuralNetworkVisualization, -2);

  const predictions = binaryData.map(row => row.map(() => Math.random() * 5));

  const predictionVisualization = createPredictionVisualization(sceneManager.getScene(), predictions);
  sceneManager.addPanel("predictions", predictionVisualization, -4);

  sceneManager.adjustPanelDepths();

  sceneManager.startAnimationLoop();
}

main();
