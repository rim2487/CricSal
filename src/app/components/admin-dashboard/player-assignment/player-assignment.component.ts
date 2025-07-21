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
  }

  loadTeams(): void {
    this.http.get<any>('http://localhost:5000/admin/teams').subscribe(data => {
      this.teams = data.teams;
    });
  }
}
