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
  
  constructor(width: number = 10, height: number = 10) {
    // Initialize with randomly generated data
    const initialData = this.generatePatternData(width, height);
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
   * Generate new data and update the observable
   */
  public regenerateData(width: number, height: number): void {
    const newData = this.generatePatternData(width, height);
    this.dataSubject.next(newData);
  }
  
  /**
   * Generate a grid of binary data (0s and 1s)
   */
  private generatePatternData(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    // Generate rows
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      
      // Generate values - random 1's and 0's
      for (let j = 0; j < width; j++) {
        // Random binary value (0 or 1)
        const value = Math.random() > 0.5 ? 1 : 0;
        row.push(value);
      }
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Process raw data into training samples
   */
  private processDataIntoSamples(data: number[][]): TrainingSample[] {
    const samples: TrainingSample[] = [];
    const height = data.length;
    const width = data[0].length;
    
    // Create a sample for each cell
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        // Input is the normalized coordinates
        const input = [i / height, j / width];
        
        // Target is the cell value
        const target = [data[i][j]];
        
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