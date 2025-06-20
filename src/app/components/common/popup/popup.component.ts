import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  standalone: true,
  imports: [
    NgClass,
    NgIf
  ],
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnChanges {
  @Input() message: string = '';
  @Input() type: string = 'success';

  show = false;
  timeoutRef: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      this.show = true;

      // Clear previous timeout if any
      if (this.timeoutRef) {
        clearTimeout(this.timeoutRef);
      }

      // Start new timeout
      this.timeoutRef = setTimeout(() => {
        this.closePopup();
      }, 3000);
    }
  }

  closePopup() {
    this.show = false;
  }
}
