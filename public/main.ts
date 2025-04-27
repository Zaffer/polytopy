import { SceneManager } from "./core/sceneSetup";
import { createDataVisualization, generateBinaryData } from "./visualizations/dataVisualization";

async function main(): Promise<void> {
  const sceneManager = new SceneManager();

  const binaryData = generateBinaryData(10,  10);

  const panelVisualization = createDataVisualization(sceneManager.getScene(), binaryData);
  sceneManager.addPanel("trainingData", panelVisualization, 0);

  sceneManager.startAnimationLoop();
}

main();
