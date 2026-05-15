export interface Room {
  roomId: number;
  roomName: string;
  roomNumber: number;
  floor: string;
  building: string;
  deviceId: string;
  description?: string;
  isActive: boolean;
  powerStatus: string;
  lastAccountName?: string;
  lastEvent?: string;
  lastEventTimestamp?: string;
  currentAccountName?: string;
  isCardPresent?: boolean;
  isAuthorized?: boolean;
  userCount?: number;

  // UI-only properties
  isToggling?: boolean;
  isTogglingPower?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
}
