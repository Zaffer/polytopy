import * as THREE from "three";

/**
 * Create text sprite that automatically sizes to fit the text content
 */
export function createTextSprite(text: string, fontSize: number = 16, backgroundColor: string = "rgba(0, 0, 0, 0)"): THREE.Sprite {
  // Create a temporary canvas to measure text dimensions
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    return new THREE.Sprite();
  }
  
  // Set font to measure text
  const scaledFontSize = fontSize * 2; // Scale up font for canvas
  tempCtx.font = `bold ${scaledFontSize}px Arial`;
  const textMetrics = tempCtx.measureText(text);
  
  // Calculate canvas dimensions based on text size with padding
  const padding = scaledFontSize * 0.5; // 50% of font size for padding
  const canvasWidth = Math.max(textMetrics.width + padding * 2, scaledFontSize * 2); // Minimum width
  const canvasHeight = scaledFontSize * 1.5; // Height based on font size
  
  // Create actual canvas with measured dimensions
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Sprite();
  }
  
  // Optional background
  if (backgroundColor !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Text rendering
  ctx.fillStyle = 'white';
  ctx.font = `bold ${scaledFontSize}px Arial`;
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
  
  // Create sprite with scale proportional to text width
  const sprite = new THREE.Sprite(material);
  const aspectRatio = canvasWidth / canvasHeight;
  const baseHeight = 0.5; // Keep consistent height
  sprite.scale.set(aspectRatio * baseHeight, baseHeight, 1);
  
  return sprite;
}
