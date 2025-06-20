import { Routes } from '@angular/router';
import {LineupPredictionComponent} from './components/lineup-prediction/lineup-prediction.component';
import {GameViewComponent} from './components/game-view/game-view.component';
import {LoginComponent} from './components/login/login.component';
import {AdminDashboardComponent} from './components/admin-dashboard/admin-dashboard.component';
import {AuthGuard} from './guards/auth.guard';
import {AdminGuard} from './guards/admin.guard';
import {UserDashboardComponent} from './components/user-dashboard/user-dashboard.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'game-view', component: GameViewComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'user-dashboard', component: UserDashboardComponent },
  { path: 'lineup', component: LineupPredictionComponent },
];
