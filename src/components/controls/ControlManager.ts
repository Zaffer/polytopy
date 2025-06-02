import { Subscription } from "rxjs";
import { AppState } from "../../core/AppState";
import { AppController } from "../../core/AppController";
import { PanelType } from "../../types/scene";
import { PatternType } from "../../types/model";

/**
 * UIManager class to handle reactive UI updates and user interactions
 */
export class ControlManager {
  private appState: AppState;
  private subscriptions: Subscription[] = [];
  
  // UI elements that need updates
  private elements: {
    learningRateSlider?: HTMLInputElement;
    epochsSlider?: HTMLInputElement;
    hiddenLayerSizeSlider?: HTMLInputElement;
    networkDepthSlider?: HTMLInputElement;
    updateIntervalSlider?: HTMLInputElement;
    trainingDataCheckbox?: HTMLInputElement;
    neuralNetworkCheckbox?: HTMLInputElement;
    predictionsCheckbox?: HTMLInputElement;
    polytopesCheckbox?: HTMLInputElement;
    analyticalPolytopesCheckbox?: HTMLInputElement;
    linesCheckbox?: HTMLInputElement;
    patternDropdown?: HTMLSelectElement;
    drawingPad?: any; // DrawingPad instance
    drawingPadContainer?: HTMLElement; // Container for showing/hiding
  } = {};
  
  // Training state callback
  private trainingStateCallbacks: ((isTraining: boolean) => void)[] = [];
  
  constructor(private appController: AppController) {
    this.appState = AppState.getInstance();
    
    // Set up state subscriptions when the UI manager is created
    this.setupStateSubscriptions();
  }
  
  /**
   * Get the AppState instance
   */
  public getAppState(): AppState {
    return this.appState;
  }
  
  /**
   * Set up subscriptions to app state changes
   */
  private setupStateSubscriptions(): void {
    // Network config subscription
    this.subscriptions.push(
      this.appState.networkConfig.subscribe(config => {
        // Update sliders to match state
        if (this.elements.learningRateSlider) {
          this.elements.learningRateSlider.value = config.learningRate.toString();
        }
        
        if (this.elements.hiddenLayerSizeSlider) {
          this.elements.hiddenLayerSizeSlider.value = config.hiddenSizes[0].toString();
        }

        if (this.elements.networkDepthSlider) {
          this.elements.networkDepthSlider.value = config.hiddenSizes.length.toString();
        }
      })
    );
    
    // Training config subscription
    this.subscriptions.push(
      this.appState.trainingConfig.subscribe(config => {
        // Update sliders to match state
        if (this.elements.epochsSlider) {
          this.elements.epochsSlider.value = config.epochs.toString();
        }
        
        if (this.elements.updateIntervalSlider) {
          this.elements.updateIntervalSlider.value = config.updateInterval.toString();
        }
        
        // Update pattern dropdown to reflect current pattern
        if (this.elements.patternDropdown) {
          this.elements.patternDropdown.value = config.patternType;
        }
        
        // Show/hide drawing pad based on pattern type
        if (this.elements.drawingPadContainer) {
          this.elements.drawingPadContainer.style.display = 
            config.patternType === PatternType.DRAWING_PAD ? 'block' : 'none';
        }
        
        // Notify training state subscribers when the state changes
        this.notifyTrainingStateChange(config.isTraining);
      })
    );
    
    // Visualization options subscription
    this.subscriptions.push(
      this.appState.visualizationOptions.subscribe(options => {
        // Update checkboxes to match state
        if (this.elements.trainingDataCheckbox) {
          this.elements.trainingDataCheckbox.checked = options.showTrainingData;
        }
        
        if (this.elements.neuralNetworkCheckbox) {
          this.elements.neuralNetworkCheckbox.checked = options.showNeuralNetwork;
        }
        
        if (this.elements.predictionsCheckbox) {
          this.elements.predictionsCheckbox.checked = options.showPredictions;
        }
        
        if (this.elements.polytopesCheckbox) {
          this.elements.polytopesCheckbox.checked = options.showPolytopes;
        }
        
        if (this.elements.analyticalPolytopesCheckbox) {
          this.elements.analyticalPolytopesCheckbox.checked = options.showAnalyticalPolytopes;
        }
        
        if (this.elements.linesCheckbox) {
          this.elements.linesCheckbox.checked = options.showLines;
        }
      })
    );
  }
  
  /**
   * Subscribe to training state changes
   */
  public subscribeToTrainingState(callback: (isTraining: boolean) => void): void {
    this.trainingStateCallbacks.push(callback);
    
    // Initialize with current state
    const isTraining = this.appState.trainingConfig.getValue().isTraining;
    callback(isTraining);
  }
  
  /**
   * Notify subscribers about training state change
   */
  private notifyTrainingStateChange(isTraining: boolean): void {
    // Make sure state matches what we're notifying
    const currentState = this.appState.trainingConfig.getValue().isTraining;
    if (currentState !== isTraining) {
      // Update the app state if it's not in sync
      this.appState.updateTrainingConfig({ isTraining });
    }
    // Notify all subscribers
    this.trainingStateCallbacks.forEach(callback => callback(isTraining));
  }
   /**
   * Register slider controls
   */
  public registerSliders(
    learningRateSlider: HTMLInputElement,
    epochsSlider: HTMLInputElement,
    hiddenLayerSizeSlider: HTMLInputElement,
    networkDepthSlider: HTMLInputElement,
    updateIntervalSlider: HTMLInputElement
  ): void {
    this.elements.learningRateSlider = learningRateSlider;
    this.elements.epochsSlider = epochsSlider;
    this.elements.hiddenLayerSizeSlider = hiddenLayerSizeSlider;
    this.elements.networkDepthSlider = networkDepthSlider;
    this.elements.updateIntervalSlider = updateIntervalSlider;
    
    // Initialize with current values
    const networkConfig = this.appState.networkConfig.getValue();
    const trainingConfig = this.appState.trainingConfig.getValue();
    
    learningRateSlider.value = networkConfig.learningRate.toString();
    epochsSlider.value = trainingConfig.epochs.toString();
    hiddenLayerSizeSlider.value = networkConfig.hiddenSizes[0].toString();
    networkDepthSlider.value = networkConfig.hiddenSizes.length.toString();
    updateIntervalSlider.value = trainingConfig.updateInterval.toString();
  }
  
  /**
   * Register visibility checkboxes
   */
  public registerVisibilityCheckboxes(
    trainingDataCheckbox: HTMLInputElement,
    neuralNetworkCheckbox: HTMLInputElement,
    predictionsCheckbox: HTMLInputElement,
    polytopesCheckbox: HTMLInputElement,
    analyticalPolytopesCheckbox: HTMLInputElement,
    linesCheckbox: HTMLInputElement
  ): void {
    this.elements.trainingDataCheckbox = trainingDataCheckbox;
    this.elements.neuralNetworkCheckbox = neuralNetworkCheckbox;
    this.elements.predictionsCheckbox = predictionsCheckbox;
    this.elements.polytopesCheckbox = polytopesCheckbox;
    this.elements.analyticalPolytopesCheckbox = analyticalPolytopesCheckbox;
    this.elements.linesCheckbox = linesCheckbox;
    
    // Initialize with current values
    const options = this.appState.visualizationOptions.getValue();
    
    trainingDataCheckbox.checked = options.showTrainingData;
    neuralNetworkCheckbox.checked = options.showNeuralNetwork;
    predictionsCheckbox.checked = options.showPredictions;
    polytopesCheckbox.checked = options.showPolytopes;
    analyticalPolytopesCheckbox.checked = options.showAnalyticalPolytopes;
    linesCheckbox.checked = options.showLines;
  }
  
  /**
   * Register pattern dropdown
   */
  public registerPatternDropdown(dropdown: HTMLSelectElement): void {
    this.elements.patternDropdown = dropdown;
    
    // Initialize with current pattern type
    const currentPattern = this.appState.trainingConfig.getValue().patternType;
    dropdown.value = currentPattern;
  }

  /**
   * Register drawing pad
   */
  public registerDrawingPad(drawingPad: any, container: HTMLElement): void {
    this.elements.drawingPad = drawingPad;
    this.elements.drawingPadContainer = container;
    
    // Initialize visibility based on current pattern type
    const currentPattern = this.appState.trainingConfig.getValue().patternType;
    container.style.display = currentPattern === PatternType.DRAWING_PAD ? 'block' : 'none';
  }
  
  /**
   * Clean up subscriptions
   */
  public dispose(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Action handlers
  
  public onStartTraining(): void {
    // Tell the app controller to start training
    this.appController.startTraining();
    
    // Immediately notify subscribers (even before we receive the next state update)
    this.notifyTrainingStateChange(true);
  }
  
  public onStopTraining(): void {
    // Tell the app controller to stop training
    this.appController.stopTraining();
    
    // Immediately notify subscribers (even before we receive the next state update)
    this.notifyTrainingStateChange(false);
  }
  
  public onResetNetwork(): void {
    this.appController.resetNetwork();
    this.notifyTrainingStateChange(false);
  }

  public onPatternChange(patternType: PatternType): void {
    // Update the training config to store the selected pattern
    this.appState.updateTrainingConfig({ patternType });
    
    // For drawing pad, don't regenerate - let user draw their own pattern
    if (patternType === PatternType.DRAWING_PAD) {
      return;
    }
    
    // Regenerate data with the new pattern
    const config = this.appController.getDataManager().getCurrentData();
    const width = config[0].length;
    const height = config.length;
    this.appController.regenerateData(width, height, patternType);
  }

  public onRandomPatternClick(): void {
    // Always regenerate when Random is clicked
    this.onPatternChange(PatternType.RANDOM);
  }

  public onDrawingPadChange(data: number[][]): void {
    // Directly set the custom data in the data manager
    this.appController.setCustomData(data);
  }

  public onLearningRateChange(value: number): void {
    this.appController.setLearningRate(value);
  }
  
  public onEpochsChange(value: number): void {
    this.appController.setEpochs(value);
  }
  
  public onHiddenLayerSizeChange(value: number): void {
    this.appController.setHiddenLayerSize(value);
  }

  public onNetworkDepthChange(value: number): void {
    this.appController.setNetworkDepth(value);
  }
  
  public onUpdateIntervalChange(value: number): void {
    this.appController.setUpdateInterval(value);
  }
  
  public onPanelVisibilityChange(panelName: string, visible: boolean): void {
    this.appController.setVisualizationOption(panelName as PanelType, visible);
  }
}