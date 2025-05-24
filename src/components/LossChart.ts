import { AppState } from '../utils/AppState';

/**
 * Minimal loss chart - just a simple line on a canvas
 */
export class LossChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLFieldSetElement;
  
  constructor() {
    // Create fieldset container
    this.container = document.createElement('fieldset');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      margin: 0;
      padding: 10px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #666;
      border-radius: 4px;
    `;
    
    // Create legend
    const legend = document.createElement('legend');
    legend.textContent = 'Training Loss';
    legend.style.cssText = `
      color: #fff;
      font-size: 12px;
      padding: 0 5px;
    `;
    this.container.appendChild(legend);
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth - 60; // Account for container padding and margins
    this.canvas.height = 80; // Slightly smaller to fit in fieldset
    this.canvas.style.cssText = `
      width: 100%;
      background: #111;
      border: 1px solid #444;
    `;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth - 60; // Account for container padding and margins
      // Redraw with current data
      const currentData = AppState.getInstance().lossHistory.getValue();
      this.draw(currentData);
    });
    
    // Subscribe to loss updates
    AppState.getInstance().lossHistory.subscribe(data => {
      this.draw(data);
    });
  }
  
  private draw(data: Array<{epoch: number, loss: number}>): void {
    if (data.length === 0) return;
    
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw line
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    const maxLoss = Math.max(...data.map(d => d.loss));
    const maxEpoch = Math.max(...data.map(d => d.epoch));
    
    for (let i = 0; i < data.length; i++) {
      const x = (data[i].epoch / maxEpoch) * this.canvas.width;
      const y = this.canvas.height - (data[i].loss / maxLoss) * this.canvas.height;
      
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    
    this.ctx.stroke();
  }
  
  destroy(): void {
    this.container.remove();
  }
}
