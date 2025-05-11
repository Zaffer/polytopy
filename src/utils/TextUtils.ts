import * as THREE from "three";

/**
 * Utility function to create text labels as sprites with sharp text
 * Shared across all visualization components
 */
export function createTextSprite(text: string, fontSize: number = 16, backgroundColor: string = "rgba(0, 0, 0, 0)"): THREE.Sprite {
  // Create high-resolution canvas for text rendering
  const canvas = document.createElement('canvas');
  const pixelRatio = window.devicePixelRatio || 2; // Use device pixel ratio or fallback to 2x
  const size = fontSize * 3; // Increase base size
  canvas.width = size * 5 * pixelRatio;  // Make canvas extra wide for text and apply pixel ratio
  canvas.height = size * 1.5 * pixelRatio;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error("Failed to get canvas context");
    // Return empty sprite if context creation fails
    return new THREE.Sprite();
  }
  
  // Scale the context by pixel ratio for high DPI displays
  ctx.scale(pixelRatio, pixelRatio);
  
  // Optional background for certain labels
  if (backgroundColor !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  }
  
  // Set text styling with sharpening techniques
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Enable font smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Support for multiline text
  if (text.includes('\n')) {
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height / pixelRatio - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / (2 * pixelRatio), startY + index * lineHeight);
    });
  } else {
    ctx.fillText(text, canvas.width / (2 * pixelRatio), canvas.height / (2 * pixelRatio));
  }
  
  // Create sprite material with the canvas texture
  const texture = new THREE.CanvasTexture(canvas);
  
  // Advanced texture settings for better distant viewing
  texture.minFilter = THREE.LinearMipmapLinearFilter; // Better mipmapping for distant viewing
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16; // Increase anisotropic filtering for sharper text at angles
  texture.needsUpdate = true; // Make sure texture updates properly
  
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    sizeAttenuation: true, // Ensure proper sizing at different distances
    depthTest: false, // Allow text to be visible in front of other objects
    depthWrite: false // Don't write to depth buffer
  });
  
  // Create sprite with the right scale based on text length and font size
  const sprite = new THREE.Sprite(material);
  const aspectRatio = canvas.width / canvas.height;
  
  // Scale sprite size based on font size and text length - adjusted for better visibility
  const baseScale = Math.min(text.length * 0.03, 0.8) * (fontSize / 16);
  sprite.scale.set(baseScale * aspectRatio, baseScale, 1);
  
  // Store original scale to allow size adjustments for zoom levels
  (sprite as any).userData = {
    originalScale: { 
      x: baseScale * aspectRatio, 
      y: baseScale 
    },
    textContent: text,
    fontSize: fontSize
  };
  
  return sprite;
}
