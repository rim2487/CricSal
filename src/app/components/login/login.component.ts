import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {PopupService} from '../../services/popup.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    FormsModule
  ],
  standalone: true
})
export class LoginComponent {
  username = '';
  password = '';
  role: string = 'user';

  constructor(private http: HttpClient, private router: Router, private popupService: PopupService) {}

  login() {
    this.http.post<any>('http://localhost:5000/login', {
      username: this.username,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        const token = res.access_token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('role', this.role);

          if (this.role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
            this.popupService.showPopup('Welcome Admin!', 'success');
          } else if (this.role === 'user') {
            this.router.navigate(['/admin-dashboard']);
            this.popupService.showPopup('Welcome User!', 'success');
          }
        } else {
          this.popupService.showPopup('Token missing in response', 'error');
        }
      },
      error: () => {
        this.popupService.showPopup('Login failed', 'error');
      }
    });
  }
}
