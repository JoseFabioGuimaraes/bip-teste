import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Beneficio } from '../../../../core/models/beneficio.model';

@Component({
  selector: 'app-beneficio-table',
  templateUrl: './beneficio-table.component.html'
})
export class BeneficioTableComponent {
  @Input() beneficios: ReadonlyArray<Beneficio> = [];

  @Output() deleteRequested = new EventEmitter<number>();
  @Output() editRequested = new EventEmitter<Beneficio>();

  onDelete(id: number): void {
    this.deleteRequested.emit(id);
  }

  onEdit(beneficio: Beneficio): void {
    this.editRequested.emit(beneficio);
  }
}
