// Dashboard Hero Component
import React from "react";
import { getTimeGreeting } from "../../utils";
import { USER_PHOTO_URL } from "../../config";

export const DashboardHero = ({ profile, onShowId }) => {
  const greeting = getTimeGreeting();
  const displayName = profile?.name || 'Warga';
  const nameSize = displayName.length <= 10 ? 'text-3xl' : displayName.length <= 18 ? 'text-2xl' : 'text-xl';

  return (
    <div className="px-1 mb-6 mt-2 select-none animate-fade-in">
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-emerald-100 text-xs font-medium mb-1 tracking-wide opacity-90">
              {greeting},
            </p>
            <h2 className={`${nameSize} font-bold tracking-tight mb-4 leading-tight truncate`}>
              {displayName}
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-200 font-medium">
                  Bumi Adipura
                </span>
                <span className="text-[10px] font-bold text-white">
                  {profile?.unit || "Warga Tetap"}
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={onShowId}
            className="w-16 h-16 rounded-[20px] bg-white/10 p-1 backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer active:scale-90 transition-transform hover:rotate-3"
          >
            <div className="w-full h-full rounded-2xl bg-emerald-800 flex items-center justify-center border border-white/20 overflow-hidden">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {(profile?.name || 'W').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
