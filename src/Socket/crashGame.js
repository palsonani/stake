import moment from 'moment';
import Bet from "../models/Bet.js";
import Pull from "../models/Pull.js";
import User from "../models/user.js";
import Wallet from "../models/Wallet.js";
import PullPlayer from "../models/PullPlayer.js";
import Commission from "../models/Commission.js";
import WalletTransaction from "../models/WalletTransaction.js";
import FinancialTransaction from "../models/financialTransaction.js";
import { updateRandomUsersOnPullCreation } from "../methods/gameMethods/rendomUser.js";

let isGameRunning = false;
let crashPoint = 0.0;
let gameStartTimestamp = 0;
let countdownStarted = false;
let gameInterval;
let betInterval;

// Store auto bets for each game round

export const crashSocketHandler = (io) => {
    let totalBetAmount = 0;
    let gameMultiplier = 1.0;
    let players = [];
    let combinedPlayers = [];
    let autoBets = [];

    io.on('connection', async (socket) => {
        console.log('New player connected for CrashGame');
        io.emit('crashConnection', { message: 'new crashConnection' });
        const user = await User.findOne({ where: { id: 2 } });
        let roomName;

        socket.on('joinGame', (gameId) => {
            const roomName = `game_${gameId.gameId}`;
            socket.join(roomName);
            console.log('User joined room:', roomName);
            console.log('Updated rooms:', io.sockets.adapter.rooms);
        });

        io.emit('gameStatus', {
            status: isGameRunning ? 'Game in progress...' : countdownStarted ? 'Betting period in progress...' : 'Waiting...',
            totalBetAmount,
            players,
            autoBets
        });

        socket.on('placeBet', async (data) => {
            const {
                userId, amount, cashoutMultiplier, betType,
                numberOfBets, onWins, onLoss, stopOnProfit, stopOnLoss
            } = data;
        
            try {
                console.log(data);
                socket.join(userId);
        
                const user = await User.findOne({ where: { id: userId } });
                if (!user) {
                    socket.emit('error', { message: 'User not found', status: true });
                    return;
                }
                if (!user.isActive) {
                    io.to(userId).emit('inActiveUser', { 
                        message: 'Your Account is Disabled. Please Contact Support Team.', 
                        status: true 
                    });
                    return;
                }
        
                const username = user.userName;
                console.log(data);
        
                // Auto-bet handling
                if (betType === 'Auto') {
                    handleAutoBet({
                        userId, amount, cashoutMultiplier, numberOfBets, betType,
                        onWins, onLoss, stopOnProfit, stopOnLoss, username
                    });
                } else {
                    console.log('Attempting to place bet:', { isGameRunning, countdownStarted });
        
                    if (isGameRunning && countdownStarted) {
                        totalBetAmount += amount;
        
                        try {
                            const wallet = await Wallet.findOne({ where: { userId } });
                            if (!wallet) throw new Error('Wallet not found');
        
                            if (wallet.currentAmount < amount) {
                                io.to(userId).emit('Insufficientfund', {
                                    message: 'Insufficient funds',
                                    status: true
                                });
                                return;
                            }
        
                            // Deduct amount from the wallet
                            await Wallet.update(
                                { currentAmount: wallet.currentAmount - amount },
                                { where: { userId } }
                            );
        
                            // Record wallet transaction
                            await WalletTransaction.create({
                                walletId: wallet.id,
                                userId,
                                amount,
                                transactionType: 'bet',
                                transactionDirection: 'debit',
                                description: `Placed a bet of ${amount}`,
                                transactionTime: new Date()
                            });
        
                            // Record financial transaction
                            await FinancialTransaction.create({
                                gameId: 1,
                                walletId: wallet.id,
                                userId,
                                amount,
                                transactionType: 'bet',
                                transactionDirection: 'credit',
                                description: `Placed a bet of ${amount}`,
                                transactionTime: new Date()
                            });
        
                            // Create bet record
                            const newBet = await Bet.create({
                                userId,
                                gameId: 1,
                                betType,
                                betAmount: amount,
                                cashOutAt: cashoutMultiplier,
                                multiplier: cashoutMultiplier,
                                betTime: new Date(),
                            });
        
                            // Update player list
                            const existingPlayerIndex = players.findIndex(player => player.id === socket.id);
                            if (existingPlayerIndex >= 0) {
                                players[existingPlayerIndex].amount += amount;
                                players[existingPlayerIndex].cashoutMultiplier = cashoutMultiplier;
                            } else {
                                players.push({
                                    id: socket.id,
                                    betId: newBet.id,
                                    userId,
                                    username,
                                    amount,
                                    cashoutMultiplier
                                });
                                console.log(players);
                                console.log(newBet.id);
                            }
        
                            // Emit updated game status
                            io.emit('gameStatus', {
                                status: 'Betting period in progress...',
                                totalBetAmount,
                                players,
                                autoBets
                            });
                            console.log("Players who placed bet::", players, autoBets);
                        } catch (error) {
                            console.error('Error placing bet:', error);
                            socket.emit('error', { message: 'Could not place bet. Please try again.' });
                        }
                    } else {
                        console.log('Cannot place bets at this time. Status:', { isGameRunning, countdownStarted });
                        socket.emit('error', { 
                            message: 'Cannot place bets at this time. Please wait for the next round.' 
                        });
                    }
                }
            } catch (error) {
                console.error('Unexpected error:', error);
                socket.emit('error', { message: 'An unexpected error occurred. Please try again.' });
            }
        });
        
        // Listen for cancel bet event
        socket.on('cancelBet', async (data) => {
            const { userId, betId } = data;
        
            try {
                console.log(data);
                console.log(`Cancel bet request received: userId=${userId}, betId=${betId}`);
        
                // Check if the game is still in the betting period
                if (!countdownStarted) {
                    console.log(`Betting period has ended. Cancellation request: userId=${userId}, betId=${betId}`);
                    socket.emit('error', { message: 'Betting period has ended. Cannot cancel bets.' });
                    return;
                }
        
                // Find the bet
                let bet;
                try {
                    bet = await Bet.findOne({ where: { id: betId, userId } });
                    if (!bet) {
                        console.log(`Bet not found: userId=${userId}, betId=${betId}`);
                        socket.emit('error', { message: 'Bet not found' });
                        return;
                    }
                } catch (error) {
                    console.error('Error retrieving bet:', error);
                    socket.emit('error', { message: 'Error retrieving bet. Please try again.' });
                    return;
                }
        
                // Find the wallet
                let wallet;
                try {
                    wallet = await Wallet.findOne({ where: { userId } });
                    if (!wallet) {
                        console.log(`Wallet not found: userId=${userId}`);
                        socket.emit('error', { message: 'Wallet not found' });
                        return;
                    }
                } catch (error) {
                    console.error('Error retrieving wallet:', error);
                    socket.emit('error', { message: 'Error retrieving wallet. Please try again.' });
                    return;
                }
        
                // Refund the bet amount
                try {
                    await Wallet.update(
                        { currentAmount: wallet.currentAmount + bet.betAmount },
                        { where: { userId } }
                    );
        
                    await WalletTransaction.create({
                        walletId: wallet.id,
                        userId,
                        amount: bet.betAmount,
                        transactionType: 'refund',
                        transactionDirection: 'credit',
                        description: `Refunded bet amount of ${bet.betAmount}`,
                        transactionTime: new Date()
                    });
        
                    await FinancialTransaction.create({
                        gameId: 1,
                        walletId: wallet.id,
                        userId,
                        amount: bet.betAmount,
                        transactionType: 'refund',
                        transactionDirection: 'debit',
                        description: `Refunded bet amount of ${bet.betAmount}`,
                        transactionTime: new Date()
                    });
        
                    // Remove the bet
                    await Bet.destroy({ where: { id: betId, userId } });
        
                    console.log("bet.betType", bet.betType);
        
                    // Check if this is an auto bet and stop it
                    if (bet.betType === 'Auto') {
                        console.log(`Ending auto bet for user ${userId}`);
                        endAutoBet(userId);
        
                        // Remove the user from the autoBets list
                        autoBets = autoBets.filter(autoBet => autoBet.userId !== userId);
                        console.log("after auto bets cancel:", autoBets);
                        console.log(`Removed user ${userId} from autoBets list`);
                    }
        
                    // Update the player list
                    players = players.filter(player => player.id !== socket.id);
        
                    console.log(`Bet successfully canceled: userId=${userId}, betId=${betId}`);
        
                    io.emit('gameStatus', {
                        status: 'Betting period in progress...',
                        totalBetAmount,
                        players,
                        autoBets
                    });
                } catch (error) {
                    console.error('Error processing refund and removing bet:', error);
                    socket.emit('error', { message: 'Could not cancel bet. Please try again.' });
                }
            } catch (error) {
                console.error('Unexpected error during bet cancellation:', error);
                socket.emit('error', { message: 'An unexpected error occurred. Please try again.' });
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from the CrashGame server');
            if (roomName) {
                socket.leave(roomName);
            }
        });

        const handleAutoBet = async ({
            userId,
            amount,
            cashoutMultiplier,
            numberOfBets,
            onWins,
            onLoss,
            betType,
            stopOnProfit,
            stopOnLoss,
            username
        }) => {
            try {
                // Find the user's wallet
                let wallet;
                try {
                    wallet = await Wallet.findOne({ where: { userId } });
                    if (!wallet) throw new Error('Wallet not found');
                } catch (error) {
                    console.error(`Error retrieving wallet for user ${userId}:`, error);
                    io.to(userId).emit('error', { message: 'Error retrieving wallet. Please try again.' });
                    return;
                }
        
                // Check if the user has enough balance
                const totalBetCost = amount * numberOfBets;
                if (wallet.currentAmount < totalBetCost) {
                    io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds for auto bets', status: true });
                    console.log("Insufficient funds for auto bets");
                    return;
                }
        
                // Deduct the amount for the first auto bet
                try {
                    await Wallet.update(
                        { currentAmount: wallet.currentAmount - amount },
                        { where: { userId } }
                    );
                } catch (error) {
                    console.error(`Error deducting wallet amount for user ${userId}:`, error);
                    io.to(userId).emit('error', { message: 'Error processing bet amount deduction. Please try again.' });
                    return;
                }
        
                // Create wallet transaction
                try {
                    await WalletTransaction.create({
                        walletId: wallet.id,
                        userId,
                        amount,
                        transactionType: 'bet',
                        transactionDirection: 'debit',
                        description: `Placed an auto bet of ${amount}`,
                        transactionTime: new Date()
                    });
        
                    await FinancialTransaction.create({
                        gameId: 1,
                        walletId: wallet.id,
                        userId,
                        amount,
                        transactionType: 'bet',
                        transactionDirection: 'credit',
                        description: `Placed an auto bet of ${amount}`,
                        transactionTime: new Date()
                    });
                } catch (error) {
                    console.error(`Error creating transactions for user ${userId}:`, error);
                    io.to(userId).emit('error', { message: 'Error processing transactions. Please try again.' });
                    return;
                }
        
                // Create the auto bet
                let newAutoBet;
                try {
                    newAutoBet = await Bet.create({
                        userId,
                        gameId: 1,
                        betType,
                        betAmount: amount,
                        cashOutAt: cashoutMultiplier,
                        multiplier: cashoutMultiplier,
                        betTime: new Date(),
                        numberOfBets,
                        onWins,
                        onLoss,
                        stopOnProfit,
                        stopOnLoss,
                    });
                } catch (error) {
                    console.error(`Error creating auto bet for user ${userId}:`, error);
                    io.to(userId).emit('error', { message: 'Error placing auto bet. Please try again.' });
                    return;
                }
        
                // Check if there's an existing auto bet for the user
                try {
                    const existingAutoBetIndex = autoBets.findIndex(
                        autoBet => autoBet.userId === userId && autoBet.cashoutMultiplier === cashoutMultiplier
                    );
        
                    if (existingAutoBetIndex >= 0) {
                        // Update existing auto bet
                        autoBets[existingAutoBetIndex].numberOfBets += numberOfBets;
                        if (stopOnProfit !== null) autoBets[existingAutoBetIndex].stopOnProfit = stopOnProfit;
                        if (stopOnLoss !== null) autoBets[existingAutoBetIndex].stopOnLoss = stopOnLoss;
                        console.log(`Updated auto bet for user ${userId}:`, autoBets[existingAutoBetIndex]);
                    } else {
                        // Add new auto bet
                        autoBets.push({
                            userId,
                            username,
                            amount,
                            cashoutMultiplier,
                            numberOfBets,
                            onWins,
                            onLoss,
                            stopOnProfit,
                            stopOnLoss,
                            betId: newAutoBet.id,
                            placedBets: 0,
                            totalProfit: 0,
                            totalLoss: 0,
                        });
        
                        io.emit('gameStatus', {
                            status: 'Game started...',
                            totalBetAmount,
                            players,
                            autoBets
                        });
        
                        console.log(`Added new auto bet for user ${userId}:`, autoBets[autoBets.length - 1]);
                    }
                } catch (error) {
                    console.error(`Error handling auto bet for user ${userId}:`, error);
                    io.to(userId).emit('error', { message: 'Error processing auto bet. Please try again.' });
                }
            } catch (error) {
                console.error('Unexpected error during auto bet processing:', error);
                io.to(userId).emit('error', { message: 'An unexpected error occurred. Please try again.' });
            }
        };
        
        // const calculateCrashPoint = async () => {
        //     console.log('Calculating crash point...');
        //     if (players.length === 0 && autoBets.length === 0) {
        //         const minCrashPoint = 1.01;
        //         const maxCrashPoint = 5;
        //         crashPoint = parseFloat(Math.random() * (maxCrashPoint - minCrashPoint) + minCrashPoint).toFixed(2);
        //         // crashPoint = 30; // Default crash point if no players
        //     } else if (players.length === 1 && autoBets.length === 0 || players.length === 0 && autoBets.length === 1) {
        //         // // If there is only one player and no auto bets, set crash point to 1.01
        //         // crashPoint = 1.01;
        //         const singlePlayer = players.length === 1 ? players[0] : autoBets[0];
        //         crashPoint = parseFloat(Math.random() * (singlePlayer.cashoutMultiplier - 1.01) + 1.01).toFixed(2);
        //     } else {
        //         // Fetch the most recent commission
        //         let commissionPercentage = 0;
        //         try {
        //             const commission = await Commission.findOne({
        //                 where: { gameId: 1 },
        //                 order: [['startTime', 'DESC']],
        //             });
        //             if (commission) {
        //                 commissionPercentage = commission.commissionPercentage;
        //                 console.log('Applying commission:', commissionPercentage);
        //             } else {
        //                 console.log('No commission found for this game round.');
        //             }
        //         } catch (error) {
        //             console.error('Error fetching commission:', error);
        //         }

        //         // Deduct commission from total bet amount
        //         let totalPullAmount = totalBetAmount;
        //         if (commissionPercentage > 0) {
        //             const commissionAmount = (totalPullAmount * commissionPercentage) / 100;
        //             totalPullAmount -= commissionAmount;
        //             console.log('Commission Amount:', commissionAmount);
        //         }

        //         // Combine players and auto bets
        //         combinedPlayers = [...players];
        //         for (const autoBet of autoBets) {
        //             if (autoBet.placedBets < autoBet.numberOfBets) {
        //                 combinedPlayers.push({
        //                     id: `auto-${autoBet.userId}`,
        //                     userId: autoBet.userId,
        //                     betId: autoBet.betId,
        //                     username: 'AutoBet',
        //                     amount: autoBet.amount,
        //                     cashoutMultiplier: autoBet.cashoutMultiplier
        //                 });
        //             }
        //         }

        //         console.log('Combined players for crash point calculation:', combinedPlayers);

        //         // Sort players by cashoutMultiplier in ascending order
        //         combinedPlayers.sort((a, b) => a.cashoutMultiplier - b.cashoutMultiplier);

        //         let remainingAmount = totalPullAmount;
        //         let crashPointMultiplier = combinedPlayers[0].cashoutMultiplier;

        //         // Iterate through players to determine the crash point
        //         for (const player of combinedPlayers) {
        //             const potentialPayout = player.amount * player.cashoutMultiplier;

        //             if (remainingAmount >= potentialPayout) {
        //                 remainingAmount -= potentialPayout;
        //                 crashPointMultiplier = player.cashoutMultiplier;
        //             } else {
        //                 break;
        //             }
        //         }

        //         crashPoint = crashPointMultiplier;
        //     }

        //     console.log('Crash Point calculated:', crashPoint);
        //     io.emit('endRound', { crashPoint });
        //     console.log('Game ended with crashPoint:', crashPoint);
        // };
        // const calculateCrashPoint = async () => {
        //     console.log('Calculating crash point...');

        //     if (players.length === 0 && autoBets.length === 0) {
        //         // No players, set crash point randomly between 1.01 and 5
        //         const minCrashPoint = 1.01;
        //         const maxCrashPoint = 5;
        //         crashPoint = parseFloat((Math.random() * (maxCrashPoint - minCrashPoint) + minCrashPoint).toFixed(2));
        //     } else if (players.length === 1 && autoBets.length === 0 || players.length === 0 && autoBets.length === 1) {
        //         // Only one player or auto bet, set crash point to a random value between 1.01 and their cashout multiplier
        //         const onlyPlayer = players.length === 1 ? players[0] : autoBets[0];
        //         crashPoint = parseFloat((Math.random() * (onlyPlayer.cashoutMultiplier - 1.01) + 1.01).toFixed(2));
        //     } else {
        //         // Fetch the most recent commission
        //         let commissionPercentage = 0;
        //         try {
        //             const commission = await Commission.findOne({
        //                 where: { gameId: 1 },
        //                 order: [['startTime', 'DESC']],
        //             });
        //             if (commission) {
        //                 commissionPercentage = commission.commissionPercentage;
        //                 console.log('Applying commission:', commissionPercentage);
        //             } else {
        //                 console.log('No commission found for this game round.');
        //             }
        //         } catch (error) {
        //             console.error('Error fetching commission:', error);
        //         }

        //         // Deduct commission from total bet amount
        //         let totalPullAmount = totalBetAmount;
        //         if (commissionPercentage > 0) {
        //             const commissionAmount = (totalPullAmount * commissionPercentage) / 100;
        //             totalPullAmount -= commissionAmount;
        //             console.log('Commission Amount:', commissionAmount);
        //         }

        //         // Combine players and auto bets
        //         const combinedPlayers = [...players];
        //         for (const autoBet of autoBets) {
        //             if (autoBet.placedBets < autoBet.numberOfBets) {
        //                 combinedPlayers.push({
        //                     id: `auto-${autoBet.userId}`,
        //                     userId: autoBet.userId,
        //                     betId: autoBet.betId,
        //                     username: 'AutoBet',
        //                     amount: autoBet.amount,
        //                     cashoutMultiplier: autoBet.cashoutMultiplier
        //                 });
        //             }
        //         }

        //         console.log('Combined players for crash point calculation:', combinedPlayers);

        //         // Sort players by cashoutMultiplier in ascending order
        //         combinedPlayers.sort((a, b) => a.cashoutMultiplier - b.cashoutMultiplier);

        //         let remainingAmount = totalPullAmount;
        //         let crashPointMultiplier = combinedPlayers[0].cashoutMultiplier;

        //         // Iterate through players to determine the crash point
        //         for (const player of combinedPlayers) {
        //             const potentialPayout = player.amount * player.cashoutMultiplier;

        //             if (remainingAmount >= potentialPayout) {
        //                 remainingAmount -= potentialPayout;
        //                 crashPointMultiplier = player.cashoutMultiplier;
        //             } else {
        //                 break;
        //             }
        //         }

        //         // Adjust crash point if there are multiple players with the highest cashout multiplier
        //         const highestCashoutMultiplier = combinedPlayers[combinedPlayers.length - 1].cashoutMultiplier;
        //         const highestMultiplierPlayers = combinedPlayers.filter(p => p.cashoutMultiplier === highestCashoutMultiplier);

        //         if (highestMultiplierPlayers.length > 1) {
        //             // Set crash point slightly below the highest cashout multiplier
        //             crashPoint = parseFloat((highestCashoutMultiplier - 0.02).toFixed(2)); // Adjust the decrement as needed
        //         } else {
        //             crashPoint = crashPointMultiplier;
        //         }
        //     }

        //     console.log('Crash Point calculated:', crashPoint);
        //     io.emit('endRound', { crashPoint });
        //     console.log('Game ended with crashPoint:', crashPoint);
        // };
        // const calculateCrashPoint = async () => {
        //     console.log('Calculating crash point...');

        //     if (players.length === 0 && autoBets.length === 0) {
        //         // No players, set crash point randomly between 1.01 and 5
        //         const minCrashPoint = 1.01;
        //         const maxCrashPoint = 5;
        //         crashPoint = parseFloat((Math.random() * (maxCrashPoint - minCrashPoint) + minCrashPoint).toFixed(2));
        //     } else if (players.length === 1 && autoBets.length === 0 || players.length === 0 && autoBets.length === 1) {
        //         // Only one player or auto bet, set crash point to a random value between 1.01 and their cashout multiplier
        //         const onlyPlayer = players.length === 1 ? players[0] : autoBets[0];
        //         crashPoint = parseFloat((Math.random() * (onlyPlayer.cashoutMultiplier - 1.01) + 1.01).toFixed(2));
        //     } else {
        //         // Fetch the most recent commission
        //         let commissionPercentage = 0;
        //         try {
        //             const commission = await Commission.findOne({
        //                 where: { gameId: 1 },
        //                 order: [['startTime', 'DESC']],
        //             });
        //             if (commission) {
        //                 commissionPercentage = commission.commissionPercentage;
        //                 console.log('Applying commission:', commissionPercentage);
        //             } else {
        //                 console.log('No commission found for this game round.');
        //             }
        //         } catch (error) {
        //             console.error('Error fetching commission:', error);
        //         }

        //         // Deduct commission from total bet amount
        //         let totalPullAmount = totalBetAmount;
        //         if (commissionPercentage > 0) {
        //             const commissionAmount = (totalPullAmount * commissionPercentage) / 100;
        //             totalPullAmount -= commissionAmount;
        //             console.log('Commission Amount:', commissionAmount);
        //         }

        //         // Combine players and auto bets
        //         const combinedPlayers = [...players];
        //         for (const autoBet of autoBets) {
        //             if (autoBet.placedBets < autoBet.numberOfBets) {
        //                 combinedPlayers.push({
        //                     id: `auto-${autoBet.userId}`,
        //                     userId: autoBet.userId,
        //                     betId: autoBet.betId,
        //                     username: 'AutoBet',
        //                     amount: autoBet.amount,
        //                     cashoutMultiplier: autoBet.cashoutMultiplier
        //                 });
        //             }
        //         }

        //         console.log('Combined players for crash point calculation:', combinedPlayers);

        //         // Sort players by cashoutMultiplier in ascending order
        //         combinedPlayers.sort((a, b) => a.cashoutMultiplier - b.cashoutMultiplier);

        //         let remainingAmount = totalPullAmount;
        //         let crashPointMultiplier = combinedPlayers[0].cashoutMultiplier;

        //         // Calculate total payout amount based on the combined players
        //         let totalPayoutAmount = 0;
        //         for (const player of combinedPlayers) {
        //             totalPayoutAmount += player.amount * player.cashoutMultiplier;
        //         }

        //         // Adjust crash point based on the total payout amount
        //         for (const player of combinedPlayers) {
        //             const potentialPayout = player.amount * player.cashoutMultiplier;

        //             if (remainingAmount >= potentialPayout) {
        //                 remainingAmount -= potentialPayout;
        //                 crashPointMultiplier = player.cashoutMultiplier;
        //             } else {
        //                 break;
        //             }
        //         }

        //         // If multiple players have the highest cashout multiplier
        //         const highestCashoutMultiplier = combinedPlayers[combinedPlayers.length - 1].cashoutMultiplier;
        //         const highestMultiplierPlayers = combinedPlayers.filter(p => p.cashoutMultiplier === highestCashoutMultiplier);

        //         if (highestMultiplierPlayers.length > 1) {
        //             // Set crash point slightly below the highest cashout multiplier
        //             crashPoint = parseFloat((highestCashoutMultiplier - 0.02).toFixed(2)); // Adjust the decrement as needed
        //         } else {
        //             crashPoint = crashPointMultiplier;
        //         }

        //         // Ensure crash point does not exceed the total payout amount
        //         if (crashPoint > highestCashoutMultiplier) {
        //             crashPoint = parseFloat(highestCashoutMultiplier.toFixed(2));
        //         }
        //     }

        //     console.log('Crash Point calculated:', crashPoint);
        //     io.emit('endRound', { crashPoint });
        //     console.log('Game ended with crashPoint:', crashPoint);
        // };
       
        const calculateCrashPoint = async () => {
            console.log('Calculating crash point...');

            if (players.length === 0 && autoBets.length === 0) {
                // No players, set crash point randomly between 1.01 and 5
                const minCrashPoint = 1.01;
                const maxCrashPoint = 5;
                // crashPoint = parseFloat((Math.random() * (maxCrashPoint - minCrashPoint) + minCrashPoint).toFixed(2));
                crashPoint = 5;
            } else if (players.length === 1 && autoBets.length === 0 || players.length === 0 && autoBets.length === 1) {
                // Only one player or auto bet, set crash point to a random value between 1.01 and their cashout multiplier
                const onlyPlayer = players.length === 1 ? players[0] : autoBets[0];
                crashPoint = parseFloat((Math.random() * (onlyPlayer.cashoutMultiplier - 1.01) + 1.01).toFixed(2));
            } else {
                // Fetch the most recent commission
                let commissionPercentage = 0;
                try {
                    // Get the current date and time
                    const currentDate = moment().format('YYYY-MM-DD');
                    const currentTime = moment().format('HH:mm:ss');

                    // Fetch the latest commission based on gameId
                    const commission = await Commission.findOne({
                        where: {
                            gameId: 1,
                            startCommissionDate: { [Op.lte]: currentDate },
                            endCommissionDate: { [Op.gte]: currentDate },
                            startTime: { [Op.lte]: currentTime },
                            endTime: { [Op.gte]: currentTime }
                        },
                        order: [['startCommissionDate', 'DESC'], ['startTime', 'DESC']],
                    });
                    if (commission) {
                        commissionPercentage = commission.commissionPercentage;
                        console.log('Applying commission:', commissionPercentage);
                    } else {
                        commissionPercentage = 10;
                        console.log('defult commission apply for this game round.');
                    }
                } catch (error) {
                    console.error('Error fetching commission:', error);
                }

                // Deduct commission from total bet amount
                let totalPullAmount = totalBetAmount;
                if (commissionPercentage > 0) {
                    const commissionAmount = (totalPullAmount * commissionPercentage) / 100;
                    totalPullAmount -= commissionAmount;
                    console.log('Commission Amount:', commissionAmount);
                }

                // Combine players and auto bets
                const combinedPlayers = [...players];
                for (const autoBet of autoBets) {
                    if (autoBet.placedBets < autoBet.numberOfBets) {
                        combinedPlayers.push({
                            id: `auto-${autoBet.userId}`,
                            userId: autoBet.userId,
                            betId: autoBet.betId,
                            username: 'AutoBet',
                            amount: autoBet.amount,
                            cashoutMultiplier: autoBet.cashoutMultiplier
                        });
                    }
                }

                console.log('Combined players for crash point calculation:', combinedPlayers);

                // Sort players by cashoutMultiplier in ascending order
                combinedPlayers.sort((a, b) => a.cashoutMultiplier - b.cashoutMultiplier);

                let totalPayoutAmount = 0;
                let crashPointMultiplier = 1.01; // Default minimum crash point

                // Calculate total payout amount for each player
                for (const player of combinedPlayers) {
                    totalPayoutAmount += player.amount * player.cashoutMultiplier;
                }

                let remainingAmount = totalPullAmount;
                console.log("remainingAmount::", remainingAmount)
                // Iterate through players to determine the crash point
                for (const player of combinedPlayers) {
                    const potentialPayout = player.amount * player.cashoutMultiplier;

                    if (remainingAmount >= potentialPayout) {
                        remainingAmount -= potentialPayout;
                        crashPointMultiplier = player.cashoutMultiplier;
                    } else {
                        // Adjust crash point based on remaining amount
                        crashPointMultiplier = (remainingAmount / player.amount) + 1;
                        break;
                    }
                }

                // Adjust crash point to be slightly less if multiple players have the highest multiplier
                const highestCashoutMultiplier = combinedPlayers[combinedPlayers.length - 1].cashoutMultiplier;
                const highestMultiplierPlayers = combinedPlayers.filter(p => p.cashoutMultiplier === highestCashoutMultiplier);

                if (highestMultiplierPlayers.length > 1) {
                    crashPoint = parseFloat((highestCashoutMultiplier - 0.02).toFixed(2)); // Adjust the decrement as needed
                } else {
                    crashPoint = parseFloat(crashPointMultiplier.toFixed(2));
                }

                // Ensure crash point does not exceed the highest possible value based on total payout
                if (crashPoint > highestCashoutMultiplier) {
                    crashPoint = parseFloat(highestCashoutMultiplier.toFixed(2));
                }
            }

            console.log('Crash Point calculated:', crashPoint);
            io.emit('endRound', { crashPoint });
            console.log('Game ended with crashPoint:', crashPoint);
        };

        const endGameRound = async () => {
            if (gameInterval) clearInterval(gameInterval);
            if (betInterval) clearTimeout(betInterval);
            console.log('Ending game round...');

            if (players.length > 0 || autoBets.length > 0) {
                let pullId;
                try {
                    // Create a single Pull record for the game round
                    const pull = await Pull.create({
                        gameId: 1,
                        crashPoint,
                    });

                    pullId = pull.id;
                    console.log('Created Pull record with ID:', pullId);
                } catch (error) {
                    console.error('Error creating Pull record:', error);
                    return;
                }

                let totalProfit = 0;
                let totalLoss = 0;
                console.log("kljhagSKDFJNHksdbfG", totalLoss);
                // Combine manual and auto players for processing
                const combinedPlayers = [...players];

                // Include auto bets that haven't reached their limit
                for (const autoBet of autoBets) {
                    if (autoBet.placedBets < autoBet.numberOfBets) {
                        combinedPlayers.push({
                            id: `auto-${autoBet.userId}`,
                            userId: autoBet.userId,
                            username: 'AutoBet',
                            amount: autoBet.amount,
                            cashoutMultiplier: autoBet.cashoutMultiplier,
                            isAutoBet: true, // Mark as an auto bet
                            onWins: autoBet.onWins,
                            onLoss: autoBet.onLoss,
                        });
                    }
                }

                // Process winnings and create PullPlayer entries for each combined player
                for (const player of combinedPlayers) {
                    const isWinner = player.cashoutMultiplier <= crashPoint;
                    const winAmount = isWinner ? player.amount * player.cashoutMultiplier : 0;
                    let playerProfit = 0;
                    let playerLoss = 0;

                    try {
                        if (isWinner) {
                            const user = await User.findByPk(player.userId);
                            await user.updateMedal();
                            const wallet = await Wallet.findOne({ where: { userId: player.userId } });
                            if (wallet) {
                                await Wallet.update(
                                    { currentAmount: wallet.currentAmount + winAmount },
                                    { where: { userId: player.userId } }
                                );

                                await WalletTransaction.create({
                                    walletId: wallet.id,
                                    userId: player.userId,
                                    amount: winAmount,
                                    transactionType: 'win',
                                    transactionDirection: 'credit',
                                    description: `Won amount ${winAmount}`,
                                    transactionTime: new Date(),
                                });
                                await FinancialTransaction.create({
                                    gameId: 1,
                                    walletId: wallet.id,
                                    userId: player.userId,
                                    amount: winAmount,
                                    transactionType: 'win',
                                    transactionDirection: 'debit',
                                    description: `Won amount ${winAmount}`,
                                    transactionTime: new Date(),
                                });
                            }

                            playerProfit = winAmount - player.amount; // Calculate profit
                            totalProfit += playerProfit; // Add to total profit for both manual and auto bets

                            if (player.betId) {
                                await Bet.update(
                                    { winAmount },
                                    { where: { id: player.betId, userId: player.userId } }
                                );
                            }

                            // Update auto bet profit
                            if (player.isAutoBet) {
                                const autoBet = autoBets.find(autoBet => autoBet.userId === player.userId);
                                if (autoBet) {
                                    autoBet.totalProfit += playerProfit;

                                    // Adjust bet amount for the next round based on `onWins`
                                    if (autoBet.onWins !== null) {
                                        autoBet.amount *= (1 + autoBet.onWins / 100);
                                    }
                                }
                            }

                        } else {
                            playerLoss = player.amount; // Loss is the bet amount
                            totalLoss += playerLoss; // Add to total loss for both manual and auto bets
                            console.log("totalLoss", totalLoss)
                            // Update auto bet loss
                            if (player.isAutoBet) {
                                const autoBet = autoBets.find(autoBet => autoBet.userId === player.userId);
                                console.log("player", autoBet);
                                if (autoBet) {
                                    autoBet.totalLoss += playerLoss;

                                    // Adjust bet amount for the next round based on `onLoss`
                                    if (autoBet.onLoss !== null) {
                                        autoBet.amount *= (1 - autoBet.onLoss / 100);
                                    }

                                    // Ensure the bet amount doesn't drop below 1
                                    if (autoBet.amount < 1) {
                                        autoBet.amount = 1; // Set a minimum bet amount
                                    }
                                }
                            }
                        }

                        // Create PullPlayer record for both manual and auto bets
                        await PullPlayer.create({
                            pullId,
                            userId: player.userId,
                            amount: player.amount,
                            cashoutMultiplier: player.cashoutMultiplier,
                            winAmount: isWinner ? winAmount : null,
                            isWinner,
                        });

                    } catch (error) {
                        console.error('Error processing win/loss for player:', error);
                    }
                }

                // Update auto bets for the next round
                const updatedAutoBets = await Promise.all(autoBets.map(async (autoBet) => {
                    const newPlacedBets = autoBet.placedBets + 1;

                    const shouldStopOnProfit = autoBet.stopOnProfit !== null && autoBet.totalProfit >= autoBet.stopOnProfit;
                    const shouldStopOnLoss = autoBet.stopOnLoss !== null && autoBet.totalLoss >= autoBet.stopOnLoss;

                    if (shouldStopOnProfit || shouldStopOnLoss || newPlacedBets >= autoBet.numberOfBets) {
                        console.log(`Removing auto bet for user ${autoBet.userId}`);
                        endAutoBet(autoBet.userId);
                        return null;
                    }

                    // Deduct the bet amount for the new round
                    try {
                        const wallet = await Wallet.findOne({ where: { userId: autoBet.userId } });
                        if (wallet.currentAmount < autoBet.amount) {
                            console.log(`Insufficient funds for auto bet for user ${autoBet.userId}`);
                            return null; // Auto bet ends if funds are insufficient
                        }

                        // Deduct the bet amount from the user's wallet
                        await Wallet.update(
                            { currentAmount: wallet.currentAmount - autoBet.amount },
                            { where: { userId: autoBet.userId } }
                        );

                        // Create a wallet transaction for the auto bet deduction
                        await WalletTransaction.create({
                            walletId: wallet.id,
                            userId: autoBet.userId,
                            amount: autoBet.amount,
                            transactionType: 'bet',
                            transactionDirection: 'debit',
                            description: `Auto bet deduction of ${autoBet.amount} for the next round`,
                            transactionTime: new Date(),
                        });
                        await WalletTransaction.create({
                            gameId: 1,
                            walletId: wallet.id,
                            userId: autoBet.userId,
                            amount: autoBet.amount,
                            transactionType: 'bet',
                            transactionDirection: 'cradit',
                            description: `Auto bet deduction of ${autoBet.amount} for the next round`,
                            transactionTime: new Date(),
                        });

                        await Bet.create({
                            userId: autoBet.userId,
                            gameId: 1,
                            betType: autoBet.betType,
                            betAmount: autoBet.amount,
                            cashOutAt: autoBet.cashoutMultiplier,
                            multiplier: autoBet.cashoutMultiplier,
                            betTime: new Date(),
                            numberOfBets: autoBet.numberOfBets,
                            onWins: autoBet.onWins,
                            onLoss: autoBet.onLoss,
                            stopOnProfit: autoBet.stopOnProfit,
                            stopOnLoss: autoBet.stopOnLoss,
                        });

                        console.log(`Deducted ${autoBet.amount} from wallet for user ${autoBet.userId} for auto bet`);
                    } catch (error) {
                        console.error(`Error processing auto bet for user ${autoBet.userId}:`, error);
                        return null;
                    }

                    return {
                        ...autoBet,
                        placedBets: newPlacedBets,
                    };
                }));

                // Filter out null values (those which were removed or had insufficient funds)
                autoBets = updatedAutoBets.filter(autoBet => autoBet !== null);

                console.log('Updated auto bets:', autoBets);
            }
            else {
                await Pull.create({
                    gameId: 1,
                    crashPoint,
                });

            }
            players = [];
            io.emit('gameStatus', {
                status: 'Game in gameEnded...',
                totalBetAmount,
                players,
                autoBets
            });
            await updateRandomUsersOnPullCreation();
            // Fetch the last 5 pulls
            const lastPulls = await Pull.findAll({
                order: [['pullTime', 'DESC']],
                limit: 5,
                attributes: ['crashPoint'],
            });
            const crashPoints = lastPulls.map(pull => pull.crashPoint);
            console.log("crashPoints", crashPoints)
            multipliers.length = 0;
            io.emit('gameEnded', { message: 'Game has ended.', lastPulls: crashPoints });

            // Delay to ensure proper game reset
            setTimeout(() => {
                if (!isGameRunning) {
                    startNewGame();
                }
            }, 5000); // Delay before starting a new game
        };

        const endAutoBet = (userId) => {
            io.to(userId).emit('autoBetEnded', { message: `Auto bet ended for user: ${userId}`, status: 'success' });
            console.log(`auto bets ended for :`, userId, io.emit('autoBetEnded', { message: `Auto bet ended for user: ${userId}` }))
        };
        const multipliers = []; // Array to store the multipliers

        const startNewGame = () => {
            if (isGameRunning) return;
        
            console.log('Starting new game...');
            // Reset game state
            gameMultiplier = 1.0;
            isGameRunning = true;
            gameStartTimestamp = Date.now();
            countdownStarted = true;
        
            totalBetAmount = 0;
        
            // Emit message to notify about the start of the betting period
            io.emit('bettingStarted', { message: 'Betting period has started. Place your bets!', status: true });
        
            // Start betting period
            betInterval = setTimeout(() => {
                countdownStarted = false;
                calculateCrashPoint();
                io.emit('bettingClosed', { message: 'Betting period has ended. Game starting soon...', status: false });
        
                // Delay to start the game after calculating crash point
                setTimeout(() => {
                    io.emit('gameStarted', { multiplier: gameMultiplier.toFixed(1) });
                    multipliers.push(gameMultiplier.toFixed(1));
                    io.emit('multiplierUpdate', { multiplier: gameMultiplier.toFixed(1), multipliers }); // Emit initial multipliers array
                    // Start game loop
                    gameInterval = setInterval(() => {
                        if (isGameRunning) {
                            const nextMultiplier = parseFloat((gameMultiplier + 0.10).toFixed(3));
        
                            if (nextMultiplier >= crashPoint) {
                                // Set gameMultiplier to crashPoint if the next increment would exceed it
                                gameMultiplier = crashPoint;
                                multipliers.push(gameMultiplier.toFixed(1)); // Add to multipliers array
                                io.emit('multiplierUpdate', { multiplier: gameMultiplier, multipliers }); // Emit updated array
                                clearInterval(gameInterval);
                                isGameRunning = false;
                                endGameRound();
                            } else {
                                // Increment gameMultiplier and limit to 2 decimal places
                                gameMultiplier = nextMultiplier;
                                multipliers.push(gameMultiplier.toFixed(1)); // Add to multipliers array
                                // Notify clients of the updated multiplier
                                io.emit('multiplierUpdate', { multiplier: gameMultiplier.toFixed(1), multipliers }); // Emit updated array
                            }
                        }
                    }, 500);
                }, 2000); // 2 seconds before the game starts
            }, 10000); // 10-second betting period
        };

        // const startNewGame = () => {
        //     if (isGameRunning) return;

        //     console.log('Starting new game...');
        //     // Reset game state
        //     gameMultiplier = 1.0;
        //     isGameRunning = true;
        //     gameStartTimestamp = Date.now();
        //     countdownStarted = true;

        //     // Reset players and total bet amount
        //     // players = [];

        //     totalBetAmount = 0;

        //     // Emit message to notify about the start of the betting period
        //     io.emit('bettingStarted', { message: 'Betting period has started. Place your bets!', status: true });


        //     // Emit message to notify about the start of the betting period
        //     io.emit('bettingStarted', { message: 'Betting period has started. Place your bets!', status: true });
        //     // Start betting period
        //     betInterval = setTimeout(() => {
        //         countdownStarted = false;
        //         calculateCrashPoint();
        //         io.emit('bettingClosed', { message: 'Betting period has ended. Game starting soon...', status: false });

        //         // Delay to start the game after calculating crash point
        //         setTimeout(() => {
        //             io.emit('gameStarted', { multiplier: gameMultiplier.toFixed(1) });
        //             io.emit('multiplierUpdate', { multiplier: gameMultiplier.toFixed(1) });
        //             // Start game loop
        //             gameInterval = setInterval(() => {

        //                 if (isGameRunning) {
        //                     // gameMultiplier = parseFloat((gameMultiplier + 0.1).toFixed(2));
        //                     // io.emit('multiplierUpdate', { multiplier: gameMultiplier });

        //                     // if (gameMultiplier >= crashPoint) {
        //                     //     clearInterval(gameInterval);
        //                     //     isGameRunning = false;
        //                     //     endGameRound();
        //                     // }

        //                     const nextMultiplier = parseFloat((gameMultiplier + 0.10).toFixed(3));

        //                     if (nextMultiplier >= crashPoint) {
        //                         // Set gameMultiplier to crashPoint if the next increment would exceed it
        //                         gameMultiplier = crashPoint;
        //                         io.emit('multiplierUpdate', { multiplier: gameMultiplier });
        //                         clearInterval(gameInterval);
        //                         isGameRunning = false;
        //                         endGameRound();
        //                     } else {
        //                         // Increment gameMultiplier and limit to 2 decimal places
        //                         gameMultiplier = nextMultiplier;
        //                         // Notify clients of the updated multiplier
        //                         io.emit('multiplierUpdate', { multiplier: gameMultiplier.toFixed(1) });
        //                     }
        //                 }
        //             }, 500);
        //         }, 2000); // 2 seconds before the game starts
        //     }, 10000); // 10-second betting period
        // };
        
        startNewGame()
    });

    
};
