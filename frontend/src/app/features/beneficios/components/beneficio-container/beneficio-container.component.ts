import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Beneficio } from '../../../../core/models/beneficio.model';
import { BeneficioService } from '../../../../core/services/beneficio.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-beneficio-container',
  templateUrl: './beneficio-container.component.html',
  styleUrls: ['./beneficio-container.component.css']
})
export class BeneficioContainerComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly beneficioService = inject(BeneficioService);
  private readonly toastService = inject(ToastService);

  readonly beneficios$: Observable<Beneficio[]> = this.beneficioService.beneficios$;
  selectedBeneficio: Beneficio | null = null;
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  readonly editForm: FormGroup = this.formBuilder.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    descricao: ['']
  });

  ngOnInit(): void {
    this.beneficioService.loadBeneficios().subscribe({
      error: (error: Error) => {
        this.toastService.showError(error.message);
      }
    });
  }

  handleDelete(id: number): void {
    this.beneficioService.deleteBeneficio(id).subscribe({
      next: () => {
        if (this.selectedBeneficio?.id === id) {
          this.cancelEdit();
        }
        this.toastService.showSuccess('Beneficio removido com sucesso.');
      },
      error: (error: Error) => {
        this.toastService.showError(error.message);
      }
    });
  }

  handleEdit(beneficio: Beneficio): void {
    this.selectedBeneficio = beneficio;
    this.editForm.setValue({
      nome: beneficio.nome,
      descricao: beneficio.descricao ?? ''
    });
  }

  submitEdit(): void {
    if (!this.selectedBeneficio) {
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const nome = String(this.editForm.get('nome')?.value ?? '').trim();
    const descricaoRaw = this.editForm.get('descricao')?.value;
    const descricao = String(descricaoRaw ?? '').trim();

    this.beneficioService.updateBeneficio(this.selectedBeneficio.id, {
      nome,
      descricao
    }).subscribe({
      next: () => {
        this.toastService.showSuccess('Beneficio atualizado com sucesso.');
        this.cancelEdit();
      },
      error: (error: Error) => {
        this.toastService.showError(error.message);
      }
    });
  }

  cancelEdit(): void {
    this.selectedBeneficio = null;
    this.editForm.reset();
  }

  formatCurrency(value: number): string {
    const safeValue = Number.isFinite(value) ? value : 0;
    return this.currencyFormatter.format(safeValue);
  }
}
