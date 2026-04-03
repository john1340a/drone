import maplibregl from 'maplibre-gl';
import MapService from '../services/MapService';

declare global {
    interface Window {
        analyticsService?: any;
    }
}

import osmImage from '../../assets/images/osm.png';
import satelliteImage from '../../assets/images/satellite.png';

export default class BasemapSwitcher implements maplibregl.IControl {
    private mapService: MapService;
    private currentBasemap: string;
    private container: HTMLElement | null;
    private onSwitch: ((basemapKey: string) => void) | null;

    constructor(mapService: MapService, onSwitch?: (basemapKey: string) => void) {
        this.mapService = mapService;
        this.onSwitch = onSwitch || null;
        this.currentBasemap = 'jawg';
        this.container = null;
    }

    onAdd(_map: maplibregl.Map): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl basemap-switcher';

        this.container.innerHTML = this._getHTML();

        // Prevent map click propagation
        this.container.addEventListener('click', (e) => e.stopPropagation());
        this.container.addEventListener('dblclick', (e) => e.stopPropagation());

        setTimeout(() => {
            this._attachEvents();
        }, 0);

        return this.container;
    }

    onRemove(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }

    private _getHTML(): string {
        const nextBasemap = this.currentBasemap === 'jawg' ? 'satellite' : 'jawg';
        const imageSrc = nextBasemap === 'satellite' ? satelliteImage : osmImage;

        return `
            <button class="basemap-toggle-btn" title="Changer de fond de carte">
                <img src="${imageSrc}" alt="Switch Basemap" />
            </button>
        `;
    }

    private _attachEvents(): void {
        if (!this.container) return;
        const btn = this.container.querySelector('.basemap-toggle-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleBasemap();
            });
        }
    }

    private _toggleBasemap(): void {
        const nextBasemap = this.currentBasemap === 'jawg' ? 'satellite' : 'jawg';
        this._switchBasemap(nextBasemap);
    }

    private _switchBasemap(basemapKey: string): void {
        if (basemapKey === this.currentBasemap) return;

        this.mapService.setBaseLayer(basemapKey);
        this.currentBasemap = basemapKey;

        // Update thumbnail to show the OTHER basemap option
        if (this.container) {
            const img = this.container.querySelector('.basemap-thumbnail') as HTMLImageElement;
            if (img) {
                const nextBasemap = this.currentBasemap === 'jawg' ? 'satellite' : 'jawg';
                img.src = nextBasemap === 'satellite' ? satelliteImage : osmImage;
            }
        }

        if (this.onSwitch) {
            this.onSwitch(basemapKey);
        }

        if (window.analyticsService) {
            window.analyticsService.trackEvent('basemap_change', { basemap: basemapKey });
        }
    }
}
