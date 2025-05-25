import { Observable, Subscription } from "rxjs";

import { SceneManager } from "../core/SceneManager";
import { PanelType } from "../types/scene";
import { AppState } from "../core/AppState";
import { createDataVisualization } from "./DataVis";
import { createNeuralNetworkVisualization } from "./NetworkVis";
import { createPredictionVisualization } from "./PredictionVis";
import { createPolytopeVisualization } from "./PolytopeVis";

/**
 * Manager for 3D visualizations of neural network, data, and predictions
 */
export class VisualizationManager {
  private sceneManager: SceneManager;
  private appState: AppState;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.appState = AppState.getInstance();
  }
  
  /**
   * Clean up subscriptions
   */
  public dispose(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  /**
   * Create or update the data visualization
   */
  public updateDataVisualization(data$: Observable<number[][]>): void {
    this.subscriptions.push(
      data$.subscribe(data => {
        const visualization = createDataVisualization(data);
        this.sceneManager.updatePanel(PanelType.TRAINING_DATA, visualization);
      })
    );
  }
  
  /**
   * Create or update the neural network visualization
   */
  public updateNetworkVisualization(): void {
    this.subscriptions.push(
      this.appState.networkConfig.subscribe(config => {
        const visualization = createNeuralNetworkVisualization({
          inputSize: config.inputSize,
          hiddenSizes: config.hiddenSizes,
          outputSize: config.outputSize
        });
        this.sceneManager.updatePanel(PanelType.NEURAL_NETWORK, visualization);
      })
    );
  }
  
  /**
   * Create or update the prediction visualization
   */
  public updatePredictionVisualization(predictions$: Observable<number[][]>): void {
    this.subscriptions.push(
      predictions$.subscribe(predictions => {
        if (predictions.length === 0) return;
        
        const visualization = createPredictionVisualization(predictions);
        this.sceneManager.updatePanel(PanelType.PREDICTIONS, visualization);
      })
    );
  }
  
  /**
   * Create or update the polytope visualization
   */
  public updatePolytopeVisualization(): void {
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        if (options.showPolytopes) {
          const visualization = createPolytopeVisualization();
          this.sceneManager.updatePanel(PanelType.POLYTOPES, visualization);
        }
      })
    );
  }
}