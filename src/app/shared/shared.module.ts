// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../_helpers/time-ago.pipe';

@NgModule({
  declarations: [TimeAgoPipe],
  imports: [CommonModule],
  exports: [TimeAgoPipe]   // <-- exported so other modules can use it
})
export class SharedModule { }
