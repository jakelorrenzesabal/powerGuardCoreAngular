
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { RoomsRoutingModule } from './room-routing.module';
import { RoomListComponent } from './room-list.component';
import { RoomAddEditComponent } from './room-add-edit.component';
import { SharedModule } from '../shared/shared.module'; // <-- add this

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NgbModule,
        FormsModule,
        RoomsRoutingModule,
        SharedModule
    ],
    declarations: [
        RoomListComponent,
        RoomAddEditComponent
    ]
})
export class RoomsModule { }