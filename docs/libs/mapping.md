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

### leaflet-velocity

**Rôle** : Visualisation animée des particules de vent.
**Pourquoi** : Ajoute une dimension visuelle immersive ("Wow effect") pour comprendre le flux d'air.
**Fonctionnement** :

- Le plugin attend un champ vectoriel (U/V components).
- Nous générons ce champ localement (Smart Mock) via `WeatherService` à partir des données ponctuelles d'OpenMeteo, pour garantir la fluidité sans dépendre d'un lourd backend GRIB.

- **Lien** : [https://github.com/onaci/leaflet-velocity](https://github.com/onaci/leaflet-velocity)

## Services Externes

### OpenMeteo (Météo & Vent)

**Rôle** : Fournir les données météorologiques en temps réel.
**Utilisation** :

- Retrieves wind data (Speed 10m, Gusts, Direction).
- **Widget UI** : Affichage précis des valeurs et status de sécurité.
- **Velocity Layer** : Sert de "seed" pour générer le champ d'animation des vents.
- **URL API** : `https://api.open-meteo.com/v1/forecast`

## Sources de Données (IGN)

### Géoservices IGN

**Rôle** : Fournisseur de tuiles et de données vectorielles.

1.  **WMS (Web Map Service)** : Utilisé pour les orthophotos et cartes scannées.
    - _URL_ : `https://wxs.ign.fr/essentiels/geoportail/r/wms`
2.  **WMTS (Web Map Tile Service)** : Utilisé pour la couche de restriction drone (TRANSPORTS.DRONES.RESTRICTIONS).
    - _Pourquoi_ : Plus performant que le WMS (tuilé et caché), permet une fluidité maximale.

- **Documentation** : [https://geoservices.ign.fr/](https://geoservices.ign.fr/)
