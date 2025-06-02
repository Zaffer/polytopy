import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TrainingSample, PatternType } from '../types/model';

/**
 * Class for generating and managing training data
 */
export class DataManager {
  // BehaviorSubject for the raw 2D grid data
  private dataSubject: BehaviorSubject<number[][]>;
  
  // Observable for the processed training samples
  private samples$: Observable<TrainingSample[]>;
  
  constructor(width: number = 10, height: number = 10, patternType: PatternType = PatternType.RANDOM) {
    // Initialize with pattern data
    const initialData = this.generatePatternData(width, height, patternType);
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
  public regenerateData(width: number, height: number, patternType: PatternType = PatternType.RANDOM): void {
    const newData = this.generatePatternData(width, height, patternType);
    this.dataSubject.next(newData);
  }

  /**
   * Set custom data directly (for drawing pad)
   */
  public setCustomData(data: number[][]): void {
    // Create a deep copy to avoid reference issues
    const dataCopy = data.map(row => [...row]);
    this.dataSubject.next(dataCopy);
  }
  
  /**
   * Generate a grid of binary data (0s and 1s) based on pattern type
   */
  private generatePatternData(width: number, height: number, patternType: PatternType = PatternType.RANDOM): number[][] {
    switch (patternType) {
      case PatternType.RANDOM:
        return this.generateRandomPattern(width, height);
      case PatternType.CHECKERBOARD:
        return this.generateCheckerboardPattern(width, height);
      case PatternType.STRIPES_FIFTY_FIFTY:
        return this.generateFiftyFiftyPattern(width, height);
      case PatternType.STRIPES_VERTICAL:
        return this.generateVerticalStripesPattern(width, height);
      case PatternType.CIRCLE:
        return this.generateCirclePattern(width, height);
      case PatternType.CORNERS:
        return this.generateCornersPattern(width, height);
      default:
        return this.generateRandomPattern(width, height);
    }
  }

  /**
   * Generate random binary pattern
   */
  private generateRandomPattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        const value = Math.random() > 0.5 ? 1 : 0;
        row.push(value);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Generate checkerboard pattern
   */
  private generateCheckerboardPattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        const value = (i + j) % 2;
        row.push(value);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Generate 50/50 black white pattern split down the middle
   */
  private generateFiftyFiftyPattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    const midpoint = Math.floor(width / 2);
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        // Left half is black (0), right half is white (1)
        row.push(j < midpoint ? 0 : 1);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Generate vertical stripes pattern
   */
  private generateVerticalStripesPattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        const value = Math.floor(j / 2) % 2;
        row.push(value);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Generate circle pattern
   */
  private generateCirclePattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        const distance = Math.sqrt((j - centerX) ** 2 + (i - centerY) ** 2);
        const value = distance <= radius ? 1 : 0;
        row.push(value);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Generate corners pattern
   */
  private generateCornersPattern(width: number, height: number): number[][] {
    const data: number[][] = [];
    
    for (let i = 0; i < height; i++) {
      const row: number[] = [];
      for (let j = 0; j < width; j++) {
        // Set corners to 1, everything else to 0
        const isCorner = (i < 2 && j < 2) || 
                        (i < 2 && j >= width - 2) || 
                        (i >= height - 2 && j < 2) || 
                        (i >= height - 2 && j >= width - 2);
        const value = isCorner ? 1 : 0;
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