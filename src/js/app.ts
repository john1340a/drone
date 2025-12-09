
import MapController from './controllers/MapController';
import AnalyticsService from './services/AnalyticsService';

declare global {
    interface Window {
        app: App;
        analyticsService?: any;
        L: any;
    }
}

class App {
    private mapController: MapController | null;
    private analyticsService: AnalyticsService | null;

    constructor() {
        this.mapController = null;
        this.analyticsService = null;
    }

    init(): void {
        try {
            this._detectBrowserAndPlatform();
            // this._validateDependencies(); // Not needed with imports
            this._initializeAnalytics();
            this._initializeController();
            this._setupGlobalErrorHandling();

        } catch (error: any) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this._showCriticalError('Erreur critique lors de l\'initialisation de l\'application');

            // Track l'erreur si analytics disponible
            if (this.analyticsService) {
                this.analyticsService.trackError(error, 'App initialization');
            }
        }
    }

    private _detectBrowserAndPlatform(): void {
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

    private _initializeAnalytics(): void {
        this.analyticsService = new AnalyticsService();
        this.analyticsService.trackPageLoad();
        this.analyticsService.initSessionTracking();

        // Track les performances après chargement complet
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (this.analyticsService) {
                    this.analyticsService.trackPerformance();
                }
            }, 1000);
        });

        // Rendre le service accessible globalement
        window.analyticsService = this.analyticsService;
    }

    private _initializeController(): void {
        this.mapController = new MapController();
        this.mapController.initialize();
    }

    private _setupGlobalErrorHandling(): void {
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

    private _showCriticalError(message: string): void {
        console.error(message);
        const $ = (window as any).$;
        if ($ && $.toast) {
            $.toast({
                class: 'error',
                title: 'Erreur Critique',
                message: message,
                displayTime: 0, // Ne disparait pas auto
                closeIcon: true
            });
        } else {
            alert(message);
        }
    }

    getMapController(): MapController | null {
        return this.mapController;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});