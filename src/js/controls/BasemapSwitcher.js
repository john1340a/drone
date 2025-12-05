class BasemapSwitcher {
    constructor(mapService, baseMaps) {
        this.mapService = mapService;
        this.baseMaps = baseMaps;
        this.currentBasemap = 'osm';
        this.control = null;
    }

    createControl() {
        const BasemapControl = L.Control.extend({
            options: {
                position: 'topright'
            },

            onAdd: (map) => {
                const container = L.DomUtil.create('div', 'leaflet-basemap-switcher leaflet-bar leaflet-control');

                // Empêcher la propagation des événements de la carte
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                // Créer le contenu
                container.innerHTML = this._getHTML();

                // Ajouter les événements après insertion dans le DOM
                setTimeout(() => {
                    this._attachEvents(container);
                }, 0);

                return container;
            }
        });

        this.control = new BasemapControl();
        return this.control;
    }

    _getHTML() {
        return `
            <div class="basemap-switcher-container">
                <a class="basemap-toggle-link leaflet-basemap-toggle" href="#" title="Fonds de carte">
                    <span class="basemap-toggle-icon"></span>
                </a>
                <div class="basemap-options">
                    <div class="basemap-option ${this.currentBasemap === 'osm' ? 'active' : ''}"
                         data-basemap="osm">
                        <img src="src/assets/images/osm.png" alt="OSM" class="basemap-thumbnail" />
                        <div class="basemap-label">OSM</div>
                    </div>
                    <div class="basemap-option ${this.currentBasemap === 'satellite' ? 'active' : ''}"
                         data-basemap="satellite">
                        <img src="src/assets/images/satellite.png" alt="Satellite" class="basemap-thumbnail" />
                        <div class="basemap-label">Satellite</div>
                    </div>
                </div>
            </div>
        `;
    }

    _attachEvents(container) {
        const options = container.querySelectorAll('.basemap-option');
        const toggleLink = container.querySelector('.basemap-toggle-link');
        const basemapContainer = container.querySelector('.basemap-switcher-container');

        // Gérer les clics sur les options de basemap
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const basemapKey = option.getAttribute('data-basemap');
                this._switchBasemap(basemapKey, container);

                // Sur mobile, fermer après sélection
                if (this._isMobile()) {
                    basemapContainer.classList.remove('expanded');
                }
            });
        });

        // Gérer le toggle sur mobile uniquement
        if (toggleLink && this._isMobile()) {
            toggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                basemapContainer.classList.toggle('expanded');
            });
        }
    }

    _isMobile() {
        return window.innerWidth <= 768;
    }

    _switchBasemap(basemapKey, container) {
        if (basemapKey === this.currentBasemap) return;

        // Récupérer la nouvelle couche
        const newLayer = this.baseMaps[basemapKey];

        // Changer le fond de carte
        this.mapService.setBaseLayer(basemapKey);
        this.currentBasemap = basemapKey;

        // Déclencher l'événement baselayerchange pour la minimap
        const map = this.mapService.getMap();
        if (map && newLayer) {
            map.fire('baselayerchange', {
                layer: newLayer,
                name: basemapKey
            });
        }

        // Mettre à jour l'UI
        const options = container.querySelectorAll('.basemap-option');
        options.forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-basemap') === basemapKey) {
                opt.classList.add('active');
            }
        });

        // Track avec analytics si disponible
        if (window.analyticsService) {
            window.analyticsService.trackEvent('basemap_change', {
                basemap: basemapKey
            });
        }
    }

    addTo(map) {
        if (this.control) {
            this.control.addTo(map);
        }
        return this;
    }
}
