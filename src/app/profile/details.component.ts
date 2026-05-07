import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/_services';
import { ActivityLog } from '@app/_models/activity-log.model';


@Component({
    templateUrl: 'details.component.html',
    styleUrls: ['details.component.less']
})
export class DetailsComponent implements OnInit {
    account = this.accountService.accountValue;
    activityLogs: ActivityLog[] = [];
    filteredLogs: ActivityLog[] = [];
    allActivityLogs: ActivityLog[] = [];
    filteredAllLogs: ActivityLog[] = [];
    showActivityLogs = false;
    showAllActivityLogs = false;
    searchTerm: string = '';
    startDate: string = '';
    endDate: string = '';
    adminSearchTerm: string = '';
    adminStartDate: string = '';
    adminEndDate: string = '';

    constructor(
        private accountService: AccountService
    ) { }

    ngOnInit(): void {
        if (this.account?.accountId) {
            this.getActivityLogs(this.account.accountId);
        }
    }

    getActivityLogs(accountId: number): void {
        this.accountService.getActivityLogs(accountId).subscribe(
            (logs) => {
                this.activityLogs = logs;
                this.filteredLogs = logs; // Initialize filtered logs
            },
            (error) => {
                console.error('Error fetching activity logs:', error);
            }
        );
    }

    handleSearch(): void {
        const startDate = this.startDate ? new Date(this.startDate).getTime() : null;
        const endDate = this.endDate ? new Date(this.endDate).getTime() : null;

        this.filteredLogs = this.activityLogs.filter((log) => {
            const logTimestamp = new Date(log.timestamp).getTime();
            const matchesSearchTerm = log.actionType.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesStartDate = !startDate || logTimestamp >= startDate;
            const matchesEndDate = !endDate || logTimestamp <= endDate;

            return matchesSearchTerm && matchesStartDate && matchesEndDate;
        });
    }

    getAllActivityLogs(): void {
        this.accountService.getAllActivityLogs().subscribe({
            next: (logs: ActivityLog[]) => {
                this.allActivityLogs = logs;
                this.filteredAllLogs = logs;
            },
            error: (error) => {
                console.error('Error fetching activity logs:', error);
            }
        });
    }

    handleAdminSearch(): void {
        const startDate = this.adminStartDate ? new Date(this.adminStartDate).getTime() : null;
        const endDate = this.adminEndDate ? new Date(this.adminEndDate).getTime() : null;

        this.filteredAllLogs = this.allActivityLogs.filter((log: ActivityLog) => {
            const logTimestamp = new Date(log.timestamp).getTime();
            const matchesSearchTerm = log.actionType.toLowerCase().includes(this.adminSearchTerm.toLowerCase()) ||
                                     (log.accountId && log.accountId.toString().includes(this.adminSearchTerm));
            const matchesStartDate = !startDate || logTimestamp >= startDate;
            const matchesEndDate = !endDate || logTimestamp <= endDate;

            return matchesSearchTerm && matchesStartDate && matchesEndDate;
        });
    }


    toggleAllActivityLogs(): void {
        if (!this.showAllActivityLogs) {
            this.getAllActivityLogs();  // Fetch the logs only when toggled
        }
        this.showAllActivityLogs = !this.showAllActivityLogs;
    }

    toggleActivityLogs(): void {
        this.showActivityLogs = !this.showActivityLogs;
    }

    isAdmin(): boolean {
        return this.account?.role === 'Admin';
    }
}