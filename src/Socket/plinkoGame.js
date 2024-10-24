import Bet from "../models/Bet.js";
import Wallet from "../models/Wallet.js";
import { sequelize } from "../config/connection.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AmountDistribution from "../models/AmountDistribution.js";
import FinancialTransaction from "../models/financialTransaction.js";
import { outcomes } from "../methods/gameMethods/plinko/outcomes.js";
import { rowConfigs } from "../methods/gameMethods/plinko/rowConfigs.js";
import { generateWeights } from "../methods/gameMethods/plinko/generateWeights.js";

let autoBetSessions = {};


export const plinkoSocketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("New user connected for Plinko");

        async function placeBet(userId, betAmount, rows, riskLevel) {
           
            // Validate row configuration and risk level
            if (!rowConfigs[rows]) {
                return { success: false, error: 'Invalid number of rows' };
            }
            if (!['low', 'medium', 'high'].includes(riskLevel)) {
                return { success: false, error: 'Invalid risk level' };
            }
            const results = [];
            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    return { success: false, error: 'Wallet not found' };
                }

                // if (wallet.currentAmount < betAmount * autoBetCount) {
                //     return { success: false, error: 'Insufficient funds' };
                // }

                const wallet1 = await Wallet.update(
                    { currentAmount: wallet.currentAmount - betAmount },
                    { where: { userId } }
                );

                io.to(userId).emit("walletBalance", {
                    walletBalance: wallet1.currentAmount
                });

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: betAmount || 0,
                    transactionType: 'bet',
                    transactionDirection: 'debit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                await FinancialTransaction.create({
                    gameId: 9,
                    walletId: wallet.id,
                    userId,
                    amount: betAmount || 0,
                    transactionType: 'bet',
                    transactionDirection: 'credit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                // Simulate the ball drop
                const distribution = await AmountDistribution.findOne({
                    where: {
                        userId,
                        gameId: 9
                    }
                });
                // if(distribution)
                // {
                //     const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // }
                // else{
                //     const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // }
                const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // console.log("dropPosition, multiplier::", dropPosition, multiplier);

                let finalMultiplier = multiplier;

                // Check AmountDistribution and adjust multiplier

                // if (distribution) {
                //     // const profit = betAmount * (multiplier - 1);
                //     // console.log("profit",profit)
                //     if (distribution.amount > 0) {
                //         finalMultiplier = Math.max(1.1, multiplier);
                //         const winAmount = betAmount * finalMultiplier;
                //         const profit = winAmount - betAmount;
                //         await AmountDistribution.update(
                //             { amount: distribution.amount - profit },
                //             { where: { id: distribution.id } }
                //         );
                //     } else {
                //         // Not enough amount in distribution
                //         await AmountDistribution.update(
                //             { amount: 0, status: 'inactive' },
                //             { where: { id: distribution.id } }
                //         );
                //         finalMultiplier = Math.max(1.1, multiplier);
                //     }
                // } else {
                //     finalMultiplier = multiplier;
                // }

                const winAmount = betAmount * finalMultiplier;
              
            
                // Store the bet result in the database

                const bet = await Bet.create({
                    gameId: 9,
                    userId,
                    betAmount,
                    multiplier,
                    winAmount,
                    rows,
                    risk: riskLevel,
                    betTime: new Date()
                });

                // console.log(`Result: Multiplier=${multiplier}, Position=${dropPosition}, WinAmount=${winAmount}`);
                // results.push({ finalMultiplier, dropPosition, winAmount });
                results.push({ finalMultiplier, dropPosition, winAmount, rows, riskLevel, userId, betId: bet.id });
                // console.log("results::::", results,bet.betId)
            } catch (error) {
                console.error('Error saving bet:', error);
                return { success: false, error: 'Failed to process bet' };
            }

            return { success: true, results };
        }

        async function emitBetResult(result, socket) {
            
            try {
                result.results.forEach(async (result) => {
                    

                    const outcome = result.dropPosition;

                    // Ensure the rowConfigs and outcomes exist to avoid undefined errors
                    if (!rowConfigs[result.rows] || !rowConfigs[result.rows][result.riskLevel] || !outcomes[result.rows]) {
                        console.error("Invalid configuration for rows or riskLevel.");
                        socket.emit("error", "Invalid configuration for rows or riskLevel.");
                        return;
                    }

                    const multiplier = rowConfigs[result.rows][result.riskLevel][outcome];
                    const possibleOutcomes = outcomes[result.rows][outcome];

                    const pattern = [];
                    for (let i = 0; i < result.rows; i++) {
                        pattern.push(Math.random() > 0.5 ? "R" : "L");
                    }
                    if (autoBetSessions[result.userId]) {
                        // Emit the bet result
                        socket.emit("plinkoBetResult", {
                            point: possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)],
                            multiplier,
                            pattern,
                            remainingBets: autoBetSessions[result.userId].remainingBets,
                            betId: result.betId
                        });
                    }
                    else {
                        
                        // console.log("results11111.betId = " ,results.betId);


                        socket.emit("plinkoBetResult", {
                            point: possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)],
                            multiplier,
                            pattern,
                            betId: result.betId
                        });
                    }
                    // Fetch the last 4 bets from the database asynchronously
                    try {
                        const lastBets = await Bet.findAll({
                            where: { userId: result.userId, gameId: 9 }, // Fetch bets for the specific user
                            order: [['betTime', 'DESC']],
                            limit: 4
                        });

                        const lastMultipliers = lastBets.map(bet => bet.multiplier);
                        console.log("Last four multipliers:", lastMultipliers);

                        // Emit the last 4 multipliers to the client
                        socket.emit('lastFourMultipliers', { multipliers: lastMultipliers });
                    } catch (error) {
                        console.error("Error fetching last bets:", error);
                    }
                });
            } catch (error) {
                console.error("Error:", error);
            }

        }

        // Function to start an auto-bet session
        function startAutoBet(socket, userId, betAmount, rows, riskLevel, autoBetCount) {
            if (autoBetSessions[userId]) {
                console.log("Auto-bet session already exists for user:", userId);
                return;
            }

            let remainingBets = autoBetCount;

            autoBetSessions[userId] = {
                interval: setInterval(async () => {
                    if (remainingBets <= 0) {
                        clearInterval(autoBetSessions[userId].interval);
                        delete autoBetSessions[userId]; // Clear session after all bets are done
                        socket.emit("autoBetComplete", { message: "Auto-bet completed" });
                        return;
                    }

                    const result = await placeBet(userId, betAmount, rows, riskLevel);
                    emitBetResult(result, socket);
                    remainingBets--;
                    autoBetSessions[userId].remainingBets = remainingBets;
                }, 1500), // Bet every 1 second
                remainingBets,
            };

            console.log("Auto-bet session started for user:", userId, autoBetSessions[userId]);
            socket.emit("autoBetStarted", { message: "Auto-bet started", remainingBets });
        }

        // Function to resume an auto-bet session
        function resumeAutoBet(socket, userId, betAmount, rows, riskLevel) {
            const session = autoBetSessions[userId];
            const remainingBets = session.remainingBets;

            session.interval = setInterval(async () => {
                if (remainingBets <= 0) {
                    clearInterval(session.interval);
                    delete autoBetSessions[userId];
                    socket.emit("autoBetComplete", { message: "Auto-bet completed" });
                    return;
                }

                const result = await placeBet(userId, betAmount, rows, riskLevel);
                emitBetResult(result, socket);
                session.remainingBets--;
            }, 5000);

            socket.emit("autoBetResumed", { message: "Auto-bet resumed", remainingBets });
        }

        // Place a bet logic
        async function placeBet(userId, betAmount, rows, riskLevel) {
            console.log(userId, betAmount, rows, riskLevel)
            // Validate row configuration and risk level
            if (!rowConfigs[rows]) {
                return { success: false, error: 'Invalid number of rows' };
            }
            if (!['low', 'medium', 'high'].includes(riskLevel)) {
                return { success: false, error: 'Invalid risk level' };
            }
            const results = [];
            try {
                const wallet = await Wallet.findOne({ where: { userId } });
                if (!wallet) {
                    return { success: false, error: 'Wallet not found' };
                }

                // if (wallet.currentAmount < betAmount * autoBetCount) {
                //     return { success: false, error: 'Insufficient funds' };
                // }
                let currentAmount= wallet.currentAmount - betAmount;
               await Wallet.update(
                    { currentAmount: wallet.currentAmount - betAmount },
                    { where: { userId } }
                );
                const walletAmount = await Wallet.findOne({ where: { userId } });

                socket.emit("walletBalance", {
                    walletBalance: walletAmount.currentAmount
                });

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId,
                    amount: betAmount || 0,
                    transactionType: 'bet',
                    transactionDirection: 'debit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                await FinancialTransaction.create({
                    gameId: 9,
                    walletId: wallet.id,
                    userId,
                    amount: betAmount || 0,
                    transactionType: 'bet',
                    transactionDirection: 'credit',
                    description: `Placed  bets of ${betAmount} each`,
                    transactionTime: new Date()
                });

                // Simulate the ball drop
                const distribution = await AmountDistribution.findOne({
                    where: {
                        userId,
                        gameId: 9
                    }
                });
                // if(distribution)
                // {
                //     const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // }
                // else{
                //     const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // }
                const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId, betAmount, distribution);
                // console.log("dropPosition, multiplier::", dropPosition, multiplier);

                let finalMultiplier = multiplier;

                // Check AmountDistribution and adjust multiplier

                // if (distribution) {
                //     // const profit = betAmount * (multiplier - 1);
                //     // console.log("profit",profit)
                //     if (distribution.amount > 0) {
                //         finalMultiplier = Math.max(1.1, multiplier);
                //         const winAmount = betAmount * finalMultiplier;
                //         const profit = winAmount - betAmount;
                //         await AmountDistribution.update(
                //             { amount: distribution.amount - profit },
                //             { where: { id: distribution.id } }
                //         );
                //     } else {
                //         // Not enough amount in distribution
                //         await AmountDistribution.update(
                //             { amount: 0, status: 'inactive' },
                //             { where: { id: distribution.id } }
                //         );
                //         finalMultiplier = Math.max(1.1, multiplier);
                //     }
                // } else {
                //     finalMultiplier = multiplier;
                // }

                const winAmount = betAmount * finalMultiplier;
                console.log("winAmount::", winAmount);

                // Store the bet result in the database

                const bet = await Bet.create({
                    gameId: 9,
                    userId,
                    betAmount,
                    multiplier,
                    winAmount,
                    rows,
                    risk: riskLevel,
                    betTime: new Date()
                });

                // console.log(`Result: Multiplier=${multiplier}, Position=${dropPosition}, WinAmount=${winAmount}`);
                // results.push({ finalMultiplier, dropPosition, winAmount });
                results.push({ finalMultiplier, dropPosition, winAmount, rows, riskLevel, userId, betId: bet.id });
                console.log("results::::::::::::::::::::::", results)
            } catch (error) {
                console.error('Error saving bet:', error);
                return { success: false, error: 'Failed to process bet' };
            }

            return { success: true, results };
        }

        async function dropBall(rows, riskLevel, userId, betAmount, distribution) {

            // Get the possible outcomes based on row and risk level
            const possibleOutcomes = rowConfigs[rows][riskLevel];
            console.log('possibleOutcomes:', possibleOutcomes);

            // Fetch the user's betting history
            const totalBets = await Bet.findAll({
                where: { userId, gameId: 9 },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
                    [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
                ],
                raw: true
            });

            const totalBet = totalBets[0]?.totalBet || 0;
            const totalWin = totalBets[0]?.totalWin || 0;
            const netGain = totalWin - totalBet;
            console.log("netGain:", netGain);

            // Determine if the user is in profit or loss
            const inProfit = netGain > 0;

            // We'll keep the original possible outcomes and generate weights based on them
            let filteredOutcomes = possibleOutcomes;

            // If distribution exists and amount is greater than 0, only use first 2 and last element
            if (distribution && distribution.amount > 0 && distribution.status === "active") {
                const firstTwoElements = possibleOutcomes.slice(0, 2); // First two elements
                const lastElement = possibleOutcomes[possibleOutcomes.length - 1]; // Last element
                filteredOutcomes = [...firstTwoElements, lastElement];
                console.log("Filtered outcomes for distribution:", filteredOutcomes);
            }

            // Generate base weights based on the length of the filtered outcomes
            let baseWeights = generateWeights(filteredOutcomes.length, inProfit, totalBet, netGain);

            // Create weighted probabilities based on the filtered outcomes and their adjusted weights
            const weightedProbabilities = [];

            filteredOutcomes.forEach((multiplier, index) => {
                const weight = baseWeights[index];
                weightedProbabilities.push(...Array(weight).fill({ multiplier, position: index }));
            });

            // Randomly select a drop from the weighted probabilities
            const randomIndex = Math.floor(Math.random() * weightedProbabilities.length);
            const selectedOutcome = weightedProbabilities[randomIndex];
            const { multiplier, position } = selectedOutcome;
            console.log("Selected position and multiplier:", position, multiplier);

            // Update distribution amount if applicable
            if (distribution && distribution.amount > 0 && distribution.status === "active") {
                const winAmount = betAmount * multiplier;
                const profit = winAmount - betAmount;
                await AmountDistribution.update(
                    { amount: distribution.amount - profit },
                    { where: { id: distribution.id } }
                );

            } else if (distribution) {
                // Set distribution to inactive if amount is not sufficient
                await AmountDistribution.update(
                    { amount: 0, status: 'inactive' },
                    { where: { id: distribution.id } }
                );

            }

            // Return the actual drop position and the multiplier
            return { dropPosition: position, multiplier };
        }

        let roomName;
        socket.on('joinGame', (gameId) => {
            const roomName = `game_${gameId.gameId}`;
            socket.join(roomName);
            console.log('User joined room:', roomName);
            console.log('Updated rooms:', io.sockets.adapter.rooms);
        });

        // Handle placing bets
        socket.on("plinkoPlaceBet", async (data) => {
            const { userId, betAmount, rows, riskLevel, autoBetCount = 1 } = data;
            console.log(data);
           
            const wallet = await Wallet.findOne({ where: { userId } });
            if (!wallet) {
                io.to(userId).emit('WalletNotFound', { message: 'Wallet not found', status: true });
                return;
            }
            if (wallet.currentAmount <= betAmount) {
                console.log('inif', wallet.currentAmount, betAmount);
                io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
                return;
            }

            // Validate rows and risk levels
            if (!rowConfigs[rows] || !rowConfigs[rows][riskLevel]) {
                console.log("Invalid row or risk level selected");
                return socket.emit("error", "Invalid row or risk level selected");
            }

            // Check if user has remaining bets in an ongoing auto-bet session
            if (autoBetSessions[userId] && autoBetSessions[userId].remainingBets > 0) {
                console.log("Resuming auto-bet session");
                resumeAutoBet(socket, userId, betAmount, rows, riskLevel);
            } else if (autoBetCount > 1) {
                // Start new auto-bet session
                startAutoBet(socket, userId, betAmount, rows, riskLevel, autoBetCount);
            } else {
                // Place a single bet
                const result = await placeBet(userId, betAmount, rows, riskLevel);
                emitBetResult(result, socket);
            }
        });

        // Handle stopping the auto-bet process
        socket.on("stopAutoBet", (data) => {

            const userId = data.userId;

            if (!userId || typeof userId !== 'number') {
                console.log("Invalid userId received for stopping auto-bet:", userId);
                return socket.emit("error", "Invalid user ID");
            }

            if (autoBetSessions[userId]) {
                // Clear the auto-bet interval
                clearInterval(autoBetSessions[userId].interval);

                // Emit the auto-bet stopped event immediately
                socket.emit("autoBetStopped", {
                    message: "Auto-bet stopped",
                    remainingBets: autoBetSessions[userId].remainingBets
                });

                // Clean up the auto-bet session after stopping
                delete autoBetSessions[userId];
                console.log(`Auto-bet session for user ${userId} stopped and removed.`);
            } else {
                console.log(`No active auto-bet session for user ${userId}`);
                // Emit a message if there's no active auto-bet session
                socket.emit("error", "No active auto-bet session to stop");
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the plinkoGame server');
            if (roomName) {
                socket.leave(roomName);
            }
        });

        socket.on('betCompleted', async (data) => {
            try {
                const wallet = await Wallet.findOne({ where: { userId: data.userId } });
                if (!wallet) {
                    return { success: false, error: 'Wallet not found' };
                }
                const bet = await Bet.findByPk(data.betId);

                await Bet.update(
                    { isActive: false },
                    { where: { id: data.betId } }
                );

                await Wallet.update(
                    { currentAmount: wallet.currentAmount + bet.winAmount },
                    { where: { userId: data.userId } }
                );

                await WalletTransaction.create({
                    walletId: wallet.id,
                    userId: data.userId,
                    amount: bet.winAmount,
                    transactionType: 'win',
                    transactionDirection: 'credit',
                    description: `Won amount ${bet.winAmount}`,
                    transactionTime: new Date(),
                });

                await FinancialTransaction.create({
                    gameId: 9,
                    walletId: wallet.id,
                    userId: data.userId,
                    amount: bet.winAmount,
                    transactionType: 'win',
                    transactionDirection: 'debit',
                    description: `Won amount ${bet.winAmount}`,
                    transactionTime: new Date(),
                });
                socket.emit("walletBalance", {
                    walletBalance: wallet.currentAmount
                });
                console.log("betCompletedbetCompleted")
            } catch (error) {
                console.log(error);

            }

        });

    });

};
