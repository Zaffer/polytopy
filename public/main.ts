import { SceneManager } from "./core/sceneSetup";
import { createDataVisualization, generateBinaryData } from "./visualizations/dataVisualization";
import { createNeuralNetworkVisualization } from "./visualizations/neuralNetworkVisualization";
import { createPredictionVisualization } from "./visualizations/predictionVisualization";
import { createPolytopeVisualization } from "./visualizations/polytopeVisualization";

async function main(): Promise<void> {
  const sceneManager = new SceneManager();

  const binaryData = generateBinaryData(10,  10);

  const panelVisualization = createDataVisualization(sceneManager.getScene(), binaryData);
  sceneManager.addPanel("trainingData", panelVisualization);

  const neuralNetworkVisualization = createNeuralNetworkVisualization(sceneManager.getScene(), binaryData, 5);
  sceneManager.addPanel("neuralNetwork", neuralNetworkVisualization);

  const predictions = binaryData.map(row => row.map(() => Math.random() * 5));

  const predictionVisualization = createPredictionVisualization(sceneManager.getScene(), predictions);
  sceneManager.addPanel("predictions", predictionVisualization);

  const polytopeVisualization = createPolytopeVisualization(sceneManager.getScene());
  sceneManager.addPanel("polytopes", polytopeVisualization);

  // sceneManager.drawBoundingBoxes();

  sceneManager.startAnimationLoop();
}

main();
