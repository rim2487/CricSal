import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {Team} from '../models/team';
import {Match} from '../models/match';
import {Player} from '../models/player';
import { LivePlayer } from '../models/LivePlayer';

@Injectable({
  providedIn: 'root'
})
export class CricketService {
  private apiUrl = 'http://localhost:5000';
  private matchesSubject = new BehaviorSubject<Match[]>([]);

  constructor(private http: HttpClient) {
  }

  // Matches
  getMatches(): Observable<Match[]> {
    return this.http.get<{ matches: Match[] }>(`${this.apiUrl}/admin/matches`).pipe(
        map(response => response.matches)
    );
  }

  createMatch(matchData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create-match`, matchData);
  }

  deleteMatch(matchId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/matches/${matchId}`);
  }

// Players
  getPlayers(): Observable<Player[]> {
    return this.http.get<{ players: Player[] }>(`${this.apiUrl}/admin/players`).pipe(
        map(response => response.players)
    );
  }

  createPlayer(playerData: Player) {
    return this.http.post(`${this.apiUrl}/admin/player/create`, playerData);
  }

  updatePlayerData(playerData: LivePlayer[]) {
    return this.http.put(`${this.apiUrl}/admin/player/update`, playerData);
  }

  getPlayer(playerId: number): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/admin/player?id=${playerId}`);
  }

// teams
  getAllTeams(): Observable<Team[]> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/admin/teams`).pipe(
      map(response => response.teams)
    );
  }

  getMatchById(matchId: number) {
    return this.http.get<any>(`${this.apiUrl}/admin/match/${matchId}`);
  }

  refreshMatches() {
    this.http.get<Match[]>(`${this.apiUrl}/admin/matches`).subscribe(matches => {
      this.matchesSubject.next(matches);
    });
  }

  updateMatchStatus(matchId: number, status: string) {
    return this.http.put(`${this.apiUrl}/admin/match/${matchId}/status`, {status});
  }

  updateMatch(matchData: Match) {
      return this.http.put(`${this.apiUrl}/admin/match/end-match/${matchData.id}`, matchData);
  }

  suggestBatsman(features: any) {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(`${this.apiUrl}/admin/predict-batsman-batch`, features, { headers: headers });
  }




}
