/**
 * ============================================================================
 * WEATHER SERVICE - Real-Time Weather Risk Assessment
 * ============================================================================
 * 
 * Integrates with OpenWeatherMap API to provide real-time weather risk data
 * for trade corridors.
 * 
 * Confidence: 80-85% (partner tier)
 */

import type { CorridorDataPoint, RiskLevel, DataSource } from '@/types/corridorIntelligence';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Weather conditions that indicate high risk for shipping
 */
const HIGH_RISK_CONDITIONS = [
    'Thunderstorm',
    'Snow',
    'Extreme',
    'Tornado',
    'Hurricane',
    'Squall',
];

const MEDIUM_RISK_CONDITIONS = [
    'Rain',
    'Drizzle',
    'Mist',
    'Fog',
    'Haze',
    'Dust',
    'Sand',
];

/**
 * Get weather risk for a specific location
 */
export async function getWeatherRisk(
    lat: number,
    lon: number,
    locationName: string = 'Location'
): Promise<CorridorDataPoint<RiskLevel>> {
    try {
        // Check if API key is configured
        if (!OPENWEATHER_API_KEY) {
            console.warn('OpenWeatherMap API key not configured, using heuristic fallback');
            return getWeatherRiskFallback(locationName);
        }

        // Fetch 5-day forecast using native fetch
        const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();


        // Analyze forecast for severe weather in next 48 hours
        const next48Hours = data.list.slice(0, 16); // 16 * 3-hour intervals = 48 hours

        let highRiskCount = 0;
        let mediumRiskCount = 0;

        for (const forecast of next48Hours) {
            const weatherConditions = forecast.weather.map((w: any) => w.main);

            if (weatherConditions.some((c: string) => HIGH_RISK_CONDITIONS.includes(c))) {
                highRiskCount++;
            } else if (weatherConditions.some((c: string) => MEDIUM_RISK_CONDITIONS.includes(c))) {
                mediumRiskCount++;
            }
        }

        // Determine risk level
        let risk: RiskLevel;
        if (highRiskCount > 0) {
            risk = 'high';
        } else if (mediumRiskCount > 4) { // More than 25% of forecasts show medium risk
            risk = 'medium';
        } else {
            risk = 'low';
        }

        // Higher confidence for partner data
        const confidence = 85;

        return {
            value: risk,
            confidence,
            sources: [{
                type: 'partner',
                name: 'OpenWeatherMap',
                confidence,
                lastUpdated: new Date(),
                url: 'https://openweathermap.org',
                metadata: {
                    highRiskForecasts: highRiskCount,
                    mediumRiskForecasts: mediumRiskCount,
                    forecastHours: 48,
                },
            }],
            lastUpdated: new Date(),
            trend: highRiskCount > 0 ? 'increasing' : 'stable',
        };

    } catch (error) {
        console.error('Error fetching weather data:', error);

        // Fallback to heuristic if API fails
        return getWeatherRiskFallback(locationName);
    }
}

/**
 * Fallback weather risk using heuristic model
 */
function getWeatherRiskFallback(locationName: string): CorridorDataPoint<RiskLevel> {
    const month = new Date().getMonth();

    // Rainy season in West Africa: May - October
    const isRainySeason = month >= 4 && month <= 9;

    return {
        value: isRainySeason ? 'medium' : 'low',
        confidence: 45,
        sources: [{
            type: 'heuristic',
            name: 'Seasonal Model (Fallback)',
            confidence: 45,
            lastUpdated: new Date(),
            metadata: {
                reason: 'Weather API unavailable',
                season: isRainySeason ? 'rainy' : 'dry',
            },
        }],
        lastUpdated: new Date(),
    };
}

/**
 * Get weather risk for a corridor (checks both origin and destination)
 */
export async function getCorridorWeatherRisk(
    originLat: number,
    originLon: number,
    originName: string,
    destLat: number,
    destLon: number,
    destName: string
): Promise<CorridorDataPoint<RiskLevel>> {
    try {
        // Fetch weather for both locations
        const [originWeather, destWeather] = await Promise.all([
            getWeatherRisk(originLat, originLon, originName),
            getWeatherRisk(destLat, destLon, destName),
        ]);

        // Take the higher risk of the two
        const risk: RiskLevel =
            originWeather.value === 'high' || destWeather.value === 'high' ? 'high' :
                originWeather.value === 'medium' || destWeather.value === 'medium' ? 'medium' : 'low';

        // Average confidence
        const confidence = Math.round((originWeather.confidence + destWeather.confidence) / 2);

        // Combine sources
        const sources: DataSource[] = [
            ...originWeather.sources.map(s => ({ ...s, metadata: { ...s.metadata, location: originName } })),
            ...destWeather.sources.map(s => ({ ...s, metadata: { ...s.metadata, location: destName } })),
        ];

        return {
            value: risk,
            confidence,
            sources,
            lastUpdated: new Date(),
            trend: risk === 'high' ? 'increasing' : 'stable',
        };

    } catch (error) {
        console.error('Error fetching corridor weather risk:', error);
        return getWeatherRiskFallback(`${originName} → ${destName}`);
    }
}

/**
 * Common port coordinates for quick lookup
 */
export const PORT_COORDINATES: Record<string, { lat: number; lon: number }> = {
    // West Africa
    'Abidjan': { lat: 5.3600, lon: -4.0083 },
    'Lagos': { lat: 6.4531, lon: 3.3958 },
    'Tema': { lat: 5.6698, lon: -0.0166 },
    'Dakar': { lat: 14.7167, lon: -17.4677 },
    'Lomé': { lat: 6.1256, lon: 1.2254 },

    // East Africa
    'Mombasa': { lat: -4.0435, lon: 39.6682 },
    'Dar es Salaam': { lat: -6.8160, lon: 39.2803 },
    'Djibouti': { lat: 11.5950, lon: 43.1481 },

    // Southern Africa
    'Durban': { lat: -29.8587, lon: 31.0218 },
    'Cape Town': { lat: -33.9249, lon: 18.4241 },

    // Europe
    'Rotterdam': { lat: 51.9225, lon: 4.4792 },
    'Antwerp': { lat: 51.2194, lon: 4.4025 },
    'Le Havre': { lat: 49.4944, lon: 0.1079 },
    'Marseille': { lat: 43.2965, lon: 5.3698 },

    // North America
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Miami': { lat: 25.7617, lon: -80.1918 },

    // Middle East
    'Dubai': { lat: 25.2048, lon: 55.2708 },
    'Jeddah': { lat: 21.5433, lon: 39.1728 },
};

/**
 * Get coordinates for a city/port
 */
export function getPortCoordinates(cityName: string): { lat: number; lon: number } | null {
    // Try exact match first
    if (PORT_COORDINATES[cityName]) {
        return PORT_COORDINATES[cityName];
    }

    // Try partial match
    const partialMatch = Object.keys(PORT_COORDINATES).find(port =>
        cityName.includes(port) || port.includes(cityName)
    );

    if (partialMatch) {
        return PORT_COORDINATES[partialMatch];
    }

    return null;
}

export default {
    getWeatherRisk,
    getCorridorWeatherRisk,
    getPortCoordinates,
    PORT_COORDINATES,
};
