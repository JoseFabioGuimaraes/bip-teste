import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BeneficioContainerComponent } from './components/beneficio-container/beneficio-container.component';

const routes: Routes = [
  {
    path: '',
    component: BeneficioContainerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BeneficiosRoutingModule {}
