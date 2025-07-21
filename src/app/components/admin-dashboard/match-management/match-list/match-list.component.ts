import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CricketService} from '../../../../services/cricket.service';
import {CreateMatchComponent} from '../create-match/create-match.component';
import {NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {Match} from '../../../../models/match';
import {PopupService} from '../../../../services/popup.service';
import {MatDialog} from '@angular/material/dialog';
import {DialogModalComponent} from '../../../common/dialog-modal/dialog-modal.component';
import {AuthService} from "../../../../services/auth.service";

@Component({
  selector: 'app-match-list',
  templateUrl: './match-list.component.html',
  imports: [
    CreateMatchComponent,
    NgIf,
    NgForOf,
    TitleCasePipe,
    NgClass
  ],
  standalone: true
})
export class MatchListComponent implements OnInit {
  matches: Match[] = [];

  constructor(private cricketService: CricketService,
              private authService: AuthService,
              private router: Router,
              private popupService: PopupService,
              private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.fetchMatches();
  }

  fetchMatches(): void {
    this.cricketService.getMatches().subscribe({
      next: (res) => {
        this.matches = res;
      },
      error: (err) => {
        console.error('Failed to fetch matches', err);
      },
    });
  }

  startMatch(match: Match) {
    this.cricketService.updateMatchStatus(match.id, 'ongoing').subscribe({
      next: () => {
        this.router.navigate(['/score', match.id]);
      },
      error: () => {
        this.popupService.showPopup('Failed to start the match', 'error');
      }
    });
  }

  deleteMatch(match: Match) {
    const dialogRef = this.dialog.open(DialogModalComponent, {
      width: '300px',
      data: {
        title: 'Delete Match',
        message: 'Are you sure you want to delete this match?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User clicked Yes
        this.cricketService.deleteMatch(match.id).subscribe({
          next: () => {
            this.fetchMatches();
          },
          error: () => {
            // Show error popup
            this.popupService.showPopup('Failed to delete match', 'error');
          }
        });
      }
    });
  }

  isAdmin() {
    return this.authService.isAdmin();
  }
}
