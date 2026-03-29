import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { BeneficiosRoutingModule } from './beneficios-routing.module';
import { BeneficioContainerComponent } from './components/beneficio-container/beneficio-container.component';
import { BeneficioTableComponent } from './components/beneficio-table/beneficio-table.component';

@NgModule({
  declarations: [BeneficioContainerComponent, BeneficioTableComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, BeneficiosRoutingModule]
})
export class BeneficiosModule {}
