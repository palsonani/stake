import AmountDistribution from "../models/AmountDistribution.js";
import Bet from "../models/Bet.js";
import FinancialTransaction from "../models/financialTransaction.js";
import User from "../models/user.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

const activeAutoBets = {};
export const limboSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New user connected for Limbo game',socket.id);
        io.emit('limboConnection', { message: 'new limboConnection' });
        let roomName;
        socket.on('joinGame', (gameId) => {
            const roomName = `game_${gameId.gameId}`;
            socket.join(roomName);
            console.log('User joined room:', roomName);
            console.log('Updated rooms:', io.sockets.adapter.rooms);
        });

        socket.on('limboPlaceBet', async (betData) => {
            const { userId, betAmount, betType, multiplier, autoBetCount, onWin, onLoss, stopOnProfit, stopOnLoss } = betData;
            socket.join(userId)
            console.log(`Received bet data from user ${userId}:`, betData);

            try {
                const user = await User.findByPk(userId);
                if (!user) {
                    console.log(`User ${userId} not found`);
                    return socket.emit('error', { message: "User not found" });
                }

                console.log(`User ${userId} found. Processing bet type: ${betType}`);

                if (betType === 'Manual') {
                    await handleManualBet(user, betAmount, multiplier, socket);
                } else if (betType === 'Auto') {
                    await handleAutoBet(user, betAmount, autoBetCount, multiplier, onWin, onLoss, stopOnProfit, stopOnLoss, socket);
                }
            } catch (error) {
                console.error("Error placing bet:", error);
                socket.emit('error', { message: "Error placing bet" });
            }
        });

        socket.on('stopAutoBet', (userId) => {
            if (activeAutoBets[userId]) {
                activeAutoBets[userId] = false; // Mark the user's auto bet as stopped
                console.log(`Auto-bet stopped for user ${userId}`);
                socket.emit('autoBetStopped', { message: "Auto-bet has been stopped." });
            } else {
                socket.emit('error', { message: "No active auto-bet found." });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the limboGame server');
            if (roomName) {
                socket.leave(roomName);
            }
        });
    });

    const handleManualBet = async (user, betAmount, selectedMultiplier, socket) => {
        console.log(`Handling manual bet for user ${user.id}, Bet Amount: ${betAmount}, Selected Multiplier: ${selectedMultiplier}`);

        const result = await simulateWinLoss(user.id, selectedMultiplier, betAmount);
        const { isWin, winAmount, actualMultiplier } = result;

        const wallet = await Wallet.findOne({ where: { userId: user.id } });
        if (!wallet) {
            io.to(user.id).emit('WalletNotFound', { message: 'Wallet not found', status: true });
        }

        if (wallet.currentAmount < betAmount) {
            io.to(user.id).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
        }

        await Wallet.update(
            { currentAmount: wallet.currentAmount - betAmount },
            { where: { userId: user.id } }
        );

        await WalletTransaction.create({
            walletId: wallet.id,
            userId: user.id,
            amount: betAmount,
            transactionType: 'bet',
            transactionDirection: 'debit',
            description: `Placed  bets of ${betAmount} each`,
            transactionTime: new Date()
        });

        await FinancialTransaction.create({
            gameId: 14,
            walletId: wallet.id,
            userId: user.id,
            amount: betAmount,
            transactionType: 'bet',
            transactionDirection: 'credit',
            description: `Placed  bets of ${betAmount} each`,
            transactionTime: new Date()
        });

        const newBet = await Bet.create({
            userId: user.id,
            betAmount,
            gameId: 14,
            cashOutAt: selectedMultiplier,
            multiplier: actualMultiplier,
            winAmount: isWin ? winAmount : 0,
            isActive: false,
            betType: 'manual',
            betTime: new Date(),
        });

        await Wallet.update(
            { currentAmount: wallet.currentAmount + winAmount },
            { where: { userId: user.id } }
        );

        await WalletTransaction.create({
            walletId: wallet.id,
            userId: user.id,
            amount: winAmount,
            transactionType: 'win',
            transactionDirection: 'credit',
            description: `Won amount ${winAmount}`,
            transactionTime: new Date(),
        });

        await FinancialTransaction.create({
            gameId: 14,
            walletId: wallet.id,
            userId: user.id,
            amount: winAmount,
            transactionType: 'win',
            transactionDirection: 'debit',
            description: `Won amount ${winAmount}`,
            transactionTime: new Date(),
        });
        // console.log(`Bet record created for user ${user.id}:`, newBet);


        io.to(user.id).emit('limbobetResult', {
            isWin,
            actualMultiplier,
            selectedMultiplier,
        });
        console.log(socket.emit('limbobetResult', {
            isWin,
            actualMultiplier,
            selectedMultiplier,
        }));

    };

    const handleAutoBet = async (user, initialBetAmount, autoBetCount, selectedMultiplier, onWinPercentage, onLossPercentage, stopOnProfit, stopOnLoss, socket) => {
        let currentBetAmount = initialBetAmount;
        let totalProfit = 0;

        console.log(`Starting auto-bet for user ${user.id}, Initial Bet Amount: ${initialBetAmount}, Auto Bet Count: ${autoBetCount}`);
        activeAutoBets[user.id] = true;
        for (let i = 0; i < autoBetCount; i++) {
            if (!activeAutoBets[user.id]) {
                console.log(`Auto-bet process stopped for user ${user.id}`);
                break;
            }
            console.log(`Auto-bet round ${i + 1} for user ${user.id}`);

            const result = await simulateWinLoss(user.id, selectedMultiplier, currentBetAmount);
            const { isWin, winAmount, actualMultiplier } = result;
            const wallet = await Wallet.findOne({ where: { userId: user.id } });
            if (!wallet) {
                io.to(user.id).emit('WalletNotFound', { message: 'Wallet not found', status: true });
            }

            if (wallet.currentAmount < initialBetAmount * autoBetCount) {
                io.to(user.id).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
            }
            await Wallet.update(
                { currentAmount: wallet.currentAmount - initialBetAmount },
                { where: { userId: user.id } }
            );

            await WalletTransaction.create({
                walletId: wallet.id,
                userId: user.id,
                amount: initialBetAmount,
                transactionType: 'bet',
                transactionDirection: 'debit',
                description: `Placed  bets of ${initialBetAmount} each`,
                transactionTime: new Date()
            });

            await FinancialTransaction.create({
                gameId: 14,
                walletId: wallet.id,
                userId: user.id,
                amount: initialBetAmount,
                transactionType: 'bet',
                transactionDirection: 'credit',
                description: `Placed  bets of ${initialBetAmount} each`,
                transactionTime: new Date()
            });

            const newBet = await Bet.create({
                userId: user.id,
                gameId: 14,
                betAmount: currentBetAmount,
                cashOutAt: selectedMultiplier,
                multiplier: actualMultiplier,
                winAmount: isWin ? winAmount : 0,
                isActive: false,
                betType: 'auto',
                betTime: new Date(),
            });

            await Wallet.update(
                { currentAmount: wallet.currentAmount + winAmount },
                { where: { userId: user.id } }
            );

            await WalletTransaction.create({
                walletId: wallet.id,
                userId: user.id,
                amount: winAmount,
                transactionType: 'win',
                transactionDirection: 'credit',
                description: `Won amount ${winAmount}`,
                transactionTime: new Date(),
            });

            await FinancialTransaction.create({
                gameId: 14,
                walletId: wallet.id,
                userId: user.id,
                amount: winAmount,
                transactionType: 'win',
                transactionDirection: 'debit',
                description: `Won amount ${winAmount}`,
                transactionTime: new Date(),
            });

            totalProfit += isWin ? winAmount - currentBetAmount : -currentBetAmount;

            // Adjust bet amount based on win/loss percentages only if provided
            if (isWin) {
                if (onWinPercentage !== undefined || onWinPercentage !== null) {
                    currentBetAmount += currentBetAmount * (onWinPercentage / 100);
                    console.log(`User ${user.id} won. Increasing bet amount to: ${currentBetAmount}`);
                }
            } else {
                if (onLossPercentage !== undefined || onLossPercentage !== null) {
                    currentBetAmount -= currentBetAmount * (onLossPercentage / 100);
                    console.log(`User ${user.id} lost. Decreasing bet amount to: ${currentBetAmount}`);
                }
            }
            console.log("adsfasfgsd", stopOnProfit, stopOnLoss)
            // Stop if profit/loss limits are reached (only check if limits are defined)
            if (stopOnProfit !== null && totalProfit >= stopOnProfit) {
                console.log(`Auto-bet stopping for user ${user.id} due to reaching profit limit: ${totalProfit}`);
                break;
            }
            if (stopOnLoss !== null && totalProfit <= stopOnLoss) {
                console.log(`Auto-bet stopping for user ${user.id} due to reaching loss limit: ${totalProfit}`);
                break;
            }

            // Delay for 1 second between bets
            await new Promise(resolve => setTimeout(resolve, 2000));
            io.to(user.id).emit('limbobetResult', {
                isWin,
                actualMultiplier,
                selectedMultiplier,
                currentBetAmount,
                Autobetround: i + 1
            });
        }
        delete activeAutoBets[user.id];
        console.log(`Auto-bet completed for user ${user.id}`);
    };

    // Simulate a dynamic win/loss outcome
    // const simulateWinLoss = async (userId, selectedMultiplier, betAmount) => {
    //     // This function simulates the win/loss outcomes
    //     const random = Math.random();
    //     let isWin = false;
    //     let winAmount = 0;
    //     let actualMultiplier = 0;

    //     // Define win/loss patterns
    //     const patterns = [
    //         { wins: 2, losses: 2 },
    //         { wins: 1, losses: 1 },
    //         { wins: 3, losses: 1 },
    //         { wins: 1, losses: 3 },
    //     ];

    //     // Randomly choose a pattern
    //     const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
    //     let winCount = 0;
    //     let lossCount = 0;

    //     // Execute the pattern
    //     for (let i = 0; i < chosenPattern.wins; i++) {
    //         if (random > 0.5) { // 50% chance to win
    //             isWin = true;
    //             winAmount = betAmount * selectedMultiplier;
    //             // actualMultiplier = selectedMultiplier + Math.random(); // Simulating a higher backend multiplier
    //             actualMultiplier = selectedMultiplier + Math.random() * (100 - selectedMultiplier);
    //             winCount++;
    //         } else {
    //             isWin = false;
    //             actualMultiplier = selectedMultiplier - Math.random(); // Simulating a lower backend multiplier
    //             lossCount++;
    //         }
    //     }

    //     for (let i = 0; i < chosenPattern.losses; i++) {
    //         if (random <= 0.5) { // 50% chance to lose
    //             isWin = false;
    //             actualMultiplier = selectedMultiplier - Math.random(); // Simulating a lower backend multiplier
    //             lossCount++;
    //         } else {
    //             isWin = true;
    //             winAmount = betAmount * selectedMultiplier;
    //             actualMultiplier = selectedMultiplier + Math.random() * (100 - selectedMultiplier); // Simulating a higher backend multiplier
    //             winCount++;
    //         }
    //     }

    //     // Ensure to keep the overall result balanced around zero
    //     // if (winCount > lossCount) {
    //     //     // More wins than losses
    //     //     winAmount -= (winCount - lossCount) * (betAmount / 10); // Deduct some amount to balance
    //     // } else if (lossCount > winCount) {
    //     //     // More losses than wins
    //     //     winAmount += (lossCount - winCount) * (betAmount / 10); // Add some amount to balance
    //     // }

    //     return { isWin, winAmount, actualMultiplier };
    // };
    const simulateWinLoss = async (userId, selectedMultiplier, betAmount) => {

        const distribution = await AmountDistribution.findOne({
            where: { userId: userId, gameId: 14, status: 'active' },
        });
        const random = Math.random();
        let isWin = false;
        let winAmount = 0;
        let actualMultiplier = 0;
        if (distribution) {
            console.log('Active distribution found, forcing win.');
            isWin = true;
            winAmount = betAmount * selectedMultiplier;
            actualMultiplier = selectedMultiplier + Math.random() * (100 - selectedMultiplier);
            return { isWin, winAmount, actualMultiplier }; // Return immediately after forcing a win
        }

        // Update distribution amount if applicable
        if (distribution && distribution.amount > 0 && distribution.status === "active") {
            const winAmount = betAmount * selectedMultiplier;
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

        // This function simulates the win/loss outcomes

        let totalProfit = 0
        // Fetch user's betting history from the database
        const userHistory = await Bet.findAll({
            where: { userId, gameId: 14 },
            attributes: ['winAmount', 'betAmount'],
        });

        // Calculate the player's overall profit/loss
        for (let i = 0; i < userHistory.length; i++) {
            const winAmount = userHistory[i].winAmount || 0; // Default to 0 if winAmount is null/undefined
            const betAmount = userHistory[i].betAmount;

            // Accumulate profit/loss
            totalProfit += (winAmount - betAmount);
        }

        const isPlayerInProfit = totalProfit > 0;
        console.log("totalProfitsfdhgfdhgf", totalProfit)
        // Define win/loss patterns
        const patterns = [
            { wins: isPlayerInProfit ? 3 : 2, losses: isPlayerInProfit ? 1 : 2 },
            { wins: isPlayerInProfit ? 2 : 1, losses: isPlayerInProfit ? 2 : 1 },
            { wins: isPlayerInProfit ? 4 : 1, losses: isPlayerInProfit ? 1 : 3 },
            { wins: isPlayerInProfit ? 1 : 3, losses: isPlayerInProfit ? 3 : 1 },
        ];

        // Randomly choose a pattern
        const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
        let winCount = 0;
        let lossCount = 0;

        // Execute the pattern
        for (let i = 0; i < chosenPattern.wins; i++) {
            if (random > 0.3) { // 50% chance to win
                isWin = true;
                winAmount = betAmount * selectedMultiplier;
                actualMultiplier = selectedMultiplier + Math.random() * (100 - selectedMultiplier);
                winCount++;
            } else {
                isWin = false;
                actualMultiplier = selectedMultiplier - Math.random(); // Simulating a lower backend multiplier
                lossCount++;
            }
        }

        for (let i = 0; i < chosenPattern.losses; i++) {
            if (random <= 0.7) { // 50% chance to lose
                isWin = false;
                actualMultiplier = selectedMultiplier - Math.random(); // Simulating a lower backend multiplier
                lossCount++;
            } else {
                isWin = true;
                winAmount = betAmount * selectedMultiplier;
                actualMultiplier = selectedMultiplier + Math.random() * (100 - selectedMultiplier); // Simulating a higher backend multiplier
                winCount++;
            }
        }

        return { isWin, winAmount, actualMultiplier };
    };

    const calculateProfitLoss = async (userId) => {
        const bets = await Bet.findAll({ where: { userId, gameId: 14 } });
        let profitLoss = 0;

        bets.forEach(bet => {
            profitLoss += bet.winAmount - bet.betAmount;
        });

        console.log(`Calculated total profit/loss for user ${userId}: ${profitLoss}`);
        return profitLoss;
    };

    
};

