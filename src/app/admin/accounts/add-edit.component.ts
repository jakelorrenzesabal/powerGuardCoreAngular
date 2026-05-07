import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AccountService, AlertService } from '@app/_services';
import { RoomService } from '@app/_services/room.service';

@Component({
  templateUrl: 'add-edit.component.html',
  styleUrls: ['add-edit.component.less']
})
export class AddEditComponent implements OnInit {
  form!: FormGroup;
  accountId?: number;
  title!: string;
  loading = false;
  submitted = false;
  rooms: any[] = [];
  selectedRooms: any[] = [];
  submitting = false;
  isAddMode!: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private roomService: RoomService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
    this.accountId = this.route.snapshot.params['AccountId'];

    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      uid: ['', [Validators.required]],
      role: ['', Validators.required],
      password: [''],
      confirmPassword: [''],
      roomIds: [[], Validators.required]
    });

    this.isAddMode = !this.accountId;
    this.title = this.isAddMode ? 'Add Account' : 'Edit Account';

    this.roomService.getAllRooms()
      .pipe(first())
      .subscribe({
        next: (rooms: any[]) => (this.rooms = rooms),
        error: (err: any) => this.alertService.error(err)
      });

    if (this.accountId) {
      this.loading = true;
      this.accountService.getById(this.accountId)
        .pipe(first())
        .subscribe({
          next: (account: any) => {
            this.form.patchValue({
              title: account.title,
              firstName: account.firstName,
              lastName: account.lastName,
              email: account.email,
              phoneNumber: account.phoneNumber,
              uid: account.uid,
              role: account.role,
              roomIds: account.rooms.map((r: any) => r.roomId)
            });

            this.selectedRooms = account.rooms || [];
            this.loading = false;
          },
          error: (err: any) => {
            this.alertService.error(err);
            this.loading = false;
          }
        });
    }
  }

  get f() {
    return this.form.controls;
  }

  openRoomsModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', scrollable: true });
  }

  isRoomSelected(roomId: number): boolean {
    return this.form.value.roomIds.includes(roomId);
  }

  onRoomToggle(roomId: number, event: any) {
    const roomIds: number[] = this.form.value.roomIds || [];

    if (event.target.checked) {
      this.form.patchValue({ roomIds: [...roomIds, roomId] });
    } else {
      this.form.patchValue({ roomIds: roomIds.filter(id => id !== roomId) });
    }

    this.selectedRooms = this.rooms.filter(r =>
      this.form.value.roomIds.includes(r.roomId)
    );
  }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) return;

    // Remove password fields if they are empty
    const params = { ...this.form.value };
    if (!params.password) {
      delete params.password;
      delete params.confirmPassword;
    }

    this.submitting = true;
    if (this.accountId) {
      this.accountService.update(this.accountId, params)
        .pipe(first())
        .subscribe({
          next: () => {
            this.alertService.success('Account updated successfully', { keepAfterRouteChange: true });
            this.router.navigate(['/admin/accounts']);
          },
          error: (error: any) => {
            this.alertService.error(error);
            this.submitting = false;
          }
        });
    } else {
      this.accountService.create(this.form.value)
        .pipe(first())
        .subscribe({
          next: () => {
            this.alertService.success('Account created successfully', { keepAfterRouteChange: true });
            this.router.navigate(['/admin/accounts']);
          },
          error: (error: any) => {
            this.alertService.error(error);
            this.submitting = false;
          }
        });
    }
  }
}
