import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ToastMessage, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-feedback-message',
  templateUrl: './feedback-message.component.html',
  styleUrls: ['./feedback-message.component.css']
})
export class FeedbackMessageComponent {
  private readonly toastService = inject(ToastService);

  readonly toast$: Observable<ToastMessage | null> = this.toastService.toast$;

  close(): void {
    this.toastService.clear();
  }
}
