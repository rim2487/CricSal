import {Player} from './player';

export interface LivePlayer extends Player{
  runs: number;
  isOut: boolean;
  onStrike?: boolean;
  ballsFaced: number;
}
