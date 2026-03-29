import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'beneficios',
    loadChildren: () => import('./features/beneficios/beneficios.module').then((m) => m.BeneficiosModule)
  },
  {
    path: 'transferencia',
    loadChildren: () => import('./features/transferencia/transferencia.module').then((m) => m.TransferenciaModule)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'beneficios'
  },
  {
    path: '**',
    redirectTo: 'beneficios'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
