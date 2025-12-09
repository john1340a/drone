import L from 'leaflet';
import Config from '../config/config';

export default class MapService {
    private map: L.Map | null;
    private baseLayers: Record<string, L.TileLayer>;
    private overlayLayers: Record<string, L.Layer>;
    private currentBaseLayer: L.TileLayer | null;

    constructor() {
        this.map = null;
        this.baseLayers = {};
        this.overlayLayers = {};
        this.currentBaseLayer = null;
    }

    initializeMap(containerId: string): L.Map {
        const config = Config.MAP_CONFIG;

        this.map = L.map(containerId, {
            center: config.center as L.LatLngExpression,
            zoom: config.zoom,
            minZoom: config.minZoom,
            maxZoom: config.maxZoom,
            zoomControl: false // Désactiver le contrôle par défaut pour le repositionner
        });

        // Créer un pane personnalisé pour les overlays (au-dessus des basemaps)
        this.map.createPane('overlayPane');
        const overlayPane = this.map.getPane('overlayPane');
        if (overlayPane) {
            overlayPane.style.zIndex = '450'; // Au-dessus des tile layers (zIndex 200)
        }

        this._setupBaseLayers();
        this._setDefaultBaseLayer();

        return this.map;
    }

    private _setupBaseLayers(): void {
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;

        Object.entries(baseMapsConfig).forEach(([key, config]) => {
            // @ts-ignore - config.url can be a string in our structure
            const url = typeof config.url === 'function' ? config.url() : config.url;
            this.baseLayers[key] = L.tileLayer(url, config.options);
        });
    }



    private _setDefaultBaseLayer(): void {
        this.setBaseLayer('osm');
    }

    setBaseLayer(layerKey: string): void {
        if (!this.map) return;

        if (this.currentBaseLayer) {
            this.map.removeLayer(this.currentBaseLayer);
        }

        if (this.baseLayers[layerKey]) {
            this.currentBaseLayer = this.baseLayers[layerKey];
            this.currentBaseLayer.addTo(this.map);
        } else {
            console.warn(`Base layer '${layerKey}' not found`);
        }
    }

    addOverlayLayer(layerKey: string, layer: L.Layer): void {
        if (!this.map) return;

        if (this.overlayLayers[layerKey]) {
            this.removeOverlayLayer(layerKey);
        }

        this.overlayLayers[layerKey] = layer;
        layer.addTo(this.map);
    }

    removeOverlayLayer(layerKey: string): void {
        if (!this.map) return;

        if (this.overlayLayers[layerKey]) {
            this.map.removeLayer(this.overlayLayers[layerKey]);
            delete this.overlayLayers[layerKey];
        }
    }

    toggleOverlayLayer(layerKey: string, layer: L.Layer): boolean {
        if (this.overlayLayers[layerKey]) {
            this.removeOverlayLayer(layerKey);
            return false;
        } else {
            this.addOverlayLayer(layerKey, layer);
            return true;
        }
    }

    getMap(): L.Map | null {
        return this.map;
    }

    fitBounds(bounds: L.LatLngBoundsExpression, options: L.FitBoundsOptions = {}): void {
        if (this.map) {
            this.map.fitBounds(bounds, options);
        }
    }

    setView(center: L.LatLngExpression, zoom: number): void {
        if (this.map) {
            this.map.setView(center, zoom);
        }
    }

    addControl(control: L.Control): void {
        if (this.map) {
            control.addTo(this.map);
        }
    }

    removeControl(control: L.Control): void {
        if (this.map) {
            this.map.removeControl(control);
        }
    }
}