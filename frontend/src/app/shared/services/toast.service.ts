import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  type: ToastType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  readonly toast$ = this.toastSubject.asObservable();
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  showSuccess(message: string): void {
    this.show({ type: 'success', message });
  }

  showError(message: string): void {
    this.show({ type: 'error', message });
  }

  clear(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
    this.toastSubject.next(null);
  }

  private show(toast: ToastMessage): void {
    this.clear();
    this.toastSubject.next(toast);
    this.hideTimeoutId = setTimeout(() => {
      this.toastSubject.next(null);
      this.hideTimeoutId = null;
    }, 4000);
  }
}
