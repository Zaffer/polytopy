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


## TODO

- [ ] Add strange area to data.

   As per: https://arxiv.org/pdf/2210.01892
   > "This reflects an abundance of unexpected structure"

   Test capacity of polysemantic neurons to learn unexpected structure, ie. a regular shape with one strange portion. Expect that this area will take up relatively more neurons to learn.