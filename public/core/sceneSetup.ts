import * as THREE from "three";
import { WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private panels: Map<string, THREE.Group>;
  private controls: OrbitControls;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 15;

    // Force the use of WebGLRenderer for debugging purposes
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooth rotation

    this.panels = new Map();

    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public addPanel(name: string, group: THREE.Group): void {
    let currentDepth = 0;
    if (this.panels.size > 0) {
      const lastPanel = Array.from(this.panels.values()).at(-1);
      const boundingBox = new THREE.Box3().setFromObject(lastPanel!);
      const lastPanelDepth = boundingBox.max.z - boundingBox.min.z;
      currentDepth = lastPanel!.position.z - lastPanelDepth - 2; // Fixed gap of 4 units
    }

    group.position.z = currentDepth;
    this.panels.set(name, group);
    this.scene.add(group);
  }

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

  public removePanel(name: string): void {
    const group = this.panels.get(name);
    if (group) {
      this.scene.remove(group);
      this.panels.delete(name);
    }
  }

  public togglePanelVisibility(name: string, visible: boolean): void {
    const group = this.panels.get(name);
    if (group) {
      group.visible = visible;
    }
  }

  public startAnimationLoop(): void {
    const animate = (): void => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.renderer.setAnimationLoop(animate);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public drawBoundingBoxes(): void {
    this.panels.forEach((group) => {
      const boundingBox = new THREE.Box3().setFromObject(group);
      const helper = new THREE.Box3Helper(boundingBox, 0xff0000);
      this.scene.add(helper);
    });
  }
}