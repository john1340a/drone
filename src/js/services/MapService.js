class MapService {
    constructor() {
        this.map = null;
        this.baseLayers = {};
        this.overlayLayers = {};
        this.currentBaseLayer = null;
    }

    initializeMap(containerId) {
        const config = Config.MAP_CONFIG;

        this.map = L.map(containerId, {
            center: config.center,
            zoom: config.zoom,
            minZoom: config.minZoom,
            maxZoom: config.maxZoom,
            zoomControl: false // Désactiver le contrôle par défaut pour le repositionner
        });

        this._setupBaseLayers();
        this._setDefaultBaseLayer();

        return this.map;
    }

    _setupBaseLayers() {
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;

        Object.entries(baseMapsConfig).forEach(([key, config]) => {
            this.baseLayers[key] = L.tileLayer(config.url, config.options);
        });
    }

    _setDefaultBaseLayer() {
        this.setBaseLayer('osm');
    }

    setBaseLayer(layerKey) {
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

    addOverlayLayer(layerKey, layer) {
        if (this.overlayLayers[layerKey]) {
            this.removeOverlayLayer(layerKey);
        }

        this.overlayLayers[layerKey] = layer;
        layer.addTo(this.map);
    }

    removeOverlayLayer(layerKey) {
        if (this.overlayLayers[layerKey]) {
            this.map.removeLayer(this.overlayLayers[layerKey]);
            delete this.overlayLayers[layerKey];
        }
    }

    toggleOverlayLayer(layerKey, layer) {
        if (this.overlayLayers[layerKey]) {
            this.removeOverlayLayer(layerKey);
            return false;
        } else {
            this.addOverlayLayer(layerKey, layer);
            return true;
        }
    }

    getMap() {
        return this.map;
    }

    fitBounds(bounds, options = {}) {
        this.map.fitBounds(bounds, options);
    }

    setView(center, zoom) {
        this.map.setView(center, zoom);
    }

    addControl(control) {
        control.addTo(this.map);
    }

    removeControl(control) {
        this.map.removeControl(control);
    }
}