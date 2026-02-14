import L from 'leaflet';
import 'leaflet-pmtiles-layer';

// Config unused
// import Config from '../config/config';

export default class LayerService {

    private _map: L.Map | null = null;

    constructor() {
    }

    setMap(map: L.Map): void {
        this._map = map;
    }

    createGeoJSONLayer(data: any, options: L.GeoJSONOptions = {}): L.GeoJSON {
        const defaultOptions: L.GeoJSONOptions = {
            style: this._getDefaultStyle(),
            onEachFeature: this._onEachFeature.bind(this)
        };

        return L.geoJSON(data, { ...defaultOptions, ...options });
    }

    private _getDefaultStyle(): L.PathOptions {
        return {
            color: '#ff0000',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        };
    }

    private _onEachFeature(feature: GeoJSON.Feature, layer: L.Layer): void {
        if (feature.properties) {
            const props = feature.properties as any;
            const popupContent = this._buildRestrictionPopupHTML(props);
            (layer as L.Path).bindPopup(popupContent, { className: 'restriction-popup-container' });
        }
    }

    // ── Shared logic: determine color, status, icon from properties ──
    // Color palette: Red (interdit), Orange (autorisation), Amber/Yellow (restreint), Steel Blue (>120m info)
    private _getRestrictionInfo(props: any): { colorCode: string; statusText: string; iconName: string } {
        const restriction = props.restriction || 'UNKNOWN';
        const type = props.type || '';
        const minH = props.min_height !== undefined ? Math.round(props.min_height) : null;
        const maxH = props.max_height !== undefined ? Math.round(props.max_height) : null;
        const maxRef = props.max_ref || 'AMSL';

        let colorCode = '#5b7fa5'; // Steel blue default
        let statusText = 'Zone Réglementée';
        let iconName = 'info';

        if (minH !== null && minH >= 120) {
            colorCode = '#5b7fa5'; // Steel blue — info only, not applicable to drones
            statusText = 'Restriction > 120m (non applicable)';
            iconName = 'cloud';
        } else if (restriction === 'PROHIBITED') {
            colorCode = '#c0392b'; // Red
            statusText = 'Vol Interdit';
            iconName = 'block';
        } else if (restriction === 'REQ_AUTHORISATION') {
            colorCode = '#e67e22'; // Orange 
            statusText = 'Autorisation Requise';
            iconName = 'lock';
        } else if (restriction === 'RESTRICTED' || restriction === 'CONDITIONAL') {
            colorCode = '#f39c12'; // Amber
            statusText = 'Restreint';
            iconName = 'warning';

            if (maxH !== null && maxRef === 'AGL') {
                if (maxH <= 30) { colorCode = '#d35400'; statusText = `Max ${maxH}m`; } // Dark orange
                else if (maxH <= 50) { colorCode = '#e67e22'; statusText = `Max ${maxH}m`; } // Orange
                else if (maxH < 120) { colorCode = '#f1c40f'; statusText = `Max ${maxH}m`; } // Yellow
            }
        } else {
            colorCode = '#5b7fa5'; // Steel blue
            statusText = 'Information';
            iconName = type === 'AERO' ? 'flight' : 'info';
        }

        return { colorCode, statusText, iconName };
    }

    // ── Shared logic: build popup HTML from properties ──
    private _buildRestrictionPopupHTML(props: any): string {
        const nom = props.nom || props.id || 'Zone UAS';
        const restriction = props.restriction || 'UNKNOWN';
        const type = props.type || '';
        const minH = props.min_height !== undefined ? Math.round(props.min_height) : null;
        const maxH = props.max_height !== undefined ? Math.round(props.max_height) : null;
        const maxRef = props.max_ref || 'AMSL';
        const message = props.message || props.otherReasonInfo || '';

        const { colorCode, statusText, iconName } = this._getRestrictionInfo(props);

        const limiteTxt = (minH !== null && maxH !== null)
            ? `${minH} - ${maxH}m ${maxRef}`
            : (maxH !== null ? `Max ${maxH}m ${maxRef}` : 'Voir détails');

        return `
            <div class="restriction-popup" style="min-width: 200px;">
                <div class="restriction-header" style="background: ${colorCode}; color: white; padding: 8px; border-radius: 4px 4px 0 0; font-weight: bold; display: flex; align-items: center;">
                    <span class="material-symbols-outlined" style="margin-right: 6px;">${iconName}</span>
                    ${statusText}
                </div>
                <div class="restriction-body" style="padding: 8px; background: rgba(255,255,255,0.95); border-radius: 0 0 4px 4px;">
                    <div style="margin-bottom: 6px;"><strong>Zone:</strong> ${nom} <span style="font-size:0.8em; color:#888;">(${props.id})</span></div>
                    <div style="margin-bottom: 6px;"><strong>Type:</strong> ${restriction} / ${type}</div>
                    <div style="margin-bottom: 6px;"><strong>Hauteur:</strong> ${limiteTxt}</div>
                    ${message ? `<div style="margin-bottom: 6px; font-size: 0.9em; color: #666; font-style: italic;">${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</div>` : ''}
                    <div style="font-size: 0.8em; color: #999; margin-top: 8px; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">description</span>
                        Source: SIA (ED-269)
                    </div>
                </div>
            </div>
        `;
    }

    // ── PMTiles layer for restrictions (vector tiles) ──
    async loadDroneRestrictionsPMTiles(pane?: string): Promise<L.Layer> {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        const url = `${baseUrl}data/restrictions_sia.pmtiles`;

        const self = this;

        // @ts-ignore - L.pmtilesLayer is added by leaflet-pmtiles-layer
        const layer = L.pmtilesLayer(url, {
            pane: pane || 'overlayPane',
            interactive: true,
            autoScale: 'pmtiles',
            vectorTileLayerStyles: {
                restrictions: (properties: any) => {
                    return self.getStyleFromProperties(properties);
                }
            },
            maxNativeZoom: 12, // Match tippecanoe max-zoom
            maxZoom: 18,       // Allow overzooming
        });

        // Bind click popup for vector tile features
        layer.on('click', (e: any) => {
            if (e.layer && e.layer.properties && self._map) {
                const props = e.layer.properties;
                const popupContent = self._buildRestrictionPopupHTML(props);
                L.popup({ className: 'restriction-popup-container' })
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(self._map);
            }
        });

        return layer;
    }

    // ── PMTiles layer for allowed zones (vector tiles) ──
    async loadAllowedZonesPMTiles(pane?: string): Promise<L.Layer> {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        const url = `${baseUrl}data/allowed_zones.pmtiles`;

        const self = this;

        // @ts-ignore - L.pmtilesLayer is added by leaflet-pmtiles-layer
        const layer = L.pmtilesLayer(url, {
            pane: pane || 'overlayPane',
            interactive: true,
            autoScale: 'pmtiles',
            style: {
                color: '#3498db',
                fillColor: '#3498db',
                fill: true,
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.15
            },
            maxNativeZoom: 10,
            maxZoom: 18,
        });

        // Bind click popup for allowed zones
        layer.on('click', (e: any) => {
            const popupContent = `
                <div class="restriction-popup" style="min-width: 220px;">
                    <div class="restriction-header" style="background: #3498db; color: white; padding: 8px; border-radius: 4px 4px 0 0; font-weight: bold; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="margin-right: 6px;">explore</span>
                        Hors zone réglementée SIA
                    </div>
                    <div class="restriction-body" style="padding: 8px; background: rgba(255,255,255,0.95); border-radius: 0 0 4px 4px;">
                        <div style="margin-bottom: 6px; display: flex; align-items: center;">
                            <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 4px; color: #666;">vertical_align_top</span>
                            <strong>Hauteur max:</strong> 120m
                        </div>
                        <div style="font-size: 0.9em; color: #666;">Catégorie Ouverte - A1/A2/A3</div>
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 6px; margin-top: 8px; font-size: 0.85em; display: flex; align-items: flex-start;">
                            <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px; color: #856404; flex-shrink: 0;">warning</span>
                            <span style="color: #856404;">Vérifiez les règles locales : <strong>survol de zones urbaines</strong>, propriétés privées, rassemblements de personnes.</span>
                        </div>
                        <div style="font-size: 0.8em; color: #999; margin-top: 8px; display: flex; align-items: center;">
                            <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">gavel</span>
                            Réglementation UE 2019/947
                        </div>
                    </div>
                </div>
            `;
            if (self._map) {
                L.popup({ className: 'restriction-popup-container' })
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(self._map);
            }
        });

        return layer;
    }

    // GeoJSON fallback loaders removed — PMTiles is the sole data path.


    async loadGeoJSONFromFile(filePath: string): Promise<L.GeoJSON> {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.createGeoJSONLayer(data);
        } catch (error) {
            console.error('Error loading GeoJSON file:', error);
            throw error;
        }
    }

    getStyleFromProperties(properties: any): L.PathOptions {
        const restriction = properties?.restriction || '';
        const maxH = properties?.max_height !== undefined ? Math.round(properties.max_height) : null;
        const maxRef = properties?.max_ref || 'AMSL';

        let color = '#888888';
        let fillOpacity = 0.15;

        const minH = properties?.min_height !== undefined ? Math.round(properties.min_height) : null;

        if (minH !== null && minH >= 120) {
            color = '#5b7fa5'; // Steel blue — info only
            fillOpacity = 0.15;
        } else if (restriction === 'PROHIBITED') {
            color = '#c0392b'; // Red
            fillOpacity = 0.4;
        } else if (restriction === 'REQ_AUTHORISATION') {
             color = '#e67e22'; // Orange
             fillOpacity = 0.3;
        } else if (restriction === 'RESTRICTED' || restriction === 'CONDITIONAL') {
             color = '#f39c12'; // Amber
             fillOpacity = 0.3;
             
             if (maxH !== null && maxRef === 'AGL') {
                if (maxH <= 30) { color = '#d35400'; fillOpacity = 0.4; } // Dark orange
                else if (maxH <= 50) { color = '#e67e22'; fillOpacity = 0.3; } // Orange
                else if (maxH <= 60) { color = '#f39c12'; fillOpacity = 0.25; } // Amber
                else { color = '#f1c40f'; fillOpacity = 0.15; } // Yellow
             }
        } else {
             color = '#5b7fa5'; // Steel blue
             fillOpacity = 0.15;
        }

        return {
            color: color,
            fillColor: color,
            fill: true,
            weight: 1,
            opacity: 0.8,
            fillOpacity: fillOpacity,
            dashArray: '3, 3'
        };
    }

    createStyledGeoJSONLayer(data: any, options: L.GeoJSONOptions = {}): L.GeoJSON {
        return L.geoJSON(data, {
            ...options,
            style: (feature: any) => {
                return this.getStyleFromProperties(feature?.properties);
            },
            onEachFeature: this._onEachFeature.bind(this)
        });
    }
}