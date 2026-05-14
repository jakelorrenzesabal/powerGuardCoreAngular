import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { AccessRequestService, AlertService } from '@app/_services';
import { AccessRequest, ProcessAccessRequest } from '@app/_models';

@Component({
    templateUrl: 'access-request-list.component.html',
    styleUrls: ['access-request-list.component.css']
})
export class AccessRequestListComponent implements OnInit {
    requests: AccessRequest[] = [];
    loading = false;
    processingId: number | null = null;

    constructor(
        private accessRequestService: AccessRequestService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.accessRequestService.getAllRequests()
            .pipe(first())
            .subscribe({
                next: requests => {
                    this.requests = requests;
                    this.loading = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    approveRequest(id: number) {
        this.process(id, 'Approved');
    }

    rejectRequest(id: number) {
        const comment = prompt('Please enter a reason for rejection:');
        if (comment !== null) {
            this.process(id, 'Rejected', comment);
        }
    }

    private process(id: number, status: string, adminComment?: string) {
        this.processingId = id;
        const model: ProcessAccessRequest = { status, adminComment };

        this.accessRequestService.processRequest(id, model)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success(`Request ${status.toLowerCase()} successfully`);
                    this.loadRequests();
                    this.processingId = null;
                },
                error: error => {
                    this.alertService.error(error);
                    this.processingId = null;
                }
            });
    }
}
