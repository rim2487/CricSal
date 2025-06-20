import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {PopupService} from '../../../services/popup.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-match-view',
  templateUrl: './match-view.component.html',
  styleUrls: ['./match-view.component.scss'],
  imports: [
    NgIf
  ],
  standalone: true
})
export class MatchViewComponent implements OnInit {
  matchId: number = 0;
  match: any;

  constructor(private route: ActivatedRoute, private http: HttpClient, private popupService: PopupService) {}

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchMatchDetails();
  }

  fetchMatchDetails() {
    this.http.get(`http://localhost:5000/matches/${this.matchId}`).subscribe({
      next: (data) => this.match = data,
      error: () => this.popupService.showPopup('Could not load match details', 'error')
    });
  }
}
