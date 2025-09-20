// Module pour utiliser les icônes Lucide en JavaScript vanilla
// Inspiré de Shadcn UI

// Import des icônes Lucide via CDN
function loadLucideIcons() {
    if (!window.lucide) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.js';
        script.onload = () => {
            lucide.createIcons();
        };
        document.head.appendChild(script);
    }
}

// Fonction pour créer une icône SVG
function createIcon(iconName, className = '', size = 20) {
    const iconElement = document.createElement('i');
    iconElement.setAttribute('data-lucide', iconName);
    iconElement.className = className;
    iconElement.style.width = `${size}px`;
    iconElement.style.height = `${size}px`;
    iconElement.style.display = 'inline-block';
    return iconElement;
}

// Icônes utilisées dans l'application (mappées depuis Shadcn UI)
const Icons = {
    // Navigation et interface
    map: (className = '', size = 20) => createIcon('map', className, size),
    layers: (className = '', size = 20) => createIcon('layers', className, size),
    menu: (className = '', size = 20) => createIcon('menu', className, size),

    // Zones et restrictions
    alertTriangle: (className = '', size = 20) => createIcon('alert-triangle', className, size),
    shield: (className = '', size = 20) => createIcon('shield', className, size),
    mapPin: (className = '', size = 20) => createIcon('map-pin', className, size),

    // Actions
    zoomIn: (className = '', size = 20) => createIcon('zoom-in', className, size),
    zoomOut: (className = '', size = 20) => createIcon('zoom-out', className, size),
    refresh: (className = '', size = 20) => createIcon('refresh-cw', className, size),

    // Statut
    checkCircle: (className = '', size = 20) => createIcon('check-circle', className, size),
    xCircle: (className = '', size = 20) => createIcon('x-circle', className, size),
    info: (className = '', size = 20) => createIcon('info', className, size),

    // Drone spécifique
    drone: (className = '', size = 20) => createIcon('plane', className, size),
    target: (className = '', size = 20) => createIcon('target', className, size)
};

// Initialiser les icônes quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLucideIcons);
} else {
    loadLucideIcons();
}

// Export pour utilisation
window.Icons = Icons;