import * as THREE from "three";
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
    titleSpan.textContent = `Node Inspector - Layer ${layerIndex}, Node ${nodeIndex}`;
    
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
    titleSpan.textContent = `Edge Inspector - Layer ${layerIndex} → ${layerIndex + 1} (Node ${sourceNodeIndex} → Node ${targetNodeIndex})`;
    
    mainLegend.appendChild(closeButton);
    mainLegend.appendChild(toggleButton);
    mainLegend.appendChild(titleSpan);
    mainFieldset.appendChild(mainLegend);

    // Create container for all collapsible content
    const collapsibleContent = document.createElement('div');

    // Weight control
    this.createWeightControl(collapsibleContent);

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
    const network = this.trainingManager.getNeuralNetwork();
    const currentBias = network.getBias(layerIndex!, nodeIndex!);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Node Bias';
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Bias: ${currentBias.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-2';
    slider.max = '2';
    slider.step = '0.01';
    slider.value = currentBias.toString();

    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = currentBias.toFixed(4);

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Bias: ${newValue.toFixed(4)}`;
      valueDisplay.textContent = newValue.toFixed(4);
      
      // Update the network immediately
      this.updateNodeBias(layerIndex!, nodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
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
    legend.textContent = 'Connection Weight';
    fieldset.appendChild(legend);
    
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = `Weight: ${currentWeight.toFixed(4)}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-2';
    slider.max = '2';
    slider.step = '0.01';
    slider.value = currentWeight.toString();

    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = currentWeight.toFixed(4);

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      label.textContent = `Weight: ${newValue.toFixed(4)}`;
      valueDisplay.textContent = newValue.toFixed(4);
      
      // Update the network immediately
      this.updateConnectionWeight(layerIndex!, sourceNodeIndex!, targetNodeIndex!, newValue);
    });

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);
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
    legend.textContent = 'Incoming Connections';
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
      this.createConnectionRow(fieldset, `Layer ${prevLayerIndex}, Node ${fromNode}`, weight, 
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
    legend.textContent = 'Outgoing Connections';
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
      this.createConnectionRow(fieldset, `Layer ${nextLayerIndex}, Node ${toNode}`, weight,
        (newValue: number) => this.updateConnectionWeight(layerIndex!, nodeIndex!, toNode, newValue));
    }

    parent.appendChild(fieldset);
  }

  /**
   * Create a connection row with weight control
   */
  private createConnectionRow(parent: HTMLElement, connectionLabel: string, weight: number, onUpdate: (value: number) => void): void {
    const row = document.createElement('div');

    const label = document.createElement('div');
    label.textContent = connectionLabel;

    const weightControl = document.createElement('div');

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-2';
    slider.max = '2';
    slider.step = '0.01';
    slider.value = weight.toString();

    const valueSpan = document.createElement('span');
    valueSpan.textContent = weight.toFixed(3);

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      valueSpan.textContent = newValue.toFixed(3);
      onUpdate(newValue);
    });

    weightControl.appendChild(slider);
    weightControl.appendChild(valueSpan);
    row.appendChild(label);
    row.appendChild(weightControl);
    parent.appendChild(row);
  }

  /**
   * Update node bias in the network
   */
  private updateNodeBias(layerIndex: number, nodeIndex: number, newBias: number): void {
    if (!this.trainingManager) return;
    
    // Update the network bias
    const network = this.trainingManager.getNeuralNetwork();
    network.updateBias(layerIndex, nodeIndex, newBias);
    
    // Update visual representation without recreating the entire scene
    this.updateNodeVisual(layerIndex, nodeIndex, newBias);
    
    // Only update predictions, don't trigger full visualization recreation
    this.trainingManager.updatePredictions();
  }

  /**
   * Update connection weight in the network
   */
  private updateConnectionWeight(layerIndex: number, fromNode: number, toNode: number, newWeight: number): void {
    if (!this.trainingManager) return;
    
    // Update the network weight
    const network = this.trainingManager.getNeuralNetwork();
    network.updateWeight(layerIndex, fromNode, toNode, newWeight);
    
    // Update visual representation without recreating the entire scene
    this.updateEdgeVisual(layerIndex, fromNode, toNode, newWeight);
    
    // Only update predictions, don't trigger full visualization recreation
    this.trainingManager.updatePredictions();
  }

  /**
   * Update the visual representation of a node (color, size) without recreating it
   */
  private updateNodeVisual(layerIndex: number, nodeIndex: number, newBias: number): void {
    if (!this.interactionManager) return;
    
    // Find the node object in the scene
    const nodeObject = this.findNodeObject(layerIndex, nodeIndex);
    if (!nodeObject) return;
    
    // Update node size and color based on bias
    if (nodeObject instanceof THREE.Mesh) {
      // Update node size based on bias magnitude (0.7x to 1.3x original size)
      const biasMagnitude = Math.abs(newBias);
      const sizeMultiplier = 0.7 + (biasMagnitude / 2) * 0.6; // Maps [0,2] bias to [0.7,1.3] size
      nodeObject.scale.setScalar(sizeMultiplier);
      
      // Update node color based on bias sign and magnitude
      if (nodeObject.material instanceof THREE.MeshBasicMaterial) {
        const normalizedBias = Math.max(-1, Math.min(1, newBias / 2)); // Clamp to [-1, 1]
        const intensity = Math.abs(normalizedBias);
        
        let newColor: THREE.Color;
        if (normalizedBias >= 0) {
          // Positive bias: Green tones
          newColor = new THREE.Color(0.2 + intensity * 0.3, 0.7 + intensity * 0.3, 0.2);
        } else {
          // Negative bias: Red tones
          newColor = new THREE.Color(0.7 + intensity * 0.3, 0.2 + intensity * 0.3, 0.2);
        }
        
        nodeObject.material.color.copy(newColor);
      }
    }
  }

  /**
   * Update the visual representation of an edge (color, thickness) without recreating it
   */
  private updateEdgeVisual(layerIndex: number, fromNode: number, toNode: number, newWeight: number): void {
    if (!this.interactionManager) return;
    
    // Find the edge object in the scene
    const edgeObject = this.findEdgeObject(layerIndex, fromNode, toNode);
    if (!edgeObject) return;
    
    // Update edge color and thickness based on weight
    if (edgeObject instanceof THREE.Mesh && edgeObject.material instanceof THREE.MeshBasicMaterial) {
      const absWeight = Math.abs(newWeight);
      
      // Update color based on weight sign and magnitude
      let newColor: THREE.Color;
      if (newWeight > 0) {
        // Positive weights: Green shades
        newColor = new THREE.Color(0x27ae60).lerp(new THREE.Color(0x2ecc71), absWeight);
      } else {
        // Negative weights: Red shades  
        newColor = new THREE.Color(0xc0392b).lerp(new THREE.Color(0xe74c3c), absWeight);
      }
      
      edgeObject.material.color.copy(newColor);
      
      // Update opacity based on weight magnitude
      edgeObject.material.opacity = 0.4 + absWeight * 0.6;
      
      // Update edge thickness properly by modifying scale only in perpendicular directions
      const thicknessMultiplier = Math.max(0.3, absWeight * 2); // Maps weight to thickness
      this.updateEdgeThickness(edgeObject, thicknessMultiplier);
    }
  }

  /**
   * Update edge thickness by scaling only the perpendicular dimensions
   */
  private updateEdgeThickness(edgeObject: THREE.Mesh, thicknessMultiplier: number): void {
    // For tube geometry, we need to be careful about how we scale
    // We want to change radius but preserve the length and position
    
    // Store the current position and rotation
    const position = edgeObject.position.clone();
    const rotation = edgeObject.rotation.clone();
    
    // Reset transform to apply clean scaling
    edgeObject.position.set(0, 0, 0);
    edgeObject.rotation.set(0, 0, 0);
    
    // Apply thickness scaling - scale in X and Z but preserve Y (length direction)
    // This assumes the tube was created along the Y axis initially
    edgeObject.scale.set(thicknessMultiplier, 1, thicknessMultiplier);
    
    // Restore position and rotation
    edgeObject.position.copy(position);
    edgeObject.rotation.copy(rotation);
  }

  /**
   * Find a node object in the scene by layer and node index
   */
  private findNodeObject(layerIndex: number, nodeIndex: number): THREE.Object3D | null {
    if (!this.interactionManager) return null;
    
    // Access the scene through the interaction manager
    const scene = (this.interactionManager as any).scene;
    if (!scene) return null;
    
    let foundNode: THREE.Object3D | null = null;
    scene.traverse((child: THREE.Object3D) => {
      if (child.userData.type === 'network_node' &&
          child.userData.layerIndex === layerIndex &&
          child.userData.nodeIndex === nodeIndex) {
        foundNode = child;
      }
    });
    
    return foundNode;
  }

  /**
   * Find an edge object in the scene by layer and node indices
   */
  private findEdgeObject(layerIndex: number, fromNode: number, toNode: number): THREE.Object3D | null {
    if (!this.interactionManager) return null;
    
    // Access the scene through the interaction manager
    const scene = (this.interactionManager as any).scene;
    if (!scene) return null;
    
    let foundEdge: THREE.Object3D | null = null;
    scene.traverse((child: THREE.Object3D) => {
      if (child.userData.type === 'network_edge' &&
          child.userData.layerIndex === layerIndex &&
          child.userData.sourceNodeIndex === fromNode &&
          child.userData.targetNodeIndex === toNode) {
        foundEdge = child;
      }
    });
    
    return foundEdge;
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
