import '../leaflet-setup';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-minimap';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
// import 'leaflet.locatecontrol'; 
import * as LocateControlModule from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-velocity';
import 'leaflet-velocity/dist/leaflet-velocity.css';

// Manual registration attempt 3
// @ts-ignore
if (LocateControlModule) {

     
     // Check for various UMD export patterns
     // @ts-ignore
     const LocateClass = LocateControlModule.LocateControl || LocateControlModule.default || LocateControlModule;
     
     if (typeof LocateClass === 'function' && !(L.Control as any).Locate) {
        // @ts-ignore
        L.Control.Locate = LocateClass;
        // @ts-ignore
        L.control.locate = function (options) {
            // @ts-ignore
            return new LocateClass(options);
        };

     }
}

import MapService from '../services/MapService';
import LayerService from '../services/LayerService';
import Config from '../config/config';
import WeatherService from '../services/WeatherService';
import RestrictionInfoService from '../services/RestrictionInfoService';
import BasemapSwitcher from '../controls/BasemapSwitcher';

declare const lucide: any;

declare global {
    interface Window {
        toggleLegend?: () => void;
        analyticsService?: any;
    }
}

export default class MapController {
    private mapService: MapService;
    private layerService: LayerService;
    private weatherService: WeatherService;
    private isInitialized: boolean;
    private basemapSwitcher: BasemapSwitcher | null;
    private layerControl: L.Control.Layers | null;
    private miniMap: any;
    private currentMiniMapLayer: L.Layer | null;
    private restrictionInfoService: RestrictionInfoService;
    private _droneLayer: L.GeoJSON | null = null;

    constructor() {
        this.mapService = new MapService();
        this.layerService = new LayerService();
        this.weatherService = new WeatherService();
        this.isInitialized = false;
        this.basemapSwitcher = null;
        this.layerControl = null;
        this.miniMap = null;
        this.currentMiniMapLayer = null;
        this.restrictionInfoService = new RestrictionInfoService();
    }

    initialize(): void {
        if (this.isInitialized) {
            console.warn('MapController already initialized');
            return;
        }

        this.mapService.initializeMap('map');
        this._setupEventListeners();
        this._loadInitialLayers();
        this._setupUI();
        this._setupTileErrorHandling();
        this._initializeLucideIcons();
        this._setupAnalyticsTracking();

        this.isInitialized = true;
    }

    private _setupAnalyticsTracking(): void {
        const map = this.mapService.getMap();
        const analytics = window.analyticsService;

        if (!analytics || !map) return;

        // Track les zoom
        map.on('zoomend', () => {
            const zoom = map.getZoom();
            const center = map.getCenter();
            analytics.trackMapInteraction('zoom', {
                zoom: zoom,
                center: center
            });
        });

        // Track les changements de fond de carte
        map.on('baselayerchange', (e: any) => {
            analytics.trackBaseMapChange(e.name);
        });

        // Track l'activation/désactivation des overlays
        map.on('overlayadd', (e: any) => {
            analytics.trackLayerToggle(e.name, true);
        });

        map.on('overlayremove', (e: any) => {
            analytics.trackLayerToggle(e.name, false);
        });
    }

    private _setupEventListeners(): void {
        this._setupResponsiveEvents();
        this._setupLayerControl();
        this._setupRestrictionClickHandler();
    }

    private _setupLayerControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        // Custom Panes for Strict Ordering
        // Create only if they don't exist to avoid errors on potential re-runs
        if (!map.getPane('allowedPane')) {
            map.createPane('allowedPane');
            map.getPane('allowedPane')!.style.zIndex = '400';
        }
        
        if (!map.getPane('restrictionPane')) {
            map.createPane('restrictionPane');
            map.getPane('restrictionPane')!.style.zIndex = '450';
        }

        // Créer le sélecteur visuel de fond de carte (topright)
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;
        const baseMaps: Record<string, L.TileLayer> = {};

        const serviceBaseLayers = (this.mapService as any)['baseLayers'];
        Object.entries(baseMapsConfig).forEach(([key]) => {
             if (serviceBaseLayers[key]) {
                 baseMaps[key] = serviceBaseLayers[key];
             }
        });

        this.basemapSwitcher = new BasemapSwitcher(this.mapService, baseMaps);
        this.basemapSwitcher.createControl().addTo(map);

        // Créer un contrôle séparé pour les overlays (topright, en dessous du basemap switcher)
        const overlayMaps: Record<string, L.Layer> = {};
        
        this.layerControl = L.control.layers(undefined, overlayMaps, {
            position: 'topright',
            collapsed: true
        }).addTo(map);

        // Async load drone layer
        this.loadDroneLayer(); 

        // Configuration du comportement hover pour desktop
        setTimeout(() => {
            this._setupLayerControlHover();
        }, 200);
    }

    private async loadDroneLayer(): Promise<void> {
        const map = this.mapService.getMap();
        if (!map) return;

        try {
            // Load allowed zones FIRST (pane: allowedPane)
            // We pass the pane via options, requires LayerService update to accept options or we set it here if LayerService returns a GeoJSON layer that we can mutate.
            // LayerService.loadAllowedZonesLayer returns Promise<L.GeoJSON>.
            // We can set the pane using options in the L.geoJSON call inside LayerService, OR here.
            // BUT L.geoJSON options are set at creation. Resetting pane after creation iterates layers.
            // Best to pass pane name to LayerService methods.
            
            // Let's assume we modify LayerService to accept an options object or string.
            // Or simpler: iterate and set pane.
            
            const allowedLayer = await this.layerService.loadAllowedZonesLayer({ pane: 'allowedPane' });
            if (allowedLayer) {
                allowedLayer.addTo(map); // Will check options.pane
                this.layerControl?.addOverlay(allowedLayer, "Zones Autorisées");
            }

            // Load restrictions on top (pane: restrictionPane)
            this._droneLayer = await this.layerService.loadDroneRestrictionsLayer({ pane: 'restrictionPane' });
            if (this._droneLayer) {
                this.layerControl?.addOverlay(this._droneLayer, "Restrictions");
                this._droneLayer.addTo(map);
                this._droneLayer.bringToFront(); // Ensure it's top within its pane
            }
        } catch (error) {
            console.error("Failed to load drone layers:", error);
        }
    }

    private _setupLayerControlHover(): void {
        if (!this.layerControl) return;
        
        const controlContainer = this.layerControl.getContainer();
        if (!controlContainer) return;

        if (!this._isMobileDevice()) {
            controlContainer.addEventListener('mouseenter', () => {
                try {
                    // Check if class list implies collapsed state, but leaflet API is safer
                    if (!controlContainer.classList.contains('leaflet-control-layers-expanded') && this.layerControl) {
                        this.layerControl.expand();
                    }
                } catch (error) {
                    console.debug('Layer control hover expand error:', error);
                }
            });

            controlContainer.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    try {
                        if (!controlContainer.matches(':hover') && this.layerControl) {
                            this.layerControl.collapse();
                        }
                    } catch (error) {
                        console.debug('Layer control hover collapse error:', error);
                    }
                }, 100);
            });
        }
    }

    private _isMobileDevice(): boolean {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private _setupResponsiveEvents(): void {
        window.addEventListener('resize', () => {
            this._handleResize();
        });
    }

    /**
     * Setup click handler for restriction zone info popups.
     */
    private _setupRestrictionClickHandler(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        map.on('click', async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const zoom = map.getZoom();

            // Only query if zoom is high enough for meaningful detail
            if (zoom < 8) return;

            try {
                const info = this.restrictionInfoService.getRestrictionInfo(lat, lng, this._droneLayer as L.GeoJSON);

            if (!info) {
                 return; 
            }
            
            // Create popup content
            const popupContent = `
                <div class="ui card restriction-popup">
                    <div class="content">
                        <div class="header" style="color: ${this._getColorCode(info.color)}">
                            <i class="exclamation triangle icon"></i>
                            ${info.maxHeight !== null ? `Max: ${info.maxHeight}m` : 'VOL INTERDIT'}
                        </div>
                        <div class="meta">
                            <span class="category">${info.zoneType}</span>
                        </div>
                        <div class="description">
                            ${info.description}
                        </div>
                    </div>
                    <div class="extra content">
                         <i class="file alternate outline icon"></i>
                         ${info.legislation}
                    </div>
                </div>
            `;        
                L.popup({ className: 'restriction-popup-container' })
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(map);

            } catch (error) {
                console.warn('Failed to get restriction info:', error);
            }
        });
    }

    private _setupUI(): void {
        this._addMapControls();
    }

    private _addMapControls(): void {
        this._addTitleControl();
        this._addZoomControl();
        this._addScaleControl();
        this._addLegendControl();
        this._addMiniMapControl();
        this._addLocateControl();
        this._addDomTomGeocoder();
        this._addSearchControl();
        this._addWeatherWidget();
    }

    private _addWeatherWidget(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const startCenter = map.getCenter();
        
        // Custom Control
        const weatherControl = new L.Control({ position: 'topright' });

        weatherControl.onAdd = () => {
            const container = L.DomUtil.create('div', 'weather-widget');
            container.innerHTML = `
                <div class="weather-icon-container">
                    <i data-lucide="wind" class="weather-icon"></i>
                </div>
                <div class="weather-info">
                    <span class="weather-label">Vent</span>
                    <div class="weather-value">
                        <span id="wind-speed">--</span> <span>km/h</span>
                    </div>
                </div>
                <div class="wind-direction" id="wind-direction-arrow">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="wind-arrow-icon">
                        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                    </svg>
                </div>
            `;
            
            // Prevent map interaction when clicking the widget
            L.DomEvent.disableClickPropagation(container);
            return container;
        };

        weatherControl.addTo(map);

        // Initial Fetch
        this._updateWeather(startCenter.lat, startCenter.lng);
        // Initialize Layer ONCE for fluidity
        this._initWindLayer(startCenter.lat, startCenter.lng);

        // Update on move (debounced) - Widget ONLY
        let timeout: any;
        map.on('moveend', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const center = map.getCenter();
                this._updateWeather(center.lat, center.lng);
            }, 1000);
        });
    }

    private async _updateWeather(lat: number, lng: number): Promise<void> {
        try {
            const data = await this.weatherService.getCurrentWind(lat, lng);
            
            const widget = document.querySelector('.weather-widget');
            const speedEl = document.getElementById('wind-speed');
            const arrowEl = document.getElementById('wind-direction-arrow');

            if (widget && speedEl && arrowEl) {
                // Update Value
                speedEl.textContent = Math.round(data.windSpeed).toString();

                // Update Direction Rotation
                // OpenMeteo gives direction in degrees (0 = North, 90 = East)
                // The icon (navigation) usually points Up (North).
                // We rotate it by direction + 180 to point IN THE DIRECTION OF FLOW (Destination),
                // matching the particle layer movement, instead of pointing into the wind (Source).
                arrowEl.style.transform = `rotate(${data.windDirection + 180}deg)`;

                // Update Safety Status
                widget.classList.remove('safe', 'warning', 'danger');
                if (data.isSafe) {
                    widget.classList.add('safe');
                } else if (data.windGusts > 50) {
                     widget.classList.add('danger');
                } else {
                     widget.classList.add('warning');
                }
                
                // Refresh icons in case of dynamic update
                // Refresh icons in case of dynamic update
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                // Note: We do NOT update the wind layer here to maintain fluidity.
                const map = this.mapService.getMap();
                if (map && this._lastWindGridCenter) {
                     const currentCenter = L.latLng(lat, lng);
                     const dist = map.distance(this._lastWindGridCenter, currentCenter);
                     if (dist > 500000) { // 500km threshold
                         this._initWindLayer(lat, lng);
                     }
                }
            }
        } catch (error) {
            console.warn('Weather update failed', error);
        }
    }

    private _windLayer: any = null;
    private _lastWindGridCenter: L.LatLng | null = null;

    /**
     * Initializes the visual wind layer with a static "Regional" field.
     * We do NOT update this on move/zoom to ensure 60fps fluidity (Canvas panning).
     * We creates a massive grid (France-wide) based on the initial fetch.
     */
    private async _initWindLayer(lat: number, lng: number): Promise<void> {
        const map = this.mapService.getMap();
        if (!map) return;
        
        this._lastWindGridCenter = L.latLng(lat, lng);
        
        // Use existing state to check visibility before removal
        const isLayerActive = this._windLayer && map.hasLayer(this._windLayer);

        // CLEANUP: Remove strict reference to existing layer from map AND control
        if (this._windLayer) {
            map.removeLayer(this._windLayer);
            if (this.layerControl) {
                this.layerControl.removeLayer(this._windLayer);
            }
            this._windLayer = null;
        }

        try {
            // Get initial condition for the field generation
            const data = await this.weatherService.getCurrentWind(lat, lng);
            
            // Generate a huge field (covering +/- 10 degrees) to allow panning without regeneration
            // This is a "Visual Approximation" for the 'Wow' effect.
            const windField = this.weatherService.generateWindField(lat, lng, data.windSpeed, data.windDirection);

            // @ts-ignore
            this._windLayer = L.velocityLayer({
                displayValues: false,
                displayOptions: {
                    velocityType: 'Vent Global',
                    position: 'bottomleft',
                    emptyString: 'Pas de données de vent',
                    angleConvention: 'bearingCW',
                    displayPosition: 'bottomleft',
                    displayEmptyString: 'No wind data',
                    speedUnit: 'km/h'
                },
                data: windField,
                maxVelocity: 40,
                velocityScale: 0.01 // Fine tune for visuals
            });

            if (this.layerControl) {
                this.layerControl.addOverlay(this._windLayer, "Météo");
            }

            // Persistence: If it was active, add the new one back to the map
            // If it's the very first init (isLayerActive false), we don't auto-add it (user must toggle)
            // UNLESS the user wants it by default? In step 1475/1449 user implied "je dois l'activer".
            // So default is off. But if I switch territory, I want it to STAY on if it was on.
            if (isLayerActive) {
                this._windLayer.addTo(map);
            }

        } catch (e) {
            console.warn('Failed to init wind visuals', e);
        }
    }

    private _addSearchControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        // @ts-ignore
        L.Control.geocoder({
            defaultMarkGeocode: false,
            position: 'topleft',
            placeholder: 'Rechercher une adresse...'
        })
        .on('markgeocode', function(e: any) {
            const bbox = e.geocode.bbox;
            const poly = L.polygon([
                bbox.getSouthEast(),
                bbox.getNorthEast(),
                bbox.getNorthWest(),
                bbox.getSouthWest()
            ]);
            map.fitBounds(poly.getBounds());
        })
        .addTo(map);
    }

    private _addZoomControl(): void {
        const map = this.mapService.getMap();
        if (map) {
            L.control.zoom({
                position: 'topleft'
            }).addTo(map);
        }
    }

    private _addTitleControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const titleControl = new L.Control({position: 'topleft'});

        titleControl.onAdd = function (_map) {
            const div = L.DomUtil.create('div', 'map-title-control');
            div.innerHTML = `
                <i data-lucide="map-pin" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;"></i>
                Zones de Restrictions Drone
            `;
            return div;
        };

        titleControl.addTo(map);
    }

    private _getColorCode(colorKey: string): string {
        const colors: Record<string, string> = {
            'RED': '#db2828',
            'ORANGE': '#f2711c',
            'YELLOW': '#fbbd08',
            'YELLOW_ORANGE': '#fce205',
            'BLUE': '#3498db', // New Info Color
            'GREEN': '#21ba45', // Added Green 
            'UNKNOWN': '#767676'
        };
        // Update mapping to return BLUE for Info default if needed, 
        // strictly speaking _onEachFeature passes the hex directly to popup, 
        // but this helper might be used if we pass keys. 
        // Actually _onEachFeature uses hex vars. 
        // But let's keep this clean.
        return colors[colorKey] || colors['UNKNOWN'];
    }

    private _addScaleControl(): void {
        const map = this.mapService.getMap();
        if (map) {
            L.control.scale({
                position: 'bottomleft',
                metric: true,
                imperial: false
            }).addTo(map);
        }
    }

    private _addLegendControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const legend = new L.Control({position: 'bottomleft'});

        legend.onAdd = function (_map) {
            const div = L.DomUtil.create('div', 'info legend');

            div.innerHTML = `
                <button class="legend-toggle" onclick="window.toggleLegend()">
                    <span class="material-symbols-outlined" style="font-size: 20px;">info</span>
                </button>
                <div class="legend-content">
                    <h4>Légende (SIA)</h4>
                    <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 6px; background: rgba(52,152,219,0.1); border-radius: 4px;">
                        <span class="material-symbols-outlined" style="color:#3498db; margin-right: 6px;">check_circle</span>
                        <span><strong>Autorisé (Max 120m)</strong></span>
                    </div>
                    
                    <div style="display: flex; align-items: center; margin: 4px 0;">
                        <span class="material-symbols-outlined" style="color:#b22222; margin-right: 6px;">block</span>
                        <span><strong>Interdit / Max 30m</strong></span>
                    </div>

                    <div style="display: flex; align-items: center; margin: 4px 0;">
                        <span class="material-symbols-outlined" style="color:#d35400; margin-right: 6px;">warning</span>
                        <span><strong>Restreint (Max 50m)</strong></span>
                    </div>

                    <div style="display: flex; align-items: center; margin: 4px 0;">
                        <span class="material-symbols-outlined" style="color:#21ba45; margin-right: 6px;">info</span>
                        <span><strong>Information</strong></span>
                    </div>
                </div>
            `;

            return div;
        };

        legend.addTo(map);

        window.toggleLegend = function() {
            const legendContent = document.querySelector('.legend-content');
            const legendToggle = document.querySelector('.legend-toggle');

            if (legendContent && legendToggle) {
                const isShowing = legendContent.classList.contains('show');

                if (isShowing) {
                    legendContent.classList.remove('show');
                    legendToggle.classList.remove('hidden');
                } else {
                    legendContent.classList.add('show');
                    legendToggle.classList.add('hidden');
                }
            }
        };
    }

    private _addMiniMapControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        // Créer une couche OSM pour la minimap
        const miniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OSM contributors',
            maxZoom: 18
        });

        // @ts-ignore - Leaflet MiniMap type definitions might be missing
        const miniMap = new L.Control.MiniMap(miniMapLayer, {
            position: 'bottomright',
            width: 150,
            height: 150,
            zoomLevelOffset: -5,
            toggleDisplay: true
        });

        miniMap.addTo(map);
        this.miniMap = miniMap;
        this.currentMiniMapLayer = miniMapLayer;

        map.on('baselayerchange', (e: any) => {
            this._updateMiniMapLayer(e.layer);
        });
    }

    private _updateMiniMapLayer(newLayer: any): void {
        if (!this.miniMap || !this.currentMiniMapLayer) return;

        try {
            this.miniMap._miniMap.removeLayer(this.currentMiniMapLayer);

            const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;

            if (newLayer._url && (newLayer._url.includes('arcgisonline.com') || newLayer._url.includes('satellite'))) {
                // @ts-ignore
                const satUrl = typeof baseMapsConfig.satellite.url === 'function' ? baseMapsConfig.satellite.url() : baseMapsConfig.satellite.url;
                this.currentMiniMapLayer = L.tileLayer(satUrl, {
                    attribution: '&copy; Esri',
                    maxZoom: 19
                });
            } else {
                this.currentMiniMapLayer = L.tileLayer(baseMapsConfig.osm.url, {
                    attribution: '&copy; OSM contributors',
                    maxZoom: 18
                });
            }

            this.miniMap._miniMap.addLayer(this.currentMiniMapLayer);
        } catch (error) {
            console.warn('Erreur lors de la mise à jour du minimap:', error);
        }
    }

    private _addLocateControl(): L.Control | undefined {
        const map = this.mapService.getMap();
        const analytics = window.analyticsService;

        if (!map) return;

        // @ts-ignore
        const locateControl = L.control.locate({
            position: 'topleft',
            strings: {
                title: "Me géolocaliser",
                popup: "Vous êtes dans un rayon de {distance} {unit} de ce point",
                outsideMapBoundsMsg: "Vous semblez être en dehors des limites de la carte"
            },
            locateOptions: {
                maxZoom: 16,
                watch: false,
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 15000
            },
            onLocationError: function(err: any) {
                console.warn('Erreur de géolocalisation:', err.message);
                let userMessage = '';
                if (err.code === 1) userMessage = 'Veuillez autoriser la géolocalisation dans les réglages de votre navigateur';
                else if (err.code === 2) userMessage = 'Position indisponible. Vérifiez votre connexion GPS';
                else if (err.code === 3) userMessage = 'La géolocalisation prend trop de temps. Réessayez';
                else userMessage = 'Impossible d\'obtenir votre position';

                if (console) console.info('Géolocalisation:', userMessage);
            }
        }).addTo(map);

        if (analytics) {
            map.on('locationfound', () => {
                analytics.trackGeolocation(true);
            });

            map.on('locationerror', (e: any) => {
                analytics.trackGeolocation(false);
                console.debug('Location error:', e.message);
            });
        }

        return locateControl;
    }

    private _initializeLucideIcons(): void {
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            this._setupClickOutsideToClose();
        }, 500);
    }

    private _setupClickOutsideToClose(): void {
        if (window.innerWidth <= 768) {
            document.addEventListener('click', function(e) {
                const legendControl = document.querySelector('.info.legend');
                const legendContent = document.querySelector('.legend-content');
                const legendToggle = document.querySelector('.legend-toggle');

                if (legendContent && legendContent.classList.contains('show') &&
                    legendControl && !legendControl.contains(e.target as Node)) {

                    legendContent.classList.remove('show');
                    if (legendToggle) {
                        legendToggle.classList.remove('hidden');
                    }
                }
            });
        }
    }

    private _loadInitialLayers(): void {
        // Init logic for layers if any
    }

    private _setupTileErrorHandling(): void {
        const map = this.mapService.getMap();
        if (map) {
            map.on('tileerror', function(_e) {
                // Silent error
            });
        }
    }

    async loadGeoJSONLayer(filePath: string, layerKey: string): Promise<L.GeoJSON> {
        try {
            const layer = await this.layerService.loadGeoJSONFromFile(filePath);
            this.mapService.addOverlayLayer(layerKey, layer);
            return layer;
        } catch (error) {
            console.error(`Error loading GeoJSON layer from ${filePath}:`, error);
            this._showErrorMessage(`Erreur lors du chargement du fichier ${filePath}`);
            throw error;
        }
    }

    private _handleResize(): void {
        const map = this.mapService.getMap();
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }

    private _showErrorMessage(message: string): void {
        console.error(message);
    }



    getMapService(): MapService {
        return this.mapService;
    }

    getLayerService(): LayerService {
        return this.layerService;
    }

    centerMapOnLocation(lat: number, lng: number, zoom: number = 15): void {
        this.mapService.setView([lat, lng], zoom);
    }

    fitMapToBounds(bounds: L.LatLngBoundsExpression): void {
        this.mapService.fitBounds(bounds);
    }

    private _addDomTomGeocoder(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const geocoderControl = new L.Control({position: 'topright'});

        geocoderControl.onAdd = (_map) => {
            const div = L.DomUtil.create('div', 'domtom-geocoder');
            div.innerHTML = `
                <div class="custom-select" id="domtom-select">
                    <div class="select-trigger">
                        <span class="selected-option">🌍</span>
                        <i class="dropdown-arrow">▼</i>
                    </div>
                    <div class="select-options">
                        <div class="select-option" data-value="metropole">
                            <img src="https://flagcdn.com/w40/fr.png" alt="France" class="flag-icon">
                            <span class="option-text">Métropole</span>
                        </div>
                        <div class="select-option" data-value="antilles">
                            <img src="https://flagcdn.com/w40/mq.png" alt="Martinique" class="flag-icon">
                            <span class="option-text">Antilles</span>
                        </div>
                        <div class="select-option" data-value="guyane">
                            <img src="https://flagcdn.com/w40/gf.png" alt="Guyane" class="flag-icon">
                            <span class="option-text">Guyane</span>
                        </div>
                        <div class="select-option" data-value="reunion">
                            <img src="https://flagcdn.com/w40/re.png" alt="Réunion" class="flag-icon">
                            <span class="option-text">Réunion</span>
                        </div>
                        <div class="select-option" data-value="mayotte">
                            <img src="https://flagcdn.com/w40/yt.png" alt="Mayotte" class="flag-icon">
                            <span class="option-text">Mayotte</span>
                        </div>
                    </div>
                </div>
            `;
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            return div;
        };

        geocoderControl.addTo(map);

        setTimeout(() => {
            this._setupCustomSelect();
        }, 100);
    }

    private _setupCustomSelect(): void {
        const customSelect = document.getElementById('domtom-select');
        if (!customSelect) return;

        const trigger = customSelect.querySelector('.select-trigger');
        const selectOptions = customSelect.querySelectorAll('.select-option');

        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('active');
        });

        selectOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');

                if (value) {
                    this.navigateToTerritory(value);
                }

                const selectedIcon = trigger.querySelector('.selected-option');
                if (selectedIcon) selectedIcon.textContent = '🌍';
                customSelect.classList.remove('active');
            });
        });

        document.addEventListener('click', () => {
            customSelect.classList.remove('active');
        });
    }

    navigateToTerritory(territoryKey: string): void {
        const territories = Config.DOMTOM_CONFIG;
        // @ts-ignore
        const territory = territories[territoryKey];

        if (territory) {
            this.mapService.setView(territory.center as L.LatLngExpression, territory.zoom);
            if (window.analyticsService) {
                window.analyticsService.trackRegionChange(territory.name);
            }
        }
    }
}