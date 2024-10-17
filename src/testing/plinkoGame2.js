import { sequelize } from "../config/connection.js";
import { generateWeights } from "../methods/gameMethods/plinko/generateWeights.js";
import { outcomes } from "../methods/gameMethods/plinko/outcomes.js";
import { rowConfigs } from "../methods/gameMethods/plinko/rowConfigs.js";
import AmountDistribution from "../models/AmountDistribution.js";
import Bet from "../models/Bet.js";
import FinancialTransaction from "../models/financialTransaction.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

// export const plinkoSocketHandler = (io) => {

//     async function dropBall(rows, riskLevel, userId) {
//         // Get the possible outcomes based on row and risk level
//         const possibleOutcomes = rowConfigs[rows][riskLevel];
//         console.log('possibleOutcomes:', possibleOutcomes);

//         // Fetch the user's betting history
//         const totalBets = await Bet.findAll({
//             where: { userId, gameId: 9 },
//             attributes: [
//                 [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
//                 [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
//             ],
//             raw: true
//         });

//         const totalBet = totalBets[0]?.totalBet || 0;
//         const totalWin = totalBets[0]?.totalWin || 0;
//         const netGain = totalWin - totalBet;
//         console.log("netGain:", netGain);

//         // Determine if the user is in profit or loss
//         const inProfit = netGain > 0;

//         // Generate weights based on the length of possible outcomes
//         const baseWeights = generateWeights(possibleOutcomes.length, inProfit, totalBet, netGain);

//         // Create weighted probabilities based on the weights generated
//         const weightedProbabilities = [];

//         possibleOutcomes.forEach((multiplier, index) => {
//             const weight = baseWeights[index];
//             weightedProbabilities.push(...Array(weight).fill(multiplier));
//         });

//         console.log("weightedProbabilities:", weightedProbabilities);

//         // Randomly select a drop position from the weighted probabilities
//         const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
//         console.log("dropPosition:", dropPosition);

//         // Get the multiplier based on the drop position
//         const multiplier = weightedProbabilities[dropPosition];
//         console.log("multiplier:", multiplier);

//         return { dropPosition, multiplier };
//     }

//     io.on('connection', (socket) => {
//         console.log('New player connected');

//         socket.on('plinkoPlaceBet', async (data) => {
//             const { userId, betAmount, rows, riskLevel } = data;
//             console.log(data);

//             // Validate row configuration and risk level
//             if (!rowConfigs[rows]) {
//                 socket.emit('error', { message: 'Invalid number of rows' });
//                 return;
//             }
//             if (!['low', 'medium', 'high'].includes(riskLevel)) {
//                 socket.emit('error', { message: 'Invalid risk level' });
//                 return;
//             }
//             const wallet = await Wallet.findOne({ where: { userId } });
//             if (!wallet) throw new Error('Wallet not found');

//             if (wallet.currentAmount < betAmount) {
//                 io.to(userId).emit('Insufficientfund', { message: 'Insufficient funds', status: true });
//                 return;
//             }

//             await Wallet.update(
//                 { currentAmount: wallet.currentAmount - betAmount },
//                 { where: { userId } }
//             );

//             await WalletTransaction.create({
//                 walletId: wallet.id,
//                 userId,
//                 amount:betAmount,
//                 transactionType: 'bet',
//                 transactionDirection: 'debit',
//                 description: `Placed a bet of ${betAmount}`,
//                 transactionTime: new Date()
//             });

//             await FinancialTransaction.create({
//                 gameId: 9,
//                 walletId: wallet.id,
//                 userId,
//                 amount:betAmount,
//                 transactionType: 'bet',
//                 transactionDirection: 'credit',
//                 description: `Placed a bet of ${betAmount}`,
//                 transactionTime: new Date()
//             });

//             // Simulate the ball drop
//             const { dropPosition, multiplier } = await dropBall(rows, riskLevel, userId);
//             console.log("dropPosition, multiplier::", dropPosition, multiplier);

//             const winAmount = betAmount * multiplier;
//             console.log("winAmount::", winAmount);

//             await Wallet.update(
//                 { currentAmount: wallet.currentAmount + winAmount },
//                 { where: { userId: userId } }
//             );

//             await WalletTransaction.create({
//                 walletId: wallet.id,
//                 userId: userId,
//                 amount: winAmount,
//                 transactionType: 'win',
//                 transactionDirection: 'credit',
//                 description: `Won amount ${winAmount}`,
//                 transactionTime: new Date(),
//             });
//             await FinancialTransaction.create({
//                 gameId: 9,
//                 walletId: wallet.id,
//                 userId: userId,
//                 amount: winAmount,
//                 transactionType: 'win',
//                 transactionDirection: 'debit',
//                 description: `Won amount ${winAmount}`,
//                 transactionTime: new Date(),
//             });

//             // Store the bet result in the database
//             try {
//                 await Bet.create({
//                     gameId: 9,
//                     userId,
//                     betAmount,
//                     multiplier,
//                     winAmount,
//                     rows,
//                     risk: riskLevel,
//                     betTime: new Date()
//                 });
//                 console.log(`Result: Multiplier=${multiplier}, Position=${dropPosition}, WinAmount=${winAmount}`);

//                 socket.emit('plinkoBetResult', { multiplier, dropPosition, winAmount });

//                 const lastBets = await Bet.findAll({
//                     where: { userId, gameId: 9 },
//                     order: [['betTime', 'DESC']],
//                     limit: 4
//                 });

//                 const lastMultipliers = lastBets.map(bet => bet.multiplier);
//                 console.log(lastMultipliers);
//                 socket.emit('lastFourMultipliers', { multipliers: lastMultipliers });

//             } catch (error) {
//                 console.error('Error saving bet:', error);
//                 socket.emit('error', { message: 'Failed to process bet' });
//             }
//         });
//     });
// };

// export const plinkoSocketHandler = (io) => {

//     // async function dropBall(rows, riskLevel, userId) {
//     //     // Get the possible outcomes based on row and risk level
//     //     const possibleOutcomes = rowConfigs[rows][riskLevel];
//     //     console.log('possibleOutcomes:', possibleOutcomes);

//     //     // Fetch the user's betting history
//     //     const totalBets = await Bet.findAll({
//     //         where: { userId, gameId: 9 },
//     //         attributes: [
//     //             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
//     //             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
//     //         ],
//     //         raw: true
//     //     });

//     //     const totalBet = totalBets[0]?.totalBet || 0;
//     //     const totalWin = totalBets[0]?.totalWin || 0;
//     //     const netGain = totalWin - totalBet;
//     //     console.log("netGain:", netGain);

//     //     // Determine if the user is in profit or loss
//     //     const inProfit = netGain > 0;

//     //     // Generate weights based on the length of possible outcomes
//     //     const baseWeights = generateWeights(possibleOutcomes.length, inProfit, totalBet, netGain);

//     //     // Create weighted probabilities based on the weights generated
//     //     const weightedProbabilities = [];

//     //     possibleOutcomes.forEach((multiplier, index) => {
//     //         const weight = baseWeights[index];
//     //         weightedProbabilities.push(...Array(weight).fill(multiplier));
//     //     });

//     //     console.log("weightedProbabilities:", weightedProbabilities);

//     //     // Randomly select a drop position from the weighted probabilities
//     //     const dropPosition = Math.floor(Math.random() * weightedProbabilities.length);
//     //     console.log("dropPosition:", dropPosition);

//     //     // Get the multiplier based on the drop position
//     //     const multiplier = weightedProbabilities[dropPosition];
//     //     console.log("multiplier:", multiplier);

//     //     return { dropPosition, multiplier };
//     // }

// async function dropBall(rows, riskLevel, userId) {
//     // Get the possible outcomes based on row and risk level
//     const possibleOutcomes = rowConfigs[rows][riskLevel];
//     console.log('possibleOutcomes:', possibleOutcomes);

//     // Fetch the user's betting history
//     const totalBets = await Bet.findAll({
//         where: { userId, gameId: 9 },
//         attributes: [
//             [sequelize.fn('SUM', sequelize.col('betAmount')), 'totalBet'],
//             [sequelize.fn('SUM', sequelize.col('winAmount')), 'totalWin']
//         ],
//         raw: true
//     });

//     const totalBet = totalBets[0]?.totalBet || 0;
//     const totalWin = totalBets[0]?.totalWin || 0;
//     const netGain = totalWin - totalBet;
//     console.log("netGain:", netGain);

//     // Determine if the user is in profit or loss
//     const inProfit = netGain > 0;

//     // Generate weights based on the length of possible outcomes
//     const baseWeights = generateWeights(possibleOutcomes.length, inProfit, totalBet, netGain);

//     // Create weighted probabilities based on the weights generated
//     const weightedProbabilities = [];

//     possibleOutcomes.forEach((multiplier, index) => {
//         const weight = baseWeights[index];
//         weightedProbabilities.push(...Array(weight).fill({ multiplier, position: index }));
//     });

//     console.log("weightedProbabilities:", weightedProbabilities);

//     // Randomly select a drop from the weighted probabilities
//     const randomIndex = Math.floor(Math.random() * weightedProbabilities.length);
//     const selectedOutcome = weightedProbabilities[randomIndex];
//     const { multiplier, position } = selectedOutcome;
//     console.log("Selected position and multiplier:", position, multiplier);

//     // Real drop position is the index (actual row position)
//     return { dropPosition: position, multiplier };
// }

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
    // if (distribution.amount > 0 && distribution.status === "active") {
    //     const firstTwoElements = possibleOutcomes.slice(0, 2); // First two elements
    //     const lastElement = possibleOutcomes[possibleOutcomes.length - 1]; // Last element
    //     filteredOutcomes = [...firstTwoElements, lastElement];
    //     console.log("Filtered outcomes for distribution:", filteredOutcomes);
    // }

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
    // if (distribution.amount > 0 && distribution.status === "active") {
    //     const winAmount = betAmount * multiplier;
    //     const profit = winAmount - betAmount;
    //     await AmountDistribution.update(
    //         { amount: distribution.amount - profit },
    //         { where: { id: distribution.id } }
    //     );
    // } else {
    //     // Set distribution to inactive if amount is not sufficient
    //     await AmountDistribution.update(
    //         { amount: 0, status: 'inactive' },
    //         { where: { id: distribution.id } }
    //     );
    // }

    // Return the actual drop position and the multiplier
    return { dropPosition: position, multiplier };
}

async function placeBet(userId, betAmount, rows, riskLevel, autoBetCount = 1) {
    console.log(userId, betAmount, rows, riskLevel, autoBetCount)
    // Validate row configuration and risk level
    if (!rowConfigs[rows]) {
        return { success: false, error: 'Invalid number of rows' };
    }
    if (!['low', 'medium', 'high'].includes(riskLevel)) {
        return { success: false, error: 'Invalid risk level' };
    }

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
        return { success: false, error: 'Wallet not found' };
    }

    if (wallet.currentAmount < betAmount * autoBetCount) {
        return { success: false, error: 'Insufficient funds' };
    }

    const results = [];

    for (let i = 0; i <= autoBetCount; i++) {

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
            description: `Placed ${autoBetCount} bets of ${betAmount} each`,
            transactionTime: new Date()
        });

        await FinancialTransaction.create({
            gameId: 9,
            walletId: wallet.id,
            userId,
            amount: betAmount,
            transactionType: 'bet',
            transactionDirection: 'credit',
            description: `Placed ${autoBetCount} bets of ${betAmount} each`,
            transactionTime: new Date()
        });

        // Simulate the ball drop
        const distribution = await AmountDistribution.findOne({
            where: {
                userId,
                gameId: 9
            }
        });
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
            gameId: 9,
            walletId: wallet.id,
            userId,
            amount: winAmount,
            transactionType: 'win',
            transactionDirection: 'debit',
            description: `Won amount ${winAmount}`,
            transactionTime: new Date(),
        });

        // Store the bet result in the database
        try {
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
            results.push({ finalMultiplier, dropPosition, winAmount });
            // console.log("results::::", results)
        } catch (error) {
            console.error('Error saving bet:', error);
            return { success: false, error: 'Failed to process bet' };
        }
    }

    return { success: true, results };
}

//     io.on('connection', (socket) => {
//         console.log('New player connected for PlinkoGame');

//         let roomName;
//         socket.on('joinGame', (gameId) => {
//             const roomName = `game_${gameId.gameId}`;
//             socket.join(roomName);
//             console.log('User joined PlinkoRoom:', roomName);
//             console.log('Updated rooms:', io.sockets.adapter.rooms);
//         });

//         socket.on('plinkoPlaceBet', async (data) => {
//             const { userId, betAmount, rows, riskLevel, autoBetCount } = data;
//             const wallet = await Wallet.findOne({ where: { userId } });
//             if (!wallet) {
//                 socket.emit('WalletNotFound', { message: 'Wallet not found' })
//             }

//             if (wallet.currentAmount < betAmount * autoBetCount) {
//                 socket.emit('InsufficientFunds', { message: 'Insufficient funds' });
//             }

//             // Handle single and auto-bets
//             const result = await placeBet(userId, betAmount, rows, riskLevel, autoBetCount);
//             console.log("result::::", result);

//             if (!result.success) {
//                 console.log('arfgsdghf');

//                 socket.emit('error', { message: result.error });
//                 return;
//             }

//             // Emit results for all bets placed
//             result.results.forEach((result) => {
//                 io.emit('plinkoBetResult', result);
//             });

//             // Emit last four multipliers
//             const lastBets = await Bet.findAll({
//                 where: { userId, gameId: 9 },
//                 order: [['betTime', 'DESC']],
//                 limit: 4
//             });

//             const lastMultipliers = lastBets.map(bet => bet.multiplier);
//             console.log(lastMultipliers);
//             io.emit('lastFourMultipliers', { multipliers: lastMultipliers });
//         });
//     });

//     io.on('disconnect', () => {
//         console.log('Disconnected from the PlinkoGame server');
//         if (roomName) {
//             socket.leave(roomName);
//         }
//     });
// };

export const plinkoSocketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("New user connected for Plinko");

        socket.on("plinkoPlaceBet", async (data) => {
            const { userId, betAmount, rows, riskLevel, autoBetCount = 1 } = data;
            console.log(data);


            // Check if the selected row and risk level are valid
            if (!rowConfigs[rows] || !rowConfigs[rows][riskLevel]) {
                console.log("Invalid row or risk level selected")
                return socket.emit("error", "Invalid row or risk level selected");
            }
            const result = await placeBet(userId, betAmount, rows, riskLevel, autoBetCount);
            console.log("jhgfAD::::",result);
            result.results.forEach((result) => {
                console.log("jhgfAD::::",result);
                const outcome = result.dropPosition
                
                console.log("outcome:::", outcome)
                const multiplier = rowConfigs[rows][riskLevel][outcome]; // Get multiplier based on row and risk level
                console.log("rowConfigs[row][riskLevel]::", rowConfigs[rows][riskLevel])
                console.log("multiplier:::", multiplier);
                const possibleOutcomes = outcomes[rows][outcome]; // Assuming outcomes logic is already defined
                console.log("possibleOutcomes", possibleOutcomes);
    
                const pattern = [];
                for (let i = 0; i < rows; i++) {
                    pattern.push(Math.random() > 0.5 ? "R" : "L");
                }
    
                socket.emit("plinkoBetResult", {
                    point: possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)],
                    multiplier,
                    pattern,
                });
            });
            // const outcome = result.results[0].dropPosition;
            // console.log("outcome:::", outcome)
            // const multiplier = rowConfigs[rows][riskLevel][outcome]; // Get multiplier based on row and risk level
            // console.log("rowConfigs[row][riskLevel]::", rowConfigs[rows][riskLevel])
            // console.log("multiplier:::", multiplier);
            // const possibleOutcomes = outcomes[rows][outcome]; // Assuming outcomes logic is already defined
            // console.log("possibleOutcomes", possibleOutcomes);


            // const pattern = [];
            // for (let i = 0; i < rows; i++) {
            //     pattern.push(Math.random() > 0.5 ? "R" : "L");
            // }

            // socket.emit("plinkoBetResult", {
            //     point: possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)],
            //     multiplier,
            //     pattern,
            // });

            // Emit last four multipliers
            const lastBets = await Bet.findAll({
                where: { userId, gameId: 9 },
                order: [['betTime', 'DESC']],
                limit: 4
            });

            const lastMultipliers = lastBets.map(bet => bet.multiplier);
            console.log(lastMultipliers);
            io.emit('lastFourMultipliers', { multipliers: lastMultipliers });

            // console.log("point::", possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)])
            // console.log("pattern:::", pattern);

        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
}