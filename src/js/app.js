class App {
    constructor() {
        this.mapController = null;
        this.analyticsService = null;
    }

    init() {
        try {
            this._detectBrowserAndPlatform();
            this._validateDependencies();
            this._initializeAnalytics();
            this._initializeController();
            this._setupGlobalErrorHandling();

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this._showCriticalError('Erreur critique lors de l\'initialisation de l\'application');

            // Track l'erreur si analytics disponible
            if (this.analyticsService) {
                this.analyticsService.trackError(error, 'App initialization');
            }
        }
    }

    _detectBrowserAndPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const body = document.body;

        // Détection iOS
        if (/iphone|ipad|ipod/.test(userAgent)) {
            body.classList.add('ios');
        }

        // Détection Android
        if (/android/.test(userAgent)) {
            body.classList.add('android');
        }

        // Détection Safari (mais pas Chrome sur iOS)
        if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
            body.classList.add('safari');
        }

        // Détection mobile générale
        if (/mobile/.test(userAgent)) {
            body.classList.add('mobile');
        }
    }

    _initializeAnalytics() {
        this.analyticsService = new AnalyticsService();
        this.analyticsService.trackPageLoad();
        this.analyticsService.initSessionTracking();

        // Track les performances après chargement complet
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.analyticsService.trackPerformance();
            }, 1000);
        });

        // Rendre le service accessible globalement
        window.analyticsService = this.analyticsService;
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

                // Track l'erreur
                if (this.analyticsService) {
                    this.analyticsService.trackError(event.error, 'Global error');
                }
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejetée non gérée:', event.reason);

            // Track l'erreur de promise
            if (this.analyticsService) {
                const error = new Error(event.reason);
                this.analyticsService.trackError(error, 'Unhandled promise rejection');
            }
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