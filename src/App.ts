import { SceneManager } from "./core/SceneManager";
import { AppController } from "./core/AppController";
import { VisualizationManager } from "./visualizations/VisualizationManager";
import { LossChart } from "./components/LossChart";
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
    this.visualizationManager.updateNetworkVisualization();
    this.visualizationManager.updatePredictionVisualization(trainingManager.getPredictions$());
    this.visualizationManager.updatePolytopeVisualization();
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
  }
}
