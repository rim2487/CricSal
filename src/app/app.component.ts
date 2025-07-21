import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {ScoreInputComponent} from './components/admin-dashboard/score-input/score-input.component';
import {AuthService} from './services/auth.service';
import {NgIf} from '@angular/common';
import {PopupComponent} from './components/common/popup/popup.component';
import {PopupService} from './services/popup.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ScoreInputComponent, NgIf, PopupComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  message: string = '';
  type: string = 'success';

  constructor(private authService: AuthService, private router: Router, private popupService: PopupService) {
  }

  ngOnInit() {
    this.popupService.getPopup().subscribe(popup => {
      this.message = popup.message;
      this.type = popup.type;
    });
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  logout() {
    this.router.navigate(['/login']).then(r => {
      this.authService.logout();
        }
    );
  }

}
