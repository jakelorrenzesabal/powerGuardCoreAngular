import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RoomService } from '../_services/room.service';
import { DeviceKeyModalComponent } from './device-key-modal.component';

@Component({
  selector: 'app-room-add-edit',
  templateUrl: './room-add-edit.component.html'
})
export class RoomAddEditComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() room: any;

  form!: FormGroup;
  submitted = false;
  submitting = false;
  loading = false;
  title = '';

  successMessage = '';
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private roomService: RoomService,
    private modalService: NgbModal   // keep modal service
  ) { }

  ngOnInit(): void {
    this.title = this.mode === 'add' ? 'Add Room' : 'Edit Room';

    this.form = this.fb.group({
      roomName: [this.room?.roomName || '', Validators.required],
      roomNumber: [this.room?.roomNumber || '', [Validators.required, Validators.min(1)]],
      building: [this.room?.building || '', Validators.required],
      floor: [this.room?.floor || '', Validators.required],
      deviceId: [this.room?.deviceId || '', Validators.required],
      isActive: [this.room?.isActive ?? true, Validators.required]
    });
    // ✅ Auto-fill deviceId only when adding
    if (this.mode === 'add') {
      const savedForm = sessionStorage.getItem('roomAddEditForm');
      if (savedForm) {
        try {
          this.form.patchValue(JSON.parse(savedForm));
        } catch (e) {}
      } else {
        this.roomService.getAllRooms().subscribe((rooms: any[]) => {
          const ids = rooms
            .map(r => r.deviceId)
            .filter((id: string) => /^ROOM_\d+$/.test(id))
            .map((id: string) => parseInt(id.split('_')[1], 10));

          const max = ids.length ? Math.max(...ids) : 0;
          const next = (max + 1).toString().padStart(3, '0');

          this.form.patchValue({ deviceId: `ROOM_${next}` });
        });
      }
      
      this.form.valueChanges.subscribe(val => {
        sessionStorage.setItem('roomAddEditForm', JSON.stringify(val));
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) return;

    this.submitting = true;

    const payload = this.form.value;

    const request =
      this.mode === 'edit'
        ? this.roomService.update(this.room.roomId, payload)
        : this.roomService.create(payload);

    request.subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.successMessage =
          this.mode === 'edit'
            ? 'Room updated successfully!'
            : 'Room created successfully!';

        if (this.mode === 'add') {
          sessionStorage.removeItem('roomAddEditForm');
          const key = res?.deviceKey;
          setTimeout(() => {
            this.activeModal.close(true);
            if (key) {
              const modalRef = this.modalService.open(DeviceKeyModalComponent, { centered: true });
              modalRef.componentInstance.deviceKey = key;
            }
          }, 500);
        } else {
          this.activeModal.close(true);
        }
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.submitting = false;

        // Handle specific server errors
        const message = typeof err === 'string' ? err : err.error?.message || 'Something went wrong';

        if (message.includes('Device ID') && message.includes('already registered')) {
          this.form.get('deviceId')?.setErrors({ unique: true });
        } else if (message.includes('Room Name') && message.includes('already registered')) {
          this.form.get('roomName')?.setErrors({ unique: true });
        } else if (message.includes('Room Number') && message.includes('already registered')) {
          this.form.get('roomNumber')?.setErrors({ unique: true });
        } else {
          this.errorMessage = message;
        }
      }
    });
  }
}
