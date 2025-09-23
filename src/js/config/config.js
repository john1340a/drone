class Config {
    static get MAP_CONFIG() {
        return {
            center: [46.603354, 1.888334], // Centre de la France
            zoom: 6,
            minZoom: 6, // Zoom minimum pour éviter les 404 inutiles
            maxZoom: 18,
            // Limites géographiques étendues pour inclure tous les DOM-TOM
            maxBounds: [
                [-22.0, -63.0], // Sud-Ouest (Nouvelle-Calédonie, Antilles)
                [51.5, 56.0]     // Nord-Est (limite nord, Guyane/Réunion)
            ],
            maxBoundsViscosity: 1.0 // Empêche de sortir complètement des limites
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
                        maxZoom: 18
                    }
                },
                satellite: {
                    name: 'Satellite',
                    url: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}',
                    options: {
                        minZoom: 0,
                        maxZoom: 20,
                        attribution: '&copy; CNES, Distribution Airbus DS',
                        ext: 'jpg'
                    }
                }
            },
            dateLayers: {
                droneRestrictions: {
                    name: 'Restrictions drones',
                    wms: {
                        url: 'https://wxs.ign.fr/essentiels/geoportail/r/wms',
                        layer: 'TRANSPORTS.DRONES.RESTRICTIONS',
                        format: 'image/png',
                        transparent: true,
                        version: '1.3.0',
                        crs: L.CRS.EPSG4326
                    },
                    wmts: {
                        url: 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=TRANSPORTS.DRONES.RESTRICTIONS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
                        options: {
                            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a> - G&eacute;oplateforme - Restrictions Drones',
                            format: 'image/png',
                            transparent: true,
                            opacity: 0.8,
                            maxZoom: 18
                        }
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
                center: [16.25, -61.583333], // Centré entre Guadeloupe et Martinique
                zoom: 9
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
}