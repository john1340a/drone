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

import { GeometryUtils } from '../utils/GeometryUtils';

export default class RestrictionInfoService {

    /**
     * Client-side lookup for drone restrictions.
     * @param lat Latitude
     * @param lng Longitude
     * @param layer The Leaflet GeoJSON layer containing the data
     */
    getRestrictionInfo(lat: number, lng: number, layer: L.GeoJSON): RestrictionInfo | null {
        // Identify features at the clicked location
        const foundFeatures: any[] = [];
        
        layer.eachLayer((l: any) => {
            const feature = l.feature;
            const geometry = feature.geometry;
            
            let isInside = false;
            if (geometry.type === 'Polygon') {
                isInside = GeometryUtils.isPointInPolygon([lng, lat], geometry.coordinates);
            } else if (geometry.type === 'MultiPolygon') {
                isInside = GeometryUtils.isPointInMultiPolygon([lng, lat], geometry.coordinates);
            }

            if (isInside) {
                foundFeatures.push(feature);
            }
        });

        if (foundFeatures.length > 0) {
            // If multiple restrictions overlap, we could prioritise them.
            // For now, take the most restrictive one or the first one.
            // IGN logic: lowest max height or "Interdit".
            
            // Sort by severity (approximate)
            foundFeatures.sort((a, b) => {
                const hA = this._extractHeight(a.properties.limite);
                const hB = this._extractHeight(b.properties.limite);
                const valA = hA === null ? -1 : hA; // -1 for Forbidden (most severe)
                const valB = hB === null ? -1 : hB;
                return valA - valB; // Ascending height (Forbidden first)
            });

            return this._parseFeature(foundFeatures[0]);
        }

        // NO RESTRICTION FOUND -> ALLOWED ZONE
        return {
             color: 'GREEN',
             maxHeight: 120,
             zoneType: 'Zone Ouverte',
             description: 'Pas de restriction spécifique détectée pour la catégorie Ouverte.',
             legislation: 'Réglementation Générale Catégorie Ouverte (120m max)'
        };
    }

    private _extractHeight(limite: string): number | null {
        if (!limite) return 120; // Default if missing?
        const lower = limite.toLowerCase();
        if (lower.includes('interdit')) return null;
        const match = lower.match(/(\d+)\s*m/);
        return match ? parseInt(match[1], 10) : 120;
    }

    private _parseFeature(feature: any): RestrictionInfo {
        const props = feature.properties || {};
        const limite = (props.limite || '').toLowerCase();
        const remarque = props.remarque || '';

        let color = 'UNKNOWN';
        let maxHeight: number | null = null;
        const description = props.limite || 'Zone soumise à restrictions';
        const zoneType = remarque || '';

        if (limite.includes('vol interdit')) {
            color = 'RED';
            maxHeight = null;
        } else {
            const h = this._extractHeight(limite);
            maxHeight = h;
             if (h !== null) {
                if (h <= 30) color = 'RED';
                else if (h <= 50) color = 'ORANGE';
                else if (h <= 60) color = 'YELLOW_ORANGE'; // Custom mapping if needed
                else color = 'YELLOW';
            }
        }

        return {
            color,
            maxHeight,
            zoneType,
            description,
            legislation: 'Données DGAC/IGN - ' + (props.nom || '')
        };
    }

    getColorLabel(color: string): string {
        const labels: Record<string, string> = {
            'RED': 'Rouge - Interdit / 30m',
            'ORANGE': 'Orange - 50m max',
            'YELLOW': 'Jaune - 100m max',
            'GREEN': 'Vert - 120m max', // NEW
            'UNKNOWN': 'Non défini'
        };
        return labels[color] || color;
    }
}

