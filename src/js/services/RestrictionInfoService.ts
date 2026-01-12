/**
 * Service to query IGN GetFeatureInfo API for drone restriction zones.
 */
export interface RestrictionInfo {
    color: string;           // e.g. "RED", "ORANGE", "YELLOW"
    maxHeight: number | null; // meters, null if forbidden
    zoneType: string;        // e.g. "CTR", "Agglomeration", "Aerodrome"
    description: string;
    legislation: string;     // e.g. "Arrêté Espace 2020"
}

export default class RestrictionInfoService {
    private static readonly WMTS_BASE = 'https://data.geopf.fr/wmts';
    private static readonly LAYER = 'TRANSPORTS.DRONES.RESTRICTIONS';
    private static readonly STYLE = 'normal';
    private static readonly TILE_MATRIX_SET = 'PM';

    /**
     * Query the IGN WMTS GetFeatureInfo endpoint.
     * @param lat Latitude of the click
     * @param lng Longitude of the click
     * @param zoom Current map zoom level
     * @param map Leaflet map instance (needed for coordinate conversion)
     */
    async getFeatureInfo(
        lat: number,
        lng: number,
        zoom: number,
        map: L.Map
    ): Promise<RestrictionInfo | null> {
        try {
            // Convert lat/lng to tile coordinates
            const tileSize = 256;
            const point = map.project([lat, lng], zoom);
            const tileX = Math.floor(point.x / tileSize);
            const tileY = Math.floor(point.y / tileSize);
            
            // Pixel within the tile
            const i = Math.floor(point.x % tileSize);
            const j = Math.floor(point.y % tileSize);

            // Build GetFeatureInfo URL
            const url = new URL(RestrictionInfoService.WMTS_BASE);
            url.searchParams.set('SERVICE', 'WMTS');
            url.searchParams.set('REQUEST', 'GetFeatureInfo');
            url.searchParams.set('VERSION', '1.0.0');
            url.searchParams.set('LAYER', RestrictionInfoService.LAYER);
            url.searchParams.set('STYLE', RestrictionInfoService.STYLE);
            url.searchParams.set('FORMAT', 'image/png');
            url.searchParams.set('TILEMATRIXSET', RestrictionInfoService.TILE_MATRIX_SET);
            url.searchParams.set('TILEMATRIX', zoom.toString());
            url.searchParams.set('TILEROW', tileY.toString());
            url.searchParams.set('TILECOL', tileX.toString());
            url.searchParams.set('I', i.toString());
            url.searchParams.set('J', j.toString());
            url.searchParams.set('INFOFORMAT', 'application/json');

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                console.warn('GetFeatureInfo request failed:', response.statusText);
                return null;
            }

            const data = await response.json();
            
            // Parse the response (structure depends on IGN's API)
            return this._parseResponse(data);
        } catch (error) {
            console.warn('Failed to get feature info:', error);
            return null;
        }
    }

    /**
     * Parse the GetFeatureInfo JSON response into a RestrictionInfo object.
     */
    private _parseResponse(data: any): RestrictionInfo | null {
        // IGN returns features array
        if (!data.features || data.features.length === 0) {
            return null; // No restriction at this location
        }

        const feature = data.features[0];
        const props = feature.properties || {};

        // The main property is "limite" which contains text like:
        // - "Vol interdit *" → RED
        // - "Hauteur maximale de vol de 30 m *" → Light Red
        // - "Hauteur maximale de vol de 50 m *" → ORANGE  
        // - "Hauteur maximale de vol de 60 m *" → Yellow-Orange
        // - "Hauteur maximale de vol de 100 m *" → YELLOW
        const limite = (props.limite || '').toLowerCase();
        const remarque = props.remarque || '';

        let color = 'UNKNOWN';
        let maxHeight: number | null = null;
        let description = props.limite || 'Zone soumise à restrictions';
        // Note: L'API IGN ne fournit pas le type exact de zone (CTR, Zone P/D/R, parc naturel, etc.)
        // On laisse vide plutôt que d'afficher un terme incorrect
        let zoneType = '';

        // Parse the "limite" field
        if (limite.includes('vol interdit')) {
            color = 'RED';
            maxHeight = null;
        } else if (limite.includes('hauteur maximale')) {
            // Extract the height value using regex
            const heightMatch = limite.match(/(\d+)\s*m/);
            if (heightMatch) {
                maxHeight = parseInt(heightMatch[1], 10);
                
                // Determine color based on height
                if (maxHeight <= 30) {
                    color = 'RED'; // Light red in the legend
                } else if (maxHeight <= 50) {
                    color = 'ORANGE';
                } else if (maxHeight <= 60) {
                    color = 'YELLOW_ORANGE';
                } else {
                    color = 'YELLOW'; // 100m+
                }
            }
        }

        // Try to extract zone type from remarque if available
        if (remarque) {
            zoneType = remarque;
        }

        return {
            color,
            maxHeight,
            zoneType,
            description,
            legislation: 'Arrêté Espace (3 décembre 2020) - Mise à jour Janvier 2026'
        };
    }

    /**
     * Get a human-readable color name in French.
     */
    getColorLabel(color: string): string {
        const labels: Record<string, string> = {
            'RED': 'Rouge - Interdit',
            'ORANGE': 'Orange - 50m max',
            'YELLOW': 'Jaune - 100m max',
            'UNKNOWN': 'Non défini'
        };
        return labels[color] || color;
    }
}
