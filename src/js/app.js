class App {
    constructor() {
        this.mapController = null;
    }

    init() {
        try {
            this._validateDependencies();
            this._initializeController();
            this._setupGlobalErrorHandling();

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this._showCriticalError('Erreur critique lors de l\'initialisation de l\'application');
        }
    }

    _validateDependencies() {
        const requiredGlobals = ['L', '$'];
        const missing = requiredGlobals.filter(global => typeof window[global] === 'undefined');

        if (missing.length > 0) {
            throw new Error(`Dépendances manquantes: ${missing.join(', ')}`);
        }

        // Vérifier que les classes sont disponibles
        if (typeof Config === 'undefined') {
            throw new Error('Config class not loaded');
        }

        if (typeof MapController === 'undefined') {
            throw new Error('MapController class not loaded');
        }
    }

    _initializeController() {
        this.mapController = new MapController();
        this.mapController.initialize();
    }

    _setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            // Filtrer les erreurs non critiques du navigateur/extensions
            if (event.error && event.error.message &&
                !event.error.message.includes('runtime.lastError') &&
                !event.error.message.includes('Extension context invalidated')) {
                console.error('Erreur globale:', event.error);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejetée non gérée:', event.reason);
        });
    }

    _showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ui negative message';
        errorDiv.innerHTML = `
            <div class="header">Erreur Critique</div>
            <p>${message}</p>
        `;

        const container = document.querySelector('body');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    getMapController() {
        return this.mapController;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});