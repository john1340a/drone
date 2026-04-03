import maplibregl from 'maplibre-gl';

export default class LayerService {

    private _map: maplibregl.Map | null = null;

    setMap(map: maplibregl.Map): void {
        this._map = map;
    }

    // ── Add restriction zones (PMTiles vector tiles) ──
    addRestrictionLayers(): void {
        if (!this._map) return;
        const map = this._map;

        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

        map.addSource('restrictions', {
            type: 'vector',
            url: `pmtiles://${window.location.origin}${baseUrl}data/restrictions_sia.pmtiles`
        });

        // Fill layer with conditional colors based on restriction severity
        map.addLayer({
            id: 'restrictions-fill',
            type: 'fill',
            source: 'restrictions',
            'source-layer': 'restrictions',
            paint: {
                'fill-color': [
                    'case',
                    // min_height >= 120 → steel blue (info only, not applicable to drones)
                    ['>=', ['coalesce', ['get', 'min_height'], 0], 120],
                    '#5b7fa5',
                    // PROHIBITED → red
                    ['==', ['get', 'restriction'], 'PROHIBITED'],
                    '#c0392b',
                    // REQ_AUTHORISATION → orange
                    ['==', ['get', 'restriction'], 'REQ_AUTHORISATION'],
                    '#e67e22',
                    // RESTRICTED/CONDITIONAL with height-based gradients
                    ['any',
                        ['==', ['get', 'restriction'], 'RESTRICTED'],
                        ['==', ['get', 'restriction'], 'CONDITIONAL']
                    ],
                    [
                        'case',
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 30]],
                        '#d35400',
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 50]],
                        '#e67e22',
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 60]],
                        '#f39c12',
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['has', 'max_height']],
                        '#f1c40f',
                        '#f39c12'
                    ],
                    // default → steel blue
                    '#5b7fa5'
                ],
                'fill-opacity': [
                    'case',
                    ['>=', ['coalesce', ['get', 'min_height'], 0], 120], 0.15,
                    ['==', ['get', 'restriction'], 'PROHIBITED'], 0.4,
                    ['==', ['get', 'restriction'], 'REQ_AUTHORISATION'], 0.3,
                    ['any',
                        ['==', ['get', 'restriction'], 'RESTRICTED'],
                        ['==', ['get', 'restriction'], 'CONDITIONAL']
                    ],
                    [
                        'case',
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 30]],
                        0.4,
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 50]],
                        0.3,
                        ['all', ['==', ['get', 'max_ref'], 'AGL'], ['<=', ['coalesce', ['get', 'max_height'], 999], 60]],
                        0.25,
                        0.3
                    ],
                    0.15
                ]
            }
        });

        // Outline layer
        map.addLayer({
            id: 'restrictions-outline',
            type: 'line',
            source: 'restrictions',
            'source-layer': 'restrictions',
            paint: {
                'line-color': [
                    'case',
                    ['>=', ['coalesce', ['get', 'min_height'], 0], 120], '#5b7fa5',
                    ['==', ['get', 'restriction'], 'PROHIBITED'], '#c0392b',
                    ['==', ['get', 'restriction'], 'REQ_AUTHORISATION'], '#e67e22',
                    ['any',
                        ['==', ['get', 'restriction'], 'RESTRICTED'],
                        ['==', ['get', 'restriction'], 'CONDITIONAL']
                    ], '#f39c12',
                    '#5b7fa5'
                ],
                'line-opacity': 0.8,
                'line-width': 1,
                'line-dasharray': [3, 3]
            }
        });
    }

    // ── Add allowed zones (PMTiles vector tiles) ──
    addAllowedZonesLayers(): void {
        if (!this._map) return;
        const map = this._map;

        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

        map.addSource('allowed-zones', {
            type: 'vector',
            url: `pmtiles://${window.location.origin}${baseUrl}data/allowed_zones.pmtiles`
        });

        map.addLayer(
            {
                id: 'allowed-fill',
                type: 'fill',
                source: 'allowed-zones',
                'source-layer': 'allowed',
                paint: {
                    'fill-color': '#3388ff',
                    'fill-opacity': 0.15
                }
            },
            'restrictions-fill' // Insert below restrictions
        );

        map.addLayer(
            {
                id: 'allowed-outline',
                type: 'line',
                source: 'allowed-zones',
                'source-layer': 'allowed',
                paint: {
                    'line-color': '#3388ff',
                    'line-opacity': 0.5,
                    'line-width': 1
                }
            },
            'restrictions-fill' // Insert below restrictions
        );
    }

    // ── Toggle layer visibility ──
    setLayerVisibility(layerIds: string[], visible: boolean): void {
        if (!this._map) return;
        for (const id of layerIds) {
            if (this._map.getLayer(id)) {
                this._map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
            }
        }
    }

    // ── Build restriction popup HTML from feature properties ──
    buildRestrictionPopupHTML(props: Record<string, any>): string {
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
            <div class="restriction-popup">
                <div class="popup-header" style="background: ${colorCode};">
                    <div class="popup-icon">
                        <span class="material-symbols-outlined">${iconName}</span>
                    </div>
                    <span>${statusText}</span>
                </div>
                <div class="popup-body">
                    <div class="popup-row">
                        <span class="popup-label">Zone</span>
                        <span class="popup-value">${nom}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Type</span>
                        <span class="popup-value">${restriction} / ${type}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Hauteur</span>
                        <span class="popup-value">${limiteTxt}</span>
                    </div>
                    ${message ? `<div class="popup-message">${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</div>` : ''}
                    <div class="popup-source">
                        <span class="material-symbols-outlined">description</span>
                        Source: SIA (ED-269) &mdash; ${props.id}
                    </div>
                </div>
            </div>
        `;
    }

    private _getRestrictionInfo(props: Record<string, any>): { colorCode: string; statusText: string; iconName: string } {
        const restriction = props.restriction || 'UNKNOWN';
        const type = props.type || '';
        const minH = props.min_height !== undefined ? Math.round(props.min_height) : null;
        const maxH = props.max_height !== undefined ? Math.round(props.max_height) : null;
        const maxRef = props.max_ref || 'AMSL';

        let colorCode = '#5b7fa5';
        let statusText = 'Zone Réglementée';
        let iconName = 'info';

        if (minH !== null && minH >= 120) {
            colorCode = '#5b7fa5';
            statusText = 'Restriction > 120m (non applicable)';
            iconName = 'cloud';
        } else if (restriction === 'PROHIBITED') {
            colorCode = '#c0392b';
            statusText = 'Vol Interdit';
            iconName = 'block';
        } else if (restriction === 'REQ_AUTHORISATION') {
            colorCode = '#e67e22';
            statusText = 'Autorisation Requise';
            iconName = 'lock';
        } else if (restriction === 'RESTRICTED' || restriction === 'CONDITIONAL') {
            colorCode = '#f39c12';
            statusText = 'Restreint';
            iconName = 'warning';

            if (maxH !== null && maxRef === 'AGL') {
                if (maxH <= 30) { colorCode = '#d35400'; statusText = `Max ${maxH}m`; }
                else if (maxH <= 50) { colorCode = '#e67e22'; statusText = `Max ${maxH}m`; }
                else if (maxH < 120) { colorCode = '#f1c40f'; statusText = `Max ${maxH}m`; }
            }
        } else {
            colorCode = '#5b7fa5';
            statusText = 'Information';
            iconName = type === 'AERO' ? 'flight' : 'info';
        }

        return { colorCode, statusText, iconName };
    }
}
