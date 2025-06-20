import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';
import {PopupService} from '../../services/popup.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
})
export class UserDashboardComponent implements OnInit {
  matches: any[] = [];

  constructor(private http: HttpClient, private router: Router, private popupService: PopupService) {}

  ngOnInit() {
    this.fetchMatches();
  }

  fetchMatches() {
    this.http.get<any[]>('http://localhost:5000/user/matches').subscribe({
      next: (data) => (this.matches = data),
      error: () => this.popupService.showPopup('Failed to fetch matches', 'error')
    });
  }

  viewMatch(matchId: number) {
    this.router.navigate(['/match', matchId]);
  }
}
