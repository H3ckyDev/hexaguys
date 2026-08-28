import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "./firebase";
import type { AvatarConfig } from "../types/game";
import { serializeAvatar, deserializeAvatar } from "../utils/avatarGenerator";

export interface UserProfileData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  nickname: string;
  avatarConfig: AvatarConfig;
  color: string;
  skin?: string;
  allTimeScore?: number;
  allTimeMatches?: number;
  allTimeWins?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Perfil en memoria de la sesión activa
let activeProfile: UserProfileData | null = null;

export function getActiveProfile(): UserProfileData | null {
  return activeProfile;
}

export function createDefaultGuestProfile(): UserProfileData {
  const rand = Math.floor(Math.random() * 900 + 100);
  return {
    uid: `guest_${rand}`,
    email: null,
    displayName: "Invitado",
    photoURL: null,
    nickname: `Invitado_${rand}`,
    avatarConfig: deserializeAvatar(null),
    color: "#0284c7",
    skin: "robot",
    allTimeScore: 0,
    allTimeMatches: 0,
    allTimeWins: 0,
  };
}

/**
 * Inicia sesión mediante ventana emergente de Google y guarda/carga exclusivamente en Firestore
 */
export async function signInWithGoogle(
  preferredNickname?: string
): Promise<{ user: User; profile: UserProfileData; isNewUser: boolean } | null> {
  if (!auth || !isFirebaseConfigured) {
    console.warn("[Auth] Firebase no está configurado.");
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user) return null;

    let profile: UserProfileData;
    let isNewUser = false;

    if (db) {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const explicitNickname = preferredNickname?.trim();

      if (snap.exists()) {
        profile = snap.data() as UserProfileData;
        isNewUser = false;

        // Si el usuario proporcionó un apodo gamer explícito nuevo, actualizarlo en Firestore
        if (explicitNickname && explicitNickname !== profile.nickname) {
          profile.nickname = explicitNickname;
          await setDoc(userRef, { nickname: explicitNickname, updatedAt: serverTimestamp() }, { merge: true });
        }
      } else {
        // Usuario NUEVO sin perfil previo en Firestore
        isNewUser = true;
        const finalNickname = explicitNickname || `Player_${Math.floor(Math.random() * 900 + 100)}`;
        const defaultAvatar = deserializeAvatar(null);

        profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          nickname: finalNickname,
          avatarConfig: defaultAvatar,
          color: defaultAvatar.color || "#0284c7",
          skin: "robot",
          allTimeScore: 0,
          allTimeMatches: 0,
          allTimeWins: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, profile, { merge: true });
      }

      // Sincronizar metadatos en leaderboard_players de Firestore
      const lbRef = doc(db, "leaderboard_players", user.uid);
      await setDoc(
        lbRef,
        {
          playerId: user.uid,
          nickname: profile.nickname,
          avatar: serializeAvatar(profile.avatarConfig),
          color: profile.color,
          skin: profile.skin || "robot",
          allTimeScore: profile.allTimeScore || 0,
          allTimeMatches: profile.allTimeMatches || 0,
          allTimeWins: profile.allTimeWins || 0,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } else {
      isNewUser = true;
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        nickname: preferredNickname || `Player_${Math.floor(Math.random() * 900 + 100)}`,
        avatarConfig: deserializeAvatar(null),
        color: "#0284c7",
      };
    }

    activeProfile = profile;
    return { user, profile, isNewUser };
  } catch (error) {
    console.error("[Auth] Error al iniciar sesión con Google:", error);
    throw error;
  }
}

/**
 * Cierra la sesión activa y limpia la memoria
 */
export async function logoutUser(): Promise<void> {
  activeProfile = null;
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[Auth] Error al cerrar sesión:", error);
  }
}

/**
 * Obtiene el usuario autenticado actual
 */
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Suscribe un callback a cambios de sesión y carga el perfil directamente de Firestore
 */
export function subscribeToAuth(
  callback: (user: User | null, profile: UserProfileData | null) => void
): () => void {
  if (!auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await loadUserProfile(user.uid);
      activeProfile = profile;
      callback(user, profile);
    } else {
      activeProfile = null;
      callback(null, null);
    }
  });
}

/**
 * Guarda o actualiza todas las configuraciones del perfil del usuario exclusivamente en Firestore
 */
export async function saveUserProfile(
  uid: string,
  data: Partial<UserProfileData>
): Promise<void> {
  // Actualizar estado en memoria
  if (activeProfile) {
    activeProfile = { ...activeProfile, ...data };
  }

  // Guardar en Firestore solo para usuarios autenticados
  if (db && isFirebaseConfigured && uid && !uid.startsWith("guest_")) {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Sincronizar metadatos visuales en el ranking global
      const lbRef = doc(db, "leaderboard_players", uid);
      const lbUpdate: Record<string, unknown> = {
        playerId: uid,
        updatedAt: Date.now(),
      };
      if (data.nickname) lbUpdate.nickname = data.nickname;
      if (data.avatarConfig) lbUpdate.avatar = serializeAvatar(data.avatarConfig);
      if (data.color) lbUpdate.color = data.color;
      if (data.skin) lbUpdate.skin = data.skin;

      await setDoc(lbRef, lbUpdate, { merge: true });
    } catch (error) {
      console.warn("[Auth] No se pudo sincronizar en Firestore:", error);
    }
  }
}

/**
 * Carga el perfil completo del usuario desde Firestore
 */
export async function loadUserProfile(uid: string): Promise<UserProfileData | null> {
  if (!db || !isFirebaseConfigured || !uid || uid.startsWith("guest_")) return null;

  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
  } catch (error) {
    console.warn("[Auth] Error al cargar perfil de usuario desde Firestore:", error);
  }
  return null;
}
