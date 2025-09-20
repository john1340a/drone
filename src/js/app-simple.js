// Application SIG Drone - Version simplifiée avec gestionnaire natif Leaflet

// Configuration
const CONFIG = {
    map: {
        center: [46.603354, 1.888334], // Centre de la France
        zoom: 6,
        minZoom: 5,
        maxZoom: 18
    }
};

// Fonds de carte
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }),

    "Satellite": L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; CNES, Distribution Airbus DS',
        ext: 'jpg'
    })
};

// Couches overlay
const overlayMaps = {};

// Initialisation de la carte
const map = L.map('map', {
    center: CONFIG.map.center,
    zoom: CONFIG.map.zoom,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    layers: [baseMaps["OpenStreetMap"]] // Couche par défaut
});

// Service officiel IGN Géoplateforme pour les restrictions drones
function createDroneRestrictionsLayer() {
    // URL WMTS officielle Géoplateforme IGN
    const droneRestrictionsLayer = L.tileLayer('https://data.geopf.fr/wmts?' +
        'SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&' +
        'TILEMATRIXSET=PM&FORMAT=image/png&' +
        'LAYER=TRANSPORTS.DRONES.RESTRICTIONS&' +
        'TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
        attribution: '&copy; <a href="https://www.ign.fr/">IGN</a> - Géoplateforme - Restrictions Drones',
        format: 'image/png',
        transparent: true,
        opacity: 0.8,
        maxZoom: 18
    });

    // Ajouter la couche au gestionnaire
    overlayMaps["🛡️ Restrictions Drones (IGN)"] = droneRestrictionsLayer;

    return { droneRestrictionsLayer };
}

// Chargement des couches de restrictions
const droneRestrictions = createDroneRestrictionsLayer();

// Ajout du gestionnaire de couches natif Leaflet
const layerControl = L.control.layers(baseMaps, overlayMaps, {
    position: 'topright',
    collapsed: true // Démarre collapsed
}).addTo(map);

// Fonction pour détecter si on est sur mobile
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Configuration du comportement hover pour desktop uniquement
function setupLayerControlHover() {
    const controlContainer = layerControl.getContainer();

    if (!isMobileDevice()) {
        // Desktop: hover pour ouvrir/fermer
        controlContainer.addEventListener('mouseenter', function() {
            if (layerControl._form.style.display === 'none' || !layerControl._form.style.display) {
                layerControl.expand();
            }
        });

        controlContainer.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!controlContainer.matches(':hover')) {
                    layerControl.collapse();
                }
            }, 100); // Petit délai pour éviter les fermetures accidentelles
        });
    }
    // Mobile: garde le comportement par défaut (clic pour ouvrir/fermer)
}

// Appliquer la configuration hover après que le contrôle soit ajouté
setTimeout(setupLayerControlHover, 100);

// Gestion des erreurs de chargement des tuiles (silencieux)
map.on('tileerror', function(e) {
    // Erreur silencieuse - pas d'affichage console
});

// Test de connexion aux services IGN Géoplateforme
function testIGNConnection() {
    // Test de connectivité avec la Géoplateforme (silencieux)
    const testUrl = 'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities';

    fetch(testUrl)
        .then(response => {
            // Connexion OK - pas d'action nécessaire
        })
        .catch(error => {
            // Erreur de connexion - pas d'action nécessaire (couche IGN reste disponible)
        });
}

// Ajout de contrôles supplémentaires
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(map);

// Création du contrôle titre
const titleControl = L.control({position: 'topleft'});

titleControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'map-title-control');
    div.innerHTML = `
        <i data-lucide="map-pin" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;"></i>
        Zones de Restrictions Drone
    `;
    return div;
};

titleControl.addTo(map);

// Contrôle de zoom avec position personnalisée (en dessous du titre)
map.removeControl(map.zoomControl);
L.control.zoom({
    position: 'topleft'
}).addTo(map);

// Création de la légende native Leaflet
const legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');

    div.innerHTML = `
        <button class="legend-toggle" onclick="toggleLegend()">
            <i data-lucide="info" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i>
        </button>
        <div class="legend-content">
            <h4>Légende</h4>
            <i style="background:#ff0000"></i> Vol interdit <br>
            <i style="background:#ff9999"></i> Hauteur maximale de vol de 30m <br>
            <i style="background:#ffaa00"></i> Hauteur maximale de vol de 50m <br>
            <i style="background:#ffdd00"></i> Hauteur maximale de vol de 60m <br>
            <i style="background:#ffff00"></i> Hauteur maximale de vol de 100m <br>
        </div>
    `;

    return div;
};

legend.addTo(map);

// Création du MiniMap avec synchronisation des fonds de carte
let currentMiniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM contributors',
    maxZoom: 18
});

const miniMap = new L.Control.MiniMap(currentMiniMapLayer, {
    position: 'bottomright',
    width: 150,
    height: 150,
    zoomLevelOffset: -5,
    toggleDisplay: true
}).addTo(map);

// Fonction pour mettre à jour le fond de carte du minimap
function updateMiniMapLayer(newLayer) {
    // Retirer l'ancienne couche du minimap
    miniMap._miniMap.removeLayer(currentMiniMapLayer);

    // Créer une nouvelle couche identique pour le minimap
    if (newLayer === baseMaps["OpenStreetMap"]) {
        currentMiniMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OSM contributors',
            maxZoom: 18
        });
    } else if (newLayer === baseMaps["Satellite"]) {
        currentMiniMapLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
            attribution: '&copy; Stadia Maps',
            maxZoom: 20,
            ext: 'jpg'
        });
    }

    // Ajouter la nouvelle couche au minimap
    miniMap._miniMap.addLayer(currentMiniMapLayer);
}

// Écouter les changements de fond de carte
map.on('baselayerchange', function(e) {
    updateMiniMapLayer(e.layer);
});

// Test de la connexion IGN Géoplateforme au chargement
testIGNConnection();

// Messages informatifs
console.log('MAP: Carte initialisée');
console.log('LAYERS: Gestionnaire de couches natif Leaflet activé');
console.log('LOADING: Test des couches de restrictions en cours...');

// Gestion du redimensionnement
window.addEventListener('resize', function() {
    setTimeout(function() {
        map.invalidateSize();
        // Réappliquer la configuration hover si la taille change
        setupLayerControlHover();
    }, 100);
});

// Fonction pour remplacer les emojis par des icônes Lucide dans les labels
function replaceEmojisWithIcons() {
    const layerLabels = document.querySelectorAll('.leaflet-control-layers label span');
    layerLabels.forEach(label => {
        let text = label.textContent;

        // Remplacer les emojis par des icônes Lucide
        if (text.includes('🛡️')) {
            text = text.replace('🛡️', '');
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'shield');
            icon.style.width = '14px';
            icon.style.height = '14px';
            icon.style.marginRight = '6px';
            icon.style.verticalAlign = 'middle';
            label.insertBefore(icon, label.firstChild);
        }

        if (text.includes('⚠️')) {
            text = text.replace('⚠️', '');
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'alert-triangle');
            icon.style.width = '14px';
            icon.style.height = '14px';
            icon.style.marginRight = '6px';
            icon.style.verticalAlign = 'middle';
            label.insertBefore(icon, label.firstChild);
        }

        if (text.includes('📍')) {
            text = text.replace('📍', '');
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'map-pin');
            icon.style.width = '14px';
            icon.style.height = '14px';
            icon.style.marginRight = '6px';
            icon.style.verticalAlign = 'middle';
            label.insertBefore(icon, label.firstChild);
        }

        label.lastChild.textContent = text.trim();
    });

    // Réinitialiser les icônes Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Initialiser les icônes Lucide après le chargement
setTimeout(() => {
    if (window.lucide) {
        lucide.createIcons();
        replaceEmojisWithIcons();
    }
}, 1000);

// Fonction pour toggle la légende sur mobile
window.toggleLegend = function() {
    const legendContent = document.querySelector('.legend-content');
    const legendToggle = document.querySelector('.legend-toggle');

    if (legendContent && legendToggle) {
        const isShowing = legendContent.classList.contains('show');

        if (isShowing) {
            // Fermer la légende
            legendContent.classList.remove('show');
            legendToggle.classList.remove('hidden');
        } else {
            // Ouvrir la légende
            legendContent.classList.add('show');
            legendToggle.classList.add('hidden');
        }
    }
};

// Fermer la légende si on clique en dehors (mobile uniquement)
function setupClickOutsideToClose() {
    if (window.innerWidth <= 768) {
        document.addEventListener('click', function(e) {
            const legendControl = document.querySelector('.info.legend');
            const legendContent = document.querySelector('.legend-content');
            const legendToggle = document.querySelector('.legend-toggle');

            // Si la légende est ouverte et qu'on clique en dehors
            if (legendContent && legendContent.classList.contains('show') &&
                legendControl && !legendControl.contains(e.target)) {

                legendContent.classList.remove('show');
                if (legendToggle) {
                    legendToggle.classList.remove('hidden');
                }
            }
        });
    }
}

// Appliquer le comportement click outside après initialisation
setTimeout(setupClickOutsideToClose, 1000);

// Export pour debug
window.mapInstance = map;
window.droneRestrictions = droneRestrictions;