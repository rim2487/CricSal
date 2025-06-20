import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {CricketService} from '../../../services/cricket.service';
import {Team} from '../../../models/team';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './team-management.component.html',
  styleUrl: './team-management.component.scss'
})
export class TeamManagementComponent implements OnInit {
  teamName: string = '';
  message: string = '';
  teams: Team[] = [];

  constructor(private http: HttpClient,
              private cricketService: CricketService,) {}

  createTeam() {
    if (!this.teamName.trim()) {
      this.message = 'Team name cannot be empty';
      return;
    }

    this.http
      .post('http://localhost:5000/admin/create-team', { name: this.teamName })
      .subscribe({
        next: (res: any) => {
          this.message = res.message;
          this.teamName = '';
          this.fetchAllTeams();
        },
        error: () => {
          this.message = 'Error creating team';
        },
      });
  }

  ngOnInit() {
    this.fetchAllTeams();
  }

  fetchAllTeams() {
    this.cricketService.getAllTeams().subscribe((data) => {
      this.teams = data;
    });
  }
}
