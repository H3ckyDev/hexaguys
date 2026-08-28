import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export type LeaderboardMetric = "score" | "matches";
export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";

export interface LeaderboardPlayer {
  playerId: string;
  nickname: string;
  skin: string;
  avatar?: string;
  color: string;
  allTimeScore: number;
  allTimeMatches: number;
  allTimeWins: number;
  weeklyScore: number;
  weeklyMatches: number;
  weeklyWins: number;
  monthlyScore: number;
  monthlyMatches: number;
  monthlyWins: number;
  lastWeekKey: string;
  lastMonthKey: string;
  updatedAt: number;
}

export function getWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const LOCAL_STORAGE_KEY = "hexaguys_leaderboard_data";
const PLAYER_ID_STORAGE_KEY = "hexaguys_player_uuid";

export function getPersistentPlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
    if (!id) {
      id = "p_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
      localStorage.setItem(PLAYER_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "p_guest_" + Date.now().toString(36);
  }
}

function getLocalPlayers(): LeaderboardPlayer[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: LeaderboardPlayer[] = JSON.parse(raw);
    // Filtrar posibles datos quemados previos de demo
    const realPlayers = parsed.filter((p) => !p.playerId.startsWith("demo_"));
    if (realPlayers.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(realPlayers));
    }
    return realPlayers;
  } catch {
    return [];
  }
}

function saveLocalPlayers(players: LeaderboardPlayer[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    console.error("[Leaderboard] Failed to save to localStorage", e);
  }
}

export interface MatchResultPayload {
  playerId: string;
  nickname: string;
  skin: string;
  avatar?: string;
  color: string;
  scoreGained: number;
  isWin: boolean;
}

export async function recordMatchResult(payload: MatchResultPayload): Promise<void> {
  const currentWeek = getWeekKey();
  const currentMonth = getMonthKey();
  const now = Date.now();

  // 1. Registro en Firebase Firestore (si está configurado)
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "leaderboard_players", payload.playerId);
      const docSnap = await getDoc(docRef);

      let data: LeaderboardPlayer;
      if (docSnap.exists()) {
        const prev = docSnap.data() as LeaderboardPlayer;
        const isNewWeek = prev.lastWeekKey !== currentWeek;
        const isNewMonth = prev.lastMonthKey !== currentMonth;

        data = {
          playerId: payload.playerId,
          nickname: payload.nickname || prev.nickname,
          skin: payload.skin || prev.skin,
          avatar: payload.avatar || prev.avatar,
          color: payload.color || prev.color,
          allTimeScore: (prev.allTimeScore || 0) + payload.scoreGained,
          allTimeMatches: (prev.allTimeMatches || 0) + 1,
          allTimeWins: (prev.allTimeWins || 0) + (payload.isWin ? 1 : 0),
          weeklyScore: (isNewWeek ? 0 : prev.weeklyScore || 0) + payload.scoreGained,
          weeklyMatches: (isNewWeek ? 0 : prev.weeklyMatches || 0) + 1,
          weeklyWins: (isNewWeek ? 0 : prev.weeklyWins || 0) + (payload.isWin ? 1 : 0),
          monthlyScore: (isNewMonth ? 0 : prev.monthlyScore || 0) + payload.scoreGained,
          monthlyMatches: (isNewMonth ? 0 : prev.monthlyMatches || 0) + 1,
          monthlyWins: (isNewMonth ? 0 : prev.monthlyWins || 0) + (payload.isWin ? 1 : 0),
          lastWeekKey: currentWeek,
          lastMonthKey: currentMonth,
          updatedAt: now,
        };
      } else {
        data = {
          playerId: payload.playerId,
          nickname: payload.nickname || "Jugador",
          skin: payload.skin || "robot",
          avatar: payload.avatar,
          color: payload.color || "#38bdf8",
          allTimeScore: payload.scoreGained,
          allTimeMatches: 1,
          allTimeWins: payload.isWin ? 1 : 0,
          weeklyScore: payload.scoreGained,
          weeklyMatches: 1,
          weeklyWins: payload.isWin ? 1 : 0,
          monthlyScore: payload.scoreGained,
          monthlyMatches: 1,
          monthlyWins: payload.isWin ? 1 : 0,
          lastWeekKey: currentWeek,
          lastMonthKey: currentMonth,
          updatedAt: now,
        };
      }

      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.warn("[Leaderboard] Error saving match to Firebase, using local fallback:", error);
    }
  }

  // 2. Registro espejo en LocalStorage
  const localList = getLocalPlayers();
  const index = localList.findIndex((p) => p.playerId === payload.playerId);

  if (index >= 0) {
    const prev = localList[index];
    const isNewWeek = prev.lastWeekKey !== currentWeek;
    const isNewMonth = prev.lastMonthKey !== currentMonth;

    localList[index] = {
      ...prev,
      nickname: payload.nickname || prev.nickname,
      skin: payload.skin || prev.skin,
      avatar: payload.avatar || prev.avatar,
      color: payload.color || prev.color,
      allTimeScore: (prev.allTimeScore || 0) + payload.scoreGained,
      allTimeMatches: (prev.allTimeMatches || 0) + 1,
      allTimeWins: (prev.allTimeWins || 0) + (payload.isWin ? 1 : 0),
      weeklyScore: (isNewWeek ? 0 : prev.weeklyScore || 0) + payload.scoreGained,
      weeklyMatches: (isNewWeek ? 0 : prev.weeklyMatches || 0) + 1,
      weeklyWins: (isNewWeek ? 0 : prev.weeklyWins || 0) + (payload.isWin ? 1 : 0),
      monthlyScore: (isNewMonth ? 0 : prev.monthlyScore || 0) + payload.scoreGained,
      monthlyMatches: (isNewMonth ? 0 : prev.monthlyMatches || 0) + 1,
      monthlyWins: (isNewMonth ? 0 : prev.monthlyWins || 0) + (payload.isWin ? 1 : 0),
      lastWeekKey: currentWeek,
      lastMonthKey: currentMonth,
      updatedAt: now,
    };
  } else {
    localList.push({
      playerId: payload.playerId,
      nickname: payload.nickname || "Jugador",
      skin: payload.skin || "robot",
      avatar: payload.avatar,
      color: payload.color || "#38bdf8",
      allTimeScore: payload.scoreGained,
      allTimeMatches: 1,
      allTimeWins: payload.isWin ? 1 : 0,
      weeklyScore: payload.scoreGained,
      weeklyMatches: 1,
      weeklyWins: payload.isWin ? 1 : 0,
      monthlyScore: payload.scoreGained,
      monthlyMatches: 1,
      monthlyWins: payload.isWin ? 1 : 0,
      lastWeekKey: currentWeek,
      lastMonthKey: currentMonth,
      updatedAt: now,
    });
  }

  saveLocalPlayers(localList);
}

export function getFieldForQuery(metric: LeaderboardMetric, period: LeaderboardPeriod): keyof LeaderboardPlayer {
  if (metric === "score") {
    if (period === "weekly") return "weeklyScore";
    if (period === "monthly") return "monthlyScore";
    return "allTimeScore";
  } else {
    if (period === "weekly") return "weeklyMatches";
    if (period === "monthly") return "monthlyMatches";
    return "allTimeMatches";
  }
}

export async function fetchLeaderboard(
  metric: LeaderboardMetric = "score",
  period: LeaderboardPeriod = "weekly"
): Promise<LeaderboardPlayer[]> {
  const sortField = getFieldForQuery(metric, period);
  const currentWeek = getWeekKey();
  const currentMonth = getMonthKey();

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "leaderboard_players"));
      const results: LeaderboardPlayer[] = [];
      snap.forEach((d) => {
        const item = d.data() as Partial<LeaderboardPlayer>;
        const playerItem: LeaderboardPlayer = {
          playerId: d.id || item.playerId || "unknown",
          nickname: item.nickname || "Jugador",
          skin: item.skin || "robot",
          avatar: item.avatar,
          color: item.color || "#38bdf8",
          allTimeScore: item.allTimeScore || 0,
          allTimeMatches: item.allTimeMatches || 0,
          allTimeWins: item.allTimeWins || 0,
          weeklyScore: item.lastWeekKey === currentWeek ? (item.weeklyScore || 0) : 0,
          weeklyMatches: item.lastWeekKey === currentWeek ? (item.weeklyMatches || 0) : 0,
          weeklyWins: item.lastWeekKey === currentWeek ? (item.weeklyWins || 0) : 0,
          monthlyScore: item.lastMonthKey === currentMonth ? (item.monthlyScore || 0) : 0,
          monthlyMatches: item.lastMonthKey === currentMonth ? (item.monthlyMatches || 0) : 0,
          monthlyWins: item.lastMonthKey === currentMonth ? (item.monthlyWins || 0) : 0,
          lastWeekKey: item.lastWeekKey || currentWeek,
          lastMonthKey: item.lastMonthKey || currentMonth,
          updatedAt: item.updatedAt || Date.now(),
        };
        results.push(playerItem);
      });

      console.log(`[Leaderboard] Obtenidos ${results.length} jugadores de Firestore (${metric} / ${period}):`, results);
      return results.sort((a, b) => Number(b[sortField] || 0) - Number(a[sortField] || 0)).slice(0, 50);
    } catch (error) {
      console.warn("[Leaderboard] Error al consultar Firestore, usando datos locales:", error);
    }
  }

  // Fallback local
  const list = getLocalPlayers().map((item) => {
    const cloned = { ...item };
    if (cloned.lastWeekKey !== currentWeek) {
      cloned.weeklyScore = 0;
      cloned.weeklyMatches = 0;
      cloned.weeklyWins = 0;
    }
    if (cloned.lastMonthKey !== currentMonth) {
      cloned.monthlyScore = 0;
      cloned.monthlyMatches = 0;
      cloned.monthlyWins = 0;
    }
    return cloned;
  });

  return list.sort((a, b) => Number(b[sortField] || 0) - Number(a[sortField] || 0)).slice(0, 50);
}
