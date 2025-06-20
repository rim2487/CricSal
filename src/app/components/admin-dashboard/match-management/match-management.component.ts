import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {Match} from '../../../models/match';
import {CricketService} from '../../../services/cricket.service';

@Component({
  selector: 'app-match-management',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    NgClass,
    TitleCasePipe
  ],
  templateUrl: './match-management.component.html',
  styleUrl: './match-management.component.scss'
})
export class MatchManagementComponent implements OnInit{
  teams: any[] = [];
  matches: Match[] = [];
  teamMap: { [id: number]: string } = {};

  constructor(private http: HttpClient,
              private cricketService: CricketService,) {}

  ngOnInit() {
    this.fetchTeams();
    this.getAllMatches();
    this.populateTeamsMap();
  }

  match = {
    team1_id: null,
    team2_id: null,
    status: ''
  };

  fetchTeams() {
    this.http.get('http://localhost:5000/admin/teams').subscribe((res: any) => {
      this.teams = res.teams;
    });
  }

  createMatch() {
    this.http.post('http://localhost:5000/admin/create-match', this.match).subscribe(() => {
      alert('Match created!');
      this.match = { team1_id: null, team2_id: null, status: '' };
    });
    this.getAllMatches();
  }

  getAllMatches() {
    this.cricketService.getMatches().subscribe((data) => {
      this.matches = data;
    });
  }

  populateTeamsMap() {
    this.cricketService.getAllTeams().subscribe((data) => {
      this.teams = data;
      this.teamMap = Object.fromEntries(data.map((team) =>[team.id, team.name]));
    })
  }

  getTeamName(id: number) {
    console.log(this.teamMap);
    return  this.teamMap[id] || `Team ${id}`;
  }
}
