import { useState, useEffect, useCallback } from "react";
import {
  fetchLeaderboard,
  type LeaderboardPlayer,
  type LeaderboardMetric,
  type LeaderboardPeriod,
  getPersistentPlayerId,
  getFieldForQuery,
} from "../services/leaderboardService";
import { isFirebaseConfigured } from "../services/firebase";
import {
  TrophyIcon,
  CloseIcon,
  CoinIcon,
  CrownIcon,
  PlayIcon,
  CalendarIcon,
  RefreshIcon,
} from "./Icons";
import { CyberAvatar } from "./CyberAvatar";
import { playStepSound } from "../utils/sounds";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname?: string;
}

export function LeaderboardModal({ isOpen, onClose, currentNickname }: LeaderboardModalProps) {
  const [metric, setMetric] = useState<LeaderboardMetric>("score");
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const localPlayerId = getPersistentPlayerId();

  const loadData = useCallback(async (m: LeaderboardMetric, p: LeaderboardPeriod) => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(m, p);
      setPlayers(data);
    } catch (e) {
      console.error("Error loading leaderboard:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData(metric, period);
    }
  }, [isOpen, metric, period, loadData]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSortField = getFieldForQuery(metric, period);

  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];
  const restPlayers = players.slice(3);

  const myIndex = players.findIndex((p) => p.playerId === localPlayerId);
  const myPlayerRecord = myIndex >= 0 ? players[myIndex] : null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans antialiased cursor-pointer select-none"
      onClick={() => {
        playStepSound();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#090d1a] border border-[#243464] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden relative cursor-default pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Cabecera del Modal */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#1a254a] flex items-center justify-between bg-gradient-to-r from-[#0e1633] via-[#090d1a] to-[#0e1633]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <TrophyIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white font-mono">
                  TABLA DE CLASIFICACIÓN
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 font-bold">
                  {isFirebaseConfigured ? "EN LÍNEA" : "LOCAL"}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Compite por los primeros puestos y desbloquea prestigio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de Recargar */}
            <button
              onClick={() => {
                playStepSound();
                loadData(metric, period);
              }}
              title="Actualizar datos"
              className={`w-8 h-8 rounded-xl bg-[#141b36] hover:bg-[#1f2952] border border-[#243464] text-slate-300 hover:text-cyan-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                isLoading ? "animate-spin text-cyan-400" : ""
              }`}
            >
              <RefreshIcon className="w-4 h-4" />
            </button>

            {/* Botón de Cerrar */}
            <button
              onClick={() => {
                playStepSound();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-[#141b36] hover:bg-rose-500/20 border border-[#243464] hover:border-rose-500/50 text-slate-400 hover:text-rose-300 flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Cerrar modal"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Controles de Filtrado (Métricas y Periodos) */}
        <div className="p-4 sm:px-6 bg-[#0c1226] border-b border-[#1a254a] flex flex-wrap items-center justify-between gap-3">
          {/* Alternar Métrica (Puntos vs Partidas) */}
          <div className="flex items-center p-1 rounded-2xl bg-[#070a14] border border-[#1e2a52]">
            <button
              onClick={() => {
                playStepSound();
                setMetric("score");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metric === "score"
                  ? "bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CoinIcon className="w-3.5 h-3.5" />
              <span>Top Puntos</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setMetric("matches");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                metric === "matches"
                  ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <PlayIcon className="w-3.5 h-3.5" />
              <span>Más Partidas</span>
            </button>
          </div>

          {/* Alternar Periodo (Semanal vs Mensual vs Histórico) */}
          <div className="flex items-center p-1 rounded-2xl bg-[#070a14] border border-[#1e2a52]">
            <button
              onClick={() => {
                playStepSound();
                setPeriod("weekly");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === "weekly"
                  ? "bg-blue-600/30 border border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Semanal</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setPeriod("monthly");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === "monthly"
                  ? "bg-blue-600/30 border border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Mensual</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setPeriod("allTime");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === "allTime"
                  ? "bg-blue-600/30 border border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Histórico</span>
            </button>
          </div>
        </div>

        {/* 3. Contenido Central con Podio y Tabla */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">
                Cargando Clasificaciones...
              </span>
            </div>
          ) : players.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl bg-[#0e1633] border border-[#243464] flex items-center justify-center text-slate-500 shadow-inner">
                <TrophyIcon className="w-7 h-7 text-slate-500" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-sm font-black text-white font-mono uppercase tracking-wider">
                  TABLÓN DISPONIBLE
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Aún no hay partidas registradas para este periodo. ¡Completa una ronda para aparecer de primero en la tabla!
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Podio Dinámico Top 3 */}
              <div
                className={`grid gap-2 sm:gap-4 items-end pt-4 pb-2 ${
                  players.length === 1
                    ? "grid-cols-1 max-w-xs mx-auto"
                    : players.length === 2
                    ? "grid-cols-2 max-w-md mx-auto"
                    : "grid-cols-3"
                }`}
              >
                {/* 🥈 Segundo Lugar (Plata / Cian) */}
                {top2 && (
                  <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#0d142c] border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative order-1">
                    <div className="w-7 h-7 -mt-7 mb-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center text-xs font-black font-mono shadow-md">
                      2
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 shadow-md">
                      <CyberAvatar
                        config={top2.avatar || top2.skin}
                        seed={top2.nickname}
                        color={top2.color}
                        size={52}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {top2.nickname}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                      {top2[currentSortField]}{" "}
                      <span className="text-[10px] text-slate-400">
                        {metric === "score" ? "PTS" : "PARTIDAS"}
                      </span>
                    </span>
                  </div>
                )}

                {/* 🥇 Primer Lugar (Oro / Corona) */}
                {top1 && (
                  <div className={`flex flex-col items-center p-4 sm:p-5 rounded-3xl bg-[#111936] border border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative ${players.length >= 3 ? "order-2 scale-105" : "order-1"} z-10`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
                      <CrownIcon className="w-7 h-7 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg mt-1">
                      <CyberAvatar
                        config={top1.avatar || top1.skin}
                        seed={top1.nickname}
                        color={top1.color}
                        size={64}
                      />
                    </div>
                    <span className="text-sm sm:text-base font-black text-white truncate max-w-full">
                      {top1.nickname}
                    </span>
                    <span className="text-sm font-mono font-black text-amber-300 mt-0.5">
                      {top1[currentSortField]}{" "}
                      <span className="text-xs text-amber-400/80">
                        {metric === "score" ? "PTS" : "PARTIDAS"}
                      </span>
                    </span>
                  </div>
                )}

                {/* 🥉 Tercer Lugar (Bronce / Ámbar) */}
                {top3 && (
                  <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#0d142c] border border-amber-600/40 shadow-[0_0_20px_rgba(217,119,6,0.15)] relative order-3">
                    <div className="w-7 h-7 -mt-7 mb-1 rounded-full bg-amber-600/20 border border-amber-500 text-amber-400 flex items-center justify-center text-xs font-black font-mono shadow-md">
                      3
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 shadow-md">
                      <CyberAvatar
                        config={top3.avatar || top3.skin}
                        seed={top3.nickname}
                        color={top3.color}
                        size={52}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {top3.nickname}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      {top3[currentSortField]}{" "}
                      <span className="text-[10px] text-slate-400">
                        {metric === "score" ? "PTS" : "PARTIDAS"}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Lista Clasificada del #4 en adelante */}
              {restPlayers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-400 px-3 pb-1 border-b border-[#1a254a]">
                    <span># Posición & Jugador</span>
                    <span>{metric === "score" ? "Puntuación" : "Partidas"}</span>
                  </div>

                  {restPlayers.map((player, idx) => {
                    const rank = idx + 4;
                    const isMe = player.playerId === localPlayerId;

                    return (
                      <div
                        key={player.playerId}
                        className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                          isMe
                            ? "bg-[#162247] border border-blue-500/60 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                            : "bg-[#0b1022] border border-[#1a254a] hover:border-[#2b3b70]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 w-5 text-left">
                            #{rank}
                          </span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                            <CyberAvatar
                              config={player.avatar || player.skin}
                              seed={player.nickname}
                              color={player.color}
                              size={32}
                            />
                          </div>
                          <span className="text-sm font-black text-white truncate max-w-[140px] sm:max-w-[200px]">
                            {player.nickname} {isMe && "(Tú)"}
                          </span>
                        </div>

                        <span className="text-sm font-mono font-bold text-white">
                          {player[currentSortField]}{" "}
                          <span className="text-xs text-slate-400">
                            {metric === "score" ? "PTS" : ""}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Barra Inferior Fija "Tu Puesto Actual" */}
        <div className="p-4 sm:px-6 bg-[#0c1226] border-t border-[#1a254a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
              {myIndex >= 0 ? `#${myIndex + 1}` : "-"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">
                {currentNickname || "Tú"} (Tu Registro)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {myPlayerRecord
                  ? `${myPlayerRecord[currentSortField]} ${metric === "score" ? "puntos" : "partidas"}`
                  : "Juega una partida para clasificar"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              playStepSound();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#141b36] hover:bg-[#1a2345] border border-[#243464] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
