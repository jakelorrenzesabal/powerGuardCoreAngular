import { Component, OnInit } from '@angular/core';
import { RoomService } from '@app/_services/room.service';
import { AlertService } from '@app/_services/alert.service';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-blocked-uids',
    templateUrl: 'blocked-uids.component.html',
    styleUrls: ['blocked-uids.component.css']
})
export class BlockedUidsComponent implements OnInit {
    blockedUids: any[] = [];
    filteredBlockedUids: any[] = [];
    searchTerm = '';
    loading = false;

    constructor(
        private roomService: RoomService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadBlockedUids();
    }

    loadBlockedUids() {
        this.loading = true;
        this.roomService.getBlockedUids()
            .pipe(first())
            .subscribe({
                next: (res) => {
                    this.blockedUids = res.uids;
                    this.filterUids();
                    this.loading = false;
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    unblock(uid: string) {
        if (!confirm(`Are you sure you want to unblock UID: ${uid}?`)) return;

        this.roomService.unblockUid(uid)
            .pipe(first())
            .subscribe({
                next: (res) => {
                    this.alertService.success(res.message, { keepAfterRouteChange: true });
                    this.loadBlockedUids(); // Refresh list
                },
                error: (error) => {
                    this.alertService.error(error);
                }
            });
    }

    filterUids() {
        const term = this.searchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredBlockedUids = [...this.blockedUids];
            return;
        }
        this.filteredBlockedUids = this.blockedUids.filter(item => {
            const uid = String(item.uid || '').toLowerCase();
            const userName = String(item.userName || '').toLowerCase();
            const roomName = String(item.Room?.roomName || '').toLowerCase();
            const roomNumber = String(item.Room?.roomNumber || '').toLowerCase();
            const reason = String(item.reason || '').toLowerCase();

            return uid.includes(term) ||
                userName.includes(term) ||
                roomName.includes(term) ||
                roomNumber.includes(term) ||
                reason.includes(term);
        });
    }
}
