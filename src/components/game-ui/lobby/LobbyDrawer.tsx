import { memo, ReactNode } from "react";
import { UserIcon, GridIcon, UsersIcon, CloseIcon } from "../../Icons";
import { playStepSound } from "../../../utils/sounds";

interface LobbyDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: "custom" | "match" | "players";
  onTabChange: (tab: "custom" | "match" | "players") => void;
  playerCount: number;
  children: ReactNode;
}

export const LobbyDrawer = memo(function LobbyDrawer({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  playerCount,
  children,
}: LobbyDrawerProps) {
  if (!isOpen) return null;

  const handleTabClick = (tab: "custom" | "match" | "players") => {
    onTabChange(tab);
    playStepSound();
  };

  return (
    <div className="stealth-panel w-full p-5 sm:p-6 text-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom duration-150">
      {/* Segmented Control Bar */}
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <div className="flex p-1 bg-[#050811] border border-white/10 gap-1 w-full sm:w-auto" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "custom"}
            onClick={() => handleTabClick("custom")}
            className={`btn-esports-tab ${
              activeTab === "custom" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 inline mr-1" />
            <span>ASPECTO</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "match"}
            onClick={() => handleTabClick("match")}
            className={`btn-esports-tab ${
              activeTab === "match" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
            }`}
          >
            <GridIcon className="w-3.5 h-3.5 inline mr-1" />
            <span>ARENA & PISOS</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "players"}
            onClick={() => handleTabClick("players")}
            className={`btn-esports-tab ${
              activeTab === "players" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5 inline mr-1" />
            <span>JUGADORES ({playerCount})</span>
          </button>
        </div>

        <button
          onClick={onToggle}
          className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer ml-2"
          aria-label="Cerrar taller"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {children}
    </div>
  );
});
