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
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans antialiased cursor-pointer select-none"
      onClick={() => {
        playStepSound();
        onClose();
      }}
    >
      <div
        className="stealth-panel w-full max-w-2xl max-h-[90vh] flex flex-col relative cursor-default pointer-events-auto overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Cabecera del Modal */}
        <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <TrophyIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-tight text-white font-mono">
                  SALÓN DE LA FAMA // RANKING
                </h2>
                <span className="tech-tag">
                  {isFirebaseConfigured ? "GLOBAL ONLINE" : "LOCAL"}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                TELEMETRÍA GLOBAL DE SUPERVIVIENTES
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
              className={`btn-esports-ghost w-8 h-8 flex items-center justify-center cursor-pointer ${
                isLoading ? "animate-spin text-cyan-400" : ""
              }`}
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </button>

            {/* Botón de Cerrar */}
            <button
              onClick={() => {
                playStepSound();
                onClose();
              }}
              className="w-8 h-8 bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 flex items-center justify-center cursor-pointer"
              title="Cerrar modal"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Controles de Filtrado (Métricas y Periodos) */}
        <div className="p-3 bg-[#050811] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Alternar Métrica (Puntos vs Partidas) */}
          <div className="flex items-center p-1 bg-[#090d1a] border border-white/10">
            <button
              onClick={() => {
                playStepSound();
                setMetric("score");
              }}
              className={`btn-esports-tab ${
                metric === "score" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
              }`}
            >
              <CoinIcon className="w-3 h-3 inline mr-1" />
              <span>TOP PUNTOS</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setMetric("matches");
              }}
              className={`btn-esports-tab ${
                metric === "matches" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
              }`}
            >
              <PlayIcon className="w-3 h-3 inline mr-1" />
              <span>MÁS PARTIDAS</span>
            </button>
          </div>

          {/* Alternar Periodo (Semanal vs Mensual vs Histórico) */}
          <div className="flex items-center p-1 bg-[#090d1a] border border-white/10">
            <button
              onClick={() => {
                playStepSound();
                setPeriod("weekly");
              }}
              className={`btn-esports-tab ${
                period === "weekly" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
              }`}
            >
              <CalendarIcon className="w-3 h-3 inline mr-1" />
              <span>SEMANAL</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setPeriod("monthly");
              }}
              className={`btn-esports-tab ${
                period === "monthly" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
              }`}
            >
              <span>MENSUAL</span>
            </button>

            <button
              onClick={() => {
                playStepSound();
                setPeriod("allTime");
              }}
              className={`btn-esports-tab ${
                period === "allTime" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
              }`}
            >
              <span>HISTÓRICO</span>
            </button>
          </div>
        </div>

        {/* 3. Contenido Central con Podio y Tabla */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 bg-[#070a12]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
                CARGANDO CLASIFICACIONES...
              </span>
            </div>
          ) : players.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 bg-[#0d1222] border border-white/10 flex items-center justify-center text-slate-500">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  TABLA DISPONIBLE
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Aún no hay registros para este periodo. ¡Completa una partida para clasificar!
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Podio Táctico Top 3 */}
              <div
                className={`grid gap-3 items-end pt-4 pb-2 ${
                  players.length === 1
                    ? "grid-cols-1 max-w-xs mx-auto"
                    : players.length === 2
                    ? "grid-cols-2 max-w-md mx-auto"
                    : "grid-cols-3"
                }`}
              >
                {/* 🥈 Segundo Lugar */}
                {top2 && (
                  <div className="flex flex-col items-center p-3.5 bg-[#090e1c] border border-cyan-400/40 relative order-1">
                    <div className="text-[10px] font-mono font-black text-cyan-300 border border-cyan-400/50 px-2 py-0.5 bg-[#060a17] -mt-6 mb-1 tabular-nums">
                      #2 PLATINO
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center mb-1">
                      <CyberAvatar
                        config={top2.avatar || top2.skin}
                        seed={top2.nickname}
                        color={top2.color}
                        size={48}
                      />
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-full font-mono">
                      {top2.nickname}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums mt-0.5">
                      {top2[currentSortField]}{" "}
                      <span className="text-[9px] text-slate-500 font-mono">
                        {metric === "score" ? "PTS" : "PAR"}
                      </span>
                    </span>
                  </div>
                )}

                {/* 🥇 Primer Lugar */}
                {top1 && (
                  <div className={`flex flex-col items-center p-4 bg-[#101422] border-2 border-amber-400 shadow-[0_0_25px_rgba(255,208,0,0.25)] relative ${players.length >= 3 ? "order-2 scale-105" : "order-1"} z-10`}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center">
                      <CrownIcon className="w-6 h-6 text-amber-400 animate-bounce" />
                    </div>
                    <div className="w-14 h-14 flex items-center justify-center mb-1 mt-1">
                      <CyberAvatar
                        config={top1.avatar || top1.skin}
                        seed={top1.nickname}
                        color={top1.color}
                        size={56}
                      />
                    </div>
                    <span className="text-sm font-black text-white truncate max-w-full font-mono">
                      {top1.nickname}
                    </span>
                    <span className="text-sm font-mono font-black text-amber-300 tabular-nums mt-0.5">
                      {top1[currentSortField]}{" "}
                      <span className="text-[10px] text-amber-400/80">
                        {metric === "score" ? "PTS" : "PAR"}
                      </span>
                    </span>
                  </div>
                )}

                {/* 🥉 Tercer Lugar */}
                {top3 && (
                  <div className="flex flex-col items-center p-3.5 bg-[#090e1c] border border-amber-600/40 relative order-3">
                    <div className="text-[10px] font-mono font-black text-amber-400 border border-amber-500/50 px-2 py-0.5 bg-[#060a17] -mt-6 mb-1 tabular-nums">
                      #3 BRONCE
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center mb-1">
                      <CyberAvatar
                        config={top3.avatar || top3.skin}
                        seed={top3.nickname}
                        color={top3.color}
                        size={48}
                      />
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-full font-mono">
                      {top3.nickname}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                      {top3[currentSortField]}{" "}
                      <span className="text-[9px] text-slate-500 font-mono">
                        {metric === "score" ? "PTS" : "PAR"}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Lista Clasificada del #4 en adelante */}
              {restPlayers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-500 px-3 pb-1 border-b border-white/10">
                    <span># POSICIÓN & JUGADOR</span>
                    <span>{metric === "score" ? "PUNTUACIÓN" : "PARTIDAS"}</span>
                  </div>

                  {restPlayers.map((player, idx) => {
                    const rank = idx + 4;
                    const isMe = player.playerId === localPlayerId;

                    return (
                      <div
                        key={player.playerId}
                        className={`flex items-center justify-between p-2.5 transition-all ${
                          isMe
                            ? "bg-[#111933] border border-cyan-400 text-white"
                            : "bg-[#060912] border border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500 w-6 text-left tabular-nums">
                            #{rank}
                          </span>
                          <div className="w-7 h-7 flex items-center justify-center">
                            <CyberAvatar
                              config={player.avatar || player.skin}
                              seed={player.nickname}
                              color={player.color}
                              size={28}
                            />
                          </div>
                          <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[220px] font-mono">
                            {player.nickname} {isMe && <span className="text-cyan-400 text-xs font-bold">(Tú)</span>}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-white tabular-nums">
                          {player[currentSortField]}{" "}
                          <span className="text-[9px] text-slate-500">
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
        <div className="p-3.5 sm:px-6 bg-[#050811] border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono font-black text-xs tabular-nums">
              {myIndex >= 0 ? `#${myIndex + 1}` : "-"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white font-mono">
                {currentNickname || "Tú"} <span className="text-slate-500">(Tu Registro)</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold tabular-nums">
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
            className="btn-esports-ghost px-5 py-2 text-xs font-mono font-bold cursor-pointer"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}
