import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Batsman} from '../../models/batsman';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-score-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './score-input.component.html',
  styleUrls: ['./score-input.component.scss']
})
export class ScoreInputComponent {

  totalRuns: number = 0;
  overs: number = 0;
  balls: number = 0;
  wickets: number = 0;
  comment: string = '';
  comments: string[] = [];

  batsmen: Batsman[] = [
    {name: 'Batsman 1', runs: 0, onStrike: true},
    {name: 'Batsman 2', runs: 0, onStrike: false},
  ];

  constructor(private authService: AuthService, private router: Router) {
  }

  score(runs: number) {
    this.totalRuns += runs;
    this.balls++;
    this.updateOvers();
    this.updateBatsmanRuns(runs);

    if (runs % 2 !== 0) {
      this.switchStrike();
    }
  }

  wide(runs: number) {
    this.totalRuns++;
  }

  noBall() {
    this.totalRuns++;
  }

  bye(runs: number) {
    this.totalRuns++;
    this.balls++;
    this.updateOvers();
  }

  legBye(runs: number) {
    this.totalRuns++;
    this.balls++;
    this.updateOvers();
  }

  wicket() {
    this.wickets++;
    this.balls++;
    this.updateOvers();
  }

  updateOvers() {
    this.overs = this.overs + Math.floor(this.balls / 6);
    this.balls = this.balls % 6;

    if (this.balls === 0) {
      this.switchStrike();
    }
  }

  switchStrike() {
    this.batsmen.forEach(batsman => {
      batsman.onStrike = !batsman.onStrike;
    });
  }

  updateBatsmanRuns(runs: number) {
    const onStrikeBatsman = this.batsmen.find(batsman => batsman.onStrike);
    if (onStrikeBatsman) {
      onStrikeBatsman.runs += runs;
    }
  }

  isAdmin() {
    return  this.authService.isAdmin();
  }

  addComment() {
    this.comments.push(this.comment);
    this.comment = ''; // Clear the comment box
  }
}
