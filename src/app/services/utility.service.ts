import { Injectable } from '@angular/core';
import {Player} from "../models/player";
import {CricketService} from "./cricket.service";
import {LivePlayer} from "../models/LivePlayer";

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(private cricketService: CricketService) { }

  getStatsForPhase(player: Player, currentPhase: number) {
    if (!player) return null;
    switch (currentPhase) {
      case 0: // Powerplay
        return {
          average: player.powerplayAverage,
          strike_rate: player.powerplayStrikeRate,
          dismissals: player.powerplayDismissals,
          ballsFaced: player.powerplayBallsFaced
        };
      case 1: // Middle
        return {
          average: player.middleAverage,
          strike_rate: player.middleStrikeRate,
          dismissals: player.middleDismissals,
          ballsFaced: player.middleBallsFaced
        };
      case 2: // Death
        return {
          average: player.deathAverage,
          strike_rate: player.deathStrikeRate,
          dismissals: player.deathDismissals,
          ballsFaced: player.deathBallsFaced
        };
      default:
        return null;
    }
  }



  getCurrentPhaseNumber(currentPhase: string): number {
    switch (currentPhase) {
      case 'POWERPLAY':
        return 0;
      case 'MIDDLE':
        return 1;
      case 'DEATH':
        return 2;
      default:
        return -1;
    }
  }

  initializeLivePlayers(players: Player[]): LivePlayer[] {
    return players.map(player => ({
      ...player,
      runs: 0,
      ballsFaced: 0,
      isOut: false,
      onStrike: false,

      powerplayRuns: player.powerplayRuns || 0,
      powerplayBallsFaced: player.powerplayBallsFaced || 0,
      powerplayStrikeRate: player.powerplayStrikeRate || 0,
      powerplayAverage: player.powerplayAverage || 0,
      powerplayDismissals: player.powerplayDismissals || 0,

      middleRuns: player.middleRuns || 0,
      middleBallsFaced: player.middleBallsFaced || 0,
      middleStrikeRate: player.middleStrikeRate || 0,
      middleAverage: player.middleAverage || 0,
      middleDismissals: player.middleDismissals || 0,

      deathRuns: player.deathRuns || 0,
      deathBallsFaced: player.deathBallsFaced || 0,
      deathStrikeRate: player.deathStrikeRate || 0,
      deathAverage: player.deathAverage || 0,
      deathDismissals: player.deathDismissals || 0,
    }));
  }




}
