import { Subscription } from "rxjs";
import { AppState } from "../../utils/AppState";
import { AppController } from "../../core/AppController";
import { PanelType } from "../../types/scene";

/**
 * UIManager class to handle reactive UI updates and user interactions
 */
export class ControlManager {
  private appState: AppState;
  private subscriptions: Subscription[] = [];
  
  // UI elements that need updates
  private elements: {
    trainingStatus?: HTMLElement;
    epochDisplay?: HTMLElement;
    accuracyDisplay?: HTMLElement;
    learningRateSlider?: HTMLInputElement;
    epochsSlider?: HTMLInputElement;
    hiddenLayerSizeSlider?: HTMLInputElement;
    updateIntervalSlider?: HTMLInputElement;
    trainingDataCheckbox?: HTMLInputElement;
    neuralNetworkCheckbox?: HTMLInputElement;
    predictionsCheckbox?: HTMLInputElement;
    polytopesCheckbox?: HTMLInputElement;
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
    // Training status subscription
    this.subscriptions.push(
      this.appState.status.subscribe(status => {
        if (this.elements.trainingStatus) {
          this.elements.trainingStatus.textContent = status;
        }
      })
    );
    
    // Current epoch subscription
    this.subscriptions.push(
      this.appState.trainingConfig.subscribe(config => {
        if (this.elements.epochDisplay) {
          this.elements.epochDisplay.textContent = config.currentEpoch.toString();
        }
        
        // Notify training state subscribers when the state changes
        this.notifyTrainingStateChange(config.isTraining);
      })
    );
    
    // Accuracy subscription
    this.subscriptions.push(
      this.appState.accuracy.subscribe(accuracy => {
        if (this.elements.accuracyDisplay) {
          this.elements.accuracyDisplay.textContent = `${(accuracy * 100).toFixed(1)}%`;
        }
      })
    );
    
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
   * Register UI elements for status updates
   */
  public registerStatusElements(
    trainingStatus: HTMLElement,
    epochDisplay: HTMLElement,
    accuracyDisplay: HTMLElement
  ): void {
    this.elements.trainingStatus = trainingStatus;
    this.elements.epochDisplay = epochDisplay;
    this.elements.accuracyDisplay = accuracyDisplay;
    
    // Initialize with current values
    trainingStatus.textContent = this.appState.status.getValue();
    epochDisplay.textContent = this.appState.trainingConfig.getValue().currentEpoch.toString();
    accuracyDisplay.textContent = `${(this.appState.accuracy.getValue() * 100).toFixed(1)}%`;
  }
  
  /**
   * Register slider controls
   */
  public registerSliders(
    learningRateSlider: HTMLInputElement,
    epochsSlider: HTMLInputElement,
    hiddenLayerSizeSlider: HTMLInputElement,
    updateIntervalSlider: HTMLInputElement
  ): void {
    this.elements.learningRateSlider = learningRateSlider;
    this.elements.epochsSlider = epochsSlider;
    this.elements.hiddenLayerSizeSlider = hiddenLayerSizeSlider;
    this.elements.updateIntervalSlider = updateIntervalSlider;
    
    // Initialize with current values
    const networkConfig = this.appState.networkConfig.getValue();
    const trainingConfig = this.appState.trainingConfig.getValue();
    
    learningRateSlider.value = networkConfig.learningRate.toString();
    epochsSlider.value = trainingConfig.epochs.toString();
    hiddenLayerSizeSlider.value = networkConfig.hiddenSizes[0].toString();
    updateIntervalSlider.value = trainingConfig.updateInterval.toString();
  }
  
  /**
   * Register visibility checkboxes
   */
  public registerVisibilityCheckboxes(
    trainingDataCheckbox: HTMLInputElement,
    neuralNetworkCheckbox: HTMLInputElement,
    predictionsCheckbox: HTMLInputElement,
    polytopesCheckbox: HTMLInputElement
  ): void {
    this.elements.trainingDataCheckbox = trainingDataCheckbox;
    this.elements.neuralNetworkCheckbox = neuralNetworkCheckbox;
    this.elements.predictionsCheckbox = predictionsCheckbox;
    this.elements.polytopesCheckbox = polytopesCheckbox;
    
    // Initialize with current values
    const options = this.appState.visualizationOptions.getValue();
    
    trainingDataCheckbox.checked = options.showTrainingData;
    neuralNetworkCheckbox.checked = options.showNeuralNetwork;
    predictionsCheckbox.checked = options.showPredictions;
    polytopesCheckbox.checked = options.showPolytopes;
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
  
  public onRegenerateData(): void {
    const config = this.appController.getDataManager().getCurrentData();
    const width = config[0].length;
    const height = config.length;
    this.appController.regenerateData(width, height);
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
  
  public onUpdateIntervalChange(value: number): void {
    this.appController.setUpdateInterval(value);
  }
  
  public onPanelVisibilityChange(panelName: string, visible: boolean): void {
    this.appController.setVisualizationOption(panelName as PanelType, visible);
  }
  
  /**
   * Reset camera to default position
   */
  public onResetCamera(): void {
    this.appController.resetCamera();
  }
}