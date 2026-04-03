import maplibregl from 'maplibre-gl';
import MapService from '../services/MapService';
import LayerService from '../services/LayerService';
import Config from '../config/config';
import WeatherService from '../services/WeatherService';
import BasemapSwitcher from '../controls/BasemapSwitcher';

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
    private miniMap: maplibregl.Map | null;

    constructor() {
        this.mapService = new MapService();
        this.layerService = new LayerService();
        this.weatherService = new WeatherService();
        this.isInitialized = false;
        this.miniMap = null;
    }

    initialize(): void {
        if (this.isInitialized) return;

        const map = this.mapService.initializeMap('map');

        map.on('load', () => {
            this._setupLayers();
            this._setupClickHandlers();
            this._setupUI();
            this._setupAnalyticsTracking();
        });

        this._setupResponsiveEvents();
        this.isInitialized = true;
    }

    // ── Layers ──

    private _setupLayers(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        this.layerService.setMap(map);
        this.layerService.addRestrictionLayers();
        this.layerService.addAllowedZonesLayers();
    }

    // ── Click handlers ──

    private _setupClickHandlers(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        map.on('mouseenter', 'restrictions-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'restrictions-fill', () => {
            map.getCanvas().style.cursor = '';
        });

        // Restriction click
        map.on('click', 'restrictions-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties;
            if (!props) return;

            new maplibregl.Popup({ className: 'restriction-popup-container', maxWidth: '340px' })
                .setLngLat(e.lngLat)
                .setHTML(this.layerService.buildRestrictionPopupHTML(props))
                .addTo(map);
        });

        // Fallback — "Vol Autorisé"
        map.on('click', (e) => {
            if (map.getZoom() < 5) return;

            const features = map.queryRenderedFeatures(e.point, { layers: ['restrictions-fill'] });
            if (features.length > 0) return;

            const html = `
                <div class="restriction-popup">
                    <div class="popup-header" style="background: #006FEE;">
                        <div class="popup-icon">
                            <span class="material-symbols-outlined">check_circle</span>
                        </div>
                        <span>Vol Autorisé</span>
                    </div>
                    <div class="popup-body">
                        <div class="popup-row">
                            <span class="popup-label">Hauteur max</span>
                            <span class="popup-value">120m AGL</span>
                        </div>
                        <div class="popup-row">
                            <span class="popup-label">Catégorie</span>
                            <span class="popup-value">Ouverte (A1/A2/A3)</span>
                        </div>
                    </div>
                    <div class="popup-warning">
                        <span class="material-symbols-outlined">warning</span>
                        <span>Respectez les règles : pas de survol de personnes, agglomérations ou sites sensibles.</span>
                    </div>
                    <div class="popup-footer">
                        <span class="material-symbols-outlined">gavel</span>
                        Réglementation Européenne
                    </div>
                    <a href="https://www.ecologie.gouv.fr/politiques-publiques/guides-exploitants-daeronefs"
                       target="_blank" rel="noopener" class="popup-link">
                        <span class="material-symbols-outlined">menu_book</span>
                        Guides exploitants DGAC
                    </a>
                </div>
            `;

            new maplibregl.Popup({ className: 'restriction-popup-container', maxWidth: '340px' })
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        });
    }

    // ── UI Controls ──

    private _setupUI(): void {
        // Top-left
        this._addTitleControl();
        this._addNavigationControl();
        this._addLocateControl();
        this._addSearchControl();

        // Top-right (order = top to bottom)
        this._addBasemapSwitcher();
        this._addLayerControl();
        this._addDomTomGeocoder();
        this._addWeatherWidget();

        // Bottom
        this._addScaleControl();
        this._addLegendControl();
        this._addMiniMapControl();
    }

    private _addBasemapSwitcher(): void {
        const map = this.mapService.getMap();
        if (!map) return;
        map.addControl(
            new BasemapSwitcher(this.mapService, (key) => this.syncMiniMapBasemap(key)),
            'top-right'
        );
    }

    private _addLayerControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const c = document.createElement('div');
                c.className = 'maplibregl-ctrl layer-control';
                c.innerHTML = `
                    <div class="layer-control-icon">
                        <span class="material-symbols-outlined">layers</span>
                    </div>
                    <div class="layer-control-panel">
                        <div class="layer-control-title">Couches</div>
                        <label>
                            <input type="checkbox" id="toggle-restrictions" checked />
                            <span class="layer-dot" style="background: #c0392b;"></span>
                            Restrictions
                        </label>
                        <label>
                            <input type="checkbox" id="toggle-allowed" checked />
                            <span class="layer-dot" style="background: #006FEE;"></span>
                            Zones Autorisées
                        </label>
                    </div>
                `;
                c.addEventListener('click', (e) => e.stopPropagation());

                // Toggle panel on icon click
                const icon = c.querySelector('.layer-control-icon');
                icon?.addEventListener('click', () => {
                    const isOpen = c.classList.toggle('expanded');
                    // Close DOM-TOM if open
                    if (isOpen) {
                        document.getElementById('domtom-select')?.classList.remove('active');
                    }
                });

                setTimeout(() => {
                    const tr = c.querySelector('#toggle-restrictions') as HTMLInputElement;
                    const ta = c.querySelector('#toggle-allowed') as HTMLInputElement;
                    tr?.addEventListener('change', () => {
                        this.layerService.setLayerVisibility(['restrictions-fill', 'restrictions-outline'], tr.checked);
                    });
                    ta?.addEventListener('change', () => {
                        this.layerService.setLayerVisibility(['allowed-fill', 'allowed-outline'], ta.checked);
                    });
                }, 0);

                return c;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'top-right');
    }

    private _addTitleControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const div = document.createElement('div');
                div.className = 'maplibregl-ctrl map-title-control';
                div.innerHTML = `
                    <span class="material-symbols-outlined">flight_takeoff</span>
                    Zones de vol Drone
                `;
                return div;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'top-left');
    }

    private _addNavigationControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    }

    private _addScaleControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    }

    private _addLegendControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const div = document.createElement('div');
                div.className = 'maplibregl-ctrl legend-control';
                div.innerHTML = `
                    <button class="legend-toggle" onclick="window.toggleLegend()">
                        <span class="material-symbols-outlined">info</span>
                    </button>
                    <div class="legend-header">Légende SIA</div>
                    <div class="legend-content">
                        <div class="legend-item highlight">
                            <span class="legend-dot" style="background: #006FEE;"></span>
                            <span>Hors zone SIA</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot" style="background: #c0392b;"></span>
                            <span>Interdit</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot" style="background: #e67e22;"></span>
                            <span>Autorisation requise</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot" style="background: #f39c12;"></span>
                            <span>Restreint / Conditionnel</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-dot" style="background: #5b7fa5;"></span>
                            <span>Info (&gt; 120m)</span>
                        </div>
                    </div>
                    <div class="legend-warning">
                        <span class="material-symbols-outlined">warning</span>
                        <span>Zones urbaines non cartographiées. Vérifiez les règles locales.</span>
                    </div>
                `;
                return div;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'bottom-left');

        window.toggleLegend = () => {
            const ctrl = document.querySelector('.legend-control');
            if (ctrl) ctrl.classList.toggle('expanded');
        };
    }

    private _addMiniMapControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const jawgToken = import.meta.env.VITE_JAWG_MAPS_API;
        const baseMaps = Config.LAYERS_CONFIG.baseMaps;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const container = document.createElement('div');
                container.className = 'maplibregl-ctrl minimap-container';
                container.style.cssText = 'width: 150px; height: 150px;';

                setTimeout(() => {
                    this.miniMap = new maplibregl.Map({
                        container,
                        style: {
                            version: 8,
                            sources: {
                                'jawg-mini': {
                                    type: 'raster',
                                    tiles: [`https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=${jawgToken}`],
                                    tileSize: 256, maxzoom: 22
                                },
                                'satellite-mini': {
                                    type: 'raster',
                                    tiles: baseMaps.satellite.tiles,
                                    tileSize: 256, maxzoom: baseMaps.satellite.maxzoom
                                }
                            },
                            layers: [
                                { id: 'jawg-mini-layer', type: 'raster', source: 'jawg-mini', layout: { visibility: 'visible' } },
                                { id: 'satellite-mini-layer', type: 'raster', source: 'satellite-mini', layout: { visibility: 'none' } }
                            ]
                        },
                        center: map.getCenter(),
                        zoom: Math.max(map.getZoom() - 5, 0),
                        interactive: false,
                        attributionControl: false
                    });

                    map.on('moveend', () => {
                        this.miniMap?.jumpTo({
                            center: map.getCenter(),
                            zoom: Math.max(map.getZoom() - 5, 0)
                        });
                    });
                }, 100);

                return container;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'bottom-right');
    }

    syncMiniMapBasemap(basemapKey: string): void {
        if (!this.miniMap) return;
        const isJawg = basemapKey !== 'satellite';
        this.miniMap.setLayoutProperty('jawg-mini-layer', 'visibility', isJawg ? 'visible' : 'none');
        this.miniMap.setLayoutProperty('satellite-mini-layer', 'visibility', isJawg ? 'none' : 'visible');
    }

    private _addLocateControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const geolocate = new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
            trackUserLocation: false
        });
        map.addControl(geolocate, 'top-left');

        const analytics = window.analyticsService;
        if (analytics) {
            geolocate.on('geolocate', () => analytics.trackGeolocation(true));
            geolocate.on('error', () => analytics.trackGeolocation(false));
        }
    }

    private _addSearchControl(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const container = document.createElement('div');
                container.className = 'maplibregl-ctrl geocoder-control';
                container.innerHTML = `
                    <div class="geocoder-wrapper">
                        <div class="geocoder-icon">
                            <span class="material-symbols-outlined">search</span>
                        </div>
                        <input type="text" id="geocoder-input" placeholder="${window.innerWidth <= 768 ? 'Rechercher...' : 'Rechercher une adresse...'}" />
                    </div>
                    <div class="geocoder-results" id="geocoder-results"></div>
                `;
                container.addEventListener('click', (e) => e.stopPropagation());

                setTimeout(() => {
                    const input = container.querySelector('#geocoder-input') as HTMLInputElement;
                    const results = container.querySelector('#geocoder-results') as HTMLElement;
                    if (!input || !results) return;

                    let timer: any;
                    input.addEventListener('input', () => {
                        clearTimeout(timer);
                        timer = setTimeout(async () => {
                            const q = input.value.trim();
                            if (q.length < 3) { results.style.display = 'none'; return; }
                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=fr,gp,mq,gf,re,yt`);
                                const data = await res.json();
                                if (data.length > 0) {
                                    results.innerHTML = data.map((r: any) =>
                                        `<div class="geocoder-result" data-bbox="${r.boundingbox}">${r.display_name}</div>`
                                    ).join('');
                                    results.style.display = 'block';
                                    results.querySelectorAll('.geocoder-result').forEach((el) => {
                                        el.addEventListener('click', () => {
                                            const bbox = el.getAttribute('data-bbox')!.split(',').map(Number);
                                            map.fitBounds([[bbox[2], bbox[0]], [bbox[3], bbox[1]]], { padding: 50 });
                                            results.style.display = 'none';
                                            input.value = el.textContent?.trim() || '';
                                        });
                                    });
                                } else { results.style.display = 'none'; }
                            } catch { results.style.display = 'none'; }
                        }, 400);
                    });

                    document.addEventListener('click', (e) => {
                        if (!container.contains(e.target as Node)) results.style.display = 'none';
                    });
                }, 0);

                return container;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'top-left');
    }

    private _addWeatherWidget(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const startCenter = map.getCenter();

        const control: maplibregl.IControl = {
            onAdd: () => {
                const c = document.createElement('div');
                c.className = 'maplibregl-ctrl weather-widget';
                c.innerHTML = `
                    <div class="weather-icon-container">
                        <span class="material-symbols-outlined">air</span>
                    </div>
                    <div class="weather-info">
                        <span class="weather-label">Vent</span>
                        <div class="weather-value">
                            <span id="wind-speed">--</span>
                            <span>km/h</span>
                        </div>
                    </div>
                    <div class="wind-direction" id="wind-direction-arrow">
                        <span class="material-symbols-outlined" style="font-size: 22px;">navigation</span>
                    </div>
                `;
                c.addEventListener('click', (e) => e.stopPropagation());
                return c;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'top-right');

        this._updateWeather(startCenter.lat, startCenter.lng);

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
                speedEl.textContent = Math.round(data.windSpeed).toString();
                arrowEl.style.transform = `rotate(${data.windDirection + 180}deg)`;

                widget.classList.remove('safe', 'warning', 'danger');
                if (data.isSafe) widget.classList.add('safe');
                else if (data.windGusts > 50) widget.classList.add('danger');
                else widget.classList.add('warning');
            }
        } catch (error) {
            console.warn('Weather update failed', error);
        }
    }

    private _addDomTomGeocoder(): void {
        const map = this.mapService.getMap();
        if (!map) return;

        const control: maplibregl.IControl = {
            onAdd: () => {
                const div = document.createElement('div');
                div.className = 'maplibregl-ctrl domtom-geocoder';
                div.innerHTML = `
                    <div class="custom-select" id="domtom-select">
                        <div class="select-trigger">
                            <span class="material-symbols-outlined" style="font-size: 20px;">public</span>
                            <span class="selected-text">Territoire</span>
                            <span class="dropdown-arrow material-symbols-outlined" style="font-size: 14px;">expand_more</span>
                        </div>
                        <div class="select-options">
                            <div class="select-option" data-value="metropole">
                                <img src="https://flagcdn.com/w40/fr.png" alt="France" class="flag-icon" />
                                <span class="option-text">Métropole</span>
                            </div>
                            <div class="select-option" data-value="antilles">
                                <img src="https://flagcdn.com/w40/mq.png" alt="Martinique" class="flag-icon" />
                                <span class="option-text">Antilles</span>
                            </div>
                            <div class="select-option" data-value="guyane">
                                <img src="https://flagcdn.com/w40/gf.png" alt="Guyane" class="flag-icon" />
                                <span class="option-text">Guyane</span>
                            </div>
                            <div class="select-option" data-value="reunion">
                                <img src="https://flagcdn.com/w40/re.png" alt="Réunion" class="flag-icon" />
                                <span class="option-text">Réunion</span>
                            </div>
                            <div class="select-option" data-value="mayotte">
                                <img src="https://flagcdn.com/w40/yt.png" alt="Mayotte" class="flag-icon" />
                                <span class="option-text">Mayotte</span>
                            </div>
                        </div>
                    </div>
                `;
                div.addEventListener('click', (e) => e.stopPropagation());
                setTimeout(() => this._setupCustomSelect(), 100);
                return div;
            },
            onRemove: () => {}
        };
        map.addControl(control, 'top-right');
    }

    private _setupCustomSelect(): void {
        const cs = document.getElementById('domtom-select');
        if (!cs) return;
        const trigger = cs.querySelector('.select-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = cs.classList.toggle('active');
            // Close layer control if open
            if (isOpen) {
                document.querySelector('.layer-control')?.classList.remove('expanded');
            }
        });

        cs.querySelectorAll('.select-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = opt.getAttribute('data-value');
                if (val) this.navigateToTerritory(val);
                cs.classList.remove('active');
            });
        });

        document.addEventListener('click', () => {
            cs.classList.remove('active');
            document.querySelector('.layer-control')?.classList.remove('expanded');
        });
    }

    navigateToTerritory(territoryKey: string): void {
        const territories = Config.DOMTOM_CONFIG;
        const territory = territories[territoryKey as keyof typeof territories];
        if (territory) {
            this.mapService.setView(territory.center, territory.zoom);
            window.analyticsService?.trackRegionChange(territory.name);
        }
    }

    // ── Utilities ──

    private _setupResponsiveEvents(): void {
        window.addEventListener('resize', () => this.mapService.getMap()?.resize());
    }

    private _setupAnalyticsTracking(): void {
        const map = this.mapService.getMap();
        const analytics = window.analyticsService;
        if (!analytics || !map) return;
        map.on('zoomend', () => {
            analytics.trackMapInteraction('zoom', { zoom: map.getZoom(), center: map.getCenter() });
        });
    }

    getMapService(): MapService { return this.mapService; }
    getLayerService(): LayerService { return this.layerService; }
}
