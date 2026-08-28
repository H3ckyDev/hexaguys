import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "./firebase";

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

export function getPersistentPlayerId(): string {
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  return "guest_" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36));
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

/**
 * Registra resultados de partida exclusivamente en Firebase Firestore
 * Los usuarios invitados (sin login) NO guardan progreso en la BD ni en localStorage.
 */
export async function recordMatchResult(payload: MatchResultPayload): Promise<void> {
  const currentUserId = auth?.currentUser?.uid;
  // Solo los usuarios logueados guardan estadísticas en Firestore
  if (!currentUserId || !isFirebaseConfigured || !db) {
    return;
  }

  const currentWeek = getWeekKey();
  const currentMonth = getMonthKey();
  const now = Date.now();

  try {
    const docRef = doc(db, "leaderboard_players", currentUserId);
    const userDocRef = doc(db, "users", currentUserId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const prev = docSnap.data() as LeaderboardPlayer;
      const isNewWeek = prev.lastWeekKey !== currentWeek;
      const isNewMonth = prev.lastMonthKey !== currentMonth;

      const updateData: Record<string, unknown> = {
        nickname: payload.nickname || prev.nickname,
        skin: payload.skin || prev.skin,
        avatar: payload.avatar || prev.avatar,
        color: payload.color || prev.color,
        allTimeScore: increment(payload.scoreGained),
        allTimeMatches: increment(1),
        allTimeWins: increment(payload.isWin ? 1 : 0),
        lastWeekKey: currentWeek,
        lastMonthKey: currentMonth,
        updatedAt: now,
      };

      if (isNewWeek) {
        updateData.weeklyScore = payload.scoreGained;
        updateData.weeklyMatches = 1;
        updateData.weeklyWins = payload.isWin ? 1 : 0;
      } else {
        updateData.weeklyScore = increment(payload.scoreGained);
        updateData.weeklyMatches = increment(1);
        updateData.weeklyWins = increment(payload.isWin ? 1 : 0);
      }

      if (isNewMonth) {
        updateData.monthlyScore = payload.scoreGained;
        updateData.monthlyMatches = 1;
        updateData.monthlyWins = payload.isWin ? 1 : 0;
      } else {
        updateData.monthlyScore = increment(payload.scoreGained);
        updateData.monthlyMatches = increment(1);
        updateData.monthlyWins = increment(payload.isWin ? 1 : 0);
      }

      await updateDoc(docRef, updateData);
    } else {
      const data: LeaderboardPlayer = {
        playerId: currentUserId,
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

      await setDoc(docRef, data, { merge: true });
    }

    // Sincronizar también estadísticas agregadas en users/{uid}
    await setDoc(
      userDocRef,
      {
        allTimeScore: increment(payload.scoreGained),
        allTimeMatches: increment(1),
        allTimeWins: increment(payload.isWin ? 1 : 0),
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[Leaderboard] Error al guardar estadísticas en Firestore:", error);
  }
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

/**
 * Consulta la tabla de posiciones directamente desde Firestore
 */
export async function fetchLeaderboard(
  metric: LeaderboardMetric = "score",
  period: LeaderboardPeriod = "weekly"
): Promise<LeaderboardPlayer[]> {
  const sortField = getFieldForQuery(metric, period);
  const currentWeek = getWeekKey();
  const currentMonth = getMonthKey();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "leaderboard_players"),
        orderBy(sortField, "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
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
          weeklyScore: item.lastWeekKey === currentWeek ? item.weeklyScore || 0 : 0,
          weeklyMatches: item.lastWeekKey === currentWeek ? item.weeklyMatches || 0 : 0,
          weeklyWins: item.lastWeekKey === currentWeek ? item.weeklyWins || 0 : 0,
          monthlyScore: item.lastMonthKey === currentMonth ? item.monthlyScore || 0 : 0,
          monthlyMatches: item.lastMonthKey === currentMonth ? item.monthlyMatches || 0 : 0,
          monthlyWins: item.lastMonthKey === currentMonth ? item.monthlyWins || 0 : 0,
          lastWeekKey: item.lastWeekKey || currentWeek,
          lastMonthKey: item.lastMonthKey || currentMonth,
          updatedAt: item.updatedAt || 0,
        };
        results.push(playerItem);
      });

      return results;
    } catch (e) {
      console.warn("[Leaderboard] Error al consultar Firestore:", e);
      return [];
    }
  }

  return [];
}
