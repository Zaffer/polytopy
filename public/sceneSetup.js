import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export async function initScene() {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);  // Dark background
  
  // Setup camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;
  
  // Setup renderer
  const canvas = document.getElementById('canvas');
  const renderer = new WebGPURenderer({
    antialias: true,
  });
  await renderer.init();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  // Setup controls
  const controls = new OrbitControls(camera, renderer.domElement);
  
  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  return {
    scene,
    camera,
    renderer,
    controls,
    startAnimationLoop: function() {
      function animate() {
        controls.update();
        renderer.render(scene, camera);
      }
      
      renderer.setAnimationLoop(animate);
    }
  };
}