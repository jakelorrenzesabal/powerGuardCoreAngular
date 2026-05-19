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
    private _showActivityLogs = sessionStorage.getItem('pd_showActivityLogs') === 'true';
    get showActivityLogs() { return this._showActivityLogs; }
    set showActivityLogs(value: boolean) { this._showActivityLogs = value; sessionStorage.setItem('pd_showActivityLogs', String(value)); }

    private _showAllActivityLogs = sessionStorage.getItem('pd_showAllActivityLogs') === 'true';
    get showAllActivityLogs() { return this._showAllActivityLogs; }
    set showAllActivityLogs(value: boolean) { this._showAllActivityLogs = value; sessionStorage.setItem('pd_showAllActivityLogs', String(value)); }

    private _searchTerm = sessionStorage.getItem('pd_searchTerm') || '';
    get searchTerm() { return this._searchTerm; }
    set searchTerm(value: string) { this._searchTerm = value; sessionStorage.setItem('pd_searchTerm', value); this.handleSearch(); }

    private _startDate = sessionStorage.getItem('pd_startDate') || '';
    get startDate() { return this._startDate; }
    set startDate(value: string) { this._startDate = value; sessionStorage.setItem('pd_startDate', value); this.handleSearch(); }

    private _endDate = sessionStorage.getItem('pd_endDate') || '';
    get endDate() { return this._endDate; }
    set endDate(value: string) { this._endDate = value; sessionStorage.setItem('pd_endDate', value); this.handleSearch(); }

    private _adminSearchTerm = sessionStorage.getItem('pd_adminSearchTerm') || '';
    get adminSearchTerm() { return this._adminSearchTerm; }
    set adminSearchTerm(value: string) { this._adminSearchTerm = value; sessionStorage.setItem('pd_adminSearchTerm', value); this.handleAdminSearch(); }

    private _adminStartDate = sessionStorage.getItem('pd_adminStartDate') || '';
    get adminStartDate() { return this._adminStartDate; }
    set adminStartDate(value: string) { this._adminStartDate = value; sessionStorage.setItem('pd_adminStartDate', value); this.handleAdminSearch(); }

    private _adminEndDate = sessionStorage.getItem('pd_adminEndDate') || '';
    get adminEndDate() { return this._adminEndDate; }
    set adminEndDate(value: string) { this._adminEndDate = value; sessionStorage.setItem('pd_adminEndDate', value); this.handleAdminSearch(); }

    constructor(
        private accountService: AccountService
    ) { }

    ngOnInit(): void {
        if (this.account?.accountId) {
            this.getActivityLogs(this.account.accountId);
        }
        if (this.isAdmin() && this.showAllActivityLogs) {
            this.getAllActivityLogs();
        }
    }

    getActivityLogs(accountId: number): void {
        this.accountService.getActivityLogs(accountId).subscribe(
            (logs) => {
                this.activityLogs = logs;
                this.handleSearch(); // apply persistent filters
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
                this.handleAdminSearch(); // apply persistent filters
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
            this.getAllActivityLogs();
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