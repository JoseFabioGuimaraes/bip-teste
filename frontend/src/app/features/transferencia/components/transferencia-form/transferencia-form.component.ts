import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Beneficio } from '../../../../core/models/beneficio.model';
import { TransferRequest } from '../../../../core/models/transfer-request.model';
import { BeneficioService } from '../../../../core/services/beneficio.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-transferencia-form',
  templateUrl: './transferencia-form.component.html',
  styleUrls: ['./transferencia-form.component.css']
})
export class TransferenciaFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly beneficioService = inject(BeneficioService);
  private readonly toastService = inject(ToastService);

  readonly beneficios$: Observable<Beneficio[]> = this.beneficioService.beneficios$;

  isLoading = false;

  readonly form: FormGroup = this.formBuilder.group(
    {
      fromId: [null, [Validators.required, Validators.min(1)]],
      toId: [null, [Validators.required, Validators.min(1)]],
      amount: [null, [Validators.required, Validators.min(0.01)]]
    },
    { validators: [this.differentAccountsValidator] }
  );

  ngOnInit(): void {
    this.beneficioService.loadBeneficios().subscribe({
      error: (error: Error) => {
        this.toastService.showError(error.message);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fromIdControl = this.form.get('fromId');
    const toIdControl = this.form.get('toId');
    const amountControl = this.form.get('amount');

    if (!fromIdControl || !toIdControl || !amountControl) {
      return;
    }

    const fromId = Number(fromIdControl.value);
    const toId = Number(toIdControl.value);
    const amount = Number(amountControl.value);

    const payload: TransferRequest = {
      fromId,
      toId,
      amount
    };

    this.isLoading = true;
    this.beneficioService.transferir(payload).subscribe({
      next: () => {
        this.toastService.showSuccess('Transferencia realizada com sucesso.');
        this.form.reset();
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.toastService.showError(error.message);
        this.isLoading = false;
      }
    });
  }

  private differentAccountsValidator(control: AbstractControl): ValidationErrors | null {
    const fromId = control.get('fromId')?.value;
    const toId = control.get('toId')?.value;

    if (fromId !== null && toId !== null && fromId === toId) {
      return { sameAccount: true };
    }

    return null;
  }
}
