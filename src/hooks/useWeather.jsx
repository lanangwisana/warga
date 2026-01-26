// Custom hook for weather data
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudFog, CloudRain, CloudLightning } from 'lucide-react';

export const useWeather = () => {
    const [weather, setWeather] = useState(null);
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Bandung Coordinates
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.9175&longitude=107.6191&current_weather=true&timezone=auto');
                const data = await res.json();
                if (data && data.current_weather) {
                    setWeather(data.current_weather);
                }
            } catch (e) { console.error("Weather error", e); }
        };
        fetchWeather();
    }, []);
    return weather;
};

export const getWeatherIcon = (code, isNight) => {
    if (code === undefined) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code <= 1) return isNight ? <Moon className="w-5 h-5 text-yellow-200" /> : <Sun className="w-5 h-5 text-yellow-400" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-gray-200" />;
    if (code <= 48) return <CloudFog className="w-5 h-5 text-gray-300" />;
    if (code <= 67) return <CloudRain className="w-5 h-5 text-blue-300" />;
    if (code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code <= 99) return <CloudLightning className="w-5 h-5 text-purple-400" />;
    return <Sun className="w-5 h-5 text-yellow-400" />;
};
