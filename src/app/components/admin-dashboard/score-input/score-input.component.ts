import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import {PopupService} from '../../../services/popup.service';
import {CricketService} from '../../../services/cricket.service';
import {Player} from '../../../models/player';
import {LivePlayer} from '../../../models/LivePlayer';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {PlayerSuggestorComponent} from './player-suggestor/player-suggestor.component';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {DialogModalComponent} from "../../common/dialog-modal/dialog-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {UtilityService} from "../../../services/utility.service";
import {BallDetail} from "../../../models/ballDetail";
import {BatsmanSelectDialogComponent} from "../../common/batsman-select-dialog/batsman-select-dialog.component";

@Component({
    selector: 'app-score-input',
    standalone: true,
    imports: [FormsModule, CommonModule, MatFormField, MatOption, MatSelect, MatButton, MatLabel, PlayerSuggestorComponent, MatTab, MatTabGroup],
    templateUrl: './score-input.component.html',
    styleUrls: ['./score-input.component.scss']
})
export class ScoreInputComponent implements OnInit {
    match: any;
    predictedBatsmen: any;
    showPredictionPanel: boolean = false;
    totalRuns = 0;
    currentOvers = 0;
    balls = 0;
    wickets = 0;
    firstInningsScore = 0;
    firstInningsWickets = 0;
    totalOvers: number = 0;

    selectedFirstBatsmanId: number | null = null;
    selectedSecondBatsmanId: number | null = null;

    showExtraRunSelector = false;
    extraRunType: 'WD' | 'NB' | 'LB' | 'B' | null = null;
    extraRunOptions: number[] = [];
    selectedExtraRuns: number = 0;

    innings = 1;
    isScoringAllowed = true;
    targetScore: number | null = null;
    ballDetails: BallDetail[] = [];

    batsmen: LivePlayer[] = [];
    battingTeamPlayers: LivePlayer[] = [];
    oppositionPlayers: Player[] = [];
    availableOppositionBatters: LivePlayer[] = [];
    ballHistory: string[] = [];
    currentOverNumber = 0;

    nextBatsmanIndex = 2;
    batsmanStatusMap = new Map<number, string>();

    showBatsmanSelector = false;
    isMatchEnded: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private popupService: PopupService,
        private cricketService: CricketService,
        private utilityService: UtilityService,
        private dialog: MatDialog
    ) {
    }

    get battingTeamName(): string {
        if (!this.match) return '';
        if (this.match.tossDecision === 'bat') {
            return this.match.tossWinnerName || 'Team A';
        } else {
            return this.match.tossWinnerName === this.match.teamAName ? this.match.teamBName : this.match.teamAName;
        }
    }

    get oppositionTeamName(): string {
        if (!this.match) return '';
        if (this.match.tossDecision === 'bowl') {
            return this.match.tossWinnerName || 'Team A';
        } else {
            return this.match.tossWinnerName === this.match.teamAName ? this.match.teamBName : this.match.teamAName;
        }
    }

    get currentPhase(): string {
        if (!this.match.phases) return '';
        const totalOvers = this.match.phases.powerplay + this.match.phases.middle + this.match.phases.death;
        if (this.currentOvers > totalOvers) return 'Inning Ended';

        const powerplayOverNumber = this.match.phases.powerplay;
        const middleOverNumber = powerplayOverNumber + this.match.phases.middle;
        const deathOverNumber = middleOverNumber + this.match.phases.death;

        if (powerplayOverNumber) return 'POWERPLAY';
        if (powerplayOverNumber < this.currentOvers < powerplayOverNumber + middleOverNumber) return 'MIDDLE';
        if (middleOverNumber < this.currentOvers < deathOverNumber) return 'DEATH';
        return 'NOT DEFINED';
    }

    ngOnInit(): void {
        const matchId = Number(this.route.snapshot.paramMap.get('matchId'));

        if (!matchId || isNaN(matchId)) {
            this.router.navigate(['/']).then(() => {
                this.popupService.showPopup('Invalid match ID', 'error');
            });
            return;
        }

        this.cricketService.getMatchById(matchId).subscribe({
            next: (matchData) => {
                this.match = matchData;
                this.setupInnings1();
            },
            error: () => {
                this.router.navigate(['/admin-dashboard']).then(() => {
                    this.popupService.showPopup('Failed to fetch match data', 'error');
                });
            }
        });

    }

    score(runs: number) {
        if (!this.isScoringAllowed) return;

        this.totalRuns += runs;
        this.balls++;

        const striker = this.batsmen.find(b => b.onStrike);
        if (striker) this.recordBall(striker.id, runs, false);

        this.updateBatsmanRuns(runs);
        if (runs % 2 !== 0) this.switchStrike();

        this.pushBallResult(runs.toString(), this.currentOvers);
        this.updateOvers();

        if (this.innings === 2 && this.targetScore !== null && this.totalRuns >= this.targetScore) {
            this.endMatch('Batting team wins');
        }
    }


    // ----------------------------------------extra types ---------------------------------------------------------- //
    wide() {
        if (!this.isScoringAllowed) return;
        this.extraRunType = 'WD';
        this.extraRunOptions = [0, 1, 2, 3, 4];
        this.selectedExtraRuns = 0;
        this.showExtraRunSelector = true;
    }

    noBall() {
        if (!this.isScoringAllowed) return;
        this.extraRunType = 'NB';
        this.extraRunOptions = [0, 1, 2, 3, 4, 6];
        this.selectedExtraRuns = 0;
        this.showExtraRunSelector = true;
    }

    bye() {
        if (!this.isScoringAllowed) return;
        this.extraRunType = 'B';
        this.extraRunOptions = [0, 1, 2, 3, 4];
        this.selectedExtraRuns = 0;
        this.showExtraRunSelector = true;
    }

    legBye() {
        if (!this.isScoringAllowed) return;
        this.extraRunType = 'LB';
        this.extraRunOptions = [0, 1, 2, 3, 4];
        this.selectedExtraRuns = 0;
        this.showExtraRunSelector = true;
    }

    // ------------------------------------------------------------------------------------------------------------ //

    wicket() {
        if (!this.isScoringAllowed) return;

        this.wickets++;
        this.balls++;
        this.totalRuns += 0;

        const striker = this.batsmen.find(b => b.onStrike);
        if (striker) this.recordBall(striker.id, 0, true);

        this.pushBallResult('W', this.currentOvers);
        this.updateOvers();

        if (!striker) return;
        striker.isOut = true;

        switch (this.currentPhase) {
            case 'POWERPLAY':
                striker.powerplayDismissals = (striker.powerplayDismissals || 0) + 1;
                break;
            case 'MIDDLE':
                striker.middleDismissals = (striker.middleDismissals || 0) + 1;
                break;
            case 'DEATH':
                striker.deathDismissals = (striker.deathDismissals || 0) + 1;
                break;
        }

        const playerStats = this.battingTeamPlayers.find(p => p.id === striker.id);
        if (playerStats) {
            playerStats.isOut = true;
            playerStats.runs = striker.runs;
            playerStats.powerplayDismissals = striker.powerplayDismissals;
            playerStats.middleDismissals = striker.middleDismissals;
            playerStats.deathDismissals = striker.deathDismissals;
        }

        const availableBatsmen = this.battingTeamPlayers.filter(player => !player.isOut && !this.isPlayerCurrentlyBatting(player.id));

        if (availableBatsmen.length === 1) {
            const lastMan = availableBatsmen[0];
            lastMan.onStrike = true;
            this.batsmen = this.batsmen.map(b => (b.onStrike ? lastMan : b));
            this.updateBatsmanStatusMap();
        } else if (availableBatsmen.length > 1) {
            const phaseNum = this.utilityService.getCurrentPhaseNumber(this.currentPhase);
            this.getSuggestionForNextBatsman(availableBatsmen, phaseNum);
        } else {
            this.checkInningsOrMatchEnd();
        }
    }

    getSuggestionForNextBatsman(players: Player[], currentPhase: number) {
        if (!players) {
            return;
        }

        const features = players
            .map(player => {
                const stats = this.utilityService.getStatsForPhase(player, currentPhase);
                if (stats) {
                    return {
                        id: player.id,
                        name: player.name,
                        match_phase_num: currentPhase
                    };
                }
                return null;
            })
            .filter(p => p !== null);

        this.cricketService.suggestBatsman(features).subscribe({
            next: (results) => {
                this.predictedBatsmen = results;
                this.showPredictionPanel = true;
            },
            error: () => {
                this.popupService.showPopup('Failed to get batsman predictions', 'error');
            }
        });
    }

    updateOvers() {
        this.currentOvers += Math.floor(this.balls / 6);
        this.balls %= 6;
        if (this.balls === 0) this.switchStrike();
        this.checkInningsOrMatchEnd();
    }

    checkInningsOrMatchEnd() {
        if (this.wickets === 10 || this.currentOvers === this.match.overs) {
            if (this.innings === 1) {
                this.firstInningsScore = this.totalRuns;
                this.firstInningsWickets = this.wickets;

                this.isScoringAllowed = false;
                this.targetScore = this.totalRuns + 1;

                const firstInningsBattingTeamId = this.match.tossDecision === 'bat'
                    ? this.match.tossWinner
                    : (this.match.tossWinner === this.match.teamA ? this.match.teamB : this.match.teamA);

                const secondInningsBattingTeamId = firstInningsBattingTeamId === this.match.teamA
                    ? this.match.teamB
                    : this.match.teamA;

                const secondInningsPlayersDetailed = secondInningsBattingTeamId === this.match.teamA
                    ? this.match.teamAPlayersDetailed
                    : this.match.teamBPlayersDetailed;

                this.availableOppositionBatters = secondInningsPlayersDetailed.map((p: Player) => ({
                    ...p,
                    runs: 0,
                    isOut: false,
                    onStrike: false,
                    powerplayBallsFaced: 0,
                    powerplayRuns: 0,
                    powerplayStrikeRate: 0,
                    powerplayDismissals: 0,
                    powerplayAverage: 0,
                    middleBallsFaced: 0,
                    middleRuns: 0,
                    middleStrikeRate: 0,
                    middleDismissals: 0,
                    middleAverage: 0,
                    deathBallsFaced: 0,
                    deathRuns: 0,
                    deathStrikeRate: 0,
                    deathDismissals: 0,
                    deathAverage: 0,
                    ballsFaced: 0
                }));

                this.popupService.showPopup('First innings complete. Please choose second innings openers.', 'info');
                this.openBatsmanSelectorModal();
            } else {
                if (this.totalRuns >= this.targetScore!) {
                    this.endMatch('Batting team wins');
                } else {
                    this.endMatch('Bowling team wins');
                }
            }
        }
    }

    startSecondInnings(firstId: number, secondId: number): void {
        this.innings = 2;
        this.totalRuns = 0;
        this.currentOvers = 0;
        this.balls = 0;
        this.wickets = 0;
        this.isScoringAllowed = true;

        this.battingTeamPlayers = this.availableOppositionBatters.map(p => ({...p}));

        const firstInningsBattingTeamId = this.match.tossDecision === 'bat'
            ? this.match.tossWinner
            : (this.match.tossWinner === this.match.teamA ? this.match.teamB : this.match.teamA);

        this.oppositionPlayers = firstInningsBattingTeamId === this.match.teamA
            ? this.match.teamAPlayersDetailed.map((p: Player) => ({...p}))
            : this.match.teamBPlayersDetailed.map((p: Player) => ({...p}));

        const firstBatsman = this.battingTeamPlayers.find(p => p.id === firstId);
        const secondBatsman = this.battingTeamPlayers.find(p => p.id === secondId);

        if (!firstBatsman || !secondBatsman) {
            this.popupService.showPopup('Could not find selected openers in batting team', 'error');
            return;
        }

        firstBatsman.onStrike = true;
        secondBatsman.onStrike = false;

        this.batsmen = [firstBatsman, secondBatsman];
        this.nextBatsmanIndex = 2;
        this.updateBatsmanStatusMap();

        this.ballHistory = [];
        this.currentOverNumber = 0;
    }

    switchStrike() {
        this.batsmen.forEach(b => b.onStrike = !b.onStrike);
        this.updateBatsmanStatusMap();
    }

    isYetToBat(player: LivePlayer): boolean {
        return !this.isPlayerCurrentlyBatting(player.id) && !player.isOut && player.runs === 0;
    }

    hasBatted(playerId: number): boolean {
        const player = this.battingTeamPlayers.find(p => p.id === playerId);
        if (!player) return false;
        return player.runs > 0 || player.isOut;
    }

    updateBatsmanStatusMap() {
        this.batsmanStatusMap.clear();
        this.batsmen.forEach(b => {
            if (b.isOut) {
                this.batsmanStatusMap.set(b.id, 'Out');
            } else if (b.onStrike) {
                this.batsmanStatusMap.set(b.id, 'Batting');
            } else {
                this.batsmanStatusMap.set(b.id, 'Not Batting');
            }
        });
    }

    isPlayerCurrentlyBatting(playerId: number): boolean {
        return this.batsmen.some(b => b.id === playerId);
    }

    isAdmin() {
        return this.authService.isAdmin();
    }

    endMatch(resultText: string) {
        this.isMatchEnded = true;
        this.match.status = 'completed';
        this.isScoringAllowed = false;

        const firstInningsBattingTeamId = this.match.tossDecision === 'bat'
            ? this.match.tossWinner
            : (this.match.tossWinner === this.match.teamA ? this.match.teamB : this.match.teamA);
        if (firstInningsBattingTeamId === this.match.teamA) {
            this.match.teamAScore = this.firstInningsScore;
            this.match.teamAWickets = this.firstInningsWickets;
            this.match.teamBScore = this.totalRuns;
            this.match.teamBWickets = this.wickets;
        } else {
            this.match.teamBScore = this.firstInningsScore;
            this.match.teamBWickets = this.firstInningsWickets;
            this.match.teamAScore = this.totalRuns;
            this.match.teamAWickets = this.wickets;
        }

        let winnerName: string;
        if (resultText === 'Batting team wins') {
            winnerName = this.battingTeamName;
        } else {
            winnerName = this.oppositionTeamName;
        }

        const winByRuns = this.targetScore! - this.totalRuns;
        const winByWickets = 10 - this.wickets;

        let finalResult: string;

        if (this.totalRuns >= this.targetScore!) {
            finalResult = `${winnerName} wins by ${winByWickets} wickets`;
        } else {
            finalResult = `${winnerName} wins by ${winByRuns} runs`;
        }

        this.match.result = finalResult;

        this.cricketService.updateMatch(this.match).subscribe({
            next: () => {
                this.calculatePlayerStats();
                this.popupService.showPopup(`Match ended: ${finalResult}`, 'success');
            },
            error: () => {
                this.popupService.showPopup(`Failed to save match result`, 'error');
            }
        });
    }


    resetScoreAndWickets() {
        this.totalRuns = 0;
        this.currentOvers = 0;
        this.balls = 0;
        this.wickets = 0;
    }

    pushBallResult(value: string, over: number) {
        if (over > this.currentOverNumber) {
            this.ballHistory.push('|');
            this.currentOverNumber = over;
        }

        this.ballHistory.push(value);
    }

    setupInnings1() {

        this.totalOvers = this.match.overs;

        const battingTeamId = this.match.tossDecision === 'bat'
            ? this.match.tossWinner
            : (this.match.tossWinner === this.match.teamA ? this.match.teamB : this.match.teamA);

        const battingPlayersDetailed = battingTeamId === this.match.teamA
            ? this.match.teamAPlayersDetailed
            : this.match.teamBPlayersDetailed;

        const oppositionPlayersDetailed = battingTeamId === this.match.teamA
            ? this.match.teamBPlayersDetailed
            : this.match.teamAPlayersDetailed;

        console.log(battingPlayersDetailed)

        if (!battingPlayersDetailed || !oppositionPlayersDetailed) {
            this.router.navigate(['/admin-dashboard']).then(() => {
                this.popupService.showPopup('Player lists missing', 'error');
            });
            return;
        }

        this.battingTeamPlayers = this.utilityService.initializeLivePlayers(battingPlayersDetailed);
        this.oppositionPlayers = [...oppositionPlayersDetailed];

        const firstBatsman = this.battingTeamPlayers.find(player => player.id === this.match.firstBatsman);
        const secondBatsman = this.battingTeamPlayers.find(player => player.id === this.match.secondBatsman);

        if (!firstBatsman || !secondBatsman) {
            this.router.navigate(['/admin-dashboard']).then(() => {
                this.popupService.showPopup('Could not find opening batsmen in batting team', 'error');
            });
            return;
        }

        firstBatsman.onStrike = true;
        secondBatsman.onStrike = false;
        this.batsmen = [firstBatsman, secondBatsman];
        this.nextBatsmanIndex = 2;
        this.resetScoreAndWickets();

        this.isScoringAllowed = true;
        this.targetScore = null;
        this.innings = 1;
        this.showBatsmanSelector = false;


        this.updateBatsmanStatusMap();
    }

    confirmExtraRuns() {
        if (!this.extraRunType) return;

        const runs = Number(this.selectedExtraRuns);
        const runLabel = `${runs}${this.extraRunType}`;
        this.ballHistory.push(runLabel);

        if (this.extraRunType === 'WD' || this.extraRunType === 'NB') {
            this.totalRuns += 1 + runs;
        } else {
            this.totalRuns += runs;
            this.balls++;
            this.updateOvers();
        }

        this.showExtraRunSelector = false;
        this.extraRunType = null;
        this.selectedExtraRuns = 0;
    }

    handleBatsmanSelect(player: any) {
        const nextBatsman = this.battingTeamPlayers.find(p => p.id === player.id);
        if (nextBatsman) {
            nextBatsman.onStrike = true;
            this.batsmen = this.batsmen.map(b => b.onStrike ? nextBatsman : b);
            this.nextBatsmanIndex++;
            this.updateBatsmanStatusMap();
        }
        this.showPredictionPanel = false;
    }

    handleCancel() {
        this.showPredictionPanel = false;
    }


    updateBatsmanRuns(runs: number) {
        const striker = this.batsmen.find(b => b.onStrike);
        if (!striker) return;

        striker.runs += runs;
        striker.ballsFaced += 1;

        const phase = this.utilityService.getCurrentPhaseNumber(this.currentPhase);
        if (phase === 0) {
            striker.powerplayRuns += runs;
            striker.powerplayBallsFaced += 1;
        } else if (phase === 1) {
            striker.middleRuns += runs;
            striker.middleBallsFaced += 1;
        } else if (phase === 2) {
            striker.deathRuns += runs;
            striker.deathBallsFaced += 1;
        }

        const playerStats = this.battingTeamPlayers.find(p => p.id === striker.id);
        if (playerStats) {
            playerStats.runs = striker.runs;
            playerStats.ballsFaced = striker.ballsFaced;
            if (phase === 0) {
                playerStats.powerplayRuns = striker.powerplayRuns;
                playerStats.powerplayBallsFaced = striker.powerplayBallsFaced;
            } else if (phase === 1) {
                playerStats.middleRuns = striker.middleRuns;
                playerStats.middleBallsFaced = striker.middleBallsFaced;
            } else if (phase === 2) {
                playerStats.deathRuns = striker.deathRuns;
                playerStats.deathBallsFaced = striker.deathBallsFaced;
            }
        }
    }

    discardMatch() {
        const dialogRef = this.dialog.open(DialogModalComponent, {
            data: {
                title: 'Discard Match?',
                message: 'Are you sure you want to discard this match and go back to the dashboard?',
                confirmButtonText: 'Discard',
                cancelButtonText: 'Cancel',
                color: 'warn'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.router.navigate(['/match-management']).then(() =>
                    this.cricketService.updateMatchStatus(this.match.id, 'created').subscribe(() => {
                    })
                );
            }
        });
    }

    recordBall(playerId: number, runs: number, isDismissal: boolean) {
        const phase = this.currentPhase;
        const overNumber = this.currentOverNumber;
        this.ballDetails.push({playerId, runs, phase, isDismissal, overNumber});
    }

    calculatePlayerStats() {
        const statsMap = new Map<number, {
            powerplayRuns: number; powerplayBallsFaced: number; powerplayDismissals: number;
            middleRuns: number; middleBallsFaced: number; middleDismissals: number;
            deathRuns: number; deathBallsFaced: number; deathDismissals: number;
        }>();

        for (const ball of this.ballDetails) {
            if (!statsMap.has(ball.playerId)) {
                statsMap.set(ball.playerId, {
                    powerplayRuns: 0, powerplayBallsFaced: 0, powerplayDismissals: 0,
                    middleRuns: 0, middleBallsFaced: 0, middleDismissals: 0,
                    deathRuns: 0, deathBallsFaced: 0, deathDismissals: 0,
                });
            }
            const stats = statsMap.get(ball.playerId)!;
            if (ball.phase === 'powerplay') {
                stats.powerplayRuns += ball.runs;
                if (!ball.isDismissal) stats.powerplayBallsFaced++;
                if (ball.isDismissal) stats.powerplayDismissals++;
            } else if (ball.phase === 'middle') {
                stats.middleRuns += ball.runs;
                if (!ball.isDismissal) stats.middleBallsFaced++;
                if (ball.isDismissal) stats.middleDismissals++;
            } else if (ball.phase === 'death') {
                stats.deathRuns += ball.runs;
                if (!ball.isDismissal) stats.deathBallsFaced++;
                if (ball.isDismissal) stats.deathDismissals++;
            }
        }

        const updatedPlayers = this.battingTeamPlayers.map(player => {
            const strikerPlayer = statsMap.get(player.id);
            if (!strikerPlayer) return player;
            const powerplaySR = strikerPlayer.powerplayBallsFaced > 0 ? (strikerPlayer.powerplayRuns / strikerPlayer.powerplayBallsFaced) * 100 : 0;
            const middleSR = strikerPlayer.middleBallsFaced > 0 ? (strikerPlayer.middleRuns / strikerPlayer.middleBallsFaced) * 100 : 0;
            const deathSR = strikerPlayer.deathBallsFaced > 0 ? (strikerPlayer.deathRuns / strikerPlayer.deathBallsFaced) * 100 : 0;

            const powerplayAvg = strikerPlayer.powerplayDismissals > 0 ? strikerPlayer.powerplayRuns / strikerPlayer.powerplayDismissals : strikerPlayer.powerplayRuns;
            const middleAvg = strikerPlayer.middleDismissals > 0 ? strikerPlayer.middleRuns / strikerPlayer.middleDismissals : strikerPlayer.middleRuns;
            const deathAvg = strikerPlayer.deathDismissals > 0 ? strikerPlayer.deathRuns / strikerPlayer.deathDismissals : strikerPlayer.deathRuns;

            return {
                ...player,
                powerplayRuns: strikerPlayer.powerplayRuns,
                powerplayBallsFaced: strikerPlayer.powerplayBallsFaced,
                powerplayDismissals: strikerPlayer.powerplayDismissals,
                powerplayStrikeRate: powerplaySR,
                powerplayAverage: powerplayAvg,

                middleRuns: strikerPlayer.middleRuns,
                middleBallsFaced: strikerPlayer.middleBallsFaced,
                middleDismissals: strikerPlayer.middleDismissals,
                middleStrikeRate: middleSR,
                middleAverage: middleAvg,

                deathRuns: strikerPlayer.deathRuns,
                deathBallsFaced: strikerPlayer.deathBallsFaced,
                deathDismissals: strikerPlayer.deathDismissals,
                deathStrikeRate: deathSR,
                deathAverage: deathAvg
            };
        });

        this.cricketService.updatePlayerData(updatedPlayers).subscribe({
            next: () => {
                this.popupService.showPopup('Player stats updated successfully', 'success');
            },
            error: () => {
                this.popupService.showPopup('Failed to update player stats', 'error');
            }
        });
    }


    completeMatch() {
        this.router.navigate(['/admin-dashboard']).then(() => {
            this.popupService.showPopup('Match completed!', 'success');
        });
    }

    openBatsmanSelectorModal() {
        const dialogRef = this.dialog.open(BatsmanSelectDialogComponent, {
            width: '400px',
            disableClose: true,
            data: { players: this.availableOppositionBatters }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const { first, second } = result;
                this.startSecondInnings(first, second);
            } else {
                this.popupService.showPopup('Opening batsmen selection is required.', 'error');
            }
        });
    }

    confirmOpenersSelection() {
        if (
            !this.selectedFirstBatsmanId ||
            !this.selectedSecondBatsmanId ||
            this.selectedFirstBatsmanId === this.selectedSecondBatsmanId
        ) {
            this.popupService.showPopup('Please select two different batsmen.', 'error');
            return;
        }

        this.showBatsmanSelector = false;

        this.startSecondInnings(
            this.selectedFirstBatsmanId,
            this.selectedSecondBatsmanId
        );
    }
}
