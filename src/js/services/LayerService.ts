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
            let popupContent = '<div class="ui mini popup">';
            Object.entries(feature.properties).forEach(([key, value]) => {
                if (value) {
                    popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
                }
            });
            popupContent += '</div>';

            layer.bindPopup(popupContent);
        }
    }

    getDroneRestrictionsLayer(): L.TileLayer {
        const config = Config.LAYERS_CONFIG.dateLayers.droneRestrictions;

        // Créer une TileLayer directe avec l'URL WMTS IGN
        return L.tileLayer(config.url, config.options);
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

    getStyleByRestrictionType(type: string): L.PathOptions {
        const styles: Record<string, L.PathOptions> = {
            'interdite': {
                color: '#ff0000',
                fillColor: '#ff0000',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4
            },
            'restreinte': {
                color: '#ffa500',
                fillColor: '#ffa500',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4
            },
            'autorisee': {
                color: '#00ff00',
                fillColor: '#00ff00',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4
            },
            'default': {
                color: '#0066cc',
                fillColor: '#0066cc',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4
            }
        };

        return styles[type] || styles.default;
    }

    createStyledGeoJSONLayer(data: any, styleProperty: string = 'type'): L.GeoJSON {
        return L.geoJSON(data, {
            style: (feature: any) => {
                const type = feature?.properties?.[styleProperty];
                return this.getStyleByRestrictionType(type);
            },
            onEachFeature: this._onEachFeature.bind(this)
        });
    }
}