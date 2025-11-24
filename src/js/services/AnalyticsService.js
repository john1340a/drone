/**
 * Service de gestion des analytics (Google Analytics 4)
 * Centralise tous les événements de tracking
 */
class AnalyticsService {
    constructor() {
        this.config = Config.ANALYTICS_CONFIG;
        this.enabled = this.config.enabled && typeof gtag !== 'undefined';

        if (this.enabled) {
            console.log('📊 Analytics Service initialisé');
        } else {
            console.warn('📊 Analytics désactivé ou gtag non disponible');
        }
    }

    /**
     * Track un événement générique
     * @param {string} eventName - Nom de l'événement
     * @param {Object} params - Paramètres additionnels
     */
    trackEvent(eventName, params = {}) {
        if (!this.enabled) return;

        try {
            gtag('event', eventName, {
                ...params,
                timestamp: new Date().toISOString()
            });
            console.log(`📊 Event tracked: ${eventName}`, params);
        } catch (error) {
            console.error('❌ Erreur lors du tracking:', error);
        }
    }

    /**
     * Track le chargement initial de la page
     */
    trackPageLoad() {
        this.trackEvent('page_load', {
            page_title: document.title,
            page_location: window.location.href,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    /**
     * Track l'activation/désactivation d'une couche
     * @param {string} layerName - Nom de la couche
     * @param {boolean} isActive - État de la couche
     */
    trackLayerToggle(layerName, isActive) {
        if (!this.config.events.layerToggle) return;

        this.trackEvent('layer_toggle', {
            layer_name: layerName,
            action: isActive ? 'activated' : 'deactivated'
        });
    }

    /**
     * Track le changement de fond de carte
     * @param {string} baseMapName - Nom du fond de carte
     */
    trackBaseMapChange(baseMapName) {
        if (!this.config.events.mapInteraction) return;

        this.trackEvent('basemap_change', {
            basemap_name: baseMapName
        });
    }

    /**
     * Track les interactions avec la carte (zoom, pan)
     * @param {string} action - Type d'interaction (zoom_in, zoom_out, pan)
     * @param {Object} data - Données additionnelles (niveau de zoom, position)
     */
    trackMapInteraction(action, data = {}) {
        if (!this.config.events.mapInteraction) return;

        this.trackEvent('map_interaction', {
            interaction_type: action,
            zoom_level: data.zoom,
            center_lat: data.center ? data.center.lat : null,
            center_lng: data.center ? data.center.lng : null
        });
    }

    /**
     * Track le changement de région (Métropole, DOM-TOM)
     * @param {string} regionName - Nom de la région
     */
    trackRegionChange(regionName) {
        if (!this.config.events.regionChange) return;

        this.trackEvent('region_change', {
            region_name: regionName
        });
    }

    /**
     * Track l'utilisation de la géolocalisation
     * @param {boolean} success - Si la géolocalisation a réussi
     */
    trackGeolocation(success) {
        if (!this.config.events.mapInteraction) return;

        this.trackEvent('geolocation', {
            status: success ? 'success' : 'failed'
        });
    }

    /**
     * Track une recherche (si implémentée)
     * @param {string} query - Terme recherché
     */
    trackSearch(query) {
        if (!this.config.events.search) return;

        this.trackEvent('search', {
            search_term: query
        });
    }

    /**
     * Track les erreurs JavaScript
     * @param {Error} error - Objet erreur
     * @param {string} context - Contexte de l'erreur
     */
    trackError(error, context = '') {
        if (!this.config.events.error) return;

        this.trackEvent('error', {
            error_message: error.message,
            error_stack: error.stack ? error.stack.substring(0, 500) : '',
            error_context: context
        });
    }

    /**
     * Track la durée de session (à appeler avant déchargement)
     */
    trackSessionDuration() {
        const sessionStart = sessionStorage.getItem('session_start');
        if (sessionStart) {
            const duration = Date.now() - parseInt(sessionStart);
            this.trackEvent('session_duration', {
                duration_seconds: Math.round(duration / 1000)
            });
        }
    }

    /**
     * Initialise le tracking de session
     */
    initSessionTracking() {
        // Enregistre le début de session
        if (!sessionStorage.getItem('session_start')) {
            sessionStorage.setItem('session_start', Date.now().toString());
        }

        // Track la durée de session avant fermeture
        window.addEventListener('beforeunload', () => {
            this.trackSessionDuration();
        });
    }

    /**
     * Track les performances de chargement
     */
    trackPerformance() {
        if (typeof performance === 'undefined' || !performance.timing) return;

        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        this.trackEvent('performance', {
            load_time_ms: loadTime,
            dom_ready_ms: domReady,
            dns_time_ms: timing.domainLookupEnd - timing.domainLookupStart,
            tcp_time_ms: timing.connectEnd - timing.connectStart
        });
    }
}
