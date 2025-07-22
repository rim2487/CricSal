import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {CricketService} from '../../../services/cricket.service';
import {CreateMatchComponent} from './create-match/create-match.component';
import {MatchListComponent} from './match-list/match-list.component';
import {AuthService} from "../../../services/auth.service";

@Component({
    selector: 'app-match-management',
    standalone: true,
    imports: [
        FormsModule,
        NgForOf,
        NgIf,
        NgClass,
        TitleCasePipe,
        CreateMatchComponent,
        MatchListComponent
    ],
    templateUrl: './match-management.component.html',
    styleUrl: './match-management.component.scss'
})
export class MatchManagementComponent implements OnInit {
    showCreateMatch = false;
    teams: any[] = [];

    constructor(private http: HttpClient,
                private cricketService: CricketService,
                private authService: AuthService) {
    }

    ngOnInit() {
        this.cricketService.refreshMatches();
    }


    isAdmin() {
        return this.authService.isAdmin();
    }
}
