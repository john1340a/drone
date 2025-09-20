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

        this.isInitialized = true;
    }

    _setupEventListeners() {
        this._setupResponsiveEvents();
        this._setupLayerControl();
    }

    _setupLayerControl() {
        // Créer les fonds de carte pour le contrôle natif Leaflet
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;
        const baseMaps = {};

        Object.entries(baseMapsConfig).forEach(([key, config]) => {
            baseMaps[config.name] = this.mapService.baseLayers[key];
        });

        // Créer les couches overlay
        const overlayMaps = {};
        const droneLayer = this.layerService.getDroneRestrictionsLayer();
        overlayMaps["🛡️ Restrictions Drones (IGN)"] = droneLayer;

        // Ajouter le gestionnaire de couches natif Leaflet
        this.layerControl = L.control.layers(baseMaps, overlayMaps, {
            position: 'topright',
            collapsed: true
        }).addTo(this.mapService.getMap());

        // Configuration du comportement hover pour desktop (avec délai)
        setTimeout(() => {
            this._setupLayerControlHover();
            this._replaceEmojisWithIcons();
        }, 200);
    }

    _setupLayerControlHover() {
        const controlContainer = this.layerControl.getContainer();

        if (!this._isMobileDevice()) {
            // Desktop: hover pour ouvrir/fermer
            controlContainer.addEventListener('mouseenter', () => {
                try {
                    // Vérifier si le contrôle est collapsed
                    if (!controlContainer.classList.contains('leaflet-control-layers-expanded')) {
                        this.layerControl.expand();
                    }
                } catch (error) {
                    // Fallback silencieux
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
                        // Fallback silencieux
                        console.debug('Layer control hover collapse error:', error);
                    }
                }, 100);
            });
        }
    }

    _isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    _replaceEmojisWithIcons() {
        const layerLabels = document.querySelectorAll('.leaflet-control-layers label span');
        layerLabels.forEach(label => {
            let text = label.textContent;

            if (text.includes('🛡️')) {
                text = text.replace('🛡️', '');
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'shield');
                icon.style.width = '14px';
                icon.style.height = '14px';
                icon.style.marginRight = '6px';
                icon.style.verticalAlign = 'middle';
                label.insertBefore(icon, label.firstChild);
            }

            label.lastChild.textContent = text.trim();
        });

        // Réinitialiser les icônes Lucide
        if (window.lucide) {
            lucide.createIcons();
        }
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
        // Créer une couche pour la minimap (OSM par défaut)
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

        // Retirer l'ancienne couche du minimap
        this.miniMap._miniMap.removeLayer(this.currentMiniMapLayer);

        // Créer une nouvelle couche identique pour le minimap basée sur le type de couche
        const baseMapsConfig = Config.LAYERS_CONFIG.baseMaps;

        if (newLayer._url && newLayer._url.includes('openstreetmap')) {
            // Couche OpenStreetMap
            this.currentMiniMapLayer = L.tileLayer(baseMapsConfig.osm.url, {
                attribution: '&copy; OSM contributors',
                maxZoom: 18
            });
        } else if (newLayer._url && newLayer._url.includes('stadiamaps')) {
            // Couche Satellite
            this.currentMiniMapLayer = L.tileLayer(baseMapsConfig.satellite.url, {
                attribution: '&copy; Stadia Maps',
                maxZoom: 20,
                ext: 'jpg'
            });
        } else {
            // Par défaut, utiliser OSM
            this.currentMiniMapLayer = L.tileLayer(baseMapsConfig.osm.url, {
                attribution: '&copy; OSM contributors',
                maxZoom: 18
            });
        }

        // Ajouter la nouvelle couche au minimap
        this.miniMap._miniMap.addLayer(this.currentMiniMapLayer);
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
}