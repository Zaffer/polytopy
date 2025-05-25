import * as THREE from "three";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { VisualizationManager } from "../visualizations/VisualizationManager";
import { PanelType, SceneConfig, DEFAULT_SCENE_CONFIG } from "../types/scene";
import { PanelLabels } from "../components/PanelLabels";

/**
 * SceneManager class responsible for the core 3D scene setup and management
 */
export class SceneManager {
  // THREE.js components
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: WebGPURenderer;
  private controls: OrbitControls;
  private panels: Map<PanelType, THREE.Group> = new Map();
  
  // Application components
  private visualizationManager: VisualizationManager;
  private panelLabels: PanelLabels;
  
  // Configuration
  private config: SceneConfig;
  
  constructor(config: Partial<SceneConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_SCENE_CONFIG, ...config };
    
    // Initialize THREE.js components
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.renderer.backgroundColor);
    
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      window.innerWidth / window.innerHeight,
      this.config.camera.near,
      this.config.camera.far
    );
    this.camera.position.copy(this.config.camera.initialPosition);
    
    // Initialize renderer
    this.renderer = new WebGPURenderer({ 
      antialias: this.config.renderer.antialias,
      powerPreference: 'high-performance' 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    
    // Add lights
    this.addLights();
    
    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
    
    // Initialize visualizations
    this.visualizationManager = new VisualizationManager(this);
    
    // Initialize panel labels
    this.panelLabels = new PanelLabels();
    this.scene.add(this.panelLabels.getLabelGroup());
  }
  
  /**
   * Add lights to the scene
   */
  private addLights(): void {
    // const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    // this.scene.add(ambientLight);
    
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // directionalLight.position.set(1, 1, 1);
    // this.scene.add(directionalLight);
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
    this.visualizationManager.dispose();
    this.panelLabels.dispose();
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.onWindowResize.bind(this));
  }
  
  // Panel management methods
  
  /**
   * Add a panel to the scene
   */
  public addPanel(name: PanelType, group: THREE.Group): void {
    // Calculate position based on existing panels
    let currentDepth = 0;
    if (this.panels.size > 0) {
      const lastPanel = Array.from(this.panels.values()).at(-1);
      if (lastPanel) {
        const boundingBox = new THREE.Box3().setFromObject(lastPanel);
        const depth = boundingBox.max.z - boundingBox.min.z;
        currentDepth = lastPanel.position.z - depth - this.config.panelSpacing;
      }
    }
    
    group.position.z = currentDepth;
    this.panels.set(name, group);
    this.scene.add(group);
    
    // Add label for this panel
    this.panelLabels.setLabel(name, group.position);
  }
  
  /**
   * Update an existing panel
   */
  public updatePanel(name: PanelType, newGroup: THREE.Group): void {
    const oldGroup = this.panels.get(name);
    
    if (oldGroup) {
      newGroup.position.copy(oldGroup.position);
      this.scene.remove(oldGroup);
      this.scene.add(newGroup);
      this.panels.set(name, newGroup);
      
      // Update label position
      this.panelLabels.updateLabelPosition(name, newGroup.position);
      
      // Reposition panels that come after this one
      this.repositionPanelsAfter(name);
    } else {
      this.addPanel(name, newGroup);
    }
  }

  /**
   * Reposition all panels that come after the specified panel
   */
  private repositionPanelsAfter(changedPanelName: PanelType): void {
    const panelOrder = [
      PanelType.TRAINING_DATA,
      PanelType.NEURAL_NETWORK,
      PanelType.PREDICTIONS,
      PanelType.POLYTOPES
    ];

    const changedPanelIndex = panelOrder.indexOf(changedPanelName);
    if (changedPanelIndex === -1 || changedPanelIndex === panelOrder.length - 1) {
      return; // No panels after this one
    }

    // Calculate new positions for panels that come after the changed panel
    let currentDepth = 0;
    
    for (let i = 0; i <= changedPanelIndex; i++) {
      const panelType = panelOrder[i];
      const panel = this.panels.get(panelType);
      
      if (panel) {
        if (i === 0) {
          // First panel stays at z=0
          currentDepth = 0;
        } else {
          // Calculate position based on previous panel
          const prevPanelType = panelOrder[i - 1];
          const prevPanel = this.panels.get(prevPanelType);
          
          if (prevPanel) {
            const boundingBox = new THREE.Box3().setFromObject(prevPanel);
            const depth = boundingBox.max.z - boundingBox.min.z;
            currentDepth = prevPanel.position.z - depth - this.config.panelSpacing;
          }
        }
        
        panel.position.z = currentDepth;
        // Update label position
        this.panelLabels.updateLabelPosition(panelType, panel.position);
      }
    }

    // Now reposition the panels that come after the changed panel
    for (let i = changedPanelIndex + 1; i < panelOrder.length; i++) {
      const panelType = panelOrder[i];
      const panel = this.panels.get(panelType);
      
      if (panel) {
        // Calculate position based on previous panel
        const prevPanelType = panelOrder[i - 1];
        const prevPanel = this.panels.get(prevPanelType);
        
        if (prevPanel) {
          const boundingBox = new THREE.Box3().setFromObject(prevPanel);
          const depth = boundingBox.max.z - boundingBox.min.z;
          currentDepth = prevPanel.position.z - depth - this.config.panelSpacing;
          panel.position.z = currentDepth;
          // Update label position
          this.panelLabels.updateLabelPosition(panelType, panel.position);
        }
      }
    }
  }
  
  /**
   * Toggle panel visibility
   */
  public togglePanelVisibility(name: PanelType, visible: boolean): void {
    const group = this.panels.get(name);
    if (group) {
      group.visible = visible;
    }
    
    // Also toggle label visibility
    this.panelLabels.setLabelVisibility(name, visible);
  }
  
  /**
   * Reset camera to default position
   */
  public resetCamera(): void {
    this.camera.position.copy(this.config.camera.initialPosition);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }
  
  // Accessor methods
  
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}