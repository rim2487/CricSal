import { Component } from '@angular/core';
import {NgSwitch, NgSwitchCase} from '@angular/common';
import {TeamManagementComponent} from './team-management/team-management.component';
import {MatchManagementComponent} from './match-management/match-management.component';
import {PlayerManagementComponent} from './player-management/player-management.component';
import {PlayerAssignmentComponent} from './player-assignment/player-assignment.component';
import {GameViewComponent} from '../game-view/game-view.component';
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    NgSwitch,
    TeamManagementComponent,
    NgSwitchCase,
    MatchManagementComponent,
    PlayerManagementComponent,
    PlayerAssignmentComponent,
    GameViewComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  view: string = 'teams';

  constructor(private authService: AuthService) {
  }

  setView(view: string) {
    this.view = view;
  }

  isAdmin() {
    return this.authService.isAdmin();
  }


}
