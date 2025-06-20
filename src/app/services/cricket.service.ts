import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Team} from '../models/team';
import {Match} from '../models/match';

@Injectable({
  providedIn: 'root'
})
export class CricketService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // Matches
  getMatches(): Observable<Match[]> {
    return this.http.get<{matches: Match[]}>(`${this.apiUrl}/admin/matches`).pipe(
      map(response => response.matches)
    );
  }

  createMatch(matchData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/matches`, matchData);
  }

  deleteMatch(matchId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/matches/${matchId}`);
  }

  // Players
  getPlayers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/players`);
  }
  createPlayer(playerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/players`, playerData);
  }
  deletePlayer(playerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/players/${playerId}`);
  }

  // Scoreboard
  getScoreboard(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scoreboard`);
  }

  // teams
  getAllTeams(): Observable<Team[]> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/admin/teams`).pipe(
      map(response => response.teams)
    );
  }

}
