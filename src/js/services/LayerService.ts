import L from 'leaflet';
import pmtilesVectorGrid from '../utils/PMTilesVectorGrid';




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

        // Use custom PMTiles adapter with Gzip support (fixes GitHub Pages & Firefox)
        const layer = pmtilesVectorGrid(url, {
            pane: pane || 'overlayPane',
            interactive: true,
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
                // Prevent bubbling to map click handler
                if (e.originalEvent) {
                    L.DomEvent.stopPropagation(e.originalEvent);
                }

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

        // Use custom PMTiles adapter with Gzip support
        const layer = pmtilesVectorGrid(url, {
            pane: pane || 'allowedPane',
            interactive: true,
            vectorTileLayerStyles: {
                restrictions: (properties: any) => {
                    return {
                        color: '#2ecc71',
                        weight: 1,
                        opacity: 0.5,
                        fillColor: '#2ecc71',
                        fill: true,
                        fillOpacity: 0.2
                    };
                }
            },
            maxNativeZoom: 10,
            maxZoom: 18,
        });

        // Bind click popup for allowed zones
        layer.on('click', (e: any) => {
            if (self._map) {
                // Prevent bubbling to map click handler
                if (e.originalEvent) {
                    L.DomEvent.stopPropagation(e.originalEvent);
                }

                const popupContent = self._buildAllowedZonePopupHTML();
                L.popup({ className: 'restriction-popup-container' })
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(self._map);
            }
        });

        return layer;
    }

    private _buildAllowedZonePopupHTML(): string {
        return `
            <div class="restriction-popup">
                <div class="restriction-header" style="background: #2ecc71; color: white; padding: 10px; border-radius: 4px 4px 0 0; font-weight: bold; display: flex; align-items: center;">
                    <span class="material-symbols-outlined" style="margin-right: 6px;">check_circle</span>
                    Vol Autorisé
                </div>
                <div class="restriction-body" style="padding: 12px; background: white; border-radius: 0 0 4px 4px;">
                    <div style="margin-bottom: 10px; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="font-size: 20px; margin-right: 8px; color: #27ae60;">vertical_align_top</span>
                        <strong>Hauteur max :</strong> 120m
                    </div>
                    <div style="font-size: 0.95em; color: #444; margin-bottom: 12px;">
                        Pas de restriction spécifique détectée. Catégorie Ouverte (A1/A2/A3).
                    </div>
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px; font-size: 0.85em; display: flex; align-items: flex-start; gap: 8px; color: #856404;">
                        <span class="material-symbols-outlined" style="font-size: 18px; flex-shrink: 0;">warning</span>
                        <span>Respectez les règles : pas de survol de l'espace public en agglomération, ni de personnes, ni de sites sensibles.</span>
                    </div>
                    <div style="font-size: 0.8em; color: #999; margin-top: 12px; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">gavel</span>
                        Réglementation Européenne
                    </div>
                </div>
                <a href="https://www.ecologie.gouv.fr/politiques-publiques/guides-exploitants-daeronefs" 
                   target="_blank" 
                   rel="noopener" 
                   class="restriction-link"
                   style="display: block; text-align: center; padding: 10px; background: #f8f9fa; border-top: 1px solid #eee; text-decoration: none; color: #2185d0; font-weight: 500; font-size: 0.9em; border-radius: 0 0 4px 4px;">
                    📖 Guides exploitants DGAC →
                </a>
            </div>
        `;
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