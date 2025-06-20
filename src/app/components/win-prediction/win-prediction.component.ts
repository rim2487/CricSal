import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-win-prediction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './win-prediction.component.html',
  styleUrls: ['./win-prediction.component.scss']
})
export class WinPredictionComponent {
  winProbability: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient) { }

  getWinPrediction() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get('/api/predict_win').subscribe(
      (response: any) => {
        this.winProbability = response.winProbability;
        this.loading = false;
      },
      (error) => {
        console.error('Error getting win prediction:', error);
        this.errorMessage = 'Error getting win prediction. Please try again later.';
        this.loading = false;
      }
    );
  }
}
