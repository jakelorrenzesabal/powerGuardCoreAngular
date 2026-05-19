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
    minDateTime = '';
    rooms: any[] = [];
    fetchingRooms = false;
    
    // Searchable dropdown state
    searchQuery = '';
    isDropdownOpen = false;

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

        // Set minimum datetime for the input to now (local timezone)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.minDateTime = now.toISOString().slice(0, 16);

        this.form = this.formBuilder.group({
            roomId: [this.id || '', Validators.required],
            requestType: ['TimeLimited', Validators.required],
            requestedStartDate: [''],
            requestedExpiryDate: [''],
            reason: ['', Validators.required]
        });

        this.fetchingRooms = true;
        this.roomService.getAllRooms()
            .pipe(first())
            .subscribe({
                next: (rooms: any[]) => {
                    this.rooms = rooms;
                    this.fetchingRooms = false;
                    
                    if (this.id) {
                        const room = this.rooms.find(r => r.roomId === this.id);
                        if (room) {
                            this.roomName = room.roomName;
                            this.selectRoom(room);
                        }
                    }
                },
                error: error => {
                    this.alertService.error('Rooms could not be loaded. Please try again.');
                    console.error('Error loading rooms:', error);
                    this.fetchingRooms = false;
                }
            });
    }

    get f() { return this.form.controls; }

    get filteredRooms() {
        if (!this.searchQuery || this.searchQuery.trim() === '') return this.rooms;
        const query = this.searchQuery.toLowerCase().trim();
        return this.rooms.filter(r => {
            const name = r.roomName ? r.roomName.toLowerCase() : '';
            const num = r.roomNumber ? String(r.roomNumber).toLowerCase() : '';
            const floor = r.floor ? String(r.floor).toLowerCase() : '';
            
            return name.includes(query) || num.includes(query) || floor.includes(query);
        });
    }

    selectRoom(room: any) {
        this.f.roomId.setValue(room.roomId);
        this.searchQuery = room.roomName + ' (Floor ' + room.floor + ')';
        this.isDropdownOpen = false;
    }

    onSearchInput() {
        // If user is typing, clear the selected room ID so they must select from list
        this.f.roomId.setValue('');
        
        // Only open dropdown if there is text
        if (this.searchQuery && this.searchQuery.trim().length > 0) {
            this.isDropdownOpen = true;
        } else {
            this.isDropdownOpen = false;
        }
    }

    onInputFocus() {
        // Open dropdown only if there's already search text (e.g. they click back into it)
        // AND no room is currently selected (or if they want to change selection)
        if (this.searchQuery && this.searchQuery.trim().length > 0 && !this.f.roomId.value) {
            this.isDropdownOpen = true;
        }
    }

    closeDropdownDelay() {
        // Delay to allow click event on dropdown item to fire before closing
        setTimeout(() => {
            this.isDropdownOpen = false;
        }, 200);
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        if (this.f.requestType.value === 'TimeLimited') {
            if (!this.f.requestedStartDate.value || !this.f.requestedExpiryDate.value) {
                this.alertService.error('Start and expiry dates are required for time-limited access');
                return;
            }
            if (new Date(this.f.requestedExpiryDate.value) <= new Date(this.f.requestedStartDate.value)) {
                this.alertService.error('Expiry date must be after the start date');
                return;
            }
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
