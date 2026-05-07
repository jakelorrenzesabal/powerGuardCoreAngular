// src/app/_models/room.ts
export class Room {
  roomId?: number;
  roomName?: string;
  roomNumber?: number;
  floor?: number;
  building?: string;
  deviceId?: string;
  description?: string;
  isActive?: boolean;
  powerStatus?: 'on' | 'off';
  createdAt?: string;
  updatedAt?: string;

  // UI state tracking properties
  isToggling?: boolean;
  isDeleting?: boolean;
  isTogglingPower?: boolean;

  // authoritative: active = online
  isOnline?: boolean;     // optional (kept for compatibility)
  lastSeen?: string | null;  // ISO string or null when online

  // Activity properties
  lastAccountName?: string;
  currentAccountName?: string;
  lastEvent?: string;
  lastEventTimestamp?: string;
  userCount?: number;
  isCardPresent?: boolean;
}
