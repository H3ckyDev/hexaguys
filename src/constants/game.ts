import type { MapId } from '../types/game';

// Scoring
export const SCORE_PER_WIN = 10;
export const SCORE_PER_SURVIVAL_INTERVAL = 10_000; // ms

// Game flow
export const COUNTDOWN_DURATION = 5; // seconds
export const DEFAULT_FLOORS = 3;
export const DEFAULT_MAP: MapId = "classic";

// Polling & networking
export const ROOM_STATE_POLL_INTERVAL_MS = 66;
export const NETWORK_TICK_RATE_MS = 50;

// Physics & movement
export const WALK_SPEED = 3.8;
export const SPRINT_SPEED = 6.8;
export const JUMP_VELOCITY = 8.0;
export const JUMP_COOLDOWN_MS = 400;
export const GROUND_CHECK_THRESHOLD = 0.35;
export const PLAYER_DAMPING = 0.4;

// World layout
export const FLOOR_SPACING = 4.5;
export const LOBBY_X_OFFSET = 60;
export const SPAWN_RADIUS = 2.4;
export const FLOOR_Y_OFFSET = 0.65;

// Void & death
export const VOID_THRESHOLD_Y = -8;
export const DESPAWN_LOCAL_Y = -25;
export const DESPAWN_REMOTE_Y = -50;
export const REMOTE_SNAP_THRESHOLD_Y = -15;

// AFK system
export const AFK_TIMEOUT_MS = 20_000;
export const AFK_KICK_MS = 60_000;

// Chat
export const MAX_CHAT_LENGTH = 120;
export const CHAT_BUBBLE_DURATION_MS = 4500;
export const CHAT_HISTORY_LIMIT = 50;

// UI
export const MAX_NICKNAME_LENGTH = 15;
export const MOBILE_BREAKPOINT = "768px";

// Tile
export const TILE_STEP_DELAY_MS = 850;
