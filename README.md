# POLYTOPY

## Background
- Some experiments to help me understand Neural Nets better
  - https://addxorrol.blogspot.com/2024/07/some-experiments-to-help-me-understand.html?m=1
  - https://addxorrol.blogspot.com/2025/04/some-experiments-to-help-me-understand.html?m=1
  - https://addxorrol.blogspot.com/2025/04/some-experiments-to-help-me-understand_10.html?m=1
  - https://addxorrol.blogspot.com/2025/05/some-experiments-to-help-me-understand.html?m=1
- [Interpreting Neural Networks through the Polytope Lens](https://www.lesswrong.com/posts/eDicGjD9yte6FLSie/interpreting-neural-networks-through-the-polytope-lens)
- [On polytopes](https://www.lesswrong.com/posts/GdCCiWQWnQCWq9wBE/on-polytopes)



## Setup

   ```
   npm install
   ```
   ```
   npm start
   ```
 `http://localhost:3000`

## Usage

The application initializes a 3D scene for machine learning visualizations using THREE.js and WebGPU.

## TODO

- [ ] Add strange area to data.

   As per: https://arxiv.org/pdf/2210.01892
   > "This reflects an abundance of unexpected structure"

   Test capacity of polysemantic neurons to learn unexpected structure, ie. a regular shape with one strange portion. Expect that this area will take up relatively more neurons to learn.

## Technical Details (for the agents 🤖)

### Architecture Overview

This project implements a 3D neural network visualization and training system using TypeScript, THREE.js with WebGPU, and reactive programming with RxJS. The architecture follows a modular design with clear separation of concerns.

### Visualisation Design

- the visualisation are seperated out into thier own "panels"
- each panel allows you to see a different compenent or idea in the machine learning system

### Core Components

#### 1. Application Entry Point (`src/main.ts` → `src/App.ts`)
- **Main**: Creates and starts the `Application` instance
- **Application**: Orchestrates all components and handles lifecycle management
- Initializes `SceneManager`, `AppController`, and `VisualizationManager`
- Wires up data flow between components using reactive streams

#### 2. Core Management (`src/core/`)
- **SceneManager**: Manages THREE.js scene, WebGPU renderer, camera, and lighting
  - Handles 3D panel positioning and visibility
  - Manages animation loop and window resize events
  - Uses OrbitControls for camera interaction
- **AppController**: Central coordinator between UI, training, and visualization
  - Bridges user actions to data/training managers
  - Manages application state updates
  - Handles panel visibility and camera controls

#### 3. Data & Training (`src/models/`)
- **DataManager**: Generates and manages training data using RxJS observables
  - Creates binary grid patterns for neural network training
  - Converts data into training samples with normalized coordinates
- **NeuralNetworkTrainer**: Custom neural network implementation
  - Multi-layer perceptron with ReLU hidden layers and sigmoid output
  - Backpropagation training with configurable architecture
- **TrainingManager**: Orchestrates training loops and prediction updates
  - Manages training state and epoch progression
  - Updates predictions and accuracy metrics in real-time

#### 4. State Management (`src/utils/AppState.ts`)
- Singleton pattern using RxJS BehaviorSubjects for reactive state
- Manages: network configuration, training settings, visualization options
- Provides centralized state updates that components can subscribe to

#### 5. 3D Visualizations (`src/visualizations/`)
- **VisualizationManager**: Coordinates all visualization updates
- **DataVis**: Renders training data as colored 2D grids (blue=0, red=1)
- **NetworkVis**: 3D neural network architecture with nodes and weighted connections
- **PredictionVis**: Shows model predictions as color-coded grids
- **PolytopeVis**: Experimental polytope boundary visualization
- All visualizations use `TextUtils` for 3D text labels

#### 6. UI Controls (`src/components/controls/`)
- **ControlPanel**: Creates the main UI interface
- **ControlManager**: Handles reactive UI updates and user interactions
- **ControlElements**: Utility functions for creating UI components
- Two-way data binding between UI controls and application state

### Technology Stack

- **TypeScript**: Type-safe development with modern ES features
- **THREE.js**: 3D graphics with WebGPU renderer for high performance
- **RxJS**: Reactive programming for state management and data flow
- **Vite**: Fast development server and build tool

### Data Flow Architecture

```
User Interaction → ControlManager → AppController → DataManager/TrainingManager
                                                           ↓
SceneManager ← VisualizationManager ← AppState ← Training Updates
     ↓
THREE.js Scene Updates → WebGPU Renderer → Browser Display
```

### Key Design Patterns

1. **Observer Pattern**: RxJS observables for reactive state management
2. **Singleton Pattern**: AppState for centralized state
3. **Manager Pattern**: Separate managers for different concerns
4. **Factory Pattern**: Visualization creation functions
5. **Facade Pattern**: ControlManager simplifies UI interactions

### Module Dependencies

- **Core modules** depend only on types and utilities
- **Visualizations** depend on core and utilities
- **Components** depend on core for state management
- **App** orchestrates all modules without business logic

### Extending the System

To add new features:

1. **New Visualization**: Create in `src/visualizations/`, register in `VisualizationManager`
2. **New UI Control**: Add to `ControlElements`, wire in `ControlPanel` and `ControlManager`
3. **New Training Algorithm**: Extend or replace `NeuralNetworkTrainer`
4. **New Data Types**: Update `DataManager` and corresponding visualizations

### Configuration

- Scene settings: `src/types/scene.ts` (camera, renderer, panel spacing)
- Model defaults: `src/types/model.ts` (network architecture, training parameters)
- Build config: `vite.config.js` (development server, path aliases)

## Code Style Preferences

This project follows a philosophy of simplicity and clarity:

### Core Principles

- **Simplicity First**: Keep things simple - complexity is the enemy
- **Minimal Code**: Less code is better - prefer concise, readable solutions
- **Best Practices**: Always use current best practices and latest language features
- **Modern Standards**: Assume latest versions of dependencies and language features
- **Declarative Approach**: Favor declarative code over imperative when possible

### Implementation Guidelines

- Use modern TypeScript features (latest syntax, strict typing)
- Leverage RxJS for reactive, declarative data flow
- Prefer functional programming patterns where appropriate
- Use destructuring, arrow functions, and modern ES features
- Keep functions small and focused on single responsibilities
- Avoid unnecessary abstractions - solve the problem at hand
- Use type inference when types are obvious
- Prefer composition over inheritance
- Write self-documenting code with clear variable and function names