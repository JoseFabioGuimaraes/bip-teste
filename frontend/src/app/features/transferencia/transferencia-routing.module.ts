import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TransferenciaFormComponent } from './components/transferencia-form/transferencia-form.component';

const routes: Routes = [
  {
    path: '',
    component: TransferenciaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransferenciaRoutingModule {}
