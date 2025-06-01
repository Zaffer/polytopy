import { Observable, Subscription } from "rxjs";

import { SceneManager } from "../core/SceneManager";
import { PanelType } from "../types/scene";
import { AppState } from "../core/AppState";
import { createDataVisualization } from "./DataVis";
import { createNeuralNetworkVisualization } from "./NetworkVis";
import { createPredictionVisualization } from "./PredictionVis";
import { createPolytopeVisualization } from "./PolytopeVis";
import { createPolytopeVisualization as createAnalyticalPolytopeVisualization } from "./PolytopeVis2";
import { TrainingManager } from "../models/TrainingManager";

/**
 * Manager for 3D visualizations of neural network, data, and predictions
 */
export class VisualizationManager {
  private sceneManager: SceneManager;
  private appState: AppState;
  private trainingManager?: TrainingManager;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.appState = AppState.getInstance();
  }
  
  /**
   * Set the training manager reference
   */
  public setTrainingManager(trainingManager: TrainingManager): void {
    this.trainingManager = trainingManager;
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
        const options = this.appState.visualizationOptions.getValue();
        this.sceneManager.updatePanelWithVisibility(
          PanelType.TRAINING_DATA, 
          visualization, 
          options.showTrainingData
        );
      })
    );
  }
  
  /**
   * Create or update the neural network visualization
   */
  public updateNetworkVisualization(trainingManager: TrainingManager): void {
    // Store the training manager for use in subscriptions
    this.trainingManager = trainingManager;
    
    // Subscribe to network config changes
    this.subscriptions.push(
      this.appState.networkConfig.subscribe(config => {
        const networkInstance = this.trainingManager?.getNeuralNetwork();
        const visualization = createNeuralNetworkVisualization({
          inputSize: config.inputSize,
          hiddenSizes: config.hiddenSizes,
          outputSize: config.outputSize
        }, networkInstance);
        const options = this.appState.visualizationOptions.getValue();
        this.sceneManager.updatePanelWithVisibility(
          PanelType.NEURAL_NETWORK, 
          visualization, 
          options.showNeuralNetwork
        );
      })
    );

    // Subscribe to real-time weight updates during training
    if (this.trainingManager) {
      this.subscriptions.push(
        this.trainingManager.getWeightsUpdate$().subscribe(() => {
          const config = this.appState.networkConfig.getValue();
          const networkInstance = this.trainingManager?.getNeuralNetwork();
          const visualization = createNeuralNetworkVisualization({
            inputSize: config.inputSize,
            hiddenSizes: config.hiddenSizes,
            outputSize: config.outputSize
          }, networkInstance);
          const options = this.appState.visualizationOptions.getValue();
          this.sceneManager.updatePanelWithVisibility(
            PanelType.NEURAL_NETWORK, 
            visualization, 
            options.showNeuralNetwork
          );
        })
      );
    }
  }
  
  /**
   * Create or update the prediction visualization
   */
  public updatePredictionVisualization(predictions$: Observable<number[][]>): void {
    this.subscriptions.push(
      predictions$.subscribe(predictions => {
        if (predictions.length === 0) return;
        
        const visualization = createPredictionVisualization(predictions);
        const options = this.appState.visualizationOptions.getValue();
        this.sceneManager.updatePanelWithVisibility(
          PanelType.PREDICTIONS, 
          visualization, 
          options.showPredictions
        );
      })
    );
  }
  
  /**
   * Create or update the polytope visualization
   */
  public updatePolytopeVisualization(): void {
    // Subscribe to visualization options changes
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        }
      })
    );

    // Subscribe to network config changes (topology changes)
    this.subscriptions.push(
      this.appState.networkConfig.subscribe(() => {
        const options = this.appState.visualizationOptions.getValue();
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        }
      })
    );

    // Subscribe to network recreation events
    if (this.trainingManager) {
      this.subscriptions.push(
        this.trainingManager.getNetworkRecreated$().subscribe(() => {
          const options = this.appState.visualizationOptions.getValue();
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        })
      );
    }

    // Also update when weights change during training
    if (this.trainingManager) {
      this.subscriptions.push(
        this.trainingManager.getWeightsUpdate$().subscribe(() => {
          const options = this.appState.visualizationOptions.getValue();
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        })
      );
    }
  }
  
  /**
   * Create or update the analytical polytope visualization (PolytopeVis2)
   */
  public updateAnalyticalPolytopeVisualization(): void {
    // Subscribe to visualization options changes
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createAnalyticalPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        }
      })
    );

    // Subscribe to network config changes (topology changes)
    this.subscriptions.push(
      this.appState.networkConfig.subscribe(() => {
        const options = this.appState.visualizationOptions.getValue();
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createAnalyticalPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        }
      })
    );

    // Subscribe to network recreation events
    if (this.trainingManager) {
      this.subscriptions.push(
        this.trainingManager.getNetworkRecreated$().subscribe(() => {
          const options = this.appState.visualizationOptions.getValue();
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createAnalyticalPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        })
      );
    }

    // Also update when weights change during training
    if (this.trainingManager) {
      this.subscriptions.push(
        this.trainingManager.getWeightsUpdate$().subscribe(() => {
          const options = this.appState.visualizationOptions.getValue();
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createAnalyticalPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        })
      );
    }
  }
  
  /**
   * Subscribe to visualization options changes to handle show/hide
   */
  public subscribeToVisibilityChanges(): void {
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        // Update visibility for all panels
        this.sceneManager.setPanelVisibility(PanelType.TRAINING_DATA, options.showTrainingData);
        this.sceneManager.setPanelVisibility(PanelType.NEURAL_NETWORK, options.showNeuralNetwork);
        this.sceneManager.setPanelVisibility(PanelType.PREDICTIONS, options.showPredictions);
        this.sceneManager.setPanelVisibility(PanelType.POLYTOPES, options.showPolytopes);
        this.sceneManager.setPanelVisibility(PanelType.ANALYTICAL_POLYTOPES, options.showAnalyticalPolytopes);
      })
    );
  }
}