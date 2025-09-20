class Config {
    static get MAP_CONFIG() {
        return {
            center: [46.603354, 1.888334], // Centre de la France
            zoom: 6,
            minZoom: 5,
            maxZoom: 18
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