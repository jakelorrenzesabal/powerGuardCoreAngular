import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-device-key-modal',
  templateUrl: './device-key-modal.component.html'
})
export class DeviceKeyModalComponent {
  @Input() deviceKey!: string;   // passed from parent

  constructor(public activeModal: NgbActiveModal) {}
}
