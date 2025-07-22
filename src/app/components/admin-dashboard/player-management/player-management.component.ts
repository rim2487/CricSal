import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {DatePipe, DecimalPipe, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {CricketService} from "../../../services/cricket.service";
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: 'app-player-management',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgIf,
    NgForOf,
    TitleCasePipe,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderRow,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    DecimalPipe
  ],
  templateUrl: './player-management.component.html',
  styleUrl: './player-management.component.scss'
})
export class PlayerManagementComponent implements OnInit {
  players: any[] = [];
  isAddPlayerFormVisible = false;
  newPlayer: any = {
    name: '',
    powerplayRuns: 0,
    powerplayDismissals: 0,
    powerplayStrikeRate: 0.0,
    powerplayAverage: 0.0,
    powerplayBallsFaced: 0,

    middleRuns: 0,
    middleDismissals: 0,
    middleStrikeRate: 0.0,
    middleAverage: 0.0,
    middleBallsFaced: 0,

    deathRuns: 0,
    deathDismissals: 0,
    deathStrikeRate: 0.0,
    deathAverage: 0.0,
    deathBallsFaced: 0
  };

  phases = ['powerplay', 'middle', 'death'];

  displayedColumns: string[] = [
    'name',
    'powerplay_runs', 'powerplay_dismissals', 'powerplay_strike_rate', 'powerplay_average',
    'middle_runs', 'middle_dismissals', 'middle_strike_rate', 'middle_average',
    'death_runs', 'death_dismissals', 'death_strike_rate', 'death_average'
  ];

  constructor(private http: HttpClient,
              private cricketService: CricketService,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.fetchPlayers();
  }

  fetchPlayers() {
    // Fetch players from the backend
    this.http.get<{ players: any[] }>('http://localhost:5000/admin/players').subscribe(
      (response) => {
        this.players = response.players;
      },
      (error) => {
        console.error('Error fetching players:', error);
      }
    );
  }

  closeAddPlayerForm() {
    this.isAddPlayerFormVisible = false;
    this.newPlayer = {
      name: '',
      powerplayRuns: 0,
      powerplayDismissals: 0,
      powerplayStrikeRate: 0.0,
      powerplayAverage: 0.0,
      powerplayBallsFaced: 0.0,

      middleRuns: 0,
      middleDismissals: 0,
      middleStrikeRate: 0.0,
      middleAverage: 0.0,
      middleBallsFaced: 0.0,

      deathRuns: 0,
      deathDismissals: 0,
      deathStrikeRate: 0.0,
      deathAverage: 0.0,
      deathBallsFaced: 0.0
    };
  }

  addPlayer() {
    this.cricketService.createPlayer(this.newPlayer).subscribe(()=> {
      this.fetchPlayers();
      this.closeAddPlayerForm();
    })
  }

  showAddPlayerForm() {
    this.isAddPlayerFormVisible = true;
  }

  calculatePhaseStats(phase: string): void {
    const runs = this.newPlayer[`${phase}Runs`] || 0;
    const dismissals = this.newPlayer[`${phase}Dismissals`] || 0;
    const balls = this.newPlayer[`${phase}BallsFaced`] || 0;

    this.newPlayer[`${phase}Average`] = dismissals > 0 ? +(runs / dismissals).toFixed(2) : 0;
    this.newPlayer[`${phase}StrikeRate`] = balls > 0 ? +((runs / balls) * 100).toFixed(2) : 0;
  }

  isAdmin() {
    return this.authService.isAdmin();
  }

}
