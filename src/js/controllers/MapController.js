class MapController {
    constructor() {
        this.mapService = new MapService();
        this.layerService = new LayerService();
        this.isInitialized = false;
    }

    initialize() {
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

    _setupAnalyticsTracking() {
        const map = this.mapService.getMap();
        const analytics = window.analyticsService;

        if (!analytics) return;

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
        map.on('baselayerchange', (e) => {
            analytics.trackBaseMapChange(e.name);
        });

        // Track l'activation/désactivation des overlays
        map.on('overlayadd', (e) => {
            analytics.trackLayerToggle(e.name, true);
        });

        map.on('overlayremove', (e) => {
            analytics.trackLayerToggle(e.name, false);
        });
    }

    _setupEventListeners() {
        this._setupResponsiveEvents();
        this._setupLayerControl();
    }

    _setupLayerControl() {
        // Créer le sélecteur visuel de fond de carte (topright)
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;
        const baseMaps = {};

        Object.entries(baseMapsConfig).forEach(([key, config]) => {
            baseMaps[key] = this.mapService.baseLayers[key];
        });

        this.basemapSwitcher = new BasemapSwitcher(this.mapService, baseMaps);
        this.basemapSwitcher.createControl().addTo(this.mapService.getMap());

        // Créer un contrôle séparé pour les overlays (topright, en dessous du basemap switcher)
        const overlayMaps = {};
        const droneLayer = this.layerService.getDroneRestrictionsLayer();
        overlayMaps["Restrictions Drones (IGN)"] = droneLayer;  // Sans emoji

        // Contrôle Leaflet standard pour les overlays uniquement
        this.layerControl = L.control.layers(null, overlayMaps, {
            position: 'topright',
            collapsed: true
        }).addTo(this.mapService.getMap());

        // Configuration du comportement hover pour desktop (avec délai)
        setTimeout(() => {
            this._setupLayerControlHover();
        }, 200);
    }

    _setupLayerControlHover() {
        const controlContainer = this.layerControl.getContainer();

        if (!this._isMobileDevice()) {
            // Desktop: hover pour ouvrir/fermer
            controlContainer.addEventListener('mouseenter', () => {
                try {
                    if (!controlContainer.classList.contains('leaflet-control-layers-expanded')) {
                        this.layerControl.expand();
                    }
                } catch (error) {
                    console.debug('Layer control hover expand error:', error);
                }
            });

            controlContainer.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    try {
                        if (!controlContainer.matches(':hover')) {
                            this.layerControl.collapse();
                        }
                    } catch (error) {
                        console.debug('Layer control hover collapse error:', error);
                    }
                }, 100);
            });
        }
    }

    _isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    _setupResponsiveEvents() {
        window.addEventListener('resize', () => {
            this._handleResize();
        });
    }

    _setupUI() {
        this._addMapControls();
    }

    _addMapControls() {
        // Titre
        this._addTitleControl();

        // Contrôle de zoom repositionné
        this._addZoomControl();

        // Échelle
        this._addScaleControl();

        // Légende
        this._addLegendControl();

        // MiniMap
        this._addMiniMapControl();

        // Géolocalisation
        this._addLocateControl();

        // Navigation DOM-TOM avec geocoder
        this._addDomTomGeocoder();
    }

    _addZoomControl() {
        L.control.zoom({
            position: 'topleft'
        }).addTo(this.mapService.getMap());
    }

    _addTitleControl() {
        const titleControl = L.control({position: 'topleft'});

        titleControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'map-title-control');
            div.innerHTML = `
                <i data-lucide="map-pin" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;"></i>
                Zones de Restrictions Drone
            `;
            return div;
        };

        titleControl.addTo(this.mapService.getMap());
    }

    _addScaleControl() {
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.mapService.getMap());
    }

    _addLegendControl() {
        const legend = L.control({position: 'bottomleft'});

        legend.onAdd = function (map) {
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

        legend.addTo(this.mapService.getMap());

        // Fonction globale pour toggle la légende
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

    _addMiniMapControl() {
        // Créer une couche OSM pour la minimap
        const miniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OSM contributors',
            maxZoom: 18
        });

        const miniMap = new L.Control.MiniMap(miniMapLayer, {
            position: 'bottomright',
            width: 150,
            height: 150,
            zoomLevelOffset: -5,
            toggleDisplay: true
        });

        miniMap.addTo(this.mapService.getMap());
        this.miniMap = miniMap;
        this.currentMiniMapLayer = miniMapLayer;

        // Écouter les changements de fond de carte pour synchroniser la minimap
        this.mapService.getMap().on('baselayerchange', (e) => {
            this._updateMiniMapLayer(e.layer);
        });
    }

    _updateMiniMapLayer(newLayer) {
        if (!this.miniMap || !this.currentMiniMapLayer) return;

        try {
            // Retirer l'ancienne couche du minimap
            this.miniMap._miniMap.removeLayer(this.currentMiniMapLayer);

            // Créer une nouvelle couche identique pour le minimap basée sur le type de couche
            const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;

            if (newLayer._url && newLayer._url.includes('stadiamaps')) {
                // Couche Satellite
                const satUrl = typeof baseMapsConfig.satellite.url === 'function'
                    ? baseMapsConfig.satellite.url()
                    : baseMapsConfig.satellite.url;
                this.currentMiniMapLayer = L.tileLayer(satUrl, {
                    attribution: '&copy; Stadia Maps',
                    maxZoom: 20,
                    ext: 'jpg'
                });
            } else {
                // Couche OSM par défaut
                this.currentMiniMapLayer = L.tileLayer(baseMapsConfig.osm.url, {
                    attribution: '&copy; OSM contributors',
                    maxZoom: 18
                });
            }

            // Ajouter la nouvelle couche au minimap
            this.miniMap._miniMap.addLayer(this.currentMiniMapLayer);
        } catch (error) {
            console.warn('Erreur lors de la mise à jour du minimap:', error);
        }
    }

    _addLocateControl() {
        const map = this.mapService.getMap();
        const analytics = window.analyticsService;

        // Contrôle de géolocalisation
        const locateControl = L.control.locate({
            position: 'topleft',
            strings: {
                title: "Me géolocaliser",
                popup: "Vous êtes dans un rayon de {distance} {unit} de ce point",
                outsideMapBoundsMsg: "Vous semblez être en dehors des limites de la carte"
            },
            locateOptions: {
                maxZoom: 16,
                watch: true,
                enableHighAccuracy: true,
                maximumAge: 15000,
                timeout: 10000
            }
        }).addTo(map);

        // Track les événements de géolocalisation
        if (analytics) {
            map.on('locationfound', () => {
                analytics.trackGeolocation(true);
            });

            map.on('locationerror', () => {
                analytics.trackGeolocation(false);
            });
        }

        return locateControl;
    }

    _initializeLucideIcons() {
        // Initialiser les icônes Lucide après un délai pour s'assurer que tout est chargé
        setTimeout(() => {
            if (window.lucide) {
                lucide.createIcons();
            }
            this._setupClickOutsideToClose();
        }, 500);
    }

    _setupClickOutsideToClose() {
        if (window.innerWidth <= 768) {
            document.addEventListener('click', function(e) {
                const legendControl = document.querySelector('.info.legend');
                const legendContent = document.querySelector('.legend-content');
                const legendToggle = document.querySelector('.legend-toggle');

                // Si la légende est ouverte et qu'on clique en dehors
                if (legendContent && legendContent.classList.contains('show') &&
                    legendControl && !legendControl.contains(e.target)) {

                    legendContent.classList.remove('show');
                    if (legendToggle) {
                        legendToggle.classList.remove('hidden');
                    }
                }
            });
        }
    }

    _loadInitialLayers() {
        // Les couches sont maintenant gérées par le contrôle natif Leaflet
        // Pas besoin de logique spéciale ici
    }

    _setupTileErrorHandling() {
        // Gestion des erreurs de chargement des tuiles (silencieux)
        this.mapService.getMap().on('tileerror', function(e) {
            // Erreur silencieuse - pas d'affichage console
        });
    }

    async loadGeoJSONLayer(filePath, layerKey) {
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

    _handleResize() {
        if (this.mapService.getMap()) {
            setTimeout(() => {
                this.mapService.getMap().invalidateSize();
            }, 100);
        }
    }

    _showErrorMessage(message) {
        console.error(message);
    }

    _showSuccessMessage(message) {
        console.log(message);
    }

    getMapService() {
        return this.mapService;
    }

    getLayerService() {
        return this.layerService;
    }

    centerMapOnLocation(lat, lng, zoom = 15) {
        this.mapService.setView([lat, lng], zoom);
    }

    fitMapToBounds(bounds) {
        this.mapService.fitBounds(bounds);
    }

    _addDomTomGeocoder() {
        const geocoderControl = L.control({position: 'topright'});

        geocoderControl.onAdd = (map) => {
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

            // Empêcher la propagation des événements
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);

            return div;
        };

        geocoderControl.addTo(this.mapService.getMap());

        // Ajouter l'event listener pour le dropdown personnalisé
        setTimeout(() => {
            this._setupCustomSelect();
        }, 100);
    }

    _setupCustomSelect() {
        const customSelect = document.getElementById('domtom-select');
        const trigger = customSelect.querySelector('.select-trigger');
        const options = customSelect.querySelector('.select-options');
        const selectOptions = customSelect.querySelectorAll('.select-option');

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('active');
        });

        // Handle option selection
        selectOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');

                if (value) {
                    this.navigateToTerritory(value);
                }

                // Reset à l'icône globe après navigation
                trigger.querySelector('.selected-option').textContent = '🌍';
                customSelect.classList.remove('active');
            });
        });

        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', () => {
            customSelect.classList.remove('active');
        });
    }

    navigateToTerritory(territoryKey) {
        const territories = Config.DOMTOM_CONFIG;
        const territory = territories[territoryKey];

        if (territory) {
            this.mapService.setView(territory.center, territory.zoom);

            // Track le changement de région
            if (window.analyticsService) {
                window.analyticsService.trackRegionChange(territory.name);
            }
        }
    }
}