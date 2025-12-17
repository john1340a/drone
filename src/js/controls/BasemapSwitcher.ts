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
                const container = L.DomUtil.create('div', 'leaflet-basemap-switcher leaflet-control');

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
        const nextBasemap = this.currentBasemap === 'osm' ? 'satellite' : 'osm';
        const imageSrc = nextBasemap === 'satellite' ? satelliteImage : osmImage;
        
        return `
            <div class="basemap-switcher-container single-toggle">
                <button class="basemap-toggle-btn" title="Changer de fond de carte">
                    <img src="${imageSrc}" alt="Switch Basemap" class="basemap-thumbnail" />
                </button>
            </div>
        `;
    }

    private _attachEvents(container: HTMLElement): void {
        const btn = container.querySelector('.basemap-toggle-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleBasemap(container);
            });
        }
    }

    private _toggleBasemap(container: HTMLElement): void {
        const nextBasemap = this.currentBasemap === 'osm' ? 'satellite' : 'osm';
        this._switchBasemap(nextBasemap, container);
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

        // Update Button Image
        const img = container.querySelector('.basemap-thumbnail') as HTMLImageElement;
        if (img) {
            const nextBasemap = this.currentBasemap === 'osm' ? 'satellite' : 'osm';
            img.src = nextBasemap === 'satellite' ? satelliteImage : osmImage;
        }

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
