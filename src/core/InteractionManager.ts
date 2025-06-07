import * as THREE from "three";
import { Observable, Subject } from "rxjs";

/**
 * Types of objects that can be interacted with
 */
export enum InteractableType {
  NETWORK_NODE = "network_node",
  NETWORK_EDGE = "network_edge"
}

/**
 * Interaction data for clicked objects
 */
export interface InteractionData {
  type: InteractableType;
  object: THREE.Object3D;
  layerIndex: number;
  nodeIndex?: number;
  sourceNodeIndex?: number;
  targetNodeIndex?: number;
  position: THREE.Vector3;
}

/**
 * Manages 3D object interactions in the scene
 */
export class InteractionManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Canvas element for cursor management
  private canvasElement: HTMLCanvasElement | null = null;
  
  // Observable streams for interactions
  private rightClickSubject = new Subject<InteractionData>();
  
  // Visual feedback for objects
  private hoveredObject: THREE.Object3D | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
  private originalNodeScales = new Map<THREE.Object3D, THREE.Vector3>();
  
  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
  }
  
  /**
   * Set the canvas element for cursor management
   */
  public setCanvasElement(canvas: HTMLCanvasElement): void {
    this.canvasElement = canvas;
  }
  
  /**
   * Set cursor to crosshair for right-click interaction
   */
  public setCrosshairCursor(): void {
    if (this.canvasElement) {
      this.canvasElement.style.cursor = 'crosshair';
    }
  }
  
  /**
   * Reset cursor to default
   */
  public setDefaultCursor(): void {
    if (this.canvasElement) {
      this.canvasElement.style.cursor = 'default';
    }
  }
  
  /**
   * Handle hover during right-click hold
   */
  public handleRightClickHover(screenX: number, screenY: number): void {
    this.updateMousePosition(screenX, screenY);
    
    // Find interactable objects
    const interactables = this.findInteractableObjects();
    const intersects = this.raycaster.intersectObjects(interactables, false);
    
    let newHoveredObject: THREE.Object3D | null = null;
    
    if (intersects.length > 0) {
      newHoveredObject = intersects[0].object;
    }
    
    // Update hover state if changed
    if (newHoveredObject !== this.hoveredObject) {
      this.clearHoverHighlight();
      
      if (newHoveredObject) {
        this.hoveredObject = newHoveredObject;
        this.applyHoverHighlight(this.hoveredObject);
      }
    }
  }
  
  /**
   * Handle right-click release - finalize selection
   */
  public handleRightClickRelease(screenX: number, screenY: number): void {
    this.updateMousePosition(screenX, screenY);
    
    // Clear any previous selection
    this.clearSelectionHighlight();
    
    // If we have a hovered object, make it the selected object
    if (this.hoveredObject) {
      const userData = this.hoveredObject.userData;
      
      // Create interaction data
      const interactionData: InteractionData = {
        type: userData.type,
        object: this.hoveredObject,
        layerIndex: userData.layerIndex,
        nodeIndex: userData.nodeIndex,
        sourceNodeIndex: userData.sourceNodeIndex,
        targetNodeIndex: userData.targetNodeIndex,
        position: new THREE.Vector3() // Will be updated by raycaster if needed
      };
      
      // Move hovered object to selected state
      this.selectedObject = this.hoveredObject;
      this.hoveredObject = null;
      
      // Apply selection highlight (different from hover)
      this.applySelectionHighlight(this.selectedObject);
      
      // Emit the interaction
      this.rightClickSubject.next(interactionData);
    } else {
      // Clear hover if no object was under cursor
      this.clearHoverHighlight();
    }
  }
  
  /**
   * Clear right-click hover state
   */
  public clearRightClickHover(): void {
    this.clearHoverHighlight();
  }
  
  /**
   * Get observable for right-click interactions
   */
  public getRightClickStream(): Observable<InteractionData> {
    return this.rightClickSubject.asObservable();
  }
  
  /**
   * Update mouse position for raycasting
   */
  private updateMousePosition(screenX: number, screenY: number): void {
    this.mouse.x = (screenX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  
  /**
   * Find all interactable objects in the scene
   */
  private findInteractableObjects(): THREE.Object3D[] {
    const interactables: THREE.Object3D[] = [];
    
    this.scene.traverse((child) => {
      if (child.userData.type === InteractableType.NETWORK_NODE || 
          child.userData.type === InteractableType.NETWORK_EDGE) {
        interactables.push(child);
      }
    });
    
    return interactables;
  }
  
  /**
   * Apply hover highlight to an object
   */
  private applyHoverHighlight(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      // For nodes only, use simple scaling
      if (object.userData.type === InteractableType.NETWORK_NODE) {
        if (!this.originalNodeScales.has(object)) {
          this.originalNodeScales.set(object, object.scale.clone());
        }
        const hoverScale = 1.05; // 5% larger for nodes
        object.scale.setScalar(hoverScale);
      }
      // For edges, NO scaling - just material change (they already scale with weights)

      // Store original material if not already stored
      if (!this.originalMaterials.has(object)) {
        this.originalMaterials.set(object, object.material);
      }
      
      // Create hover material with enhanced emissive
      const originalMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const hoverMaterial = originalMaterial.clone();
      
      if ('color' in hoverMaterial) {
        hoverMaterial.color = new THREE.Color(0x00BFFF); // Bright blue for hover
      }
      if ('opacity' in hoverMaterial) {
        hoverMaterial.opacity = 0.9;
      }
      if ('emissive' in hoverMaterial) {
        hoverMaterial.emissive = new THREE.Color(0x0088ff); // Strong blue emissive glow
      }
      if ('emissiveIntensity' in hoverMaterial) {
        hoverMaterial.emissiveIntensity = 0.8; // Very strong glow for edges
      }
      
      object.material = hoverMaterial;
    }
  }
  
  /**
   * Apply selection highlight to an object
   */
  private applySelectionHighlight(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      // For nodes, restore normal scale and just use material highlighting
      if (object.userData.type === InteractableType.NETWORK_NODE) {
        if (!this.originalNodeScales.has(object)) {
          this.originalNodeScales.set(object, object.scale.clone());
        }
        // Reset to original scale for selection (normal size)
        const originalScale = this.originalNodeScales.get(object);
        if (originalScale) {
          object.scale.copy(originalScale);
        } else {
          object.scale.set(1, 1, 1);
        }
      }
      // For edges, NO scaling - just material change (they already scale with weights)

      // Store original material if not already stored
      if (!this.originalMaterials.has(object)) {
        this.originalMaterials.set(object, object.material);
      }
      
      // Create selection material with enhanced emissive
      const originalMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const selectionMaterial = originalMaterial.clone();
      
      if ('color' in selectionMaterial) {
        selectionMaterial.color = new THREE.Color(0xFFD700); // Gold for selection
      }
      if ('opacity' in selectionMaterial) {
        selectionMaterial.opacity = 1.0;
      }
      if ('emissive' in selectionMaterial) {
        selectionMaterial.emissive = new THREE.Color(0xffaa00); // Strong golden emissive glow
      }
      if ('emissiveIntensity' in selectionMaterial) {
        selectionMaterial.emissiveIntensity = 1.0; // Very strong glow for edges
      }
      
      object.material = selectionMaterial;
    }
  }

  /**
   * Clear hover highlight
   */
  private clearHoverHighlight(): void {
    if (this.hoveredObject) {
      this.restoreOriginalMaterial(this.hoveredObject);
      this.restoreOriginalNodeScale(this.hoveredObject);
      this.hoveredObject = null;
    }
  }

  /**
   * Clear selection highlight
   */
  private clearSelectionHighlight(): void {
    if (this.selectedObject) {
      this.restoreOriginalMaterial(this.selectedObject);
      this.restoreOriginalNodeScale(this.selectedObject);
      this.selectedObject = null;
    }
  }
  
  /**
   * Restore original material for an object
   */
  private restoreOriginalMaterial(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      const originalMaterial = this.originalMaterials.get(object);
      if (originalMaterial) {
        // Dispose current material if it's a clone
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
        
        // Restore original
        object.material = originalMaterial;
        this.originalMaterials.delete(object);
      }
    }
  }
  
  /**
   * Restore original scale for nodes only
   */
  private restoreOriginalNodeScale(object: THREE.Object3D): void {
    if (object.userData.type === InteractableType.NETWORK_NODE) {
      const originalScale = this.originalNodeScales.get(object);
      if (originalScale) {
        object.scale.copy(originalScale);
        this.originalNodeScales.delete(object);
      } else {
        // Reset to default if no original stored
        object.scale.set(1, 1, 1);
      }
    }
    // For edges, do nothing - they don't get scaled
  }

  /**
   * Clear all highlights and selections
   */
  public clearAll(): void {
    this.clearHoverHighlight();
    this.clearSelectionHighlight();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.clearAll();
    this.rightClickSubject.complete();
  }
}
