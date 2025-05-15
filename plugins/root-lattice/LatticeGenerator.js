// LatticeGenerator.js - Handles the mathematical generation of lattice points
// and hyperplanes for different root systems

export class LatticeGenerator {
    constructor() {
        // Define root systems with their correct root vectors and lengths
        this.rootSystems = {
            A2: {
                // A2 root system (uniform length roots forming a hexagon)
                // Simple roots
                simpleRoots: [
                    [1, 0],                  // α₁
                    [-1/2, Math.sqrt(3)/2]   // α₂
                ],
                // All 6 roots (all have the same length)
                roots: [
                    [1, 0],                   // α₁
                    [-1/2, Math.sqrt(3)/2],   // α₂
                    [-1/2, -Math.sqrt(3)/2],  // -α₁-α₂
                    [-1, 0],                  // -α₁
                    [1/2, -Math.sqrt(3)/2],   // -α₂
                    [1/2, Math.sqrt(3)/2]     // α₁+α₂
                ],
                description: "A2 root system - Uniform length roots"
            },
            B2: {
                // B2 root system (mixture of long and short roots)
                // Simple roots
                simpleRoots: [
                    [1, 0],  // α₁ (long root)
                    [0, 1]   // α₂ (short root)
                ],
                // All 8 roots - 4 short and 4 long
                roots: [
                    // Short roots (length 1)
                    [0, 1],   // α₂
                    [0, -1],  // -α₂
                    [1, 0],   // α₁
                    [-1, 0],  // -α₁
                    
                    // Long roots (length √2)
                    [1, 1],   // α₁+α₂
                    [1, -1],  // α₁-α₂
                    [-1, 1],  // -α₁+α₂
                    [-1, -1]  // -α₁-α₂
                ],
                shortRoots: [
                    [0, 1], [0, -1], [1, 0], [-1, 0]
                ],
                longRoots: [
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ],
                description: "B2 root system - Mixed length roots"
            },
            G2: {
                // G2 root system (mixture of long and short roots)
                // Simple roots
                simpleRoots: [
                    [1, 0],                   // α₁ (short root)
                    [-3/2, Math.sqrt(3)/2]    // α₂ (long root)
                ],
                // All 12 roots - 6 short and 6 long
                roots: [
                    // Short roots (length 1)
                    [1, 0],                                         // α₁
                    [-1, 0],                                        // -α₁
                    [1/2, Math.sqrt(3)/2],                         // α₁+α₂
                    [-1/2, -Math.sqrt(3)/2],                       // -(α₁+α₂)
                    [-1/2, Math.sqrt(3)/2],                        // -α₁+α₂
                    [1/2, -Math.sqrt(3)/2],                        // α₁-α₂
                    
                    // Long roots (length √3)
                    [-3/2, Math.sqrt(3)/2],                        // α₂ (long root)
                    [3/2, -Math.sqrt(3)/2],                        // -α₂
                    [0, Math.sqrt(3)],                             // 3α₁+2α₂
                    [0, -Math.sqrt(3)],                            // -(3α₁+2α₂)
                    [-3/2, -Math.sqrt(3)/2],                       // -(3α₁+α₂)
                    [3/2, Math.sqrt(3)/2]                          // 3α₁+α₂
                ],
                shortRoots: [
                    [1, 0], [-1, 0],
                    [1/2, Math.sqrt(3)/2], [-1/2, -Math.sqrt(3)/2],
                    [-1/2, Math.sqrt(3)/2], [1/2, -Math.sqrt(3)/2]
                ],
                longRoots: [
                    [-3/2, Math.sqrt(3)/2], [3/2, -Math.sqrt(3)/2],
                    [0, Math.sqrt(3)], [0, -Math.sqrt(3)],
                    [-3/2, -Math.sqrt(3)/2], [3/2, Math.sqrt(3)/2]
                ],
                description: "G2 exceptional root system"
            }
        };
    }

    // Get the roots for a specific root system
    getRoots(type) {
        if (!this.rootSystems[type]) {
            console.error(`Unknown root system type: ${type}`);
            return [];
        }
        return this.rootSystems[type].roots;
    }

    // Get the simple roots for a specific root system
    getSimpleRoots(type) {
        if (!this.rootSystems[type]) {
            console.error(`Unknown root system type: ${type}`);
            return [];
        }
        return this.rootSystems[type].simpleRoots;
    }

    // Generate lattice points based on the root system
    generateLatticePoints(type, density) {
        const simpleRoots = this.getSimpleRoots(type);
        if (simpleRoots.length === 0) return [];

        const latticePoints = [[0, 0]]; // Start with the origin
        const maxCoeff = density; // Maximum coefficient for lattice point generation

        // Generate all lattice points as integer linear combinations of simple roots
        for (let i = -maxCoeff; i <= maxCoeff; i++) {
            for (let j = -maxCoeff; j <= maxCoeff; j++) {
                // Skip the origin (already added)
                if (i === 0 && j === 0) continue;

                const x = i * simpleRoots[0][0] + j * simpleRoots[1][0];
                const y = i * simpleRoots[0][1] + j * simpleRoots[1][1];

                // Add the point to our lattice
                latticePoints.push([x*50, y*50]);
            }
        }

        return latticePoints;
    }

    // Generate hyperplanes (lines perpendicular to roots)
    generateHyperplanes(type, viewBounds) {
        const roots = this.getRoots(type);
        const hyperplanes = [];

        // For each root, create a hyperplane (line perpendicular to the root)
        for (const root of roots) {
            // Normalize the root
            const length = Math.sqrt(root[0] * root[0] + root[1] * root[1]);
            const normalizedRoot = [root[0] / length, root[1] / length];

            // Create a perpendicular vector (rotate by 90°)
            const perpVector = [-normalizedRoot[1], normalizedRoot[0]];

            // Extend the hyperplane in both directions to the view bounds
            const extensionFactor = Math.max(
                Math.abs(viewBounds.maxX - viewBounds.minX),
                Math.abs(viewBounds.maxY - viewBounds.minY)
            ) * 2; // Make it long enough to cover the view

            const start = [
                -perpVector[0] * extensionFactor,
                -perpVector[1] * extensionFactor
            ];
            
            const end = [
                perpVector[0] * extensionFactor,
                perpVector[1] * extensionFactor
            ];

            hyperplanes.push({
                root: root,
                line: [start, end]
            });
        }

        return hyperplanes;
    }

    // Transform points from lattice coordinates to view coordinates
    transformToViewCoordinates(points, scale, offset) {
        return points.map(point => [
            point[0] * scale + offset.x,
            point[1] * scale + offset.y
        ]);
    }
}
