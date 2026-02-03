
// Basic geometry utilities
export class GeometryUtils {
    
    /**
     * Check if a point is inside a polygon (Ray-casting algorithm).
     * @param point [lng, lat]
     * @param polygon GeoJSON coordinates array (e.g. feature.geometry.coordinates)
     */
    static isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
        // Handle MultiPolygon by iterating ?? No, usually polygon geometry is number[][][] (rings)
        // Polygon coordinates: [ [ [x,y], [x,y] ], [hole] ]
        // We mainly check the outer ring [0].
        
        const x = point[0], y = point[1];
        let inside = false;
        
        // Iterate over rings (usually first ring is outer, others are holes)
        // For simplicity, we check if it's in the outer ring.
        // Handling holes is more complex but for drone restrictions, usually we care about the main area.
        // Actually, if it's in a hole, it's NOT in the polygon.
        
        // Helper for a single ring
        const inRing = (pt: [number, number], ring: number[][]) => {
            let isInside = false;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const xi = ring[i][0], yi = ring[i][1];
                const xj = ring[j][0], yj = ring[j][1];
                
                const intersect = ((yi > pt[1]) !== (yj > pt[1]))
                    && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
                if (intersect) isInside = !isInside;
            }
            return isInside;
        };

        const rings = polygon;
        if (!rings || rings.length === 0) return false;

        // Check outer ring
        if (inRing(point, rings[0])) {
            inside = true;
            // Check holes (if any)
            for (let k = 1; k < rings.length; k++) {
                if (inRing(point, rings[k])) {
                    inside = false; // It's in a hole
                    break;
                }
            }
        }

        return inside;
    }

    static isPointInMultiPolygon(point: [number, number], multiPolygon: number[][][][]): boolean {
        for (const polygon of multiPolygon) {
            if (this.isPointInPolygon(point, polygon)) {
                return true;
            }
        }
        return false;
    }
}
