// Add this new utility class for convex hull calculation
// Create a new file: plugins/root-lattice/ConvexHull.js

export class ConvexHull {
    /**
     * Calculate the convex hull of a set of points using Graham scan algorithm
     * @param {Array<Array<number>>} points - Array of points [x, y]
     * @returns {Array<Array<number>>} Points forming the convex hull in counter-clockwise order
     */
    static calculate(points) {
        // Need at least 3 points for a convex hull
        if (points.length < 3) return points;
        
        // Find the point with the lowest y-coordinate
        // In case of tie, select the one with the lowest x-coordinate
        let lowestPoint = points[0];
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point[1] < lowestPoint[1] || 
                (point[1] === lowestPoint[1] && point[0] < lowestPoint[0])) {
                lowestPoint = point;
            }
        }
        
        // Sort points by polar angle with respect to the lowest point
        const sortedPoints = points.slice();
        const lowestPointRef = lowestPoint; // For closure
        sortedPoints.sort((a, b) => {
            // Handle the reference point case
            if (a === lowestPointRef) return -1;
            if (b === lowestPointRef) return 1;
            
            // Calculate polar angles with respect to lowest point
            const angleA = Math.atan2(a[1] - lowestPointRef[1], a[0] - lowestPointRef[0]);
            const angleB = Math.atan2(b[1] - lowestPointRef[1], b[0] - lowestPointRef[0]);
            
            // If angles are equal, sort by distance from lowest point
            if (angleA === angleB) {
                const distA = (a[0] - lowestPointRef[0]) ** 2 + (a[1] - lowestPointRef[1]) ** 2;
                const distB = (b[0] - lowestPointRef[0]) ** 2 + (b[1] - lowestPointRef[1]) ** 2;
                return distA - distB;
            }
            
            return angleA - angleB;
        });
        
        // Check if three points make a counter-clockwise turn
        const ccw = (p1, p2, p3) => {
            return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
        };
        
        // Graham scan algorithm
        const hull = [sortedPoints[0], sortedPoints[1]];
        
        for (let i = 2; i < sortedPoints.length; i++) {
            while (hull.length > 1 && ccw(hull[hull.length - 2], hull[hull.length - 1], sortedPoints[i]) <= 0) {
                hull.pop();
            }
            hull.push(sortedPoints[i]);
        }
        
        return hull;
    }
    
    /**
     * Calculate the combined convex hull of multiple orbit sets
     * @param {Map<string, Array<Array<number>>>} orbits - Map of orbit points
     * @returns {Array<Array<number>>} Points forming the combined convex hull
     */
    static calculateCombinedHull(orbits) {
        // Collect all orbit points into a single array
        const allPoints = [];
        orbits.forEach(orbit => {
            orbit.forEach(point => {
                allPoints.push(point);
            });
        });
        
        // Calculate the convex hull of all points
        return this.calculate(allPoints);
    }
}
