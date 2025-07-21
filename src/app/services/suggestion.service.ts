import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {

  constructor(private http: HttpClient) { }

  suggestBatsman(strikeRate: number, average: number, matchPhase: string, dismissals: number) {
    return this.http.post<any>('http://localhost:5000/predict-batsman', {
      strike_rate: strikeRate,
      average: average,
      match_phase: matchPhase,
      dismissals: dismissals
    });

  }
}
