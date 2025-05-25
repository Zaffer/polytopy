import * as THREE from "three";

/**
 * Simple text sprite creation - just make it work and look good!
 */
export function createTextSprite(text: string, fontSize: number = 16, backgroundColor: string = "rgba(0, 0, 0, 0)"): THREE.Sprite {
  // Simple canvas - no pixel ratio complexity
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Sprite();
  }
  
  // Optional background
  if (backgroundColor !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Simple text rendering
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize * 2}px Arial`; // Scale up font for canvas
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw text in center
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture and material
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  
  // Create sprite with simple, fixed scale
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1); // Wide and short for good readability
  
  return sprite;
}
