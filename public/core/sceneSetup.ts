import * as THREE from "three";
import { WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private layers: Map<string, THREE.Group>;
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

    this.layers = new Map();

    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public addLayer(name: string, group: THREE.Group, depth: number): void {
    group.position.z = depth;
    this.layers.set(name, group);
    this.scene.add(group);
  }

  public removeLayer(name: string): void {
    const group = this.layers.get(name);
    if (group) {
      this.scene.remove(group);
      this.layers.delete(name);
    }
  }

  public toggleLayerVisibility(name: string, visible: boolean): void {
    const group = this.layers.get(name);
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
}