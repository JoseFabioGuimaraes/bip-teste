import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FeedbackMessageComponent } from './components/feedback-message/feedback-message.component';

@NgModule({
  declarations: [FeedbackMessageComponent],
  imports: [CommonModule],
  exports: [FeedbackMessageComponent]
})
export class SharedModule {}
