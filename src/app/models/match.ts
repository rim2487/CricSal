import {Phases} from './phases';

export interface Match {
  id: number;
  teamA: number;
  teamB: number;
  teamAPlayers: number[];
  teamBPlayers: number[];
  tossWinner: number;
  tossDecision: 'bat' | 'bowl';
  overs: number;
  firstBatsman: number;
  secondBatsman: number;
  status: 'created' | 'ongoing' | 'completed';
  teamAScore: number;
  teamBScore: number;
  result: string;
  phases: Phases
}
