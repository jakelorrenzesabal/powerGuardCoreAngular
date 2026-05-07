import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';
import { RoomService } from '@app/_services/room.service';
import { Role } from '@app/_models';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  account: any;
  isAdmin = false;
  dashboardTitle = 'Control Center';
  roomsTitle = 'Room Management';
  logsTitle = 'System Activity';

  private subscription!: Subscription;
  today = new Date();

  dashboard = { totalRooms: 0, powerOn: 0, powerOff: 0 };
  rooms: any[] = [];
  showRooms = true;
  filter: 'all' | 'on' | 'off' = 'all';
  roomSearchTerm = '';

  // Chart properties
  allLogs: any[] = [];
  logDetails: any[] = [];
  logChartLabels: string[] = [];
  logChartData: number[] = [];
  logChartType: any = 'bar';
  logChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false } // Hide legend for simplicity
    },
    scales: {
      x: {
        grid: { display: false } // No grid lines on x-axis
      },
      y: {
        grid: { display: false, drawBorder: false }, // No grid lines on y-axis
        ticks: { stepSize: 1, display: true },
        beginAtZero: true,
        min: 0
      }
    }
  };
  logTypeFilter: 'all' | 'card' | 'manual' | 'update' = 'all';
  selectedRoomId: number | null = null;

  constructor(
    private accountService: AccountService,
    private roomService: RoomService
  ) { }

  ngOnInit() {
    this.subscription = this.accountService.account.subscribe((account: any) => {
      this.account = account;

      // ✅ Only load if logged in
      if (account?.jwtToken) {
        this.isAdmin = account.role === Role.Admin;

        if (this.isAdmin) {
          this.dashboardTitle = 'Admin Dashboard';
          this.roomsTitle = 'Room Management';
          this.logsTitle = 'System Activity';
        } else {
          this.dashboardTitle = 'My Dashboard';
          this.roomsTitle = 'My Assigned Rooms';
          this.logsTitle = 'My Activity history';
        }

        this.loadDashboard();   // ✅ Add this line
        this.loadRooms();
        this.loadLogChart();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /** ----------------------
   * Dashboard + Rooms
   * ---------------------- */
  private loadDashboard() {
    console.log("📊 Loading dashboard.");
    if (!this.account) return;

    this.roomService.getAllRooms()
      .pipe(first())
      .subscribe({
        next: (rooms: any[]) => {
          if (rooms) {
            this.dashboard.totalRooms = rooms.length;   // ✅ rooms is already an array
          }
        },
        error: (err: any) => console.error('Error loading rooms:', err)
      });

    ['on', 'off'].forEach(status => {
      this.roomService.getRoomsByPowerStatus(status as 'on' | 'off')
        .pipe(first())
        .subscribe({
          next: (res: any) => {
            // backend returns { count, rooms } for status queries
            if (status === 'on') {
              this.dashboard.powerOn = res.count ?? res.rooms?.length ?? 0;
            } else {
              this.dashboard.powerOff = res.count ?? res.rooms?.length ?? 0;
            }
          },
          error: (err: any) => console.error(`Error loading ${status} rooms:`, err)
        });
    });
  }

  private loadRooms() {
    if (!this.account) return;

    this.roomService.getAllRooms()
      .pipe(first())
      .subscribe({
        next: (rooms: any[]) => {
          if (Array.isArray(rooms)) {
            this.rooms = rooms;
          }
        },
        error: (err: any) => console.error('Error loading rooms:', err)
      });
  }

  get filteredRooms() {
    if (!this.rooms) return [];
    let filtered = this.rooms;

    if (this.filter !== 'all') {
      filtered = filtered.filter(r => r.powerStatus === this.filter);
    }

    const term = this.roomSearchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(r =>
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

    return filtered;
  }

  setFilter(filter: 'all' | 'on' | 'off') {
    this.filter = filter;
  }

  /** ----------------------
   * Logs + Chart
   * ---------------------- */
  getChartColor(): string {
    // Simple single color (primary blue) for all bars for a cleaner look
    return '#0d6efd';
  }

  loadLogChart() {
    console.log("📈 Loading log chart...");
    const params: any = {};

    // If not Admin, ONLY show card access logs
    if (!this.isAdmin) {
      params.type = 'card';
    } else if (this.logTypeFilter !== 'all') {
      if (this.logTypeFilter === 'update') params.update = 'true';
      else params.type = this.logTypeFilter;
    }

    this.roomService.getLogCounts(params).subscribe((res: any) => {
      this.allLogs = res.logs || []; // Cache logs
      const countsByDay: { [date: string]: number } = {};
      this.allLogs.forEach((log: any) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        countsByDay[date] = (countsByDay[date] || 0) + 1;
      });

      this.logChartLabels = Object.keys(countsByDay);
      this.logChartData = Object.values(countsByDay);
    });
  }

  chartClicked(e: any) {
    if (e.active && e.active.length > 0) {
      const index = e.active[0].index;
      // Use the raw label string (date)
      const date = this.logChartLabels[index];
      this.openLogDetails(date);
    }
  }

  toggleRoomPower(room: any, event: any) {
    const isChecked = event.target.checked;
    const originalStatus = room.powerStatus;
    const newStatus = isChecked ? 'on' : 'off';

    // Optimistic update
    room.powerStatus = newStatus;
    room.isLoading = true;

    this.roomService.togglePowerStatus(room.roomId, newStatus)
      .pipe(first())
      .subscribe({
        next: () => {
          room.isLoading = false;
          // Update dashboard counts
          if (newStatus === 'on') {
            this.dashboard.powerOn++;
            this.dashboard.powerOff--;
          } else {
            this.dashboard.powerOn--;
            this.dashboard.powerOff++;
          }
        },
        error: (error: any) => {
          // Revert on error
          room.powerStatus = originalStatus;
          room.isLoading = false;
          event.target.checked = !isChecked;
          console.error('Error toggling power:', error);
        }
      });
  }

  setLogTypeFilter(type: 'all' | 'card' | 'manual' | 'update') {
    this.logTypeFilter = type;
    this.loadLogChart();
  }

  get totalLogs(): number {
    return this.logChartData.reduce((a, b) => a + b, 0);
  }

  openLogDetails(date?: string) {
    if (date) {
      // Filter existing logs
      this.logDetails = this.allLogs.filter(log =>
        new Date(log.timestamp).toLocaleDateString() === date
      );
      this.showModal();
    } else {
      // Fetch all
      const params: any = {};

      if (!this.isAdmin) {
        params.type = 'card';
      } else if (this.logTypeFilter !== 'all') {
        if (this.logTypeFilter === 'update') params.update = 'true';
        else params.type = this.logTypeFilter;
      }

      this.roomService.getLogCounts(params).subscribe((res: any) => {
        this.logDetails = res.logs || [];
        this.showModal();
      });
    }
  }

  openRoomLogs(roomId: number) {
    console.log(`🔍 Loading logs for room: ${roomId}`);
    const params: any = { roomId };

    if (!this.isAdmin) {
      params.type = 'card';
    } else if (this.logTypeFilter !== 'all') {
      if (this.logTypeFilter === 'update') params.update = 'true';
      else params.type = this.logTypeFilter;
    }

    this.roomService.getLogCounts(params).subscribe((res: any) => {
      this.logDetails = res.logs || [];
      this.showModal();
    });
  }

  private showModal() {
    const modal: any = document.getElementById('logDetailsModal');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  /** ----------------------
   * Helpers for log table
   * ---------------------- */
  getPowerStatusText(log: any): string {
    if (['card_on', 'power_on'].includes(log.event)) return 'ON';
    if (['card_off', 'power_off'].includes(log.event)) return 'OFF';
    return 'OFF';
  }

  getPowerStatusClass(log: any): string {
    return ['card_on', 'power_on'].includes(log.event)
      ? 'text-success'
      : 'text-danger';
  }

  getPowerStatusIcon(log: any): string {
    return ['card_on', 'power_on'].includes(log.event)
      ? 'light_mode'
      : 'highlight_off';
  }
}
