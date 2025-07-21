import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-suggestor',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgClass
  ],
  templateUrl: './player-suggestor.component.html',
  styleUrl: './player-suggestor.component.scss'
})
export class PlayerSuggestorComponent {
  @Input() predictedBatsmen: any[] = [];
  @Input() visible = false;

  @Output() onSelect = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  selectPlayer(player: any) {
    this.onSelect.emit(player);
  }

  cancel() {
    this.onCancel.emit();
  }
}
