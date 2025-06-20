import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lineup-prediction',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lineup-prediction.component.html',
  styleUrls: ['./lineup-prediction.component.scss']
})
export class LineupPredictionComponent {
  phase: string = 'powerplay';
  recommendedPlayer: string[] = [];
  localHost = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) { }

  getLineup() {
    this.http.get(this.localHost + `/api/recommend?phase=${this.phase}`).subscribe(
      (response: any) => {
        this.recommendedPlayer = response.name;
      },
      (error) => {
        console.error('Error getting lineup:', error);
      }
    );
  }
}
