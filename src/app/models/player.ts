export interface Player {
  id: number;
  name: string;

  powerplayRuns: number;
  powerplayStrikeRate: number;
  powerplayDismissals: number;
  powerplayAverage: number;
  powerplayBallsFaced: number;

  middleRuns: number;
  middleStrikeRate: number;
  middleAverage: number;
  middleDismissals: number;
  middleBallsFaced: number;

  deathRuns: number;
  deathDismissals: number;
  deathStrikeRate: number;
  deathAverage: number;
  deathBallsFaced: number;
}
