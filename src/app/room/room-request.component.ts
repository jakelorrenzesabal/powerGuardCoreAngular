import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccessRequestService, RoomService, AlertService, AccountService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-room-request',
    templateUrl: './room-request.component.html',
    styleUrls: ['./room-request.component.css']
})
export class RoomRequestComponent implements OnInit {
    form!: FormGroup;
    id?: number;
    roomName?: string;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accessRequestService: AccessRequestService,
        private roomService: RoomService,
        private alertService: AlertService,
        public accountService: AccountService
    ) { }

    ngOnInit() {
        this.id = Number(this.route.snapshot.params['id']);

        this.form = this.formBuilder.group({
            roomId: [this.id, Validators.required],
            requestType: ['TimeLimited', Validators.required],
            requestedExpiryDate: [''],
            reason: ['', Validators.required]
        });

        if (this.id) {
            this.roomService.getRoomById(this.id)
                .pipe(first())
                .subscribe({
                    next: (room: any) => {
                        this.roomName = room.roomName;
                    },
                    error: error => {
                        this.alertService.error('Room information could not be loaded. Please try again.');
                        console.error('Error loading room:', error);
                    }
                });
        }
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        if (this.f.requestType.value === 'TimeLimited' && !this.f.requestedExpiryDate.value) {
            this.alertService.error('Expiry date is required for time-limited access');
            return;
        }

        this.loading = true;
        this.accessRequestService.createRequest(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Access request submitted successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['/rooms']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}
