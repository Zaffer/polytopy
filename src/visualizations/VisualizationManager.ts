import { Observable, Subscription, combineLatest } from "rxjs";
import { filter } from "rxjs/operators";

import { SceneManager } from "../core/SceneManager";
import { PanelType } from "../types/scene";
import { AppState } from "../core/AppState";
import { createDataVisualization } from "./DataVis";
import { createNeuralNetworkVisualization } from "./NetworkVis";
import { createPredictionVisualization } from "./PredictionVis";
import { createSampledPolytopeVisualization } from "./PolytopeSampledVis";
import { createAnalyticPolytopeVisualization } from "./PolytopeAnalyticVis";
import { createLinesVisualization } from "./LinesVis";
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
      combineLatest([
        data$,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([data, options]) => options.showTrainingData && data.length > 0)
      ).subscribe(([data, options]) => {
        const visualization = createDataVisualization(data);
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
    
    // Subscribe to network config changes only when neural network is visible
    this.subscriptions.push(
      combineLatest([
        this.appState.networkConfig,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([_, options]) => options.showNeuralNetwork)
      ).subscribe(([config, options]) => {
        const networkInstance = this.trainingManager?.getNeuralNetwork();
        const visualization = createNeuralNetworkVisualization({
          inputSize: config.inputSize,
          hiddenSizes: config.hiddenSizes,
          outputSize: config.outputSize
        }, networkInstance);
        this.sceneManager.updatePanelWithVisibility(
          PanelType.NEURAL_NETWORK, 
          visualization, 
          options.showNeuralNetwork
        );
      })
    );

    // Subscribe to real-time weight updates during training only when neural network is visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getWeightsUpdate$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showNeuralNetwork)
        ).subscribe(([_, options]) => {
          const config = this.appState.networkConfig.getValue();
          const networkInstance = this.trainingManager?.getNeuralNetwork();
          const visualization = createNeuralNetworkVisualization({
            inputSize: config.inputSize,
            hiddenSizes: config.hiddenSizes,
            outputSize: config.outputSize
          }, networkInstance);
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
      combineLatest([
        predictions$,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([predictions, options]) => options.showPredictions && predictions.length > 0)
      ).subscribe(([predictions, options]) => {
        const visualization = createPredictionVisualization(predictions);
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
    // Subscribe to visualization options changes only when polytopes are visible
    this.subscriptions.push(
      this.appState.visualizationOptions.pipe(
        filter(options => options.showPolytopes)
      ).subscribe(options => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createSampledPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        }
      })
    );

    // Subscribe to network config changes only when polytopes are visible
    this.subscriptions.push(
      combineLatest([
        this.appState.networkConfig,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([_, options]) => options.showPolytopes)
      ).subscribe(([_, options]) => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createSampledPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        }
      })
    );

    // Subscribe to network recreation events only when polytopes are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getNetworkRecreated$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showPolytopes)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createSampledPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.POLYTOPES, 
            visualization, 
            options.showPolytopes
          );
        })
      );
    }

    // Also update when weights change during training only when polytopes are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getWeightsUpdate$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showPolytopes)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createSampledPolytopeVisualization(networkInstance);
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
    // Subscribe to visualization options changes only when analytical polytopes are visible
    this.subscriptions.push(
      this.appState.visualizationOptions.pipe(
        filter(options => options.showAnalyticalPolytopes)
      ).subscribe(options => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createAnalyticPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        }
      })
    );

    // Subscribe to network config changes only when analytical polytopes are visible
    this.subscriptions.push(
      combineLatest([
        this.appState.networkConfig,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([_, options]) => options.showAnalyticalPolytopes)
      ).subscribe(([_, options]) => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createAnalyticPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        }
      })
    );

    // Subscribe to network recreation events only when analytical polytopes are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getNetworkRecreated$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showAnalyticalPolytopes)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createAnalyticPolytopeVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.ANALYTICAL_POLYTOPES, 
            visualization, 
            options.showAnalyticalPolytopes
          );
        })
      );
    }

    // Also update when weights change during training only when analytical polytopes are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getWeightsUpdate$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showAnalyticalPolytopes)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createAnalyticPolytopeVisualization(networkInstance);
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
   * Create or update the lines visualization
   */
  public updateLinesVisualization(): void {
    // Subscribe to visualization options changes only when lines are visible
    this.subscriptions.push(
      this.appState.visualizationOptions.pipe(
        filter(options => options.showLines)
      ).subscribe(options => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createLinesVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.LINES, 
            visualization, 
            options.showLines
          );
        }
      })
    );

    // Subscribe to network config changes only when lines are visible
    this.subscriptions.push(
      combineLatest([
        this.appState.networkConfig,
        this.appState.visualizationOptions
      ]).pipe(
        filter(([_, options]) => options.showLines)
      ).subscribe(([_, options]) => {
        if (this.trainingManager) {
          const networkInstance = this.trainingManager.getNeuralNetwork();
          const visualization = createLinesVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.LINES, 
            visualization, 
            options.showLines
          );
        }
      })
    );

    // Subscribe to network recreation events only when lines are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getNetworkRecreated$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showLines)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createLinesVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.LINES, 
            visualization, 
            options.showLines
          );
        })
      );
    }

    // Also update when weights change during training only when lines are visible
    if (this.trainingManager) {
      this.subscriptions.push(
        combineLatest([
          this.trainingManager.getWeightsUpdate$(),
          this.appState.visualizationOptions
        ]).pipe(
          filter(([_, options]) => options.showLines)
        ).subscribe(([_, options]) => {
          const networkInstance = this.trainingManager!.getNeuralNetwork();
          const visualization = createLinesVisualization(networkInstance);
          this.sceneManager.updatePanelWithVisibility(
            PanelType.LINES, 
            visualization, 
            options.showLines
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
        this.sceneManager.setPanelVisibility(PanelType.LINES, options.showLines);
      })
    );
  }
}