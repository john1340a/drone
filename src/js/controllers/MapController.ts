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
import BasemapSwitcher from '../controls/BasemapSwitcher';

declare const lucide: any;

declare global {
    interface Window {
        toggleLegend?: () => void;
    }
}

export default class MapController {
    private mapService: MapService;
    private layerService: LayerService;
    private isInitialized: boolean;
    private basemapSwitcher: BasemapSwitcher | null;
    private layerControl: L.Control.Layers | null;
    private miniMap: any;
    private currentMiniMapLayer: L.Layer | null;

    constructor() {
        this.mapService = new MapService();
        this.layerService = new LayerService();
        this.isInitialized = false;
        this.basemapSwitcher = null;
        this.layerControl = null;
        this.miniMap = null;
        this.currentMiniMapLayer = null;
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
    }

    private _setupLayerControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

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
        const droneLayer = this.layerService.getDroneRestrictionsLayer();
        overlayMaps["Restrictions Drones (IGN)"] = droneLayer;  // Sans emoji

        this.layerControl = L.control.layers(undefined, overlayMaps, {
            position: 'topright',
            collapsed: true
        }).addTo(map);

        // Enable by default
        droneLayer.addTo(map);

        // Configuration du comportement hover pour desktop
        setTimeout(() => {
            this._setupLayerControlHover();
        }, 200);
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
                    <i data-lucide="info" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i>
                </button>
                <div class="legend-content">
                    <h4>Légende</h4>
                    <i style="background:#ff0000"></i> Vol interdit <br>
                    <i style="background:#ff9999"></i> Hauteur maximale de vol de 30m <br>
                    <i style="background:#ffaa00"></i> Hauteur maximale de vol de 50m <br>
                    <i style="background:#ffdd00"></i> Hauteur maximale de vol de 60m <br>
                    <i style="background:#ffff00"></i> Hauteur maximale de vol de 100m <br>
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