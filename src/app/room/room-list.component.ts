import { Component, OnInit } from '@angular/core';
import { first, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
declare var bootstrap: any;

import { AlertService, AccountService } from '@app/_services';
import { RoomService, RoomLog } from '@app/_services/room.service';
import { Room } from '@app/_models/room';
import { RoomAddEditComponent } from './room-add-edit.component';

@Component({
  templateUrl: 'room-list.component.html',
  styleUrls: ['room-list.component.css']
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  roomSearchTerm = '';
  modalRoomSearchTerm = '';


  selectedRoom: any;
  attempts: any[] = [];
  filterText = '';
  unreadCounts: { [key: number]: number } = {};
  totalLogsCount = 0;
  roomLogCounts: { [key: string]: number } = {};
  roomAttemptCounts: { [key: string]: number } = {};
  String = String;

  // Logs modal state
  logs: RoomLog[] = [];
  loadingLogs = false;
  logsTitle = 'Room Activity Logs';
  logsFilter = {
    roomName: '',
    event: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  };
  currentRoomId?: number;
  currentLogView: 'room' | 'all' = 'room';
  logsModal: any;

  // Accounts modal state
  selectedRoomId: number | null = null;
  roomAccounts: any[] = [];
  unassignedAccounts: any[] = [];
  loadingAccounts = false;
  loadingUnassigned = false;
  accountSearchTerm = '';
  showUnassigned = false;
  accountsModal: any;
  durationModal: any;
  selectedAccountForAssignment: any = null;
  assignmentDuration: 'permanent' | 'timed' = 'permanent';
  assignmentExpiryDate: string = '';
  private accountSearchSubject: Subject<string> = new Subject<string>();

  constructor(
    private roomService: RoomService,
    private alertService: AlertService,
    public accountService: AccountService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadRooms();
    this.loadAllLogsCount();

    this.accountSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchTerm: string) => {
      this.accountSearchTerm = searchTerm;
      this.loadUnassignedAccounts();
    });
  }

  private loadAllLogsCount() {
    this.roomService.getLogCounts()
      .pipe(first())
      .subscribe({
        next: (res: any) => {
          this.totalLogsCount = res.logs?.length || 0;

          // Calculate counts per room
          const counts: { [key: string]: number } = {};
          if (res.logs) {
            res.logs.forEach((log: any) => {
              if (log.roomId) {
                const rid = String(log.roomId);
                counts[rid] = (counts[rid] || 0) + 1;
              }
            });
          }
          this.roomLogCounts = counts;

          // Handle attempt counts from backend
          const attempts: { [key: string]: number } = {};
          if (res.attemptCounts) {
            Object.keys(res.attemptCounts).forEach(rid => {
              attempts[rid] = res.attemptCounts[rid];
            });
          }
          this.roomAttemptCounts = attempts;
        },
        error: (error: any) => console.error('Error loading logs count:', error)
      });
  }

  private loadRooms() {
    this.roomService.getAllRooms()
      .pipe(first())
      .subscribe({
        next: (rooms: any[]) => {
          this.rooms = rooms.map((room: any) => ({
            ...room,
            isToggling: false,
            isDeleting: false,
            isTogglingPower: false
          }));
          this.filterRooms();
        },
        error: (error: any) => this.alertService.error(error)
      });
  }

  openAddRoom() {
    const modalRef = this.modalService.open(RoomAddEditComponent, { size: 'lg' });
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result: any) => {
      if (result) {
        this.loadRooms(); // ✅ refresh table
      }
    }).catch(() => { });
  }

  openEditRoom(room: any) {
    const modalRef = this.modalService.open(RoomAddEditComponent, { size: 'lg' });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.room = room;

    modalRef.result.then((result: any) => {
      if (result) {
        this.loadRooms(); // ✅ refresh table
      }
    }).catch(() => { });
  }

  // ---------- LOGS ----------
  loadRoomLogs(roomId: number, filter?: any) {
    this.loadingLogs = true;
    this.logs = [];
    this.currentRoomId = roomId;
    this.currentLogView = 'room';

    const apiFilter = filter || {
      event: this.logsFilter.event,
      startDate: this.formatDateTimeForApi(this.logsFilter.startDate, this.logsFilter.startTime),
      endDate: this.formatDateTimeForApi(this.logsFilter.endDate, this.logsFilter.endTime)
    };

    this.roomService.getRoomLogs(roomId, apiFilter)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          this.loadingLogs = false;
          if (Array.isArray(response)) {
            this.logs = response;
          } else if (response && typeof response === 'object' && 'logs' in response) {
            this.logs = (response as any).logs || [];
          } else {
            this.logs = [];
          }
        },
        error: (error: any) => {
          this.loadingLogs = false;
          this.alertService.error('Error loading room logs');
        }
      });
  }

  loadAllLogs(filter?: any) {
    this.loadingLogs = true;
    this.logs = [];
    this.currentRoomId = undefined;
    this.currentLogView = 'all';

    const apiFilter = filter || {
      roomName: this.logsFilter.roomName,
      event: this.logsFilter.event,
      startDate: this.formatDateTimeForApi(this.logsFilter.startDate, this.logsFilter.startTime),
      endDate: this.formatDateTimeForApi(this.logsFilter.endDate, this.logsFilter.endTime)
    };

    this.roomService.getAllArduinoLogs(apiFilter)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          this.loadingLogs = false;
          if (response && typeof response === 'object' && 'logs' in response) {
            this.logs = response.logs || [];
          } else if (Array.isArray(response)) {
            this.logs = response;
          } else {
            this.logs = [];
          }
        },
        error: (error: any) => {
          this.loadingLogs = false;
          this.alertService.error('Error loading all logs');
        }
      });
  }

  applyLogsFilter() {
    const apiFilter = {
      roomName: this.logsFilter.roomName,
      event: this.logsFilter.event,
      startDate: this.formatDateTimeForApi(this.logsFilter.startDate, this.logsFilter.startTime),
      endDate: this.formatDateTimeForApi(this.logsFilter.endDate, this.logsFilter.endTime)
    };

    if (this.currentLogView === 'room' && this.currentRoomId) {
      this.loadRoomLogs(this.currentRoomId, apiFilter);
    } else {
      this.loadAllLogs(apiFilter);
    }
  }

  showAllLogs() {
    this.logsTitle = 'All Activity Logs';
    this.resetLogsFilter();
    this.loadAllLogs();

    const modalElement = document.getElementById('roomLogsModal');
    if (modalElement) {
      this.logsModal = new bootstrap.Modal(modalElement);
      this.logsModal.show();
    }
  }

  showRoomLogs(roomId: number) {
    this.logsTitle = 'Room Activity Logs';
    this.resetLogsFilter();
    this.loadRoomLogs(roomId);

    const modalElement = document.getElementById('roomLogsModal');
    if (modalElement) {
      this.logsModal = new bootstrap.Modal(modalElement);
      this.logsModal.show();
    }
  }

  resetLogsFilter() {
    this.logsFilter = {
      roomName: '',
      event: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: ''
    };
  }

  formatDateTimeForApi(date: string, time: string): string {
    if (!date) return '';
    const formattedTime = time || (date === this.logsFilter.endDate ? '23:59:59' : '00:00:00');
    return `${date}T${formattedTime}`;
  }

  // ---------- ACCOUNTS ----------
  showAccountsByRoom() {
    this.selectedRoomId = null;
    this.roomAccounts = [];
    this.modalRoomSearchTerm = '';

    const modalElement = document.getElementById('accountsByRoomModal');
    if (modalElement) {
      this.accountsModal = new bootstrap.Modal(modalElement);
      this.accountsModal.show();
    }
  }

  selectRoom(roomId: number) {
    this.selectedRoomId = roomId;
    this.loadAccountsByRoom();
    if (this.showUnassigned) {
      this.loadUnassignedAccounts();
    } else {
      this.unassignedAccounts = [];
    }
  }

  loadAccountsByRoom() {
    if (this.selectedRoomId === null) {
      this.roomAccounts = [];
      return;
    }

    this.loadingAccounts = true;
    this.accountService.getAccountsByRoom(this.selectedRoomId)
      .pipe(first())
      .subscribe({
        next: (accounts: any[]) => {
          this.roomAccounts = accounts.map(a => {
            const assignment = a.rooms?.find((r: any) => r.roomId === this.selectedRoomId);
            return { ...a, expiryDate: assignment?.expiryDate };
          });
          this.loadingAccounts = false;
        },
        error: (error: any) => {
          this.alertService.error('Error loading room users');
          this.loadingAccounts = false;
        }
      });
  }

  toggleShowUnassigned() {
    this.showUnassigned = !this.showUnassigned;
    if (this.showUnassigned) {
      this.loadUnassignedAccounts();
    }
  }

  onAccountSearch(event: any) {
    this.accountSearchSubject.next(event.target.value);
  }

  loadUnassignedAccounts() {
    if (this.selectedRoomId === null) return;

    this.loadingUnassigned = true;
    this.accountService.getUnassignedAccounts(this.selectedRoomId, this.accountSearchTerm)
      .pipe(first())
      .subscribe({
        next: (accounts: any[]) => {
          this.unassignedAccounts = accounts;
          this.loadingUnassigned = false;
        },
        error: (error: any) => {
          this.alertService.error('Error loading unassigned users');
          this.loadingUnassigned = false;
        }
      });
  }

  assignAccount(account: any) {
    if (this.selectedRoomId === null) return;
    this.selectedAccountForAssignment = account;
    this.assignmentDuration = 'permanent';
    this.assignmentExpiryDate = '';

    // Hide the main modal to avoid stacking
    if (this.accountsModal) {
      this.accountsModal.hide();
    }

    const modalElement = document.getElementById('assignDurationModal');
    if (modalElement) {
      this.durationModal = new bootstrap.Modal(modalElement);
      this.durationModal.show();
    }
  }

  cancelAssignment() {
    this.durationModal.hide();
    if (this.accountsModal) {
      this.accountsModal.show();
    }
  }

  confirmAssignment() {
    if (this.selectedRoomId === null || !this.selectedAccountForAssignment) return;

    const expiryDate = this.assignmentDuration === 'timed' && this.assignmentExpiryDate 
      ? new Date(this.assignmentExpiryDate).toISOString() 
      : null;

    this.accountService.addRoom(this.selectedAccountForAssignment.accountId, this.selectedRoomId, expiryDate)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('User assigned to room successfully');
          this.durationModal.hide();
          
          // Re-show the main modal
          if (this.accountsModal) {
            this.accountsModal.show();
          }

          this.loadAccountsByRoom();
          this.loadUnassignedAccounts();
          this.loadRooms(); // Refresh room card user count badges
        },
        error: (error: any) => {
          this.alertService.error(error);
          // Even on error, we should probably show the main modal again if the duration modal is closed
          if (this.accountsModal) {
            this.accountsModal.show();
          }
        }
      });
  }

  unassignAccount(account: any) {
    if (this.selectedRoomId === null) return;

    if (account.role === 'Admin') {
      this.alertService.error('Cannot unselect an Admin user from a room.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${account.firstName} ${account.lastName} from this room?`)) return;

    this.accountService.removeRoom(account.accountId, this.selectedRoomId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('User removed from room successfully');
          this.loadAccountsByRoom();
          this.loadRooms(); // Refresh room card user count badges
          if (this.showUnassigned) {
            this.loadUnassignedAccounts();
          }
        },
        error: (error: any) => this.alertService.error(error)
      });
  }

  // ---------- TOGGLE & DELETE ----------
  toggleStatus(room: Room) {
    if (!room.roomId) return;

    room.isToggling = true;
    const newStatus = !room.isActive;

    this.roomService.toggleRoomStatus(room.roomId, newStatus)
      .pipe(first())
      .subscribe({
        next: () => {
          room.isActive = newStatus;
          room.isToggling = false;
          this.alertService.success(`Room ${newStatus ? 'activated' : 'deactivated'} successfully`);
        },
        error: (error: any) => {
          room.isToggling = false;
          this.alertService.error(error);
        }
      });
  }

  togglePower(room: Room) {
    if (!room.roomId) return;

    room.isTogglingPower = true;
    const newPowerStatus = room.powerStatus === 'on' ? 'off' : 'on';

    this.roomService.togglePowerStatus(room.roomId, newPowerStatus)
      .pipe(first())
      .subscribe({
        next: () => {
          room.powerStatus = newPowerStatus;
          room.isTogglingPower = false;
          this.alertService.success(`Power turned ${newPowerStatus.toUpperCase()} successfully`);
        },
        error: (error: any) => {
          room.isTogglingPower = false;
          this.alertService.error(error);
        }
      });
  }

  deleteRoom(roomId: number) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    const room = this.rooms.find(x => x.roomId === roomId);
    if (!room) return;

    room.isDeleting = true;
    this.roomService.delete(roomId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.rooms = this.rooms.filter(x => x.roomId !== roomId);
          this.filterRooms();
          this.alertService.success('Room deleted successfully');
        },
        error: (error: any) => {
          room.isDeleting = false;
          this.alertService.error(error);
        }
      });
  }

  filterRooms() {
    const term = this.roomSearchTerm.trim().toLowerCase();
    this.filteredRooms = !term
      ? this.rooms
      : this.rooms.filter(r =>
        String(r.roomName || '').toLowerCase().includes(term) ||
        String(r.roomNumber || '').toLowerCase().includes(term) ||
        String(r.floor || '').toLowerCase().includes(term) ||
        String(r.building || '').toLowerCase().includes(term) ||
        String(r.deviceId || '').toLowerCase().includes(term) ||
        String(r.description || '').toLowerCase().includes(term) ||
        String(r.lastAccountName || '').toLowerCase().includes(term) ||
        String(r.currentAccountName || '').toLowerCase().includes(term)
      );
  }

  openAttemptsModal(room: any) {
    this.selectedRoom = room;
    this.roomService.getValidationAttempts(room.roomId).subscribe((attempts: any[]) => {
      this.attempts = attempts;
      this.unreadCounts[room.roomId] = 0;

      const modalElement = document.getElementById('attemptsModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    });
  }

  filteredAttempts() {
    if (!this.filterText) return this.attempts;
    const search = this.filterText.toLowerCase();
    return this.attempts.filter(a =>
      a.cardUID.toLowerCase().includes(search) ||
      a.message.toLowerCase().includes(search) ||
      (a.userName && a.userName.toLowerCase().includes(search))
    );
  }
  getInactiveDuration(room: any): string {
    const now = Date.now();

    // 🟢 ROOM IS ACTIVE → show ONLINE duration
    if (room.isActive) {
      // Prefer lastActiveAt or lastSeen (fallback)
      const onlineSince =
        room.lastActiveAt
          ? new Date(room.lastActiveAt).getTime()
          : room.lastSeen
            ? new Date(room.lastSeen).getTime()
            : null;

      if (!onlineSince) {
        return 'Online';
      }

      const diffMs = now - onlineSince;
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return `Online (${seconds}s)`;
      if (minutes < 60) return `Online (${minutes}m)`;
      if (hours < 24) return `Online (${hours}h)`;
      return `Online (${days}d)`;
    }

    // 🔴 ROOM IS INACTIVE → show OFFLINE duration
    if (!room.inactiveSince) {
      return 'Offline';
    }

    const inactiveSince = new Date(room.inactiveSince).getTime();
    const diffMs = now - inactiveSince;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return ` (${seconds}s ago)`;
    if (minutes < 60) return ` (${minutes}m ago)`;
    if (hours < 24) return ` (${hours}h ago)`;
    return ` (${days}d ago)`;
  }

  get modalFilteredRooms() {
    const term = this.modalRoomSearchTerm.trim().toLowerCase();
    if (!term) return this.rooms;
    return this.rooms.filter(r =>
      String(r.roomName || '').toLowerCase().includes(term) ||
      String(r.roomNumber || '').toLowerCase().includes(term) ||
      String(r.floor || '').toLowerCase().includes(term)
    );
  }
}
