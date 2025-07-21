import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ScoreInputComponent } from '../admin-dashboard/score-input/score-input.component';
import * as console from 'node:console';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-game-view',
  standalone: true,
  imports: [FormsModule, CommonModule, ScoreInputComponent, RouterLink],
  templateUrl: './game-view.component.html',
  styleUrls: ['./game-view.component.scss']
})
export class GameViewComponent implements OnInit, AfterViewInit{
  runs: number = 0;
  wickets: number = 0;
  overs: number = 0;
  message: string = '';
  isAdmin: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
  }

  submitScore() {
    const data = {
      runs: this.runs,
      wickets: this.wickets,
      overs: this.overs
    };

    this.http.post('/api/score', data).subscribe(
      (response: any) => {
        this.message = response.message;
        this.runs = 0;
        this.wickets = 0;
        this.overs = 0;
      },
      (error) => {
        console.error('Error submitting score:', error);
        this.message = 'Error submitting score.';
      }
    );
  }

  ngAfterViewInit(): void {
  }

}
