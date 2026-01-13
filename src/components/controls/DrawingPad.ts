/**
 * Drawing pad component for creating custom patterns
 */
export class DrawingPad {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private isDrawing: boolean = false;
  private drawingValue: number = 1; // 1 for drawing, 0 for erasing
  private data: number[][];
  private onDataChange?: (data: number[][]) => void;

  constructor(
    width: number = 10, 
    height: number = 10, 
    canvasSize: number = 200,
    onDataChange?: (data: number[][]) => void
  ) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.cellSize = canvasSize / Math.max(width, height);
    this.onDataChange = onDataChange;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = width * this.cellSize;
    this.canvas.height = height * this.cellSize;
    this.canvas.style.border = '1px solid #ccc';
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '10px 0';

    // Get 2D context
    this.ctx = this.canvas.getContext('2d')!;

    // Initialize data with zeros
    this.data = Array.from({ length: height }, () => 
      Array.from({ length: width }, () => 0)
    );

    this.setupEventListeners();
    this.render();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getGridPosition(x: number, y: number): { row: number, col: number } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    const col = Math.floor(canvasX / this.cellSize);
    const row = Math.floor(canvasY / this.cellSize);
    
    return { 
      row: Math.max(0, Math.min(this.gridHeight - 1, row)), 
      col: Math.max(0, Math.min(this.gridWidth - 1, col)) 
    };
  }

  private setCellValue(row: number, col: number, value: number): void {
    if (this.data[row][col] !== value) {
      this.data[row][col] = value;
      this.renderCell(row, col);
      
      // Notify parent component of data change
      if (this.onDataChange) {
        this.onDataChange([...this.data.map(row => [...row])]);
      }
    }
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDrawing = true;
    
    // Determine drawing or erasing based on button
    this.drawingValue = e.button === 2 ? 0 : 1; // Right click = erase, left click = draw
    
    const { row, col } = this.getGridPosition(e.clientX, e.clientY);
    this.setCellValue(row, col, this.drawingValue);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;
    
    const { row, col } = this.getGridPosition(e.clientX, e.clientY);
    this.setCellValue(row, col, this.drawingValue);
  }

  private onMouseUp(): void {
    this.isDrawing = false;
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDrawing = true;
    this.drawingValue = 1; // Touch always draws
    
    const { row, col } = this.getGridPosition(touch.clientX, touch.clientY);
    this.setCellValue(row, col, this.drawingValue);
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDrawing) return;
    
    const touch = e.touches[0];
    const { row, col } = this.getGridPosition(touch.clientX, touch.clientY);
    this.setCellValue(row, col, this.drawingValue);
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.isDrawing = false;
  }

  private renderCell(row: number, col: number): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;
    
    // Set fill color based on cell value
    this.ctx.fillStyle = this.data[row][col] === 1 ? '#e74c3c' : '#3498db';
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
    
    // Draw grid lines
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        this.renderCell(row, col);
      }
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getData(): number[][] {
    return this.data.map(row => [...row]);
  }

  public setData(newData: number[][]): void {
    if (newData.length !== this.gridHeight || newData[0].length !== this.gridWidth) {
      console.warn('Data dimensions do not match grid dimensions');
      return;
    }
    
    this.data = newData.map(row => [...row]);
    this.render();
  }

  public clear(): void {
    this.data = Array.from({ length: this.gridHeight }, () => 
      Array.from({ length: this.gridWidth }, () => 0)
    );
    this.render();
    
    if (this.onDataChange) {
      this.onDataChange(this.getData());
    }
  }

  public fill(): void {
    this.data = Array.from({ length: this.gridHeight }, () => 
      Array.from({ length: this.gridWidth }, () => 1)
    );
    this.render();
    
    if (this.onDataChange) {
      this.onDataChange(this.getData());
    }
  }

  public resize(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.cellSize = 200 / Math.max(width, height);
    
    this.canvas.width = width * this.cellSize;
    this.canvas.height = height * this.cellSize;
    
    // Preserve existing data or create new
    const newData = Array.from({ length: height }, (_, row) => 
      Array.from({ length: width }, (_, col) => 
        (this.data[row] && this.data[row][col] !== undefined) ? this.data[row][col] : 0
      )
    );
    
    this.data = newData;
    this.render();
  }

  public dispose(): void {
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
  }
}
