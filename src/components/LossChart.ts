import { AppState } from '../core/AppState';

/**
 * Minimal loss chart - just a simple line on a canvas
 */
export class LossChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLFieldSetElement;
  private lastRedrawTime: number = 0;
  
  constructor() {
    // Create fieldset container
    this.container = document.createElement('fieldset');
    this.container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
    `;
    
    // Create legend with loss and accuracy display
    const legend = document.createElement('legend');
    legend.id = 'lossDisplay';

    legend.textContent = 'Training Loss';
    this.container.appendChild(legend);
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth - 60; // Account for container padding and margins
    this.canvas.height = 80; // Slightly smaller to fit in fieldset
    this.canvas.style.cssText = `
      width: 100%;
    `;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth - 60; // Account for container padding and margins
      // Redraw with current data
      this.redrawChart();
    });
    
    // Subscribe to both loss histories with throttling
    AppState.getInstance().lossHistory.subscribe(() => {
      this.throttledRedraw();
    });
    
    AppState.getInstance().sampleLossHistory.subscribe(() => {
      this.throttledRedraw();
    });
  }
  
  private throttledRedraw(): void {
    const now = Date.now();
    if (now - this.lastRedrawTime > 100) { // 100ms throttle
      this.lastRedrawTime = now;
      this.redrawChart();
    }
  }
  
  private redrawChart(): void {
    const epochData = AppState.getInstance().lossHistory.getValue();
    const sampleData = AppState.getInstance().sampleLossHistory.getValue();
    this.draw(epochData, sampleData);
  }
  
  private draw(epochData: Array<{epoch: number, loss: number}>, sampleData: Array<{sample: number, loss: number}>): void {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Find min and max loss for scaling (considering both datasets)
    const allLosses = [
      ...(epochData.length > 0 ? epochData.map(d => d.loss) : []),
      ...(sampleData.length > 0 ? sampleData.map(d => d.loss) : [])
    ];
    
    if (allLosses.length === 0) return;
    
    const maxLoss = Math.max(...allLosses);
    const minLoss = Math.min(...allLosses);
    const lossRange = maxLoss - minLoss || 1; // Avoid division by zero
    
    // Draw sample losses (cyan line) - using array indices for X-axis
    if (sampleData.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 1;
      
      sampleData.forEach((data, i) => {
        const x = (i / (sampleData.length - 1)) * this.canvas.width;
        const y = this.canvas.height - ((data.loss - minLoss) / lossRange) * this.canvas.height;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      this.ctx.stroke();
    }
    
    // Draw epoch losses (red line) - using array indices for X-axis
    if (epochData.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      
      epochData.forEach((data, i) => {
        const x = (i / (epochData.length - 1)) * this.canvas.width;
        const y = this.canvas.height - ((data.loss - minLoss) / lossRange) * this.canvas.height;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      this.ctx.stroke();
    }
    
    // Update loss display text
    const lossDisplay = document.getElementById('lossDisplay');
    if (lossDisplay) {
      const currentSampleLoss = sampleData.length > 0 ? sampleData[sampleData.length - 1].loss : 0;
      const currentEpochLoss = epochData.length > 0 ? epochData[epochData.length - 1].loss : 0;
      const currentEpoch = epochData.length > 0 ? epochData[epochData.length - 1].epoch : 0;
      const currentAccuracy = AppState.getInstance().accuracy.getValue();
      
      lossDisplay.textContent = `Epoch: ${currentEpoch} | Accuracy: ${(currentAccuracy * 100).toFixed(1)}% | Sample Loss: ${currentSampleLoss.toFixed(4)} | Epoch Loss: ${currentEpochLoss.toFixed(4)}`;
    }
  }
  
  destroy(): void {
    this.container.remove();
  }
}
