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
                orthophoto: {
                    name: 'Orthophotos',
                    url: 'https://wxs.ign.fr/essentiels/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
                    options: {
                        attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
                        maxZoom: 18
                    }
                },
                osm: {
                    name: 'OpenStreetMap',
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 18
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
                        url: 'https://wxs.ign.fr/essentiels/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=TRANSPORTS.DRONES.RESTRICTIONS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
                        options: {
                            attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
                            format: 'image/png',
                            transparent: true
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