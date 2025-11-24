class Config {
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
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 21,        // Permettre zoom jusqu'à 21
                        maxNativeZoom: 19   // OSM fournit des tuiles jusqu'à 19, oversampling au-delà
                    }
                },
                satellite: {
                    name: 'Satellite',
                    url: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}',
                    options: {
                        minZoom: 0,
                        maxZoom: 21,        // Permettre zoom jusqu'à 21
                        maxNativeZoom: 20,  // Satellite fournit jusqu'à 20, oversampling au-delà
                        attribution: '&copy; CNES, Distribution Airbus DS',
                        ext: 'jpg'
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
                        maxNativeZoom: 17,  // Fige les tuiles du niveau 17 (≈300m) et les étire pour zoom supérieur
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
        return {
            // Remplacer 'GA_MEASUREMENT_ID' par votre vrai ID Google Analytics 4
            // Format: G-XXXXXXXXXX
            measurementId: 'G-CEX7EHSHQ4',
            enabled: true,
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