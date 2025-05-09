# POLYTOPY

Inspired by: https://addxorrol.blogspot.com/2024/07/some-experiments-to-help-me-understand.html?m=1

## Setup

1. **Install dependencies:**
   ```
   npm install
   ```

1. **Run server:**
   ```
   npm start
   ```

1. **Open browser:**
   Navigate to `http://localhost:3000` (or the port specified in your Vite configuration).

## Usage

The application initializes a 3D scene with machine learning visualizations using THREE.js. It includes:

- Data visualization panel
- Neural network structure visualization
- Prediction visualization
- Polytope visualization

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Project Structure

```
/
├── src/
│   ├── components/           # UI components
│   │   ├── controls/
│   │   │   ├── ControlPanel.ts
│   │   │   └── ControlElements.ts
│   ├── core/                 # Core application code
│   │   ├── Controller.ts     # Neural network training controller
│   │   └── SceneManager.ts   # 3D scene management
│   ├── models/               # Data models
│   │   ├── NeuralNetworkTrainer.ts
│   │   └── DataGenerator.ts
│   ├── visualizations/       # Visualization panels
│   │   ├── DataVis.ts
│   │   ├── NetworkVis.ts
│   │   ├── PredictionVis.ts
│   │   └── PolytopeVis.ts
│   ├── utils/
│   │   └── math.ts
│   └── main.ts               # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.js
├── README.md
└── LICENSE
```