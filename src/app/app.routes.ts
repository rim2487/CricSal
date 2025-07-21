import {Routes} from '@angular/router';
import {GameViewComponent} from './components/game-view/game-view.component';
import {LoginComponent} from './components/login/login.component';
import {AdminDashboardComponent} from './components/admin-dashboard/admin-dashboard.component';
import {AuthGuard} from './guards/auth.guard';
import {AdminGuard} from './guards/admin.guard';
import {UserDashboardComponent} from './components/user-dashboard/user-dashboard.component';
import {ScoreInputComponent} from './components/admin-dashboard/score-input/score-input.component';
import {MatchManagementComponent} from "./components/admin-dashboard/match-management/match-management.component";

export const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'login', component: LoginComponent},
  {path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard]},
  {path: 'user-dashboard', component: UserDashboardComponent},
  {
    path: 'score/:matchId',
    component: ScoreInputComponent
  },
  {
    path: 'match-management',
    component: MatchManagementComponent
  }

];
