import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-player-management',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgIf,
    NgForOf
  ],
  templateUrl: './player-management.component.html',
  styleUrl: './player-management.component.scss'
})
export class PlayerManagementComponent implements OnInit{
  players: any[] = [];  // Stores the list of players from the backend
  isAddPlayerFormVisible = false;
  isEditPlayerFormVisible = false;
  newPlayer = { name: '', role: '' };
  selectedPlayer: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchPlayers();
  }

  fetchPlayers() {
    // Fetch players from the backend
    this.http.get<{ players: any[] }>('http://localhost:5000/admin/players').subscribe(
      (response) => {
        this.players = response.players;
      },
      (error) => {
        console.error('Error fetching players:', error);
      }
    );
  }

  openAddPlayerForm() {
    this.isAddPlayerFormVisible = true;
  }

  closeAddPlayerForm() {
    this.isAddPlayerFormVisible = false;
    this.newPlayer = { name: '', role: '' };  // Reset form
  }
  closeEditPlayerForm() {
    this.isEditPlayerFormVisible = false;
    this.selectedPlayer = null;  // Reset form
  }

  addPlayer() {
    this.http.post('http://localhost:5000/admin/create-player', this.newPlayer).subscribe(() => {
      this.fetchPlayers();  // Refresh player list after adding
      this.closeAddPlayerForm();
    });
  }
}
