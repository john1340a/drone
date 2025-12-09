import L from 'leaflet';
import MapService from '../services/MapService';

declare global {
    interface Window {
        analyticsService?: any;
    }
}

import osmImage from '../../assets/images/osm.png';
import satelliteImage from '../../assets/images/satellite.png';

export default class BasemapSwitcher {
    private mapService: MapService;
    private baseMaps: Record<string, L.TileLayer>;
    private currentBasemap: string;
    private control: L.Control | null;

    constructor(mapService: MapService, baseMaps: Record<string, L.TileLayer>) {
        this.mapService = mapService;
        this.baseMaps = baseMaps;
        this.currentBasemap = 'osm';
        this.control = null;
    }

    createControl(): L.Control {
        const BasemapControl = L.Control.extend({
            options: {
                position: 'topright'
            },

            onAdd: (_map: L.Map) => {
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

    private _getHTML(): string {
        // Note: src path should be resolved correctly by Vite if assets are in public or imported
        // Ideally we should import images, but sticking to paths for now.
        return `
            <div class="basemap-switcher-container">
                <a class="basemap-toggle-link leaflet-basemap-toggle" href="#" title="Fonds de carte">
                    <span class="basemap-toggle-icon"></span>
                </a>
                <div class="basemap-options">
                    <div class="basemap-option ${this.currentBasemap === 'osm' ? 'active' : ''}"
                         data-basemap="osm">
                        <img src="${osmImage}" alt="OSM" class="basemap-thumbnail" />
                        <div class="basemap-label">OSM</div>
                    </div>
                    <div class="basemap-option ${this.currentBasemap === 'satellite' ? 'active' : ''}"
                         data-basemap="satellite">
                        <img src="${satelliteImage}" alt="Satellite" class="basemap-thumbnail" />
                        <div class="basemap-label">Satellite</div>
                    </div>
                </div>
            </div>
        `;
        // WARNING: src/assets/images path might break in production build if not handled by Vite/public folder. 
        // Vite handles paths relative to root in dev, but in build it expects imports or public dir.
        // Assuming assets are in public/ or src/assets and accessed via URL.
    }

    private _attachEvents(container: HTMLElement): void {
        const options = container.querySelectorAll('.basemap-option');
        const toggleLink = container.querySelector('.basemap-toggle-link') as HTMLElement;
        const basemapContainer = container.querySelector('.basemap-switcher-container');

        // Gérer les clics sur les options de basemap
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const basemapKey = option.getAttribute('data-basemap');
                if (basemapKey) {
                    this._switchBasemap(basemapKey, container);
                }

                // Sur mobile, fermer après sélection
                if (this._isMobile() && basemapContainer) {
                    basemapContainer.classList.remove('expanded');
                }
            });
        });

        // Gérer le toggle sur mobile uniquement
        if (toggleLink && this._isMobile() && basemapContainer) {
            toggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                basemapContainer.classList.toggle('expanded');
            });
        }
    }

    private _isMobile(): boolean {
        return window.innerWidth <= 768;
    }

    private _switchBasemap(basemapKey: string, container: HTMLElement): void {
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

    addTo(map: L.Map): this {
        if (this.control) {
            this.control.addTo(map);
        }
        return this;
    }
}
