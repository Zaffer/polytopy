import { InteractionData, InteractableType, InteractionManager } from "../core/InteractionManager";
import { TrainingManager } from "../models/TrainingManager";

/**
 * NetworkInspector provides a panel for editing individual network elements
 */
export class NetworkInspector {
  private panel: HTMLElement;
  private currentSelection: InteractionData | null = null;
  private trainingManager: TrainingManager | null = null;
  private interactionManager: InteractionManager | null = null;

  constructor() {
    this.panel = this.createPanel();
    this.hide(); // Start hidden
  }

  /**
   * Set the training manager to access network data
   */
  public setTrainingManager(trainingManager: TrainingManager): void {
    this.trainingManager = trainingManager;
  }

  /**
   * Set the interaction manager to handle selection clearing
   */
  public setInteractionManager(interactionManager: InteractionManager): void {
    this.interactionManager = interactionManager;
  }

  /**
   * Get the panel element to add to DOM
   */
  public getElement(): HTMLElement {
    return this.panel;
  }

  /**
   * Show inspector with selected element
   */
  public showSelection(selection: InteractionData): void {
    this.currentSelection = selection;
    this.updateContent();
    this.show();
  }

  /**
   * Hide inspector and clear selection from interaction manager
   */
  public hideSelection(): void {
    this.currentSelection = null;
    this.hide();
    
    // Also clear the selection highlight from the interaction manager
    if (this.interactionManager) {
      this.interactionManager.clearAll();
    }
  }

  /**
   * Create the inspector panel
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('section');
    
    // Position on right side of screen - ultra minimal styling like control panel
    panel.style.position = 'absolute';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.zIndex = '1000';
    panel.style.background = 'rgba(0, 0, 0, 0.8)';
    
    return panel;
  }

  /**
   * Update panel content based on current selection
   */
  private updateContent(): void {
    if (!this.currentSelection || !this.trainingManager) {
      return;
    }

    // Clear existing content
    this.panel.innerHTML = '';

    if (this.currentSelection.type === InteractableType.NETWORK_NODE) {
      this.createNodeInspector();
    } else if (this.currentSelection.type === InteractableType.NETWORK_EDGE) {
      this.createEdgeInspector();
    }
  }

  /**
   * Create inspector for a network node
   */
  private createNodeInspector(): void {
    const { layerIndex, nodeIndex } = this.currentSelection!;
    
    // Main fieldset wrapper
    const mainFieldset = document.createElement('fieldset');
    const mainLegend = document.createElement('legend');
    
    // Create close button
    const closeButton = document.createElement('span');
    closeButton.textContent = '[x]';
    closeButton.style.cursor = 'pointer';
    closeButton.style.userSelect = 'none';
    closeButton.style.fontFamily = 'monospace';
    closeButton.style.marginRight = '5px';
    
    // Create collapsible toggle button
    const toggleButton = document.createElement('span');
    toggleButton.textContent = '[-] ';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.userSelect = 'none';
    toggleButton.style.fontFamily = 'monospace';
    
    // Create title span
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `Neuron (Layer ${layerIndex}, Neuron ${nodeIndex})`;
    
    mainLegend.appendChild(closeButton);
    mainLegend.appendChild(toggleButton);
    mainLegend.appendChild(titleSpan);
    mainFieldset.appendChild(mainLegend);

    // Create container for all collapsible content
    const collapsibleContent = document.createElement('div');

    // Node bias control
    this.createBiasControl(collapsibleContent);

    // Incoming connections
    this.createIncomingConnections(collapsibleContent);

    // Outgoing connections  
    this.createOutgoingConnections(collapsibleContent);

    mainFieldset.appendChild(collapsibleContent);

    // Add click handler for close button
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideSelection();
    });

    // Add click handler for collapse/expand
    let isCollapsed = false;
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        toggleButton.textContent = '[+] ';
        collapsibleContent.style.display = 'none';
      } else {
        toggleButton.textContent = '[-] ';
        collapsibleContent.style.display = 'block';
      }
    });

    this.panel.appendChild(mainFieldset);
  }

  /**
   * Create inspector for a network edge
   */
  private createEdgeInspector(): void {
    const { layerIndex, sourceNodeIndex, targetNodeIndex } = this.currentSelection!;
    
    // Main fieldset wrapper
    const mainFieldset = document.createElement('fieldset');
    const mainLegend = document.createElement('legend');
    
    // Create close button
    const closeButton = document.createElement('span');
    closeButton.textContent = '[x]';
    closeButton.style.cursor = 'pointer';
    closeButton.style.userSelect = 'none';
    closeButton.style.fontFamily = 'monospace';
    closeButton.style.marginRight = '5px';
    
    // Create collapsible toggle button
    const toggleButton = document.createElement('span');
    toggleButton.textContent = '[-] ';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.userSelect = 'none';
    toggleButton.style.fontFamily = 'monospace';
    
    // Create title span
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `Synapse (Layer ${layerIndex} → ${layerIndex + 1}, Neuron ${sourceNodeIndex} → ${targetNodeIndex})`;
    
    mainLegend.appendChild(closeButton);
    mainLegend.appendChild(toggleButton);
    mainLegend.appendChild(titleSpan);
    mainFieldset.appendChild(mainLegend);

    // Create container for all collapsible content
    const collapsibleContent = document.createElement('div');

    // Weight control
    this.createWeightControl(collapsibleContent);

    // Source neuron control
    this.createSourceNeuronControl(collapsibleContent);

    // Target neuron control
    this.createTargetNeuronControl(collapsibleContent);

    mainFieldset.appendChild(collapsibleContent);

    // Add click handler for close button
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideSelection();
    });

    // Add click handler for collapse/expand
    let isCollapsed = false;
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        toggleButton.textContent = '[+] ';
        collapsibleContent.style.display = 'none';
      } else {
        toggleButton.textContent = '[-] ';
        collapsibleContent.style.display = 'block';
      }
    });

    this.panel.appendChild(mainFieldset);
  }

  /**
   * Create bias control for selected node
   */
  private createBiasControl(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, nodeIndex } = this.currentSelection;
    
    // Skip input layer (no bias)
    if (layerIndex === 0) return;
    
    const network = this.trainingManager.getNeuralNetwork();
    // Adjust layer index for bias array (input layer has no bias)
    const currentBias = network.getBias(layerIndex! - 1, nodeIndex!);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Neuron Bias';
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Bias: ${currentBias.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.step = '0.001';
    slider.value = currentBias.toString();
    
    // Add wheel event listener directly to slider
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.01; // 0.01 step per wheel tick
      const newValue = Math.max(-5, Math.min(5, parseFloat(slider.value) + delta));
      slider.value = newValue.toString();
      slider.dispatchEvent(new Event('input')); // Trigger the input event
    });

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Bias: ${newValue.toFixed(4)}`;
      
      // Update bias and trigger full regeneration
      this.updateNodeBias(layerIndex!, nodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(document.createElement('br'));
    container.appendChild(slider);
    fieldset.appendChild(container);
    parent.appendChild(fieldset);
  }

  /**
   * Create weight control for selected edge
   */
  private createWeightControl(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, sourceNodeIndex, targetNodeIndex } = this.currentSelection;
    const network = this.trainingManager.getNeuralNetwork();
    const currentWeight = network.getWeight(layerIndex!, sourceNodeIndex!, targetNodeIndex!);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Synaptic Weight';
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Weight: ${currentWeight.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.step = '0.001';
    slider.value = currentWeight.toString();
    
    // Add wheel event listener directly to slider
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.01; // 0.01 step per wheel tick
      const newValue = Math.max(-5, Math.min(5, parseFloat(slider.value) + delta));
      slider.value = newValue.toString();
      slider.dispatchEvent(new Event('input')); // Trigger the input event
    });

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Weight: ${newValue.toFixed(4)}`;
      
      // Update weight and trigger full regeneration
      this.updateConnectionWeight(layerIndex!, sourceNodeIndex!, targetNodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(document.createElement('br'));
    container.appendChild(slider);
    fieldset.appendChild(container);
    parent.appendChild(fieldset);
  }

  /**
   * Create incoming connections display for selected node
   */
  private createIncomingConnections(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, nodeIndex } = this.currentSelection;
    
    // Skip input layer (no incoming connections)
    if (layerIndex === 0) return;

    const network = this.trainingManager.getNeuralNetwork();
    const networkInfo = network.getNetworkInfo();
    
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Incoming Synapses';
    fieldset.appendChild(legend);
    
    // Get all nodes from previous layer
    const prevLayerIndex = layerIndex! - 1;
    let prevLayerSize: number;
    
    if (prevLayerIndex === 0) {
      prevLayerSize = networkInfo.inputSize;
    } else {
      prevLayerSize = networkInfo.hiddenSizes[prevLayerIndex - 1];
    }

    for (let fromNode = 0; fromNode < prevLayerSize; fromNode++) {
      const weight = network.getWeight(prevLayerIndex, fromNode, nodeIndex!);
      this.createConnectionRow(fieldset, `Layer ${prevLayerIndex}, Neuron ${fromNode}`, weight, 
        (newValue: number) => this.updateConnectionWeight(prevLayerIndex, fromNode, nodeIndex!, newValue));
    }

    parent.appendChild(fieldset);
  }

  /**
   * Create outgoing connections display for selected node
   */
  private createOutgoingConnections(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, nodeIndex } = this.currentSelection;
    const network = this.trainingManager.getNeuralNetwork();
    const networkInfo = network.getNetworkInfo();
    
    // Skip output layer (no outgoing connections)
    const totalLayers = 1 + networkInfo.hiddenSizes.length + 1; // input + hidden + output
    if (layerIndex === totalLayers - 1) return;

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Outgoing Synapses';
    fieldset.appendChild(legend);
    
    // Get all nodes from next layer
    const nextLayerIndex = layerIndex! + 1;
    let nextLayerSize: number;
    
    if (nextLayerIndex === totalLayers - 1) {
      nextLayerSize = networkInfo.outputSize;
    } else {
      nextLayerSize = networkInfo.hiddenSizes[nextLayerIndex - 1];
    }

    for (let toNode = 0; toNode < nextLayerSize; toNode++) {
      const weight = network.getWeight(layerIndex!, nodeIndex!, toNode);
      this.createConnectionRow(fieldset, `Layer ${nextLayerIndex}, Neuron ${toNode}`, weight,
        (newValue: number) => this.updateConnectionWeight(layerIndex!, nodeIndex!, toNode, newValue));
    }

    parent.appendChild(fieldset);
  }

  /**
   * Create a connection row with weight control
   */
  private createConnectionRow(parent: HTMLElement, connectionLabel: string, weight: number, onUpdate: (value: number) => void): void {
    const row = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `${connectionLabel}: ${weight.toFixed(3)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.step = '0.001';
    slider.value = weight.toString();
    
    // Add wheel event listener directly to slider
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.01; // 0.01 step per wheel tick
      const newValue = Math.max(-5, Math.min(5, parseFloat(slider.value) + delta));
      slider.value = newValue.toString();
      slider.dispatchEvent(new Event('input')); // Trigger the input event
    });

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `${connectionLabel}: ${newValue.toFixed(3)}`;
      onUpdate(newValue);
    });

    row.appendChild(label);
    row.appendChild(document.createElement('br'));
    row.appendChild(slider);
    parent.appendChild(row);
  }

  /**
   * Update node bias in the network
   */
  private updateNodeBias(layerIndex: number, nodeIndex: number, newBias: number): void {
    if (!this.trainingManager) return;
    
    // Update the network bias (adjust layer index for bias array)
    const network = this.trainingManager.getNeuralNetwork();
    network.updateBias(layerIndex - 1, nodeIndex, newBias);
    
    // Trigger NetworkVis regeneration (same approach as training)
    this.trainingManager.notifyManualWeightChange();
    
    // Restore selection after regeneration
    this.restoreSelectionAfterRegeneration();
  }

  /**
   * Update connection weight in the network
   */
  private updateConnectionWeight(layerIndex: number, fromNode: number, toNode: number, newWeight: number): void {
    if (!this.trainingManager) return;
    
    // Update the network weight
    const network = this.trainingManager.getNeuralNetwork();
    network.updateWeight(layerIndex, fromNode, toNode, newWeight);
    
    // Trigger NetworkVis regeneration (same approach as training)
    this.trainingManager.notifyManualWeightChange();
    
    // Restore selection after regeneration
    this.restoreSelectionAfterRegeneration();
  }

  /**
   * Create bias control for the source neuron in a connection
   */
  private createSourceNeuronControl(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, sourceNodeIndex } = this.currentSelection;
    
    // Skip if source is input layer (no bias)
    if (layerIndex === 0) return;
    
    const network = this.trainingManager.getNeuralNetwork();
    // Adjust layer index for bias array (input layer has no bias)
    const currentBias = network.getBias(layerIndex! - 1, sourceNodeIndex!);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `Source Neuron ${sourceNodeIndex} (Layer ${layerIndex})`;
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Bias: ${currentBias.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.step = '0.001';
    slider.value = currentBias.toString();
    
    // Add wheel event listener
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.01;
      const newValue = Math.max(-5, Math.min(5, parseFloat(slider.value) + delta));
      slider.value = newValue.toString();
      slider.dispatchEvent(new Event('input'));
    });

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Bias: ${newValue.toFixed(4)}`;
      this.updateNodeBias(layerIndex!, sourceNodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(document.createElement('br'));
    container.appendChild(slider);
    fieldset.appendChild(container);
    parent.appendChild(fieldset);
  }

  /**
   * Create bias control for the target neuron in a connection
   */
  private createTargetNeuronControl(parent: HTMLElement): void {
    if (!this.trainingManager || !this.currentSelection) return;

    const { layerIndex, targetNodeIndex } = this.currentSelection;
    const targetLayerIndex = layerIndex! + 1;
    
    const network = this.trainingManager.getNeuralNetwork();
    // Adjust layer index for bias array (input layer has no bias)
    const currentBias = network.getBias(targetLayerIndex - 1, targetNodeIndex!);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `Target Neuron ${targetNodeIndex} (Layer ${targetLayerIndex})`;
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Bias: ${currentBias.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-5';
    slider.max = '5';
    slider.step = '0.001';
    slider.value = currentBias.toString();
    
    // Add wheel event listener
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.01;
      const newValue = Math.max(-5, Math.min(5, parseFloat(slider.value) + delta));
      slider.value = newValue.toString();
      slider.dispatchEvent(new Event('input'));
    });

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Bias: ${newValue.toFixed(4)}`;
      this.updateNodeBias(targetLayerIndex, targetNodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(document.createElement('br'));
    container.appendChild(slider);
    fieldset.appendChild(container);
    parent.appendChild(fieldset);
  }

  /**
   * Restore selection after NetworkVis regeneration
   */
  private restoreSelectionAfterRegeneration(): void {
    if (!this.currentSelection || !this.interactionManager) return;
    
    // Use setTimeout to ensure the regeneration is complete before trying to restore selection
    setTimeout(() => {
      const { layerIndex, nodeIndex, sourceNodeIndex, targetNodeIndex } = this.currentSelection!;
      
      // Find the new object that matches our selection
      const newSelectedObject = this.interactionManager!.updateSelectedObjectAfterRegeneration(
        layerIndex, nodeIndex, sourceNodeIndex, targetNodeIndex
      );
      
      if (newSelectedObject) {
        // Update our current selection to point to the new object
        this.currentSelection!.object = newSelectedObject;
      }
    }, 50); // Small delay to ensure regeneration is complete
  }

  /**
   * Show the panel
   */
  private show(): void {
    this.panel.style.display = 'block';
  }

  /**
   * Hide the panel
   */
  private hide(): void {
    this.panel.style.display = 'none';
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
