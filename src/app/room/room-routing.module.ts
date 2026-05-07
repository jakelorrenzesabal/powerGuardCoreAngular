import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoomListComponent } from './room-list.component';
import { RoomAddEditComponent } from './room-add-edit.component';

const routes: Routes = [
  { path: '', component: RoomListComponent },
  { path: 'add', component: RoomAddEditComponent },
  { path: 'edit/:roomId', component: RoomAddEditComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RoomsRoutingModule { }