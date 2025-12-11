# Cartographie & GIS

Les librairies utilisées pour la gestion de la carte interactive et des données géographiques.

## Leaflet

**Rôle** : Moteur de carte interactive.
**Pourquoi** : Leaflet est la référence open-source pour les cartes web. Elle est extrêmement légère, performante sur mobile, et dispose d'un écosystème de plugins riche. Contrairement à OpenLayers (plus complexe), Leaflet suffit parfaitement pour des besoins de visualisation standard.

- **Documentation** : [https://leafletjs.com/](https://leafletjs.com/)
- **Utilisation** : `src/js/services/MapService.ts`

## Plugins Leaflet

### leaflet-minimap

**Rôle** : Carte de situation (overview).
**Pourquoi** : Permet à l'utilisateur de se repérer globalement lorsqu'il est très zoomé sur une zone spécifique. UX essentielle pour une carte nationale.

- **Lien** : [https://github.com/Norkart/Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap)
- **Intégration** : Importé via NPM, CSS bundlé par Vite.

### leaflet.locatecontrol

**Rôle** : Géolocalisation utilisateur.
**Pourquoi** : Permet à l'utilisateur de se centrer rapidement sur sa position GPS (mobile/desktop). Essentiel pour l'usage "terrain" des dronistes.

- **Lien** : [https://github.com/domoritz/leaflet-locatecontrol](https://github.com/domoritz/leaflet-locatecontrol)

### leaflet-control-geocoder

**Rôle** : Recherche d'adresses et de lieux.
**Pourquoi** : Permet à l'utilisateur de taper une adresse ("Paris", "10 rue de la Paix") pour centrer la carte. Utilise par défaut le service open-source Nominatim.

- **Lien** : [https://github.com/perliedman/leaflet-control-geocoder](https://github.com/perliedman/leaflet-control-geocoder)

## Sources de Données (IGN)

### Géoservices IGN

**Rôle** : Fournisseur de tuiles et de données vectorielles.

1.  **WMS (Web Map Service)** : Utilisé pour les orthophotos et cartes scannées.
    - _URL_ : `https://wxs.ign.fr/essentiels/geoportail/r/wms`
2.  **WMTS (Web Map Tile Service)** : Utilisé pour la couche de restriction drone (TRANSPORTS.DRONES.RESTRICTIONS).
    - _Pourquoi_ : Plus performant que le WMS (tuilé et caché), permet une fluidité maximale.

- **Documentation** : [https://geoservices.ign.fr/](https://geoservices.ign.fr/)
