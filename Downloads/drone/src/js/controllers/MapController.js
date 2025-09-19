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

        this.isInitialized = true;
    }

    _setupEventListeners() {
        this._setupBaseLayerControls();
        this._setupOverlayControls();
        this._setupMobileControls();
        this._setupResponsiveEvents();
    }

    _setupBaseLayerControls() {
        const baseLayerInputs = document.querySelectorAll('input[name="basemap"]');
        baseLayerInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.mapService.setBaseLayer(e.target.value);
                }
            });
        });

        const mobileBaseLayerInputs = document.querySelectorAll('input[name="mobile-basemap"]');
        mobileBaseLayerInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.mapService.setBaseLayer(e.target.value);

                    const desktopInput = document.querySelector(`input[name="basemap"][value="${e.target.value}"]`);
                    if (desktopInput) {
                        desktopInput.checked = true;
                    }
                }
            });
        });
    }

    _setupOverlayControls() {
        const droneRestrictionsCheckbox = document.getElementById('drone-restrictions');
        if (droneRestrictionsCheckbox) {
            droneRestrictionsCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this._loadDroneRestrictionsLayer();
                } else {
                    this.mapService.removeOverlayLayer('droneRestrictions');
                }
            });
        }
    }

    _setupMobileControls() {
        const toggleButton = document.getElementById('toggle-layers');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                $('.ui.sidebar').sidebar('toggle');
            });
        }
    }

    _setupResponsiveEvents() {
        window.addEventListener('resize', () => {
            this._handleResize();
        });
    }

    _setupUI() {
        $('.ui.accordion').accordion();
        $('.ui.checkbox').checkbox();
        $('.ui.sidebar').sidebar({
            context: 'body',
            dimPage: false,
            transition: 'push'
        });
    }

    _loadInitialLayers() {
        const droneRestrictionsCheckbox = document.getElementById('drone-restrictions');
        if (droneRestrictionsCheckbox && droneRestrictionsCheckbox.checked) {
            this._loadDroneRestrictionsLayer();
        }
    }

    _loadDroneRestrictionsLayer() {
        try {
            const droneLayer = this.layerService.getDroneRestrictionsLayer();
            this.mapService.addOverlayLayer('droneRestrictions', droneLayer);
        } catch (error) {
            console.error('Error loading drone restrictions layer:', error);
            this._showErrorMessage('Erreur lors du chargement de la couche des restrictions drones');
        }
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

        if (window.$ && $.fn.toast) {
            $('body').toast({
                class: 'error',
                message: message,
                showProgress: 'bottom'
            });
        }
    }

    _showSuccessMessage(message) {
        console.log(message);

        if (window.$ && $.fn.toast) {
            $('body').toast({
                class: 'success',
                message: message,
                showProgress: 'bottom'
            });
        }
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