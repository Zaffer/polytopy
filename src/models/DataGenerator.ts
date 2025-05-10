import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TrainingSample } from '../types/model';

/**
 * Class for generating and managing training data
 */
export class DataManager {
  // BehaviorSubject for the raw 2D grid data
  private dataSubject: BehaviorSubject<number[][]>;
  
  // Observable for the processed training samples
  private samples$: Observable<TrainingSample[]>;
  
  // Window size for context (e.g., 3x3 window around each cell)
  private windowSize: number;
  
  constructor(width: number = 10, height: number = 10, windowSize: number = 3) {
    this.windowSize = windowSize;
    
    // Initialize with randomly generated data
    const initialData = this.generateBinaryData(width, height);
    this.dataSubject = new BehaviorSubject<number[][]>(initialData);
    
    // Create derived observable for samples
    this.samples$ = this.dataSubject.pipe(
      map(data => this.processDataIntoSamples(data))
    );
  }
  
  /**
   * Get the observable for raw data
   */
  public getData$(): Observable<number[][]> {
    return this.dataSubject.asObservable();
  }
  
  /**
   * Get the current value of the data
   */
  public getCurrentData(): number[][] {
    return this.dataSubject.getValue();
  }
  
  /**
   * Get the observable for training samples
   */
  public getSamples$(): Observable<TrainingSample[]> {
    return this.samples$;
  }
  
  /**
   * Generate new binary data and update the observable
   */
  public regenerateData(width: number, height: number): void {
    const newData = this.generateBinaryData(width, height);
    this.dataSubject.next(newData);
  }
  
  /**
   * Generate a grid of binary data (0s and 1s)
   */
  private generateBinaryData(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    // Generate rows
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      
      // Generate random binary values for each cell
      for (let j = 0; j < width; j++) {
        row.push(Math.random() > 0.5 ? 1 : 0);
      }
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Process raw data into training samples with input windows and target values
   */
  private processDataIntoSamples(data: number[][]): TrainingSample[] {
    const samples: TrainingSample[] = [];
    const height = data.length;
    const width = data[0].length;
    
    // Generate target data (edges in this case)
    const targetData = this.generateTargetData(data);
    
    // Create a sample for each cell
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        // Extract input window centered at this cell
        const input = this.extractInputWindow(data, i, j);
        
        // Get target for this cell
        const target = [targetData[i][j]];
        
        // Create sample
        samples.push({
          input,
          target,
          row: i,
          col: j
        });
      }
    }
    
    // Shuffle samples for better training
    return this.shuffleSamples(samples);
  }
  
  /**
   * Extract a window of cells centered at the given coordinates
   */
  private extractInputWindow(data: number[][], centerRow: number, centerCol: number): number[] {
    const height = data.length;
    const width = data[0].length;
    const halfWindow = Math.floor(this.windowSize / 2);
    const input: number[] = [];
    
    // Extract window
    for (let di = -halfWindow; di <= halfWindow; di++) {
      for (let dj = -halfWindow; dj <= halfWindow; dj++) {
        const ni = centerRow + di;
        const nj = centerCol + dj;
        
        // Use 0 for cells outside the grid
        if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
          input.push(data[ni][nj]);
        } else {
          input.push(0);
        }
      }
    }
    
    return input;
  }
  
  /**
   * Generate target data based on the raw data
   * In this example, we detect edges of the grid
   */
  private generateTargetData(data: number[][]): number[][] {
    const height = data.length;
    const width = data[0].length;
    const targetData: number[][] = [];
    
    for (let i = 0; i < height; i++) {
      const targetRow: number[] = [];
      for (let j = 0; j < width; j++) {
        // Simple target: detect edges
        targetRow.push(this.isEdgeCell(i, j, height, width) ? 1 : 0);
      }
      targetData.push(targetRow);
    }
    
    return targetData;
  }
  
  /**
   * Check if a cell is on the edge of the grid
   */
  private isEdgeCell(row: number, col: number, height: number, width: number): boolean {
    return row === 0 || col === 0 || row === height - 1 || col === width - 1;
  }
  
  /**
   * Shuffle an array of samples
   */
  private shuffleSamples<T>(samples: T[]): T[] {
    // Create a copy to avoid modifying the original
    const shuffled = [...samples];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
}