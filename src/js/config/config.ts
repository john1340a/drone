export default class Config {
    // MapLibre uses [lng, lat] — NOT [lat, lng] like Leaflet
    static get MAP_CONFIG() {
        return {
            center: [1.888334, 46.603354] as [number, number], // Centre de la France [lng, lat]
            zoom: 5,
            minZoom: 5,
            maxZoom: 21,
        };
    }

    static get LAYERS_CONFIG() {
        return {
            baseMaps: {
                jawg: {
                    name: 'Jawg Streets',
                    tiles: [`https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=${import.meta.env.VITE_JAWG_MAPS_API}`],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.jawg.io">Jawg</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                    maxzoom: 22
                },
                satellite: {
                    name: 'Satellite',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
                    maxzoom: 17
                }
            }
        };
    }

    static get DOMTOM_CONFIG() {
        return {
            metropole: {
                name: 'Métropole',
                center: [1.888334, 46.603354] as [number, number],
                zoom: 5
            },
            antilles: {
                name: 'Antilles',
                center: [-61.31, 16.28] as [number, number],
                zoom: 8
            },
            guyane: {
                name: 'Guyane',
                center: [-53.1258, 3.9339] as [number, number],
                zoom: 8
            },
            reunion: {
                name: 'Réunion',
                center: [55.5364, -21.1151] as [number, number],
                zoom: 11
            },
            mayotte: {
                name: 'Mayotte',
                center: [45.1662, -12.8275] as [number, number],
                zoom: 11
            }
        };
    }

    static get UI_CONFIG() {
        return {
            sidebar: {
                width: '300px',
                breakpoint: 768
            },
            colors: {
                primary: '#2185d0',
                secondary: '#f2711c',
                success: '#21ba45',
                warning: '#fbbd08',
                error: '#db2828'
            }
        };
    }

    static get ANALYTICS_CONFIG() {
        const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

        return {
            measurementId: measurementId,
            enabled: !!measurementId && measurementId !== '',
            events: {
                mapInteraction: true,
                layerToggle: true,
                regionChange: true,
                search: true,
                error: true
            }
        };
    }
}
