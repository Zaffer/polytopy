import * as THREE from "three";
import { WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BehaviorSubject, Subscription } from "rxjs";

import { DataManager } from "../models/DataGenerator";
import { TrainingManager } from "../models/TrainingManager";
import { VisualizationManager } from "../visualizations/VisualizationManager";
import { AppState } from "../utils/AppState";

/**
 * SceneManager class that handles both scene management and application logic
 */
export class SceneManager {
  // THREE.js components
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private panels: Map<string, THREE.Group> = new Map();
  
  // Application logic components
  private dataManager: DataManager;
  private trainingManager: TrainingManager;
  private visualizationManager: VisualizationManager;
  private appState: AppState;
  
  // Subscriptions to clean up
  private subscriptions: Subscription[] = [];
  
  constructor() {
    // Initialize scene, camera, renderer
    this.initScene();
    
    // Initialize application state and managers
    this.appState = AppState.getInstance();
    this.dataManager = new DataManager(10, 10);
    this.trainingManager = new TrainingManager(this.dataManager);
    this.visualizationManager = new VisualizationManager(this);
    
    // Initialize visualizations
    this.initVisualizations();
    
    // Subscribe to appState visualization options to update panel visibility
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        this.togglePanelVisibility("trainingData", options.showTrainingData);
        this.togglePanelVisibility("neuralNetwork", options.showNeuralNetwork);
        this.togglePanelVisibility("predictions", options.showPredictions);
        this.togglePanelVisibility("polytopes", options.showPolytopes);
      })
    );
  }
  
  /**
   * Initialize the THREE.js scene
   */
  private initScene(): void {
    // Create scene with dark background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 15;
    
    // Create renderer
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    // Add camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    
    // Setup lighting
    this.addLights();
    
    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }
  
  /**
   * Add lights to the scene
   */
  private addLights(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }
  
  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Initialize visualizations
   */
  private initVisualizations(): void {
    // Set up data visualization
    this.visualizationManager.updateDataVisualization(this.dataManager.getData$());
    
    // Set up neural network visualization
    this.visualizationManager.updateNetworkVisualization();
    
    // Set up prediction visualization
    this.visualizationManager.updatePredictionVisualization(this.trainingManager.getPredictions$());
    
    // Set up polytope visualization
    this.visualizationManager.updatePolytopeVisualization();
  }
  
  /**
   * Start the animation loop
   */
  public startAnimationLoop(): void {
    const animate = (): void => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.renderer.setAnimationLoop(animate);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Dispose of visualization manager
    this.visualizationManager.dispose();
    
    // Stop animation loop
    this.renderer.setAnimationLoop(null);
    
    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize.bind(this));
  }
  
  // Scene management methods
  
  /**
   * Add a panel to the scene
   */
  public addPanel(name: string, group: THREE.Group): void {
    // Calculate position based on existing panels
    let currentDepth = 0;
    if (this.panels.size > 0) {
      const lastPanel = Array.from(this.panels.values()).at(-1);
      if (lastPanel) {
        const boundingBox = new THREE.Box3().setFromObject(lastPanel);
        const lastPanelDepth = boundingBox.max.z - boundingBox.min.z;
        currentDepth = lastPanel.position.z - lastPanelDepth - 2;
      }
    }
    
    group.position.z = currentDepth;
    this.panels.set(name, group);
    this.scene.add(group);
  }
  
  /**
   * Update an existing panel
   */
  public updatePanel(name: string, newGroup: THREE.Group): void {
    const oldGroup = this.panels.get(name);
    
    if (oldGroup) {
      // Preserve the original position of the panel
      newGroup.position.copy(oldGroup.position);
      
      // Remove the old panel and add the new one
      this.scene.remove(oldGroup);
      this.scene.add(newGroup);
      
      // Update the panels map
      this.panels.set(name, newGroup);
    } else {
      // If panel doesn't exist, create a new one
      this.addPanel(name, newGroup);
    }
  }
  
  /**
   * Toggle panel visibility
   */
  public togglePanelVisibility(name: string, visible: boolean): void {
    const group = this.panels.get(name);
    if (group) {
      group.visible = visible;
    }
  }
  
  /**
   * Reset camera to default position
   */
  public resetCamera(): void {
    this.camera.position.set(0, 0, 15);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }
  
  /**
   * Get the THREE.js scene (for visualizations)
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  /**
   * Get the camera (for visualizations)
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  // UI Action methods
  
  /**
   * Start training the neural network
   */
  public startTraining(): void {
    this.trainingManager.startTraining();
  }
  
  /**
   * Stop training the neural network
   */
  public stopTraining(): void {
    this.trainingManager.stopTraining();
  }
  
  /**
   * Reset the neural network
   */
  public resetNetwork(): void {
    this.trainingManager.resetTraining();
  }
  
  /**
   * Regenerate training data
   */
  public regenerateData(): void {
    // Only allow regenerating data if not currently training
    if (!this.appState.trainingConfig.getValue().isTraining) {
      this.dataManager.regenerateData(10, 10);
      this.trainingManager.resetTraining();
    }
  }
  
  /**
   * Update visualization options
   */
  public setVisualizationOption(panelName: string, visible: boolean): void {
    const options = this.appState.visualizationOptions.getValue();
    
    switch (panelName) {
      case "trainingData":
        this.appState.updateVisualizationOptions({ showTrainingData: visible });
        break;
      case "neuralNetwork":
        this.appState.updateVisualizationOptions({ showNeuralNetwork: visible });
        break;
      case "predictions":
        this.appState.updateVisualizationOptions({ showPredictions: visible });
        break;
      case "polytopes":
        this.appState.updateVisualizationOptions({ showPolytopes: visible });
        break;
    }
  }
  
  /**
   * Update learning rate
   */
  public setLearningRate(value: number): void {
    this.appState.updateNetworkConfig({ learningRate: value });
  }
  
  /**
   * Update epochs
   */
  public setEpochs(value: number): void {
    this.appState.updateTrainingConfig({ epochs: value });
  }
  
  /**
   * Update hidden layer size
   */
  public setHiddenLayerSize(value: number): void {
    this.appState.updateNetworkConfig({ hiddenSize: Math.round(value) });
  }
  
  /**
   * Update update interval
   */
  public setUpdateInterval(value: number): void {
    this.appState.updateTrainingConfig({ updateInterval: Math.round(value) });
  }
  
  /**
   * Register callbacks for UI updates
   */
  public registerCallbacks(
    onTrainingStatusChange: (status: string) => void,
    onEpochChange: (epoch: number) => void,
    onAccuracyChange: (accuracy: number) => void
  ): void {
    // Subscribe to status changes
    this.subscriptions.push(
      this.appState.status.subscribe(status => {
        onTrainingStatusChange(status);
      })
    );
    
    // Subscribe to epoch changes
    this.subscriptions.push(
      this.appState.trainingConfig.subscribe(config => {
        onEpochChange(config.currentEpoch);
      })
    );
    
    // Subscribe to accuracy changes
    this.subscriptions.push(
      this.appState.accuracy.subscribe(accuracy => {
        onAccuracyChange(accuracy);
      })
    );
  }
}