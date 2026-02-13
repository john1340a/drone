import L from 'leaflet';
// Config unused
// import Config from '../config/config';

export default class LayerService {


    constructor() {
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
            const nom = props.nom || props.id || 'Zone UAS';
            const restriction = props.restriction || 'UNKNOWN';
            const type = props.type || '';
            const minH = props.min_height !== undefined ? Math.round(props.min_height) : null;
            const maxH = props.max_height !== undefined ? Math.round(props.max_height) : null;
            const maxRef = props.max_ref || 'AMSL';
            const message = props.message || props.otherReasonInfo || '';
            
            // Determine color based on restriction type & height
            let colorCode = '#0066cc';
            let statusText = 'Zone Réglementée';
            let iconName = 'info';
            
            if (minH !== null && minH >= 120) {
                 // High altitude restrictions -> Green / Info
                 colorCode = '#21ba45';
                 statusText = 'Espace Contrôlé > 120m';
                 iconName = 'cloud'; // Cloud icon for high altitude
            } else if (restriction === 'PROHIBITED') {
                colorCode = '#b22222'; // Dark Red
                statusText = 'Vol Interdit';
                iconName = 'block';
            } else if (restriction === 'REQ_AUTHORISATION') {
                colorCode = '#8e44ad'; // Purple
                statusText = 'Autorisation Requise';
                iconName = 'lock';
            } else if (restriction === 'RESTRICTED' || restriction === 'CONDITIONAL') {
                colorCode = '#d35400'; // Orange
                statusText = 'Restreint';
                iconName = 'warning';
                
                // Specific coloring based on max height (AGL) if available
                if (maxH !== null && maxRef === 'AGL') {
                    if (maxH <= 30) { statusText = `Max ${maxH}m`; }
                    else if (maxH <= 50) { colorCode = '#d35400'; statusText = `Max ${maxH}m`; }
                    else if (maxH < 120) { colorCode = '#f1c40f'; statusText = `Max ${maxH}m`; }
                }
            } else {
                  // Common / Warning / Aero
                 colorCode = '#21ba45'; 
                 statusText = 'Information';
                 iconName = type === 'AERO' ? 'flight' : 'info';
            }

            const limiteTxt = (minH !== null && maxH !== null) 
                ? `${minH} - ${maxH}m ${maxRef}`
                : (maxH !== null ? `Max ${maxH}m ${maxRef}` : 'Voir détails');

            const popupContent = `
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

            (layer as L.Path).bindPopup(popupContent, { className: 'restriction-popup-container' });
        }
    }

    async loadDroneRestrictionsLayer(options: L.GeoJSONOptions = {}): Promise<L.GeoJSON> {
        // Load local GeoJSON instead of IGN WMTS
        // Use import.meta.env.BASE_URL to handle the /drone/ base path
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        // Add cache buster
        const response = await fetch(`${baseUrl}data/restrictions_sia.geojson?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load restrictions: ${response.statusText}`);
        }
        const data = await response.json();

        return this.createStyledGeoJSONLayer(data, options);
    }

    async loadAllowedZonesLayer(options: L.GeoJSONOptions = {}): Promise<L.GeoJSON> {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
        // Add cache buster to ensure checking for new file updates (e.g. from QGIS export)
        const response = await fetch(`${baseUrl}data/allowed_zones.geojson?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load allowed zones: ${response.statusText}`);
        }
        const data = await response.json();

        // Create a green layer for allowed zones
        return L.geoJSON(data, {
            ...options,
            style: () => ({
                color: '#3498db',
                fillColor: '#3498db',
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.15
            }),
            onEachFeature: (_feature, layer) => {
                // const props = feature.properties as any;
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
                (layer as L.Path).bindPopup(popupContent, { className: 'restriction-popup-container' });
            }
        });
    }

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

        let color = '#888888'; // Default gray border
        let fillOpacity = 0.15; // Very transparent

        const minH = properties?.min_height !== undefined ? Math.round(properties.min_height) : null;

        if (minH !== null && minH >= 120) {
            color = '#21ba45'; // Green
            fillOpacity = 0.2;
        } else if (restriction === 'PROHIBITED') {
            color = '#b22222'; // DARKER RED
            fillOpacity = 0.4; // Filled
        } else if (restriction === 'REQ_AUTHORISATION') {
             color = '#8e44ad'; // Purple
             fillOpacity = 0.3;
        } else if (restriction === 'RESTRICTED' || restriction === 'CONDITIONAL') {
             color = '#d35400';
             fillOpacity = 0.3;
             
             if (maxH !== null && maxRef === 'AGL') {
                if (maxH <= 30) { color = '#b22222'; fillOpacity = 0.4; } // Dark Red
                else if (maxH <= 50) { color = '#d35400'; fillOpacity = 0.3; } // Darker Orange
                else if (maxH <= 60) { color = '#f39c12'; fillOpacity = 0.25; } // Darker Yellow
                else { color = '#f1c40f'; fillOpacity = 0.15; } // Yellow
             }
        } else {
             color = '#21ba45'; // Green
             fillOpacity = 0.2;
        }

        return {
            color: color,
            fillColor: color,
            weight: 1,
            opacity: 0.8,
            fillOpacity: fillOpacity,
            dashArray: '3, 3' // Dashed border
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