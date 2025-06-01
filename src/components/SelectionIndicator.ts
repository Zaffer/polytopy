import * as THREE from "three";

/**
 * Selection indicator animation for right-click feedback
 * Shows a targeting crosshair to indicate selection attempts
 */
export class SelectionIndicator {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private activeIndicators: THREE.Group[] = [];
  private holdIndicator: THREE.Group | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Show crosshair while right-click is held down
   */
  public showHoldIndicator(screenX: number, screenY: number): void {
    // Remove any existing hold indicator
    this.hideHoldIndicator();
    
    // Convert screen coordinates to world coordinates
    const worldPosition = this.screenToWorld(screenX, screenY);
    
    // Create targeting crosshair
    const indicator = this.createCrosshair();
    indicator.position.copy(worldPosition);
    
    // Make indicator face the camera
    indicator.lookAt(this.camera.position);
    
    this.scene.add(indicator);
    this.holdIndicator = indicator;
  }

  /**
   * Update the position of the hold indicator
   */
  public updateHoldIndicator(screenX: number, screenY: number): void {
    if (this.holdIndicator) {
      const worldPosition = this.screenToWorld(screenX, screenY);
      this.holdIndicator.position.copy(worldPosition);
      this.holdIndicator.lookAt(this.camera.position);
    }
  }

  /**
   * Hide the hold indicator
   */
  public hideHoldIndicator(): void {
    if (this.holdIndicator) {
      this.scene.remove(this.holdIndicator);
      this.cleanupIndicator(this.holdIndicator);
      this.holdIndicator = null;
    }
  }

  /**
   * Create a selection indicator animation when right-click is released
   */
  public createIndicator(screenX: number, screenY: number): void {
    // Hide the hold indicator first
    this.hideHoldIndicator();
    
    // Convert screen coordinates to world coordinates
    const worldPosition = this.screenToWorld(screenX, screenY);
    
    // Create targeting crosshair
    const indicator = this.createCrosshair();
    indicator.position.copy(worldPosition);
    
    // Make indicator face the camera
    indicator.lookAt(this.camera.position);
    
    this.scene.add(indicator);
    this.activeIndicators.push(indicator);
    
    // Animate the indicator
    this.animateIndicator(indicator);
  }

  /**
   * Create a crosshair/targeting reticle
   */
  private createCrosshair(): THREE.Group {
    const group = new THREE.Group();
    
    // Create crosshair lines
    const material = new THREE.LineBasicMaterial({
      color: 0xFF6B6B,  // Red color for selection
      transparent: true,
      opacity: 0.9
    });
    
    const size = 0.15;
    const gap = 0.05;
    
    // Horizontal lines (left and right)
    const leftPoints = [
      new THREE.Vector3(-size, 0, 0),
      new THREE.Vector3(-gap, 0, 0)
    ];
    const rightPoints = [
      new THREE.Vector3(gap, 0, 0),
      new THREE.Vector3(size, 0, 0)
    ];
    
    // Vertical lines (top and bottom)
    const topPoints = [
      new THREE.Vector3(0, gap, 0),
      new THREE.Vector3(0, size, 0)
    ];
    const bottomPoints = [
      new THREE.Vector3(0, -size, 0),
      new THREE.Vector3(0, -gap, 0)
    ];
    
    // Create line segments
    [leftPoints, rightPoints, topPoints, bottomPoints].forEach(points => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });
    
    // Add center dot (one pixel)
    const dotGeometry = new THREE.CircleGeometry(0.005, 8);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B6B,
      transparent: true,
      opacity: 0.9
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    group.add(dot);
    
    return group;
  }

  /**
   * Convert screen coordinates to world coordinates at a reasonable depth
   */
  private screenToWorld(screenX: number, screenY: number): THREE.Vector3 {
    const mouse = new THREE.Vector2();
    mouse.x = (screenX / window.innerWidth) * 2 - 1;
    mouse.y = -(screenY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    // Project to a plane at the scene's central depth
    // With 6 panels, panelSpacing of 2, panels span roughly from z=0 to z=-10
    // Place the indicator at the middle of the scene content: z=-5
    const sceneDepth = -5; // Center of the panel arrangement
    const distance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, sceneDepth));
    const worldPosition = raycaster.ray.at(distance, new THREE.Vector3());
    
    return worldPosition;
  }

  /**
   * Clean up geometry and materials for an indicator
   */
  private cleanupIndicator(indicator: THREE.Group): void {
    indicator.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Animate a selection indicator
   */
  private animateIndicator(indicator: THREE.Group): void {
    const startTime = Date.now();
    const duration = 400; // 400ms animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation complete - remove indicator
        this.scene.remove(indicator);
        const index = this.activeIndicators.indexOf(indicator);
        if (index > -1) {
          this.activeIndicators.splice(index, 1);
        }
        // Clean up geometry and materials
        this.cleanupIndicator(indicator);
        return;
      }

      // Animation: Brief flash + scale pulse
      let opacity: number;
      let scale: number;
      
      if (progress < 0.3) {
        // First phase: appear with flash
        const flashProgress = progress / 0.3;
        opacity = 0.9;
        scale = 1 + (1 - flashProgress) * 0.3; // Start slightly larger
      } else {
        // Second phase: fade out
        const fadeProgress = (progress - 0.3) / 0.7;
        opacity = 0.9 * (1 - fadeProgress);
        scale = 1;
      }
      
      // Apply opacity to all materials
      indicator.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if ('opacity' in mat) mat.opacity = opacity;
            });
          } else if ('opacity' in child.material) {
            child.material.opacity = opacity;
          }
        }
      });
      
      // Apply scale
      indicator.scale.setScalar(scale);

      // Continue animation
      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Clean up all active indicators
   */
  public dispose(): void {
    // Clean up hold indicator
    this.hideHoldIndicator();
    
    // Clean up active indicators
    this.activeIndicators.forEach(indicator => {
      this.scene.remove(indicator);
      this.cleanupIndicator(indicator);
    });
    this.activeIndicators = [];
  }
}
