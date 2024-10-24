import { rowConfigs } from "../methods/gameMethods/wheel/rowConfigs.js";
import Bet from "../models/Bet.js";
import Wallet from "../models/Wallet.js";

export const testSocketHandler = (io) => {
    let players = {};
    let bets = [];
    let currentRound = null;

    io.on('connection', (socket) => {
        console.log(`Player connected for wheel Game testing`);

        let isAutoBetPaused = false;
        let autoBetInterval = null;

        // Handle manual bet
        socket.on('manualBet', async (betData) => {
            const { betAmount, risk, segment, userId } = betData;
            console.log(betData);

            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    io.to(userId).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                    return;
                }
                if (wallet.currentAmount <= betAmount) {
                    console.log('Insufficient funds:', wallet.currentAmount, betAmount);
                    io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                    return;
                }

                const outcome = await calculateOutcome(risk, segment, userId);

                console.log("Outcome:", outcome);
                await Bet.create({
                    betType: 'manual',
                    gameId: 15,
                    userId,
                    betAmount,
                    cashOutAt: outcome.multiplier,
                    multiplier: outcome.multiplier,
                    winAmount:outcome.multiplier * betAmount,
                    risk,
                    segment,
                    betTime: new Date(),
                    isActive: true,
                });

                io.to(socket.id).emit('manualBetResult', outcome);
            } catch (error) {
                console.error('Error handling manualBet:', error);
                io.to(socket.id).emit('error', { message: 'An error occurred during the manual bet.' });
            }
        });

        // Handle auto bet logic
        socket.on('autoBet', async (autoBetData) => {
            let { betAmount, risk, segment, numberOfBets, onWin, onLoss, stopOnLoss, stopOnProfit, userId } = autoBetData;
            console.log("autoBetData", autoBetData);

            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    io.to(userId).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                    return;
                }
                if (wallet.currentAmount <= betAmount) {
                    console.log('Insufficient funds:', wallet.currentAmount, betAmount);
                    io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                    return;
                }

                let remainingBets = numberOfBets;
                let totalProfit = 0;
                let totalLoss = 0;

                const runAutoBet = async () => {
                    try {
                        if (remainingBets > 0 && !isAutoBetPaused) {
                            const outcome = await calculateOutcome(risk, segment, userId);

                            console.log("Auto-bet Outcome:", betAmount, remainingBets, outcome);
                            if (outcome.success) {
                                totalProfit += (outcome.payout - betAmount);
                                betAmount += onWin;
                            } else {
                                totalLoss += betAmount;
                                betAmount -= onLoss;
                            }
                            if (stopOnLoss || stopOnProfit) {
                                if (totalLoss >= stopOnLoss || totalProfit >= stopOnProfit) {
                                    io.to(socket.id).emit('autoBetStop', { totalProfit, totalLoss });
                                    clearInterval(autoBetInterval);
                                    return;
                                }
                            }

                            remainingBets--;
                            io.to(socket.id).emit('autoBetResult', { betAmount, remainingBets, outcome });
                        }
                    } catch (error) {
                        console.error('Error during auto-bet:', error);
                        io.to(socket.id).emit('error', { message: 'An error occurred during the auto-bet.' });
                        clearInterval(autoBetInterval);
                    }
                };

                autoBetInterval = setInterval(runAutoBet, 1000);

                socket.on('pauseAutoBet', () => {
                    console.log('Auto-bet paused.');
                    isAutoBetPaused = true;
                });

                socket.on('resumeAutoBet', () => {
                    console.log('Auto-bet resumed.');
                    isAutoBetPaused = false;
                    runAutoBet();
                });

                socket.on('disconnect', () => {
                    console.log(`Player disconnected: ${socket.id}`);
                    clearInterval(autoBetInterval);
                });
            } catch (error) {
                console.error('Error handling autoBet:', error);
                io.to(socket.id).emit('error', { message: 'An error occurred during the auto-bet setup.' });
            }
        });
    });

    async function calculateOutcome(risk, segment, userId) {
        try {
            const lastBets = await Bet.findAll({
                where: { userId: 2, gameId: 15 },
                order: [['betTime', 'DESC']],
                limit: 15,
            });

            const { totalWins, totalLosses } = lastBets.reduce(
                (acc, bet) => {
                    if (bet.winAmount > 0) {
                        acc.totalWins += parseFloat(bet.winAmount);
                    } else {
                        acc.totalLosses += parseFloat(bet.betAmount);
                    }
                    return acc;
                },
                { totalWins: 0, totalLosses: 0 }
            );

            const inProfit = totalWins < totalLosses;
            console.log("inProfit:::",inProfit);
            
            const entries = rowConfigs[segment][risk].filter(
                entry => entry.isWin === inProfit
            );

            if (entries.length > 0) {
                const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                return { position: randomEntry.index, multiplier: randomEntry.value };
            } else {
                console.log('No valid entries found.');
                return { position: 0, multiplier: 0  };
            }
        } catch (error) {
            console.error('Error calculating outcome:', error);
            return { inProfit: false, error: 'An error occurred during outcome calculation.' };
        }
    }
};
