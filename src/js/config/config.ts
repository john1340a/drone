export default class Config {
    static get MAP_CONFIG() {
        return {
            center: [46.603354, 1.888334], // Centre de la France
            zoom: 6,
            minZoom: 6, // Zoom minimum pour éviter les 404 inutiles
            maxZoom: 21, // Augmenté pour supporter zoom jusqu'à 100m
        };
    }

    static get LAYERS_CONFIG() {
        return {
            baseMaps: {
                osm: {
                    name: 'OpenStreetMap',
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                        maxZoom: 21,        // Permettre zoom jusqu'à 21
                        maxNativeZoom: 19   // OSM fournit des tuiles jusqu'à 19, oversampling au-delà
                    }
                },
                satellite: {
                    name: 'Satellite',
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    options: {
                        minZoom: 0,
                        maxZoom: 21,        // Permettre zoom jusqu'à 21
                        maxNativeZoom: 16,  // On limite à 16 pour garantir l'affichage partout (oversampling au-delà)
                        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
                    }
                }
            },
            dateLayers: {
                droneRestrictions: {
                    name: 'Restrictions drones',
                    // WMTS - URL exactement comme sur geoportail.gouv.fr
                    url: 'https://data.geopf.fr/wmts?layer=TRANSPORTS.DRONES.RESTRICTIONS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}',
                    options: {
                        attribution: '&copy; <a href="https://www.ign.fr/">IGN</a> - G&eacute;oplateforme - Restrictions Drones',
                        transparent: true,
                        opacity: 0.8,
                        minZoom: 0,
                        maxZoom: 21,        // Zoom jusqu'à 21 (≈5m)
                        maxNativeZoom: 11,  // On force l'utilisation des tuiles de niveau 11 pour tous les zooms supérieurs
                        tileSize: 256,
                        updateWhenIdle: false,
                        updateWhenZooming: true,
                        keepBuffer: 4,
                        pane: 'overlayPane'  // Afficher au-dessus des basemaps
                    }
                }
            }
        };
    }

    static get DOMTOM_CONFIG() {
        return {
            metropole: {
                name: 'Métropole',
                center: [46.603354, 1.888334],
                zoom: 6
            },
            antilles: {
                name: 'Antilles',
                center: [16.28, -61.31],
                zoom: 8  // Zoom réduit pour voir toute l'emprise
            },
            guyane: {
                name: 'Guyane',
                center: [3.9339, -53.1258],
                zoom: 8
            },
            reunion: {
                name: 'Réunion',
                center: [-21.1151, 55.5364],
                zoom: 11
            },
            mayotte: {
                name: 'Mayotte',
                center: [-12.8275, 45.1662],
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
        // Récupérer l'ID depuis les variables d'environnement Vite
        const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';


        return {
            measurementId: measurementId,
            enabled: !!measurementId && measurementId !== '',
            // Événements à tracker
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