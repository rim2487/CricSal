import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgForOf } from '@angular/common';
import {PopupComponent} from '../../common/popup/popup.component';
import {PopupService} from '../../../services/popup.service';

@Component({
  selector: 'app-player-assignment',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    PopupComponent
  ],
  templateUrl: './player-assignment.component.html',
  styleUrl: './player-assignment.component.scss'
})
export class PlayerAssignmentComponent implements OnInit {
  teams = [];
  players = [];
  selectedTeamId: any;
  selectedPlayerId: any;

  constructor(private http: HttpClient, private popupService: PopupService) {}

  ngOnInit(): void {
    this.loadTeams();
    this.loadUnassignedPlayers();
  }

  loadTeams(): void {
    this.http.get<any>('http://localhost:5000/admin/teams').subscribe(data => {
      this.teams = data.teams;
    });
  }

  loadUnassignedPlayers(): void {
    this.http.get<any>('http://localhost:5000/admin/unassigned-players').subscribe(data => {
      this.players = data.players;
    });
  }

  assignPlayer(): void {
    if (this.selectedPlayerId && this.selectedTeamId) {
      this.http.post<any>('http://localhost:5000/admin/assign-player', {
        player_id: this.selectedPlayerId,
        team_id: this.selectedTeamId
      }).subscribe(response => {
        this.popupService.showPopup(response.message, 'success');
        this.loadUnassignedPlayers();
      }, error => {
        this.popupService.showPopup('Error assigning player', 'error');
      });
    } else {
      this.popupService.showPopup('Please select both a player and a team', 'error');
    }
  }

}
