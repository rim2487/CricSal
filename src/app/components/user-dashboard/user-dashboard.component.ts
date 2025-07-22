import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {PopupService} from '../../services/popup.service';
import {MatchListComponent} from "../admin-dashboard/match-management/match-list/match-list.component";
import {PlayerManagementComponent} from "../admin-dashboard/player-management/player-management.component";
import {AuthService} from "../../services/auth.service";
import {TeamManagementComponent} from "../admin-dashboard/team-management/team-management.component";
import {MatchManagementComponent} from "../admin-dashboard/match-management/match-management.component";

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    MatchListComponent,
    PlayerManagementComponent,
    TeamManagementComponent,
    MatchManagementComponent,
    NgSwitch,
    NgSwitchCase
  ],
})
export class UserDashboardComponent implements OnInit {
  view: string = 'teams';

  constructor(private authService: AuthService) {}

  ngOnInit() {
  }

  setView(view: string) {
    this.view = view;
  }

  isAdmin() {
    return this.authService.isAdmin();
  }

}
