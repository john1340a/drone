import L from 'leaflet';
import Config from '../config/config';

export default class LayerService {


    constructor() {
    }

    createGeoJSONLayer(data: any, options: L.GeoJSONOptions = {}): L.GeoJSON {
        const defaultOptions: L.GeoJSONOptions = {
            style: this._getDefaultStyle(),
            onEachFeature: this._onEachFeature.bind(this)
        };

        return L.geoJSON(data, { ...defaultOptions, ...options });
    }

    private _getDefaultStyle(): L.PathOptions {
        return {
            color: '#ff0000',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        };
    }

    private _onEachFeature(feature: GeoJSON.Feature, layer: L.Layer): void {
        if (feature.properties) {
            const props = feature.properties as any;
            const limite = props.limite || 'Information non disponible';
            const remarque = props.remarque || '';
            const nom = props.nom || '';
            
            // Determine color based on height
            const h = this._extractHeight(limite);
            let colorCode = '#0066cc';
            let statusText = 'Zone restreinte';
            let iconName = 'block';
            
            if (limite.toLowerCase().includes('vol interdit')) {
                colorCode = '#b22222'; // Dark Red
                statusText = 'Vol Interdit';
                iconName = 'block';
            } else if (h !== null) {
                if (h <= 30) { colorCode = '#b22222'; statusText = `Max ${h}m`; iconName = 'warning'; }
                else if (h <= 50) { colorCode = '#d35400'; statusText = `Max ${h}m`; iconName = 'warning'; } // Darker Orange
                else { colorCode = '#f1c40f'; statusText = `Max ${h}m`; iconName = 'info'; } // Yellow
            }

            const popupContent = `
                <div class="restriction-popup" style="min-width: 200px;">
                    <div class="restriction-header" style="background: ${colorCode}; color: white; padding: 8px; border-radius: 4px 4px 0 0; font-weight: bold; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="margin-right: 6px;">${iconName}</span>
                        ${statusText}
                    </div>
                    <div class="restriction-body" style="padding: 8px; background: rgba(255,255,255,0.95); border-radius: 0 0 4px 4px;">
                        <div style="margin-bottom: 6px;"><strong>Limite:</strong> ${limite.replace(' *', '')}</div>
                        ${nom ? `<div style="margin-bottom: 6px;"><strong>Zone:</strong> ${nom}</div>` : ''}
                        ${remarque ? `<div style="margin-bottom: 6px; font-size: 0.9em; color: #666;">${remarque}</div>` : ''}
                        <div style="font-size: 0.8em; color: #999; margin-top: 8px; display: flex; align-items: center;">
                            <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">description</span>
                            Données DGAC/IGN
                        </div>
                    </div>
                </div>
            `;

            (layer as L.Path).bindPopup(popupContent, { className: 'restriction-popup-container' });
        }
    }

    async loadDroneRestrictionsLayer(): Promise<L.GeoJSON> {
        // Load local GeoJSON instead of IGN WMTS
        // Use import.meta.env.BASE_URL to handle the /drone/ base path
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        // Add cache buster
        const response = await fetch(`${baseUrl}data/restrictions.geojson?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load restrictions: ${response.statusText}`);
        }
        const data = await response.json();

        return this.createStyledGeoJSONLayer(data);
    }

    async loadAllowedZonesLayer(): Promise<L.GeoJSON> {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        // Add cache buster to ensure checking for new file updates (e.g. from QGIS export)
        const response = await fetch(`${baseUrl}data/allowed_zones.geojson?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load allowed zones: ${response.statusText}`);
        }
        const data = await response.json();

        // Create a green layer for allowed zones
        return L.geoJSON(data, {
            style: () => ({
                color: '#21ba45',
                fillColor: '#21ba45',
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.15
            }),
            onEachFeature: (feature, layer) => {
                const props = feature.properties as any;
                const popupContent = `
                    <div class="restriction-popup" style="min-width: 200px;">
                        <div class="restriction-header" style="background: #21ba45; color: white; padding: 8px; border-radius: 4px 4px 0 0; font-weight: bold; display: flex; align-items: center;">
                            <span class="material-symbols-outlined" style="margin-right: 6px;">check_circle</span>
                            Zone de Vol Autorisée
                        </div>
                        <div class="restriction-body" style="padding: 8px; background: rgba(255,255,255,0.95); border-radius: 0 0 4px 4px;">
                            <div style="margin-bottom: 6px; display: flex; align-items: center;">
                                <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 4px; color: #666;">vertical_align_top</span>
                                <strong>Hauteur max:</strong> 120m
                            </div>
                            <div style="font-size: 0.9em; color: #666;">Catégorie Ouverte - A1/A2/A3</div>
                            <div style="font-size: 0.8em; color: #999; margin-top: 8px; display: flex; align-items: center;">
                                <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">gavel</span>
                                Réglementation UE 2019/947
                            </div>
                        </div>
                    </div>
                `;
                (layer as L.Path).bindPopup(popupContent, { className: 'restriction-popup-container' });
            }
        });
    }

    async loadGeoJSONFromFile(filePath: string): Promise<L.GeoJSON> {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.createGeoJSONLayer(data);
        } catch (error) {
            console.error('Error loading GeoJSON file:', error);
            throw error;
        }
    }

    private _extractHeight(limite: string): number | null {
        if (!limite) return 120; // Default if missing?
        const lower = limite.toLowerCase();
        if (lower.includes('interdit')) return null;
        const match = lower.match(/(\d+)\s*m/);
        return match ? parseInt(match[1], 10) : 120;
    }

    getStyleFromProperties(properties: any): L.PathOptions {
        const limite = (properties?.limite || '').toLowerCase();
        let color = '#888888'; // Default gray border
        let fillOpacity = 0.15; // Very transparent - allowed areas are visible

        if (limite.includes('vol interdit')) {
            color = '#b22222'; // DARKER RED
            fillOpacity = 0.4; // More opaque for emphasis
        } else {
            const h = this._extractHeight(limite);
             if (h !== null) {
                if (h <= 30) { color = '#b22222'; fillOpacity = 0.4; } // Dark Red
                else if (h <= 50) { color = '#d35400'; fillOpacity = 0.3; } // Darker Orange
                else if (h <= 60) { color = '#f39c12'; fillOpacity = 0.25; } // Darker Yellow
                else { color = '#f1c40f'; fillOpacity = 0.15; } // Yellow
            }
        }

        return {
            color: color,
            fillColor: color,
            weight: 1,
            opacity: 0.8,
            fillOpacity: fillOpacity,
            dashArray: '3, 3' // Dashed border to indicate "restriction overlay"
        };
    }

    createStyledGeoJSONLayer(data: any, options: L.GeoJSONOptions = {}): L.GeoJSON {
        return L.geoJSON(data, {
            ...options,
            style: (feature: any) => {
                return this.getStyleFromProperties(feature?.properties);
            },
            onEachFeature: this._onEachFeature.bind(this)
        });
    }
}