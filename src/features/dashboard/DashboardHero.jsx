// Dashboard Hero Component
import React from 'react';
import { useWeather, getWeatherIcon } from '../../hooks';
import { getTimeGreeting } from '../../utils';
import { USER_PHOTO_URL } from '../../config';

export const DashboardHero = ({ profile, onShowId }) => {
    const weather = useWeather();
    const greeting = getTimeGreeting();
    const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;

    return (
        <div className="px-1 mb-6 mt-2 select-none animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex-1">
                        <p className="text-emerald-100 text-xs font-medium mb-1 tracking-wide opacity-90">{greeting},</p>
                        <h2 className="text-3xl font-bold tracking-tight mb-4 leading-none">{profile?.name?.split(' ')[0] || 'Warga'}</h2>
                        
                        <div className="flex items-center gap-3">
                             {weather ? (
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-sm">
                                    <span className="text-yellow-300 drop-shadow-sm">{getWeatherIcon(weather.weathercode, isNight)}</span>
                                    <span className="text-sm font-bold">{weather.temperature}°</span>
                                </div>
                            ) : (
                                <div className="h-8 w-16 bg-white/10 rounded-2xl animate-pulse"></div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-200 font-medium">Bumi Adipura</span>
                                <span className="text-[10px] font-bold text-white">{profile?.cluster || 'Cluster A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={onShowId} className="w-16 h-16 rounded-[20px] bg-white/10 p-1 backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer active:scale-90 transition-transform hover:rotate-3">
                        <div className="w-full h-full rounded-2xl bg-emerald-800 flex items-center justify-center border border-white/20">
                            <span className="text-2xl font-bold text-white">
                                {(profile?.name || 'W').charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
