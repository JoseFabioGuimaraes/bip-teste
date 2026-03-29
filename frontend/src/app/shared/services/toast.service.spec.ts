import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ToastMessage, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  const requireToast = (toast: ToastMessage | null | undefined): ToastMessage => {
    if (!toast) {
      fail('Toast deveria existir neste ponto do teste');
      throw new Error('Toast ausente');
    }

    return toast;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('deve publicar toast de erro e esconder automaticamente', fakeAsync(() => {
    const emissions: Array<ToastMessage | null> = [];
    service.toast$.subscribe((toast) => {
      emissions.push(toast);
    });

    service.showError('insufficient balance for transfer');
    const latestToast = requireToast(emissions.at(-1));
    expect(latestToast.type).toBe('error');
    expect(latestToast.message).toBe('insufficient balance for transfer');

    tick(4000);
    expect(emissions.at(-1)).toBeNull();
  }));

  it('deve permitir limpeza manual imediata', () => {
    const emissions: Array<ToastMessage | null> = [];
    service.toast$.subscribe((toast) => {
      emissions.push(toast);
    });

    service.showSuccess('ok');
    const latestToast = requireToast(emissions.at(-1));
    expect(latestToast.type).toBe('success');
    expect(latestToast.message).toBe('ok');

    service.clear();
    expect(emissions.at(-1)).toBeNull();
  });
});
