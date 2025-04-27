import * as THREE from "three";

export function createPolytopeVisualization(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();

  // Parameters for the 2D grid
  const gridSize = 20; // Number of points along each axis
  const gridRange = 10; // Range of the grid (-gridRange to +gridRange)
  const step = (2 * gridRange) / gridSize;

  // Simulate activation patterns and group points
  const points = [];
  const activationPatterns = new Map<string, THREE.Vector3[]>();

  for (let x = -gridRange; x <= gridRange; x += step) {
    for (let y = -gridRange; y <= gridRange; y += step) {
      const point = new THREE.Vector3(x, y, 0);

      // Simulate an activation pattern (replace this with actual NN evaluation later)
      const pattern = Math.random() > 0.5 ? "101" : "010"; // Example binary pattern

      if (!activationPatterns.has(pattern)) {
        activationPatterns.set(pattern, []);
      }
      activationPatterns.get(pattern)!.push(point);
      points.push({ point, pattern });
    }
  }

  // Render each polytope group as points
  activationPatterns.forEach((groupPoints, pattern) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(groupPoints.flatMap(p => [p.x, p.y, p.z]));
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    // Assign a unique color to each polytope group
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.PointsMaterial({ color, size: 0.2 });

    const polytope = new THREE.Points(geometry, material);
    group.add(polytope);
  });

  // Render boundaries between polytopes
  const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const boundaryGeometry = new THREE.BufferGeometry();
  const boundaryVertices = [];

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i];
      const p2 = points[j];

      // Check if points are neighbors and have different activation patterns
      const isNeighbor =
        Math.abs(p1.point.x - p2.point.x) <= step &&
        Math.abs(p1.point.y - p2.point.y) <= step;

      if (isNeighbor && p1.pattern !== p2.pattern) {
        boundaryVertices.push(p1.point.x, p1.point.y, p1.point.z);
        boundaryVertices.push(p2.point.x, p2.point.y, p2.point.z);
      }
    }
  }

  boundaryGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(boundaryVertices), 3)
  );

  const boundaryLines = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
  group.add(boundaryLines);

  scene.add(group);
  return group;
}