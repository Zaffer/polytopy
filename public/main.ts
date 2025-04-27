import { SceneManager } from "./core/sceneSetup";
import { createMatrixVisualization, generateBinaryMatrix } from "./visualizations/matrixVisualization";

async function main(): Promise<void> {
  const sceneManager = new SceneManager();

  const binaryMatrix = generateBinaryMatrix(10,  10);

  const matrixVisualization = createMatrixVisualization(sceneManager.getScene(), binaryMatrix);
  sceneManager.addLayer("matrix", matrixVisualization, 0);

  sceneManager.startAnimationLoop();
}

main();
