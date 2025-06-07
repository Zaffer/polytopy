import { SceneManager } from "./core/SceneManager";
import { AppController } from "./core/AppController";
import { VisualizationManager } from "./visualizations/VisualizationManager";
import { LossChart } from "./components/LossChart";
import { NetworkInspector } from "./components/NetworkInspector";
import { DEFAULT_SCENE_CONFIG } from "./types/scene";
import { setupControls } from "./components/controls";

/**
 * Main application class that coordinates the different components
 */
export class Application {
  private sceneManager: SceneManager;
  private appController: AppController;
  private visualizationManager: VisualizationManager;
  private lossChart: LossChart | null = null;
  private networkInspector: NetworkInspector | null = null;
  
  constructor() {
    // Initialize components
    this.sceneManager = new SceneManager();
    
    this.appController = new AppController(
      this.sceneManager, 
      DEFAULT_SCENE_CONFIG.dataGridSize.width,
      DEFAULT_SCENE_CONFIG.dataGridSize.height
    );
    
    this.visualizationManager = new VisualizationManager(this.sceneManager);
  }
  
  /**
   * Initialize connections between components
   */
  private wireUpComponents(): void {
    const dataManager = this.appController.getDataManager();
    const trainingManager = this.appController.getTrainingManager();
    
    // Connect visualizations to data sources
    this.visualizationManager.updateDataVisualization(dataManager.getData$());
    this.visualizationManager.updateNetworkVisualization(trainingManager);
    this.visualizationManager.updatePredictionVisualization(trainingManager.getPredictions$());
    this.visualizationManager.updatePolytopeVisualization();
    this.visualizationManager.updateAnalyticalPolytopeVisualization();
    this.visualizationManager.updateLinesVisualization();
    
    // Subscribe to visibility changes for show/hide functionality
    this.visualizationManager.subscribeToVisibilityChanges();
  }
  
  /**
   * Start the application
   */
  public start(): HTMLElement {
    // Wire up components after everything is initialized
    this.wireUpComponents();
    
    // Create UI controls
    const controlsPanel = this.setupControls();
    
    // Initialize loss chart
    this.lossChart = new LossChart();
    
    // Initialize network inspector
    this.setupNetworkInspector();
    
    // Start the animation loop
    this.sceneManager.startAnimationLoop();
    
    // Add cleanup handler
    window.addEventListener('beforeunload', () => this.dispose());
    
    return controlsPanel;
  }
  
  /**
   * Set up UI controls
   */
  private setupControls(): HTMLElement {
    return setupControls(this.appController);
  }

  /**
   * Set up network inspector panel
   */
  private setupNetworkInspector(): void {
    // Create the network inspector
    this.networkInspector = new NetworkInspector();
    
    // Get the interaction manager
    const interactionManager = this.sceneManager.getInteractionManager();
    
    // Set the training manager so it can access network data
    this.networkInspector.setTrainingManager(this.appController.getTrainingManager());
    
    // Set the interaction manager so it can clear selections
    this.networkInspector.setInteractionManager(interactionManager);
    
    // Add the inspector panel to the document
    document.body.appendChild(this.networkInspector.getElement());
    
    // Subscribe to left-click events from the interaction manager
    interactionManager.getLeftClickStream().subscribe(interaction => {
      this.networkInspector?.showSelection(interaction);
    });
  }
  
  /**
   * Get the scene manager instance
   */
  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }
  
  /**
   * Get the app controller instance
   */
  public getAppController(): AppController {
    return this.appController;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    this.appController.dispose();
    this.sceneManager.dispose();
    if (this.lossChart) {
      this.lossChart.destroy();
    }
    if (this.networkInspector) {
      // Remove from DOM
      const element = this.networkInspector.getElement();
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }
}
