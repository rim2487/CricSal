import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from "@angular/material/button";
import {NgForOf} from "@angular/common";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {Player} from "../../../models/player";

@Component({
  selector: 'app-batsman-select-dialog',
  templateUrl: './batsman-select-dialog.component.html',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    NgForOf,
    MatDialogTitle,
    MatFormField,
    MatSelect,
    MatOption,
      MatLabel
  ],
  standalone: true
})
export class BatsmanSelectDialogComponent {
  selectedFirstBatsmanId: number | null = null;
  selectedSecondBatsmanId: number | null = null;

  constructor(
      public dialogRef: MatDialogRef<BatsmanSelectDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { players: Player[] }
  ) {}

  confirmSelection() {
    if (
        !this.selectedFirstBatsmanId ||
        !this.selectedSecondBatsmanId ||
        this.selectedFirstBatsmanId === this.selectedSecondBatsmanId
    ) {
      alert('Please select two different batsmen.');
      return;
    }

    this.dialogRef.close({
      first: this.selectedFirstBatsmanId,
      second: this.selectedSecondBatsmanId
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
