import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CricketService} from '../../../../services/cricket.service';
import {NgForOf, NgIf} from '@angular/common';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {Player} from '../../../../models/player';
import {Match} from '../../../../models/match';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {MatInput} from '@angular/material/input';
import {Team} from '../../../../models/team';
import {PopupService} from '../../../../services/popup.service';
import {MatIcon} from "@angular/material/icon";
import {UtilityService} from "../../../../services/utility.service";
import {MatTooltip} from "@angular/material/tooltip";

@Component({
  selector: 'app-create-match',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    FormsModule,
    MatFormField,
    MatSelect,
    MatOption,
    MatButton,
    MatRadioButton,
    MatRadioGroup,
    MatInput,
    MatLabel,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './create-match.component.html',
  styleUrls: ['./create-match.component.scss']
})
export class CreateMatchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  isModalVisible = true;
  matchForm: FormGroup;
  teams: Team[] = [];
  players: Player[] = [];
  playerPhasePrediction: { [playerId: number]: { will_perform: number, probability: number } } = {};

  match: Match = {
    id: 0,
    teamA: 0,
    teamB: 0,
    teamAPlayers: [],
    teamBPlayers: [],
    tossWinner: 0,
    tossDecision: 'bat',
    overs: 20,
    firstBatsman: 0,
    secondBatsman: 0,
    status: "created",
    teamAScore: 0,
    teamBScore: 0,
    result: '',
    phases: {
      powerplayOvers: 0,
      middleOvers: 0,
      deathOvers: 0
    }
  };

  phases = {
    powerplayOvers: 0,
    middleOvers: 0,
    deathOvers: 0,
  };

  phaseSum = 0;

  constructor(private fb: FormBuilder,
              private cricketService: CricketService,
              private utilityService: UtilityService,
              private popupService: PopupService) {
    this.matchForm = this.fb.group({
      teamA: [0],
      teamB: [0],
      teamAPlayers: [[]],
      teamBPlayers: [[]],
      tossWinner: [0],
      tossDecision: ['bat'],
      overs: [20],
      firstBatsman: [0],
      secondBatsman: [0],
      teamAScore: [0],
      teamBScore: [0],
      result: null
    });
  }

  get battingTeamPlayers(): Player[] {
    if (!this.match.tossWinner || !this.match.tossDecision) return [];

    const battingTeamId =
      this.match.tossDecision === 'bat'
        ? this.match.tossWinner
        : this.match.tossWinner === this.match.teamA
          ? this.match.teamB
          : this.match.teamA;

    if (!battingTeamId) return [];

    const selectedPlayerIds =
      battingTeamId === this.match.teamA ? this.match.teamAPlayers : this.match.teamBPlayers;

    return this.players.filter((player) => selectedPlayerIds.includes(player.id));
  }

  ngOnInit(): void {
    this.cricketService.getAllTeams().subscribe((teams) => (this.teams = teams));
    this.cricketService.getPlayers().subscribe((players) => (this.players = players));
  }

  onTeamAPlayersChange(selected: number[]) {
    if (selected.length > 11) {
      this.match.teamAPlayers = selected.slice(0, 11);
    } else {
      this.match.teamAPlayers = selected;
    }
  }

  onTeamBPlayersChange(selected: number[]) {
    if (selected.length > 11) {
      this.match.teamBPlayers = selected.slice(0, 11);
    } else {
      this.match.teamBPlayers = selected;
    }
  }

  onTeamAChange(teamId: number) {
    this.match.teamA = teamId;
    this.match.teamAPlayers = [];
    this.match.firstBatsman = 0;
    this.match.secondBatsman = 0;
  }

  onTeamBChange(teamId: number) {
    this.match.teamB = teamId;
    this.match.teamBPlayers = [];
    this.match.firstBatsman = 0;
    this.match.secondBatsman = 0;
  }

  quickSelectPlayers(): void {
    if (this.players.length < 22) {
      alert('Not enough players available to select 22 unique players.');
      return;
    }

    const shuffled = [...this.players].sort(() => Math.random() - 0.5);
    const teamAPlayers = shuffled.slice(0, 11).map(p => p.id);
    const teamBPlayers = shuffled.slice(11, 22).map(p => p.id);

    this.match.teamAPlayers = teamAPlayers;
    this.match.teamBPlayers = teamBPlayers;
  }

  createMatch(): void {
    const matchData = {
      teamA: this.match.teamA,
      teamB: this.match.teamB,
      teamAPlayers: this.match.teamAPlayers,
      teamBPlayers: this.match.teamBPlayers,
      tossWinner: this.match.tossWinner,
      tossDecision: this.match.tossDecision,
      overs: this.match.overs,
      firstBatsman: this.match.firstBatsman,
      secondBatsman: this.match.secondBatsman,
      teamAScore: this.match.teamAScore,
      teamBScore: this.match.teamBScore,
      result: this.match.result,
      phases: {
        powerplay: this.match.phases.powerplayOvers,
        middle: this.match.phases.powerplayOvers,
        death: this.match.phases.deathOvers
      }
    };

    this.cricketService.createMatch(matchData).subscribe({
      next: () => {
        this.popupService.showPopup('Match created successfully!', 'success');
        this.cricketService.refreshMatches();
        this.closeForm();
      },
      error: (err) => {
        console.error(err);
        this.popupService.showPopup('Error creating the match', 'error')
      },
    });
  }

  closeForm(): void {
    this.matchForm.reset();
    this.match = {
      id: 0,
      teamA: 0,
      teamB: 0,
      teamAPlayers: [],
      teamBPlayers: [],
      tossWinner: 0,
      tossDecision: 'bat',
      overs: 20,
      firstBatsman: 0,
      secondBatsman: 0,
      status: "created",
      teamAScore: 0,
      teamBScore: 0,
      result: '',
      phases: {
        powerplayOvers: 0,
        middleOvers: 0,
        deathOvers: 0
      }
    };
    this.isModalVisible = false;
    this.close.emit();
  }

  resetPhases() {
    this.phases = {powerplayOvers: 0, middleOvers: 0, deathOvers: 0};
    this.phaseSum = 0;
  }

  validatePhases() {
    this.phaseSum = this.phases.powerplayOvers + this.phases.middleOvers + this.phases.deathOvers;
  }

  loadPhasePredictions(players: Player[]) {
    const features = players
        .map(player => {
          const stats = this.utilityService.getStatsForPhase(player, 0);
          if (stats) {
            return {
              id: player.id,
              name: player.name,
              match_phase_num: 0
            };
          }
          return null;
        })
        .filter(player => player !== null);

    this.cricketService.suggestBatsman(features).subscribe({
      next: (results) => {
        this.playerPhasePrediction = {};

        Object.values(results).forEach((result: any) => {
          const playerId = result.player_id ?? result.id;
          this.playerPhasePrediction[playerId] = {
            will_perform: result.will_perform,
            probability: result.probability
          };
        });

      },
      error: () => {
        this.popupService.showPopup('Failed to get batsman predictions', 'error');
      }
    });
  }




}
