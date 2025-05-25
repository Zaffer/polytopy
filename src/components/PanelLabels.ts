import * as THREE from "three";
import { PanelType } from "../types/scene";
import { createTextSprite } from "../utils/TextUtils";

/**
 * Centralized panel labeling system
 * This provides consistent panel titles separate from visualization content
 */
export class PanelLabels {
  private labels: Map<PanelType, THREE.Sprite> = new Map();
  private labelGroup: THREE.Group;
  
  // Panel title mapping
  private static readonly PANEL_TITLES: Record<PanelType, string> = {
    [PanelType.TRAINING_DATA]: 'Input',
    [PanelType.NEURAL_NETWORK]: 'Network', 
    [PanelType.PREDICTIONS]: 'Predictions',
    [PanelType.POLYTOPES]: 'Polytopes'
  };
  
  constructor() {
    this.labelGroup = new THREE.Group();
    this.labelGroup.name = 'PanelLabels';
  }
  
  /**
   * Create or update a label for a panel
   */
  public setLabel(panelType: PanelType, position: THREE.Vector3): void {
    // Remove existing label if it exists
    this.removeLabel(panelType);
    
    const title = PanelLabels.PANEL_TITLES[panelType];
    const label = createTextSprite(title, 30, "rgba(0, 0, 0, 0.5)"); // Increased font size from 18 to 24
    
    // Position label well above the panel content
    label.position.copy(position);
    label.position.y += 4; // Larger offset above content
    
    this.labels.set(panelType, label);
    this.labelGroup.add(label);
  }
  
  /**
   * Remove a label for a panel
   */
  public removeLabel(panelType: PanelType): void {
    const existingLabel = this.labels.get(panelType);
    if (existingLabel) {
      this.labelGroup.remove(existingLabel);
      this.labels.delete(panelType);
    }
  }
  
  /**
   * Update label position when panel moves
   */
  public updateLabelPosition(panelType: PanelType, position: THREE.Vector3): void {
    const label = this.labels.get(panelType);
    if (label) {
      label.position.copy(position);
      label.position.y += 5; // Same larger offset
    }
  }
  
  /**
   * Set visibility of a panel label
   */
  public setLabelVisibility(panelType: PanelType, visible: boolean): void {
    const label = this.labels.get(panelType);
    if (label) {
      label.visible = visible;
    }
  }
  
  /**
   * Get the label group to add to scene
   */
  public getLabelGroup(): THREE.Group {
    return this.labelGroup;
  }
  
  /**
   * Clean up all labels
   */
  public dispose(): void {
    this.labels.forEach(label => {
      this.labelGroup.remove(label);
    });
    this.labels.clear();
  }
}
