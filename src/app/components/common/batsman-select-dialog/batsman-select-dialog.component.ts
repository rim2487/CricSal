import {Component, Inject} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
} from '@angular/material/dialog';
import {Player} from '../../../models/player';
import {
    MatFormField, MatLabel
} from "@angular/material/form-field";
import {
    MatOption,
    MatSelect
} from "@angular/material/select";
import {MatIcon} from "@angular/material/icon";
import {NgForOf, NgIf} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions
} from "@angular/material/dialog";

@Component({
    selector: 'app-batsman-select-dialog',
    templateUrl: './batsman-select-dialog.component.html',
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatFormField,
        MatSelect,
        MatOption,
        MatIcon,
        NgForOf,
        NgIf,
        MatButton,
        MatDialogActions,
        MatLabel
    ]
})
export class BatsmanSelectDialogComponent {
    selectedFirstBatsmanId: number | null = null;
    selectedSecondBatsmanId: number | null = null;

    // PredictedBatsmen is an object indexed by playerId
    predictedBatsmen: {
        [playerId: number]: {
            will_perform: number;
            probability: number;
            threshold: number;
        };
    } = {};

    constructor(
        public dialogRef: MatDialogRef<BatsmanSelectDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            players: Player[],
            predictedBatsmen?: {
                [playerId: number]: {
                    will_perform: number;
                    probability: number;
                    threshold: number;
                };
            }
        }
    ) {
        if (data.predictedBatsmen) {
            this.predictedBatsmen = data.predictedBatsmen;
        }
    }

    confirmSelection(): void {
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

    cancel(): void {
        this.dialogRef.close(null);
    }
}
