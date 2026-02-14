declare module 'leaflet-pmtiles-layer' {
    import * as L from 'leaflet';

    interface PMTilesLayerOptions extends L.GridLayerOptions {
        style?: L.PathOptions | ((properties: any) => L.PathOptions);
        vectorTileLayerStyles?: Record<string, L.PathOptions | ((properties: any) => L.PathOptions)>;
        interactive?: boolean;
        autoScale?: 'pmtiles' | 'leaflet' | false;
        maxNativeZoom?: number;
    }

    function pmtilesLayer(url: string, options?: PMTilesLayerOptions): L.Layer;

    module 'leaflet' {
        function pmtilesLayer(url: string, options?: PMTilesLayerOptions): L.Layer;
    }
}
