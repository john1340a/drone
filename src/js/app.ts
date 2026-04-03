import MapController from './controllers/MapController';
import AnalyticsService from './services/AnalyticsService';

declare global {
    interface Window {
        app: App;
        analyticsService?: any;
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
            this._initializeAnalytics();
            this._initializeController();
            this._setupGlobalErrorHandling();

        } catch (error: any) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this._showCriticalError('Erreur critique lors de l\'initialisation de l\'application');

            if (this.analyticsService) {
                this.analyticsService.trackError(error, 'App initialization');
            }
        }
    }

    private _detectBrowserAndPlatform(): void {
        const userAgent = navigator.userAgent.toLowerCase();
        const body = document.body;

        if (/iphone|ipad|ipod/.test(userAgent)) {
            body.classList.add('ios');
        }
        if (/android/.test(userAgent)) {
            body.classList.add('android');
        }
        if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
            body.classList.add('safari');
        }
        if (/mobile/.test(userAgent)) {
            body.classList.add('mobile');
        }
    }

    private _initializeAnalytics(): void {
        this.analyticsService = new AnalyticsService();
        this.analyticsService.trackPageLoad();
        this.analyticsService.initSessionTracking();

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (this.analyticsService) {
                    this.analyticsService.trackPerformance();
                }
            }, 1000);
        });

        window.analyticsService = this.analyticsService;
    }

    private _initializeController(): void {
        this.mapController = new MapController();
        this.mapController.initialize();
    }

    private _setupGlobalErrorHandling(): void {
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message &&
                !event.error.message.includes('runtime.lastError') &&
                !event.error.message.includes('Extension context invalidated')) {
                console.error('Erreur globale:', event.error);

                if (this.analyticsService) {
                    this.analyticsService.trackError(event.error, 'Global error');
                }
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejetée non gérée:', event.reason);

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
                displayTime: 0,
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
