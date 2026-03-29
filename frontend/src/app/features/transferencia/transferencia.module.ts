import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { TransferenciaRoutingModule } from './transferencia-routing.module';
import { TransferenciaFormComponent } from './components/transferencia-form/transferencia-form.component';

@NgModule({
  declarations: [TransferenciaFormComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, TransferenciaRoutingModule]
})
export class TransferenciaModule {}
