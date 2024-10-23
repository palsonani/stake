import Bet from "../models/Bet.js";
import FinancialTransaction from "../models/financialTransaction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { rawConfigs, arrayConfig } from '../methods/gameMethods/dragonTower/rawConfig.js';
import DragonTowerLocation from "../models/DragonTowerLocation.js";

const activeAutoBets = {};
export const dragonTowerSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New user connected for Dragon Tower game');
        let roomName;
        let selectedTileObj = {};
        let betId;
        let stage;
        let step;
        let currentMultiplier;
        let multiplier;

        socket.on('joinGame', async (data) => {
            const roomName = `game_${data.gameId}`;
            socket.join(roomName);
            console.log('User joined room:', roomName);
            console.log('Updated rooms:', io?.sockets?.adapter?.rooms);
            try {
                if (!data.gameId && !data.userId) {
                    throw new Error('Enter userId and gameId');
                }
                const activeBet = await Bet.findOne({
                    where: {
                        userId: data.userId,
                        gameId: data.gameId,
                        isActive: true // Check for an active bet
                    }
                });

                if (activeBet) {
                    betId = activeBet.id; // Store the active bet ID
                    console.log('Active bet found for user:', data.userId, betId);

                    // Restore game state
                    const gameState = await restoreGameState(data.gameId, data.userId, betId);
                    selectedTileObj = gameState.restoreData;
                    step = gameState.currentStep;
                    multiplier = gameState.multiplier;
                    const currentMultiplier = calculateIncrement(activeBet.difficulty, step);
                    socket.emit('gameRestored', gameState, currentMultiplier);
                    console.log('Game restored for user:', data.userId, gameState);
                    return;
                }
            } catch (error) {
                console.log(error)
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('dragonTowerPlaceBet', async (data) => {
            console.log('Start game request received:', data);
            step = 0;
            currentMultiplier = 0;
            selectedTileObj = {};
            stage = '';

            const { userId, gameId, betAmount, difficulty, betType } = data;
            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    return { success: false, error: 'Wallet not found' };
                }

                if (!wallet) {
                    io.to(user.id).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                    return;
                }
                if (wallet.currentAmount <= betAmount) {
                    console.log('inif', wallet.currentAmount, betAmount);
                    io.to(user.id).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                    return;
                }

                multiplier = await calculateAdaptiveMultiplier(userId, difficulty, gameId);

                // Create a new bet record
                const bet = await Bet.create({ gameId, userId, difficulty, betAmount, betType, multiplier });
                betId = bet.id;
                stage = difficulty

                await DragonTowerLocation.create({
                    gameId,
                    userId,
                    betId: bet.id,
                    selectedTile: JSON.stringify(selectedTileObj),
                    currentMultiplier
                })

                await Wallet.update(
                    { currentAmount: wallet.currentAmount - betAmount },
                    { where: { userId } }
                );

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: betAmount,
                    transactionType: 'bet',
                    transactionDirection: 'debit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                await FinancialTransaction.create({
                    gameId,
                    walletId: wallet.id,
                    userId,
                    amount: betAmount,
                    transactionType: 'bet',
                    transactionDirection: 'credit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                const walletData = await Wallet.findOne({
                    where: {
                        userId
                    }
                })

                socket.emit('walletBalance', walletData.currentAmount)
                socket.emit('gameStarted', { gameId, betId: bet.id });
                console.log('Game started and emitted:', { gameId, betId: bet.id });
            } catch (error) {
                console.log(error)
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('selectTile', async (data) => {
            console.log('Tile selection request received:', data);
            const { gameId, userId, tileStep, tileIndex } = data;

            try {
                console.log("select tiles bet::", betId);

                const result = await selectTile(gameId, userId, tileStep, tileIndex, betId, step);
                console.log("lkjsdbgfjhsd", result);

                step++;
                if (result.gameOver) {
                    console.log('Game over for user:', userId);

                    await Bet.update(
                        { isActive: false },
                        {
                            where: {
                                id: betId
                            }
                        }
                    )

                    socket.emit('gameOver', {
                        multiplier: result.multiplier
                    });

                } else {
                    console.log('Tile selected:', { tileIndex, multiplier: result.multiplier });
                    socket.emit('tileSelected', { tileIndex, multiplier: result.multiplier });
                }
            } catch (error) {
                console.log(error)
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('cashout', async (data) => {
            const { gameId, userId } = data;

            try {

                // Finalize the bet by marking it as a win (or save the final multiplier)
                const bet = await Bet.findOne({ where: { id: betId, gameId, userId } });
                if (bet) {
                    bet.status = 'win'; // Mark the bet as a win
                    bet.cashOutAt = currentMultiplier;
                    bet.winAmount = bet.betAmount * currentMultiplier;
                    bet.isActive = false;
                    await bet.save();
                }
                socket.emit('cashoutSuccess', { multiplier: currentMultiplier });
                let winAmount = bet.betAmount * currentMultiplier;

                const wallet = await Wallet.findOne({ where: { userId } });

                await Wallet.update(
                    { currentAmount: wallet.currentAmount + winAmount },
                    { where: { userId } }
                );

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: winAmount,
                    transactionType: 'win',
                    transactionDirection: 'credit',
                    description: `Won amount ${winAmount}`,
                    transactionTime: new Date(),
                });

                await FinancialTransaction.create({
                    gameId,
                    walletId: wallet.id,
                    userId,
                    amount: winAmount,
                    transactionType: 'win',
                    transactionDirection: 'debit',
                    description: `Won amount ${winAmount}`,
                    transactionTime: new Date(),
                });

                const walletData = await Wallet.findOne({
                    where: {
                        userId
                    }
                })
                socket.emit('cashoutSuccess', { multiplier: currentMultiplier });
                socket.emit('walletBalance', walletData.currentAmount);

            } catch (error) {
                console.error('Error during cashout:', error.message);
                socket.emit('error', { message: 'Cashout failed. Please try again.' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the limboGame server');
            if (roomName) {
                socket.leave(roomName);
            }
        });

        async function restoreGameState(gameId, userId, betId) {
            console.log('Restoring game state for:', { gameId, userId, betId });

            // Fetch bet details
            const bet = await Bet.findOne({ where: { id: betId, userId } });
            if (!bet) {
                console.error('Bet not found for user:', userId);
                throw new Error('No active bet found');
            }

            stage = bet.difficulty;
            // Fetch mine locations associated with the bet
            const data = await DragonTowerLocation.findOne({ where: { gameId, userId, betId } });
            console.log("data ===", data)
            const selectedTiles = data.selectedTile
            const restoreData = JSON.parse(selectedTiles)
            const currentStep = Object.keys(restoreData).length
            return {
                betId: bet.id,
                restoreData,
                multiplier: data.multiplier,
                currentStep
            };
        }

        function calculateIncrement(difficulty, step) {
            if (rawConfigs[difficulty] && rawConfigs[difficulty][step]) {
                return rawConfigs[difficulty][step];
            } else {
                return 1.00; // Default fallback if totalMines or step is out of bounds
            }
        }

        async function calculateAdaptiveMultiplier(userId, difficulty, gameId) {
            // Get the user's last 15 bets for the Dragon Tower game
            const lastBets = await Bet.findAll({
                where: { userId, gameId },
                order: [['betTime', 'DESC']],
                limit: 15
            });

            // Calculate total win and loss amounts
            const { totalWins, totalLosses } = lastBets.reduce(
                (acc, bet) => {
                    if (bet.status === 'win') {
                        acc.totalWins += bet.winAmount;
                    } else {
                        acc.totalLosses += bet.betAmount;
                    }
                    return acc;
                },
                { totalWins: 0, totalLosses: 0 }
            );

            // Determine whether the user is in profit or loss
            const inProfit = totalWins > totalLosses;

            // Select the appropriate multiplier index
            let newStep = inProfit ? Math.max(0, step - 1) : Math.min(step + 1, rawConfigs[difficulty].length - 1);

            console.log(`Adaptive step selected: ${newStep} for difficulty: ${difficulty}`);

            // Return the adaptive multiplier
            return rawConfigs[difficulty][newStep];
        }


        async function selectTile(gameId, userId, tileStep, tileIndex, betId, step) {
            const arr = new Array(...arrayConfig[stage]);
            console.log("entrance array ===", arr)
            const bet = await Bet.findOne({
                where: {
                    id: betId,
                    userId,
                    gameId,
                }
            });

            // Check if the bet exists
            if (!bet) {
                console.error('Bet not found for user:', userId);
                throw new Error('Bet not found');
            }

            arr[tileIndex] = 1;

            console.log("tileIndex", tileIndex, "tileStep ", tileStep);
            console.log("arr ==", arr)
            const baseIncrement = calculateIncrement(bet.difficulty, step)
            currentMultiplier = baseIncrement;
            console.log('Current multiplier:', currentMultiplier);


            // Check if the current multiplier has reached the threshold to set the next mine
            if (multiplier <= currentMultiplier) {
                return { gameOver: true, multiplier: 0, clickedTitle: tileIndex };
            }

            selectedTileObj[tileStep] = arr

            await DragonTowerLocation.update(
                { selectedTile: JSON.stringify(selectedTileObj), multiplier: currentMultiplier },
                {
                    where: {
                        betId,
                        userId,
                        gameId
                    }
                }
            )

            return { gameOver: false, multiplier: currentMultiplier };
        }
    });



}