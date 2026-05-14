import { Component, OnInit, HostListener } from '@angular/core';
import { AccountService, AccessRequestService } from './_services';
import { Account, Role } from './_models';
import { first } from 'rxjs/operators';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent implements OnInit {
    Role = Role;
    account?: Account | null;
    pendingRequestsCount = 0;
    windowWidth: number = window.innerWidth;
    currentYear: number = new Date().getFullYear();

    constructor(
        private accountService: AccountService,
        private accessRequestService: AccessRequestService
    ) {
        this.accountService.account.subscribe(x => {
            this.account = x;
            if (x?.role === Role.Admin) {
                this.loadPendingCount();
            }
        });
    }

    ngOnInit() {
        // Optional: Set up interval to poll for new requests
        setInterval(() => {
            if (this.account?.role === Role.Admin) {
                this.loadPendingCount();
            }
        }, 30000); // Check every 30 seconds
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.windowWidth = window.innerWidth;
    }

    loadPendingCount() {
        this.accessRequestService.getAllRequests('Pending')
            .pipe(first())
            .subscribe(requests => {
                this.pendingRequestsCount = requests.length;
            });
    }

    logout() {
        this.accountService.logout();
    }
}