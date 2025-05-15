// WeylGroup.js - Implements operations of the Weyl group on root lattices

export class WeylGroup {
    constructor() {
        // This class handles the computational aspects of Weyl group operations
    }
    
    /**
     * Compute the reflection of a point across a hyperplane perpendicular to a root
     * @param {Array<number>} point - The point to reflect [x, y]
     * @param {Array<number>} root - The root vector defining the reflection hyperplane [x, y]
     * @returns {Array<number>} The reflected point [x', y']
     */
    reflect(point, root) {
        // For a root α, the reflection of a point x is:
        // x' = x - 2(x·α)α/(α·α)
        
        // Calculate the dot product x·α
        const dotProduct = point[0] * root[0] + point[1] * root[1];
        
        // Calculate α·α (the squared length of the root)
        const rootLengthSquared = root[0] * root[0] + root[1] * root[1];
        
        // Calculate the coefficient 2(x·α)/(α·α)
        const coefficient = 2 * dotProduct / rootLengthSquared;
        
        // Compute the reflection
        return [
            point[0] - coefficient * root[0],
            point[1] - coefficient * root[1]
        ];
    }
    
    /**
     * Generate the orbit of a point under the Weyl group action
     * Uses a breadth-first search approach to find all points in the orbit
     * @param {Array<number>} point - The starting point [x, y]
     * @param {Array<Array<number>>} roots - The roots of the root system
     * @returns {Array<Array<number>>} The orbit points
     */
    generateOrbit(point, roots) {
        // Use a Map with string keys to track unique points
        const orbitMap = new Map();
        const orbitSet = new Set();
        const queue = [point];
        
        // Helper to create a unique string key for a point
        // Uses fixed precision to handle floating-point comparison
        const pointKey = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
        
        // Add the initial point
        orbitSet.add(pointKey(point));
        orbitMap.set(pointKey(point), point);
        
        // Process each point in the queue
        while (queue.length > 0) {
            const currentPoint = queue.shift();
            
            // Apply each reflection to the current point
            for (const root of roots) {
                const reflectedPoint = this.reflect(currentPoint, root);
                const key = pointKey(reflectedPoint);
                
                // If we haven't seen this point before, add it to the orbit
                if (!orbitSet.has(key)) {
                    orbitSet.add(key);
                    orbitMap.set(key, reflectedPoint);
                    queue.push(reflectedPoint);
                }
            }
        }
        
        // Convert the map values to an array
        return Array.from(orbitMap.values());
    }
    
    /**
     * Calculate the order of the Weyl group for a given root system type
     * @param {string} rootSystemType - The type of root system (A2, B2, G2)
     * @returns {number} The order of the Weyl group
     */
    getWeylGroupOrder(rootSystemType) {
        switch (rootSystemType) {
            case 'A2':
                // Weyl group of A2 is isomorphic to S3 (symmetric group on 3 elements)
                return 6;
            case 'B2':
                // Weyl group of B2 is isomorphic to D4 (dihedral group of order 8)
                return 8;
            case 'G2':
                // Weyl group of G2 is isomorphic to D6 (dihedral group of order 12)
                return 12;
            default:
                console.error(`Unknown root system type: ${rootSystemType}`);
                return 0;
        }
    }
    
    /**
     * Get a description of the Weyl group for a given root system type
     * @param {string} rootSystemType - The type of root system (A2, B2, G2)
     * @returns {string} A description of the Weyl group
     */
    getWeylGroupDescription(rootSystemType) {
        switch (rootSystemType) {
            case 'A2':
                return "S₃ (symmetric group on 3 elements, dihedral group of order 6)";
            case 'B2':
                return "D₄ (dihedral group of order 8)";
            case 'G2':
                return "D₆ (dihedral group of order 12)";
            default:
                return "Unknown";
        }
    }
}
