export interface WeatherData {
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    isSafe: boolean;
}

export default class WeatherService {
    private static readonly API_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Fetches current wind data for a specific location.
     * @param lat Latitude
     * @param lng Longitude
     */
    async getCurrentWind(lat: number, lng: number): Promise<WeatherData> {
        try {
            const url = `${WeatherService.API_URL}?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Weather API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const current = data.current;

            return {
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m,
                windGusts: current.wind_gusts_10m,
                isSafe: current.wind_speed_10m < 30 && current.wind_gusts_10m < 40
            };
        } catch (error) {
            console.error('Failed to fetch weather data:', error);
            throw error;
        }
    }

    /**
     * Returns a cardinal direction (N, NE, E...) from degrees.
     */
    getCardinalDirection(degrees: number): string {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    /**
     * Generates a wind field compatible with leaflet-velocity based on a single point measurement.
     * This creates a "uniform" flow visualization that matches the local weather,
     * avoiding the complexity of a full GRIB backend.
     */
    generateWindField(lat: number, lng: number, speedKmh: number, directionDegrees: number): any {
        // Convert speed/dir to U/V components
        // Speed in m/s
        const speedMs = speedKmh / 3.6;
        const rad = (270 - directionDegrees) * (Math.PI / 180);
        const u = speedMs * Math.cos(rad); // West-East velocity
        const v = speedMs * Math.sin(rad); // South-North velocity

        // Create a coarse grid (Global approximation for the visual effect)
        const nx = 100;
        const ny = 50;
        
        // Random noise to make it look "organic"
        const uData = new Array(nx * ny);
        const vData = new Array(nx * ny);
        
        for (let i = 0; i < uData.length; i++) {
            const noise = (Math.random() - 0.5) * 2; // +/- 1 m/s
            uData[i] = u + noise;
            vData[i] = v + noise;
        }

        return [
            {
                header: {
                    parameterCategory: 2,
                    parameterNumber: 2,
                    lo1: lng - 10, // Span around center
                    la1: lat + 5,
                    dx: 0.2, // Grid resolution
                    dy: 0.2,
                    nx: nx,
                    ny: ny
                },
                data: uData
            },
            {
                header: {
                    parameterCategory: 2,
                    parameterNumber: 3,
                    lo1: lng - 10, // Span around center
                    la1: lat + 5,
                    dx: 0.2, // Grid resolution
                    dy: 0.2,
                    nx: nx,
                    ny: ny
                },
                data: vData
            }
        ];
    }
}
